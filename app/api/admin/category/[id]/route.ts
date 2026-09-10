import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { supabaseCatalogService } from "@/lib/supabase";
import { normalizeParentId } from "@/lib/category-tree";
import { revalidateTag, revalidatePath } from "next/cache";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Optional reassignment options from body or query
    let reassignChildrenTo: string | null = null;
    let reassignProductsTo: string | null = null;

    try {
      const body = await req.json();
      if (body) {
        reassignChildrenTo = normalizeParentId(body.reassignChildrenTo);
        reassignProductsTo = body.reassignProductsTo ? String(body.reassignProductsTo).trim() : null;
      }
    } catch {
      // Body is optional for simple delete
    }

    const [categories, products] = await Promise.all([
      supabaseCatalogService.getCategories(),
      supabaseCatalogService.getCatalogProducts(),
    ]);

    const targetCategory = categories.find((c) => c.id === id || c.slug === id);
    if (!targetCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // 1. Safe Reassignment of Child Categories
    const childCategories = categories.filter(
      (c) => normalizeParentId(c.parentId ?? c.parent_id) === targetCategory.id
    );

    const fallbackParent = reassignChildrenTo !== undefined ? reassignChildrenTo : normalizeParentId(targetCategory.parentId ?? targetCategory.parent_id);

    for (const child of childCategories) {
      const updatedChild = {
        ...child,
        parentId: fallbackParent,
        parent_id: fallbackParent,
      };
      await supabaseCatalogService.upsertCategory(child.id, updatedChild);
    }

    // 2. Safe Reassignment of Products
    if (reassignProductsTo) {
      const newCategory = categories.find(
        (c) => c.id === reassignProductsTo || c.slug === reassignProductsTo
      );
      if (newCategory) {
        const affectedProducts = products.filter(
          (p) => p.categorySlug === targetCategory.slug || p.categoryId === targetCategory.id
        );
        for (const prod of affectedProducts) {
          const updatedProd = {
            ...prod,
            categorySlug: newCategory.slug,
            categoryName: newCategory.name,
            categoryId: newCategory.id,
          };
          await supabaseCatalogService.upsertProduct(prod.id, updatedProd);
        }
      }
    }

    // 3. Delete the Category
    const success = await supabaseCatalogService.deleteCategory(targetCategory.id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }

    try {
      revalidateTag("cb-categories", { expire: 0 });
      revalidateTag("cb-products", { expire: 0 });
      revalidatePath("/", "layout");
    } catch (e) {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      message: "Category deleted safely with dependencies resolved",
      reassignedChildrenCount: childCategories.length,
    });
  } catch (error: any) {
    console.error("[Delete Category API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete category" }, { status: 500 });
  }
}
