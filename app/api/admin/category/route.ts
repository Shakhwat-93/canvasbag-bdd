import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { supabaseCatalogService } from "@/lib/supabase";
import { validateHierarchy, normalizeParentId, slugifyCategory } from "@/lib/category-tree";
import { revalidateTag } from "next/cache";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    let {
      id,
      name,
      slug,
      description,
      image,
      icon,
      parentId,
      parent_id,
      sortOrder,
      sort_order,
      isActive,
      is_active,
      isVisible,
      is_visible,
      seoTitle,
      seo_title,
      seoDescription,
      seo_description,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    if (!id) {
      id = `cat-${crypto.randomUUID()}`;
    }

    const cleanSlug = slug && slug.trim() ? slugifyCategory(slug) : slugifyCategory(name);

    const effectiveParentId = normalizeParentId(parentId !== undefined ? parentId : parent_id);
    const effectiveSortOrder = typeof sortOrder === "number" ? sortOrder : typeof sort_order === "number" ? sort_order : 0;
    const effectiveIsActive = isActive !== undefined ? Boolean(isActive) : is_active !== undefined ? Boolean(is_active) : true;
    const effectiveIsVisible = isVisible !== undefined ? Boolean(isVisible) : is_visible !== undefined ? Boolean(is_visible) : true;

    // Fetch existing categories to validate uniqueness and hierarchy cycles
    const existingCategories = await supabaseCatalogService.getCategories();

    // Prevent duplicate slugs
    const slugConflict = existingCategories.find((c) => c.slug === cleanSlug && c.id !== id);
    if (slugConflict) {
      return NextResponse.json(
        { error: `The slug "${cleanSlug}" is already in use by category "${slugConflict.name}". Please choose a unique slug.` },
        { status: 422 }
      );
    }

    // Prevent circular hierarchy
    const validation = validateHierarchy(id, effectiveParentId, existingCategories);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    const categoryData = {
      id,
      name: name.trim(),
      slug: cleanSlug,
      description: description ? String(description).trim() : "",
      image: image ? String(image).trim() : "",
      icon: icon ? String(icon).trim() : "",
      parentId: effectiveParentId,
      parent_id: effectiveParentId,
      sortOrder: effectiveSortOrder,
      sort_order: effectiveSortOrder,
      isActive: effectiveIsActive,
      is_active: effectiveIsActive,
      isVisible: effectiveIsVisible,
      is_visible: effectiveIsVisible,
      seoTitle: seoTitle ? String(seoTitle).trim() : seo_title ? String(seo_title).trim() : "",
      seoDescription: seoDescription ? String(seoDescription).trim() : seo_description ? String(seo_description).trim() : "",
    };

    const success = await supabaseCatalogService.upsertCategory(id, categoryData);
    if (!success) {
      return NextResponse.json({ error: "Failed to save category to Supabase" }, { status: 500 });
    }

    try {
      revalidateTag("cb-categories", { expire: 0 });
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/", "layout");
    } catch (e) {
      // Ignored in non-production environments
    }

    return NextResponse.json({ success: true, category: categoryData });
  } catch (error: any) {
    console.error("[Category API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to save category" }, { status: 500 });
  }
}
