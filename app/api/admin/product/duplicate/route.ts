import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { getCatalogProducts, supabaseCatalogService } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import type { Product, ProductVariant, ProductImage } from "@/lib/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      sourceId,
      name: customName,
      slug: customSlug,
      status: customStatus,
      copyImages = true,
      copyVariants = true,
    } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: "Source product ID is required for duplication" },
        { status: 400 }
      );
    }

    // 1. Fetch fresh list of all products to locate source and check slug collisions
    const existingProducts = await getCatalogProducts({ forceFresh: true });
    const sourceProduct = existingProducts.find(
      (p) => p.id === sourceId || p.slug === sourceId
    );

    if (!sourceProduct) {
      return NextResponse.json(
        { error: `Source product with ID "${sourceId}" was not found.` },
        { status: 404 }
      );
    }

    // 2. Determine unique ID and new title
    const newId = `prod-${crypto.randomUUID()}`;
    const newName = (customName && String(customName).trim()) || `${sourceProduct.name} (Copy)`;

    // 3. Generate guaranteed unique slug
    let baseSlug = customSlug && String(customSlug).trim()
      ? slugify(customSlug)
      : slugify(newName) || `${slugify(sourceProduct.slug)}-copy`;

    if (!baseSlug) {
      baseSlug = `product-${Date.now().toString().slice(-6)}`;
    }

    let finalSlug = baseSlug;
    let counter = 1;
    while (existingProducts.some((p) => p.slug && p.slug.toLowerCase() === finalSlug.toLowerCase())) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // 4. Clone variants with fresh unique variant IDs to prevent cart / checkout collisions
    let clonedVariants: ProductVariant[] = [];
    if (copyVariants && Array.isArray(sourceProduct.variants) && sourceProduct.variants.length > 0) {
      clonedVariants = sourceProduct.variants.map((v, idx) => ({
        ...v,
        id: `var-${crypto.randomUUID().slice(0, 8)}-${idx + 1}`,
        name: v.name || `Variant ${idx + 1}`,
        inStock: v.inStock !== false,
      }));
    }

    // 5. Clone images
    let clonedImages: (string | ProductImage)[] = [];
    if (copyImages && Array.isArray(sourceProduct.images) && sourceProduct.images.length > 0) {
      clonedImages = sourceProduct.images.map((img: any, idx: number) => {
        if (typeof img === "string") return img;
        if (img && typeof img === "object") {
          return {
            ...img,
            id: `img-${crypto.randomUUID().slice(0, 8)}-${idx + 1}`,
          };
        }
        return img;
      });
    }

    const primaryImg =
      sourceProduct.image ||
      sourceProduct.imageUrl ||
      (typeof clonedImages[0] === "string" ? clonedImages[0] : (clonedImages[0] as ProductImage)?.url) ||
      undefined;

    // 6. Assemble complete duplicated product
    const effectiveStatus: "active" | "inactive" | "draft" =
      customStatus === "active" || customStatus === "inactive" || customStatus === "draft"
        ? customStatus
        : "draft";

    const duplicatedProductData: Product = {
      id: newId,
      name: newName,
      db_product_name: sourceProduct.db_product_name ? `${sourceProduct.db_product_name} (Copy)` : undefined,
      slug: finalSlug,
      price: sourceProduct.price || 0,
      compareAtPrice: sourceProduct.compareAtPrice || null,
      badge: sourceProduct.badge || null,
      categoryId: sourceProduct.categoryId || undefined,
      categorySlug: sourceProduct.categorySlug || "everyday-totes",
      categoryName: sourceProduct.categoryName || "Everyday Totes",
      additionalCategorySlugs: Array.isArray(sourceProduct.additionalCategorySlugs)
        ? [...sourceProduct.additionalCategorySlugs]
        : [],
      isBestSeller: Boolean(sourceProduct.isBestSeller || sourceProduct.is_best_seller),
      is_best_seller: Boolean(sourceProduct.isBestSeller || sourceProduct.is_best_seller),
      isFeatured: Boolean(sourceProduct.isFeatured || sourceProduct.is_featured),
      is_featured: Boolean(sourceProduct.isFeatured || sourceProduct.is_featured),
      status: effectiveStatus,
      story: sourceProduct.story || "",
      benefits: Array.isArray(sourceProduct.benefits) ? [...sourceProduct.benefits] : [],
      specs: Array.isArray(sourceProduct.specs) ? [...sourceProduct.specs] : [],
      images: clonedImages,
      image: primaryImg,
      imageUrl: primaryImg,
      variants: clonedVariants,
      rating: 5.0,
      reviewCount: 0,
      reviews: [],
      salesCount: 0,
      created_at: new Date().toISOString(),
    };

    // 7. Save to Supabase Catalog
    const savedProduct = await supabaseCatalogService.upsertProduct(newId, duplicatedProductData);
    if (!savedProduct) {
      return NextResponse.json(
        { error: "Failed to write duplicated product to Supabase catalog" },
        { status: 500 }
      );
    }

    // 8. Invalidate Caches
    await supabaseCatalogService.revalidateCatalog("products");
    try {
      revalidatePath("/admin/products");
      revalidatePath(`/product/${finalSlug}`);
      if (duplicatedProductData.categorySlug) {
        revalidatePath(`/category/${duplicatedProductData.categorySlug}`);
      }
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      product: savedProduct,
      message: `Product "${sourceProduct.name}" duplicated successfully!`,
    });
  } catch (error: any) {
    console.error("[Duplicate Product API Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to duplicate product" },
      { status: 500 }
    );
  }
}
