import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { getCatalogProducts, getCatalogCategories, supabaseCatalogService } from "@/lib/supabase";
import { syncProductReviews, calculateProductRatingStats } from "@/lib/db";
import { revalidateTag, revalidatePath } from "next/cache";
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
      db_product_name,
      dbProductName,
      slug,
      price,
      compareAtPrice,
      badge,
      categoryId,
      categorySlug,
      categoryName,
      isBestSeller,
      is_best_seller,
      isFeatured,
      is_featured,
      status,
      additionalCategorySlugs,
      benefits,
      specs,
      images,
      variants,
      story,
      rating,
      reviewCount,
      reviews,
      created_at,
    } = body;

    // 1. Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json({ error: "A valid selling price greater than 0 is required" }, { status: 400 });
    }

    if (!id) {
      id = `prod-${crypto.randomUUID()}`;
    }

    // 2. Slug sanitization & uniqueness check
    if (!slug || !slug.trim()) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    } else {
      slug = slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }

    const existingProducts = await getCatalogProducts();
    const slugConflict = existingProducts.find(
      (p) => p.slug && p.slug.toLowerCase() === slug.toLowerCase() && p.id !== id
    );

    if (slugConflict) {
      return NextResponse.json(
        { error: `The slug "${slug}" is already in use by another product ("${slugConflict.name}"). Please choose a unique slug.` },
        { status: 400 }
      );
    }

    // 3. Category resolution
    if (categoryId && (!categorySlug || !categoryName)) {
      const categories = await getCatalogCategories();
      const cat = categories.find((c) => c.id === categoryId);
      if (cat) {
        categorySlug = cat.slug;
        categoryName = cat.name;
      }
    }

    // 4. Review synchronization
    let computedRating = 5.0;
    let computedReviewCount = 0;

    if (Array.isArray(reviews)) {
      const stats = syncProductReviews(id, name.trim(), reviews);
      computedRating = stats.rating;
      computedReviewCount = stats.reviewCount;
    } else {
      const stats = calculateProductRatingStats(id);
      computedRating = stats.reviewCount > 0 ? stats.rating : (Number(rating) || 5.0);
      computedReviewCount = stats.reviewCount > 0 ? stats.reviewCount : (Number(reviewCount) || 0);
    }

    const effectiveIsBestSeller =
      isBestSeller !== undefined
        ? Boolean(isBestSeller)
        : is_best_seller !== undefined
        ? Boolean(is_best_seller)
        : false;

    const effectiveIsFeatured =
      isFeatured !== undefined
        ? Boolean(isFeatured)
        : is_featured !== undefined
        ? Boolean(is_featured)
        : false;

    const effectiveStatus = status === "inactive" || status === "draft" ? status : "active";

    // Format clean images array
    const sanitizedImages: string[] = Array.isArray(images)
      ? images
          .map((img: any) => {
            if (typeof img === "string") return img.trim();
            if (img && typeof img === "object" && img.url) return String(img.url).trim();
            return "";
          })
          .filter(Boolean)
      : [];

    const productData = {
      id,
      name: name.trim(),
      db_product_name: (db_product_name || dbProductName || "").trim() || undefined,
      slug: slug.trim(),
      price: Math.round(numPrice),
      compareAtPrice: compareAtPrice && !isNaN(Number(compareAtPrice)) ? Math.round(Number(compareAtPrice)) : null,
      badge: badge && String(badge).trim() ? String(badge).trim() : null,
      categoryId: categoryId ? String(categoryId).trim() : undefined,
      categorySlug: categorySlug || "everyday-totes",
      categoryName: categoryName || "Everyday Totes",
      isBestSeller: effectiveIsBestSeller,
      is_best_seller: effectiveIsBestSeller,
      isFeatured: effectiveIsFeatured,
      is_featured: effectiveIsFeatured,
      status: effectiveStatus,
      additionalCategorySlugs: Array.isArray(additionalCategorySlugs) ? additionalCategorySlugs : [],
      benefits: Array.isArray(benefits) ? benefits.map((b: any) => String(b).trim()).filter(Boolean) : [],
      specs: Array.isArray(specs) ? specs : [],
      images: sanitizedImages,
      variants: Array.isArray(variants) ? variants : [],
      story: story ? String(story).trim() : "",
      rating: computedRating,
      reviewCount: computedReviewCount,
      created_at: created_at || new Date().toISOString(),
    };

    const success = await supabaseCatalogService.upsertProduct(id, productData);
    if (!success) {
      return NextResponse.json({ error: "Failed to save product to catalog" }, { status: 500 });
    }

    // Atomic cache invalidation
    try {
      revalidateTag("cb-products", { expire: 0 });
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/shop");
      if (productData.categorySlug) {
        revalidatePath(`/category/${productData.categorySlug}`);
        revalidatePath(`/category/${productData.categorySlug}`, "page");
      }
      revalidatePath(`/product/${productData.slug}`);
      revalidatePath(`/product/${productData.slug}`, "page");
      revalidatePath("/admin/products");
    } catch (e) {
      // Non-fatal
    }

    return NextResponse.json({ success: true, product: productData });
  } catch (error: any) {
    console.error("[Product API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to save product" }, { status: 500 });
  }
}
