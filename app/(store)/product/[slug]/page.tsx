import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseCatalogService } from "@/lib/supabase";
import { getApprovedReviews } from "@/lib/db";
import { ProductView } from "@/components/store/product-view";
import type { ProductReview } from "@/lib/types";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const products = await supabaseCatalogService.getCatalogProducts();
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return { title: "Product Not Found | CanvasBag" };
  }

  const firstImg =
    product.images?.[0] || product.image || product.imageUrl || "/brand/logo.webp";
  const imgUrl = typeof firstImg === "object" && firstImg !== null ? (firstImg as any).url : firstImg;

  return {
    title: `${product.name} | CanvasBag Bangladesh`,
    description:
      product.description ||
      `Buy ${product.name} online in Bangladesh with Cash on Delivery at CanvasBag.`,
    openGraph: {
      title: `${product.name} | CanvasBag`,
      description: product.description || undefined,
      images: imgUrl ? [{ url: imgUrl }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const [products, settings] = await Promise.all([
    supabaseCatalogService.getCatalogProducts(),
    supabaseCatalogService.getSettings(),
  ]);

  const product = products.find((p) => p.slug === slug);
  if (!product) {
    notFound();
  }

  // Fetch approved reviews from local SQLite database
  let approvedReviews: ProductReview[] = [];
  try {
    approvedReviews = getApprovedReviews(product.id);
  } catch (e) {
    console.warn("[ProductPage] Could not load customer reviews:", e);
  }

  // Calculate dynamic review stats
  const reviewCount = approvedReviews.length;
  let dynamicRating = 5.0;
  if (reviewCount > 0) {
    const totalRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0);
    dynamicRating = Math.round((totalRating / reviewCount) * 10) / 10;
  }

  const enrichedProduct = {
    ...product,
    rating: dynamicRating,
    reviewCount,
  };

  // Related products in same category
  const categorySlug = product.categorySlug || (product as any).category_slug;
  const relatedProducts = products
    .filter((p) => (p.categorySlug === categorySlug || (p as any).category_slug === categorySlug) && p.id !== product.id)
    .slice(0, 4);

  return (
    <ProductView
      product={enrichedProduct}
      reviews={approvedReviews}
      settings={settings}
      relatedProducts={relatedProducts}
    />
  );
}
