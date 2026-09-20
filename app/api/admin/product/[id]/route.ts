import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { supabaseCatalogService } from "@/lib/supabase";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const success = await supabaseCatalogService.deleteProduct(id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }
    await supabaseCatalogService.revalidateCatalog("products");
    return NextResponse.json({ success: true, message: "Product deleted" }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
  } catch (error: any) {
    console.error("[Delete Product API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
