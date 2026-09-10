import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { supabaseCatalogService } from "@/lib/supabase";
import { normalizeParentId } from "@/lib/category-tree";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid reorder payload, array of items expected" }, { status: 422 });
    }

    const categories = await supabaseCatalogService.getCategories();
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const updatePromises = items.map(async (item: { id: string; sortOrder: number; parentId?: string | null }) => {
      const existing = categoryMap.get(item.id);
      if (existing) {
        const updated = {
          ...existing,
          sortOrder: Number(item.sortOrder) || 0,
          sort_order: Number(item.sortOrder) || 0,
        };
        if (item.parentId !== undefined) {
          const normParent = normalizeParentId(item.parentId);
          updated.parentId = normParent;
          updated.parent_id = normParent;
        }
        return supabaseCatalogService.upsertCategory(item.id, updated);
      }
      return true;
    });

    await Promise.all(updatePromises);

    try {
      revalidateTag("cb-categories", { expire: 0 });
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/", "layout");
    } catch (e) {
      // Non-fatal
    }

    return NextResponse.json({ success: true, message: "Category order updated successfully" });
  } catch (error: any) {
    console.error("[Category Reorder Error]", error);
    return NextResponse.json({ error: error.message || "Failed to reorder categories" }, { status: 500 });
  }
}
