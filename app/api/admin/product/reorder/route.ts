import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { supabaseCatalogService } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { category_slug = "all", ordered_ids } = body;

    if (!Array.isArray(ordered_ids)) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 422 });
    }

    const settings = await supabaseCatalogService.getSettings();
    const ordersMap = settings.category_product_orders || {};
    ordersMap[category_slug || "all"] = ordered_ids;
    settings.category_product_orders = ordersMap;

    const success = await supabaseCatalogService.updateSettings(settings);
    if (!success) {
      return NextResponse.json({ error: "Failed to save product ordering" }, { status: 500 });
    }

    try {
      const { revalidateTag, revalidatePath } = await import("next/cache");
      revalidateTag("cb-settings", { expire: 0 });
      revalidateTag("cb-products", { expire: 0 });
      revalidatePath("/", "layout");
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: "Product order saved successfully",
      category_slug,
      ordered_ids,
    });
  } catch (error: any) {
    console.error("[Reorder Products API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to reorder products" }, { status: 500 });
  }
}
