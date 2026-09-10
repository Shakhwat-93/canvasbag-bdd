import React, { Suspense } from "react";
import { getCatalogCategories, getCatalogProducts } from "@/lib/supabase";
import { ProductsManager } from "@/components/admin/products-manager";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Products Manager | CanvasBag Admin",
};

export default async function AdminProductsPage() {
  const [categories, products] = await Promise.all([
    getCatalogCategories(),
    getCatalogProducts(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading products...</p>
        </div>
      }
    >
      <ProductsManager initialCategories={categories} initialProducts={products} />
    </Suspense>
  );
}
