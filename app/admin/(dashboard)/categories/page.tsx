import React from "react";
import { getCatalogCategories, getCatalogProducts } from "@/lib/supabase";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Categories Management | CanvasBag Admin",
};

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([
    getCatalogCategories(),
    getCatalogProducts(),
  ]);

  return <CategoriesManager initialCategories={categories} initialProducts={products} />;
}
