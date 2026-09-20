import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { supabaseCatalogService } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { category_slug = "all", ordered_ids, items } = body;

    let targetOrderedIds: string[] = [];
    if (Array.isArray(ordered_ids)) {
      targetOrderedIds = ordered_ids;
    } else if (Array.isArray(items)) {
      targetOrderedIds = items.map((it: any) => (typeof it === "string" ? it : it?.id)).filter(Boolean);
    } else {
      return NextResponse.json({ error: "Invalid order data, array expected" }, { status: 422 });
    }

    const settings = await supabaseCatalogService.getSettings({ forceFresh: true });
    const ordersMap = settings.category_product_orders || {};
    ordersMap[category_slug || "all"] = targetOrderedIds;
    settings.category_product_orders = ordersMap;

    const savedSettings = await supabaseCatalogService.updateSettings(settings);
    if (!savedSettings) {
      return NextResponse.json({ error: "Failed to save product ordering" }, { status: 500 });
    }

    await supabaseCatalogService.revalidateCatalog("all");

    return NextResponse.json({
      success: true,
      message: "Product order saved successfully",
      category_slug,
      ordered_ids: targetOrderedIds,
    }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
  } catch (error: any) {
    console.error("[Reorder Products API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to reorder products" }, { status: 500 });
  }
}
