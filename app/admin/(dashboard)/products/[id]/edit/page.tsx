import React from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { getCatalogCategories, getCatalogProducts } from "@/lib/supabase";
import { getProductAllReviews } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditProductPageProps) {
  const { id } = await params;
  const products = await getCatalogProducts();
  const product = products.find((p) => p.id === id || p.slug === id);

  return {
    title: product ? `Edit: ${product.name} | CanvasBag Admin` : "Product Not Found | CanvasBag Admin",
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [categories, products] = await Promise.all([
    getCatalogCategories(),
    getCatalogProducts(),
  ]);

  const product = products.find((p) => p.id === id || p.slug === id);

  if (!product) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-600 rounded-full mx-auto flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900">Product Not Found</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            The product with ID or slug <code className="font-mono font-bold">{id}</code> does not exist in your catalog.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products List
        </Link>
      </div>
    );
  }

  const reviews = getProductAllReviews(product.id);

  return <ProductForm initialProduct={product} initialReviews={reviews} categories={categories} mode="edit" />;
}

