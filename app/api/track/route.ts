import { NextRequest, NextResponse } from "next/server";
import { getLocalOrderById, getLocalOrdersByPhone } from "@/lib/db";
import { supabaseOrdersService } from "@/lib/supabase";
import type { LocalOrder, RemoteOrder } from "@/lib/types";

// Helper: Normalize phone to clean digits
function extractDigits(val: string): string {
  return (val || "").replace(/\D/g, "");
}

// Helper: Check if a string looks like a Bangladeshi phone number
function isPhoneNumber(val: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  const digits = extractDigits(trimmed);
  // BD phone numbers typically start with 01 (11 digits) or 8801 (13 digits)
  if (digits.length >= 10 && digits.length <= 13) {
    if (digits.startsWith("01") || digits.startsWith("8801")) {
      return true;
    }
  }
  return false;
}

// Helper: Mask phone number (e.g. 01712345678 -> 017****5678)
function maskPhone(phone: string): string {
  const digits = extractDigits(phone);
  if (digits.length <= 4) return "****";
  const start = digits.slice(0, 3);
  const end = digits.slice(-4);
  return `${start}****${end}`;
}

// Helper: Mask name (e.g. "Tanvir Ahmed" -> "T*** A***")
function maskName(name: string): string {
  if (!name) return "Customer";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => (part.length > 1 ? part[0] + "***" : part))
    .join(" ");
}

// Helper: Mask street address but preserve city / district
function maskAddress(address: string, city: string): string {
  if (!address) return city || "Bangladesh";
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length > 1) {
    return `***, ${parts[parts.length - 1]}`;
  }
  return city ? `***, ${city}` : "***";
}

// Status step mapping (1 to 5)
function getStatusStep(status: string): { step: number; label: string; isCancelled: boolean } {
  const s = (status || "pending").toLowerCase().trim();
  switch (s) {
    case "cancelled":
      return { step: 0, label: "অর্ডার বাতিলকৃত (Cancelled)", isCancelled: true };
    case "delivered":
      return { step: 5, label: "ডেলিভারি সম্পন্ন (Delivered)", isCancelled: false };
    case "dispatched":
      return { step: 4, label: "কুরিয়ারে হস্তান্তরকৃত (In Transit)", isCancelled: false };
    case "processing":
      return { step: 3, label: "প্যাকিং ও প্রসেসিং (Processing)", isCancelled: false };
    case "confirmed":
      return { step: 2, label: "অর্ডার নিশ্চিতকৃত (Confirmed)", isCancelled: false };
    case "pending":
    case "new":
    default:
      return { step: 1, label: "অর্ডার গৃহীত (Order Placed)", isCancelled: false };
  }
}

// Formatter for single order payload
function formatOrderData(localOrder?: LocalOrder | null, remoteOrder?: RemoteOrder | null) {
  const finalId = localOrder?.id || remoteOrder?.id || "";
  const orderPhone = localOrder?.phone || remoteOrder?.phone || "";
  const orderStatus = localOrder?.status || remoteOrder?.status || "pending";
  const orderCreatedAt = localOrder?.created_at || remoteOrder?.created_at || new Date().toISOString();
  const orderCity = localOrder?.city || (remoteOrder as any)?.shipping_zone || "Dhaka";
  const orderAddress = localOrder?.address || remoteOrder?.address || "";
  const customerName = localOrder?.customer_name || remoteOrder?.customer_name || "Customer";
  const totalAmount = localOrder?.total ?? remoteOrder?.amount ?? 0;
  const subtotalAmount = localOrder?.subtotal ?? remoteOrder?.amount ?? 0;
  const deliveryFee = localOrder?.delivery_fee ?? 0;
  const discountAmount = localOrder?.discount ?? 0;

  // Extract items
  let items: Array<{ name: string; variant?: string; quantity: number; price: number; total: number }> = [];
  if (localOrder?.items && localOrder.items.length > 0) {
    items = localOrder.items.map((i) => ({
      name: i.product_name,
      variant: i.variant_name || "Standard",
      quantity: i.quantity,
      price: i.unit_price,
      total: i.total,
    }));
  } else if (remoteOrder?.ordered_items && Array.isArray(remoteOrder.ordered_items)) {
    items = remoteOrder.ordered_items.map((i) => ({
      name: i.name,
      variant: "Standard",
      quantity: i.quantity || 1,
      price: i.price || 0,
      total: (i.price || 0) * (i.quantity || 1),
    }));
  } else if (remoteOrder?.product_name) {
    items = [
      {
        name: remoteOrder.product_name,
        variant: "Standard",
        quantity: remoteOrder.quantity || 1,
        price: totalAmount,
        total: totalAmount,
      },
    ];
  }

  const { step, label, isCancelled } = getStatusStep(orderStatus);
  const cleanOrderPhone = extractDigits(orderPhone);

  return {
    id: finalId,
    status: orderStatus,
    status_label: label,
    step,
    is_cancelled: isCancelled,
    created_at: orderCreatedAt,
    customer: {
      name: maskName(customerName),
      phone: maskPhone(cleanOrderPhone),
      city: orderCity,
      address: maskAddress(orderAddress, orderCity),
    },
    pricing: {
      subtotal: subtotalAmount,
      delivery_fee: deliveryFee,
      discount: discountAmount,
      total: totalAmount,
      payment_method: "Cash on Delivery (COD)",
    },
    items,
  };
}

