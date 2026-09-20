import React from "react";
import { getCatalogCategories, getCatalogProducts } from "@/lib/supabase";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Categories Management | CanvasBag Admin",
};

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([
    getCatalogCategories({ forceFresh: true }),
    getCatalogProducts({ forceFresh: true }),
  ]);

  return <CategoriesManager initialCategories={categories} initialProducts={products} />;
}
