import { NextRequest, NextResponse } from "next/server";
import { supabaseCatalogService, supabaseOrdersService } from "@/lib/supabase";
import { insertLocalOrder } from "@/lib/db";
import { sendMetaPurchaseEvent } from "@/lib/meta-capi";
import { isValidBDPhone } from "@/lib/format";
import type { CartItem, LocalOrder } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, address, shipping_zone, shippingZone: sz, note, items: rawItems } = body;

    // Validate name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "আপনার নাম লিখুন।" }, { status: 400 });
    }

    // Strict BD Phone Validation
    const cleanPhone = (phone || "").trim();
    if (!isValidBDPhone(cleanPhone)) {
      return NextResponse.json(
        { error: "মোবাইল নাম্বারটি অবশ্যই ০১ দিয়ে শুরু হওয়া ১১ ডিজিটের নাম্বার হতে হবে (যেমন: 01712345678)।" },
        { status: 400 }
      );
    }

    // Validate address
    if (!address || typeof address !== "string" || address.trim().length === 0) {
      return NextResponse.json({ error: "আপনার সম্পূর্ণ ঠিকানা লিখুন।" }, { status: 400 });
    }

    // Parse items
    let items: CartItem[] = [];
    if (typeof rawItems === "string") {
      try {
        items = JSON.parse(rawItems);
      } catch {
        return NextResponse.json({ error: "Invalid items payload." }, { status: 400 });
      }
    } else if (Array.isArray(rawItems)) {
      items = rawItems;
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "আপনার কার্ট খালি। অর্ডার করতে প্রোডাক্ট যোগ করুন।" }, { status: 400 });
    }

    // Shipping zone
    const rawZone = (shipping_zone || sz || "Inside dhaka").toLowerCase();
    const shippingZone = rawZone.includes("outside") ? "Outside Dhaka" : "Inside Dhaka";

    // City determination
    let city = shippingZone === "Inside Dhaka" ? "Dhaka" : "Outside Dhaka";
    const addrLower = address.toLowerCase();
    if (addrLower.includes("dhaka")) city = "Dhaka";
    else if (addrLower.includes("chittagong") || addrLower.includes("chattogram")) city = "Chittagong";
    else if (addrLower.includes("sylhet")) city = "Sylhet";
    else if (addrLower.includes("rajshahi")) city = "Rajshahi";
    else if (addrLower.includes("khulna")) city = "Khulna";
    else if (addrLower.includes("barisal")) city = "Barisal";
    else if (addrLower.includes("rangpur")) city = "Rangpur";
    else if (addrLower.includes("mymensingh")) city = "Mymensingh";

    // Fetch live settings for accurate delivery rates
    const settings = await supabaseCatalogService.getSettings();
    const shippingInside = Number(settings.shippingInsideDhaka) || 70;
    const shippingOutside = Number(settings.shippingOutsideDhaka) || 150;

    // Calculate totals
    let subtotal = 0;
    let totalQuantity = 0;
    for (const item of items) {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      subtotal += price * qty;
      totalQuantity += qty;
    }

    // Discount rule: Subtotal >= 3200 gets 250 discount
    const discount = subtotal >= 3200 ? 250 : 0;

    // Free shipping rule: Subtotal >= 2500 gets free shipping
    const deliveryFee =
      subtotal >= 2500 || subtotal === 0
        ? 0
        : shippingZone === "Inside Dhaka"
        ? shippingInside
        : shippingOutside;

    const total = Math.max(subtotal + deliveryFee - discount, 0);

    // Generate unique Order ID (ORD-XXXXXX)
    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    const createdAt = new Date().toISOString();

    // Resolve DB product names (Custom SKU / DB Name if set, otherwise fallback to item.name)
    let catalogProducts: any[] = [];
    try {
      catalogProducts = await supabaseCatalogService.getCatalogProducts();
    } catch (e) {
      console.warn("[Checkout] Failed to load catalog products for DB name lookup:", e);
    }

    const dbNameMap = new Map<string, string>();
    for (const p of catalogProducts) {
      if (p.db_product_name && typeof p.db_product_name === "string" && p.db_product_name.trim()) {
        const val = p.db_product_name.trim();
        if (p.id) dbNameMap.set(p.id, val);
        if (p.slug) dbNameMap.set(p.slug, val);
        if (p.name) dbNameMap.set(p.name.trim().toLowerCase(), val);
      }
    }

    const resolveDbProductName = (item: CartItem): string => {
      if (item.db_product_name && item.db_product_name.trim()) {
        return item.db_product_name.trim();
      }
      if (item.productId && dbNameMap.has(item.productId)) {
        return dbNameMap.get(item.productId)!;
      }
      if (item.slug && dbNameMap.has(item.slug)) {
        return dbNameMap.get(item.slug)!;
      }
      if (item.name && dbNameMap.has(item.name.trim().toLowerCase())) {
        return dbNameMap.get(item.name.trim().toLowerCase())!;
      }
      return item.name;
    };

    const firstItem = items[0];
    const firstDbName = firstItem ? resolveDbProductName(firstItem) : "CanvasBag Carry";
    const firstVariant = firstItem?.variantName && firstItem.variantName !== "Standard" ? ` - ${firstItem.variantName}` : "";
    const primaryProductName = `${firstDbName}${firstVariant}`;

    // Attribution data
    const trafficSource = req.cookies.get("traffic_source")?.value || "organic";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";

    // 1. Write to Remote Supabase Orders DB
    const orderedItems = items.map((item) => {
      const dbName = resolveDbProductName(item);
      const vName = item.variantName && item.variantName !== "Standard" ? ` - ${item.variantName}` : "";
      return {
        name: `${dbName}${vName}`,
        price: Number(item.price),
        quantity: Number(item.quantity || 1),
      };
    });

    const supabaseOrderData = {
      id: orderId,
      customer_name: name.trim(),
      phone: cleanPhone,
      address: address.trim(),
      product_name: primaryProductName,
      quantity: items.length,
      source: "main website",
      status: "New",
      amount: total,
      items: totalQuantity,
      payment_status: "Unpaid",
      shipping_zone: shippingZone,
      ordered_items: orderedItems,
      notes: note ? String(note).trim() : null,
      traffic_source: trafficSource,
      ip_address: ip,
      created_at: createdAt,
    };

    const supabaseInserted = await supabaseOrdersService.insertOrder(supabaseOrderData);
    if (!supabaseInserted) {
      console.warn(`[Supabase Orders] Direct remote insert returned false for ${orderId}, continuing with local DB.`);
    }

    // 2. Write to Local SQLite DB
    const localOrder: LocalOrder = {
      id: orderId,
      customer_name: name.trim(),
      phone: cleanPhone,
      city,
      area: "N/A",
      address: address.trim(),
      note: note ? String(note).trim() : undefined,
      status: "pending",
      payment_method: "cod",
      subtotal,
      delivery_fee: deliveryFee,
      discount,
      total,
      attribution: {
        traffic_source: trafficSource,
        ip_address: ip,
      },
      created_at: createdAt,
    };

    // Use resolved db product names for local items record
    const localDbItems = items.map((item) => ({
      ...item,
      name: resolveDbProductName(item),
    }));

    const localInserted = insertLocalOrder(localOrder, localDbItems);
    if (!localInserted) {
      console.error(`[Local DB] Failed to write local order ${orderId}`);
    }

    // 3. Dispatch Server-Side Meta CAPI Event
    try {
      const userAgent = req.headers.get("user-agent") || undefined;
      const fbp = req.cookies.get("_fbp")?.value;
      const fbc = req.cookies.get("_fbc")?.value;
      await sendMetaPurchaseEvent(localOrder, items, {
        ip,
        userAgent,
        fbp,
        fbc,
      });
    } catch (e) {
      console.warn("[Meta CAPI Error]", e);
    }

    return NextResponse.json(
      {
        success: true,
        orderId,
        total,
        items,
        shippingCost: deliveryFee,
        shippingZone,
        subtotal,
        discount,
        name: name.trim(),
        phone: cleanPhone,
        address: address.trim(),
        note: note || "",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Checkout API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to process order." }, { status: 500 });
  }
}