async function handleTrackLookup(rawOrderId?: string, rawPhone?: string) {
  let orderId = (rawOrderId || "").trim();
  let phone = (rawPhone || "").trim();

  // Smart detection: If customer typed mobile number in the Order ID box
  if (!phone && isPhoneNumber(orderId)) {
    phone = orderId;
    orderId = "";
  }

  // If neither provided
  if (!orderId && !phone) {
    return NextResponse.json(
      { error: "অনুগ্রহ করে আপনার অর্ডার নাম্বার অথবা মোবাইল নাম্বার লিখুন।" },
      { status: 400 }
    );
  }

  // CASE 1: SEARCH BY PHONE (Customer entered phone, or both phone & orderId)
  if (phone) {
    const cleanInputPhone = extractDigits(phone);
    if (cleanInputPhone.length < 6) {
      return NextResponse.json(
        { error: "সঠিক মোবাইল নাম্বার লিখুন (যেমন: 01712345678)।" },
        { status: 400 }
      );
    }

    // 1. If an Order ID was ALSO explicitly provided, find that specific order first and verify
    if (orderId) {
      const possibleIds = [
        orderId,
        orderId.toUpperCase(),
        orderId.startsWith("ORD-") ? orderId.replace(/^ORD-/i, "") : `ORD-${orderId}`,
        orderId.replace(/^#/, ""),
      ];

      let localOrder: LocalOrder | null = null;
      for (const idToTry of possibleIds) {
        localOrder = getLocalOrderById(idToTry);
        if (localOrder) break;
      }

      let remoteOrder: RemoteOrder | null = null;
      if (!localOrder) {
        for (const idToTry of possibleIds) {
          remoteOrder = await supabaseOrdersService.getOrderById(idToTry);
          if (remoteOrder) break;
        }
      }

      if (localOrder || remoteOrder) {
        const orderPhone = localOrder?.phone || remoteOrder?.phone || "";
        const cleanOrderPhone = extractDigits(orderPhone);

        const isMatch =
          cleanOrderPhone.endsWith(cleanInputPhone) ||
          cleanInputPhone.endsWith(cleanOrderPhone) ||
          (cleanInputPhone.length >= 4 && cleanOrderPhone.slice(-4) === cleanInputPhone.slice(-4));

        if (!isMatch) {
          return NextResponse.json(
            {
              error: "অর্ডার নাম্বার এবং মোবাইল নাম্বার মিলছে না। অনুগ্রহ করে সঠিক মোবাইল নাম্বার লিখুন।",
              order_id: localOrder?.id || remoteOrder?.id || orderId,
              requires_phone: true,
            },
            { status: 403 }
          );
        }

        const formatted = formatOrderData(localOrder, remoteOrder);
        return NextResponse.json({
          success: true,
          requires_phone: false,
          order: formatted,
        });
      }
      // If order ID wasn't found, continue below to search by phone in case they made a typo in the Order ID
    }

    // Search by phone in local and remote DBs
    const localOrders = getLocalOrdersByPhone(phone);
    let remoteOrders: RemoteOrder[] = [];
    try {
      remoteOrders = await supabaseOrdersService.getOrdersByPhone(phone);
    } catch (e) {
      console.error("[Track API] Supabase search by phone failed:", e);
    }

    const seenIds = new Set<string>();
    const combinedOrders: Array<{ local?: LocalOrder; remote?: RemoteOrder; createdAt: number }> = [];

    for (const lo of localOrders) {
      if (!seenIds.has(lo.id)) {
        seenIds.add(lo.id);
        combinedOrders.push({
          local: lo,
          createdAt: new Date(lo.created_at).getTime() || 0,
        });
      }
    }

    for (const ro of remoteOrders) {
      if (!seenIds.has(ro.id)) {
        seenIds.add(ro.id);
        combinedOrders.push({
          remote: ro,
          createdAt: new Date(ro.created_at).getTime() || 0,
        });
      }
    }

    if (combinedOrders.length === 0) {
      return NextResponse.json(
        {
          error: "এই মোবাইল নাম্বারে কোনো অর্ডার পাওয়া যায়নি। অনুগ্রহ করে সঠিক মোবাইল নাম্বার লিখুন।",
          phone,
        },
        { status: 404 }
      );
    }

    // Sort newest orders first
    combinedOrders.sort((a, b) => b.createdAt - a.createdAt);

    // Primary order is the most recent order
    const primaryOrder = formatOrderData(combinedOrders[0].local, combinedOrders[0].remote);

    // Summary of all orders for this customer
    const allOrdersSummary = combinedOrders.map((entry) => {
      const formatted = formatOrderData(entry.local, entry.remote);
      return {
        id: formatted.id,
        status: formatted.status,
        status_label: formatted.status_label,
        step: formatted.step,
        is_cancelled: formatted.is_cancelled,
        created_at: formatted.created_at,
        total: formatted.pricing.total,
        items_count: formatted.items.reduce((acc, it) => acc + it.quantity, 0),
        item_names: formatted.items.map((it) => it.name).join(", "),
      };
    });

    return NextResponse.json({
      success: true,
      requires_phone: false,
      searched_by: "phone",
      order: primaryOrder,
      all_orders: allOrdersSummary,
    });
  }

  // CASE 2: SEARCH BY ORDER ID ONLY (No phone entered)
  const possibleIds = [
    orderId,
    orderId.toUpperCase(),
    orderId.startsWith("ORD-") ? orderId.replace(/^ORD-/i, "") : `ORD-${orderId}`,
    orderId.replace(/^#/, ""),
  ];

  let localOrder: LocalOrder | null = null;
  for (const idToTry of possibleIds) {
    localOrder = getLocalOrderById(idToTry);
    if (localOrder) break;
  }

  let remoteOrder: RemoteOrder | null = null;
  if (!localOrder) {
    for (const idToTry of possibleIds) {
      remoteOrder = await supabaseOrdersService.getOrderById(idToTry);
      if (remoteOrder) break;
    }
  }

  if (!localOrder && !remoteOrder) {
    return NextResponse.json(
      {
        error: "কোনো অর্ডার পাওয়া যায়নি। অনুগ্রহ করে সঠিক অর্ডার নাম্বার অথবা মোবাইল নাম্বার লিখুন।",
        orderId,
      },
      { status: 404 }
    );
  }

  const finalId = localOrder?.id || remoteOrder?.id || orderId;
  const orderPhone = localOrder?.phone || remoteOrder?.phone || "";
  const cleanOrderPhone = extractDigits(orderPhone);

  // Require phone verification to protect privacy when someone only enters an Order ID
  return NextResponse.json({
    success: true,
    requires_phone: true,
    order_id: finalId,
    masked_phone: maskPhone(cleanOrderPhone),
    message: "নিরাপত্তার স্বার্থে অর্ডারে ব্যবহৃত মোবাইল নাম্বার দিয়ে ভেরিফাই করুন।",
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId") || searchParams.get("id") || "";
    const phone = searchParams.get("phone") || searchParams.get("mobile") || "";

    return await handleTrackLookup(orderId, phone);
  } catch (err: any) {
    console.error("[Track API GET Error]", err);
    return NextResponse.json({ error: "সার্ভারে ত্রুটি হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = body.orderId || body.id || "";
    const phone = body.phone || body.mobile || "";

    return await handleTrackLookup(orderId, phone);
  } catch (err: any) {
    console.error("[Track API POST Error]", err);
    return NextResponse.json({ error: "সার্ভারে ত্রুটি হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
