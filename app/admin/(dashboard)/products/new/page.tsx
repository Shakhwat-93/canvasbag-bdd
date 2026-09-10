import React from "react";
import { getCatalogCategories } from "@/lib/supabase";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Add Product | CanvasBag Admin",
};

export default async function NewProductPage() {
  const categories = await getCatalogCategories();

  return <ProductForm categories={categories} mode="create" />;
}
