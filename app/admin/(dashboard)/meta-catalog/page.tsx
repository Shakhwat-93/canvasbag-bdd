import React from "react";
import { getCatalogProducts, getCatalogCategories, getCatalogSettings } from "@/lib/supabase";
import { buildMetaCatalogFeed } from "@/lib/meta-catalog";
import { MetaCatalogManager } from "@/components/admin/meta-catalog-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Meta Product Catalog Feed | CanvasBag Admin",
};

export default async function AdminMetaCatalogPage() {
  const [products, categories, settings] = await Promise.all([
    getCatalogProducts({ forceFresh: true }),
    getCatalogCategories({ forceFresh: true }),
    getCatalogSettings({ forceFresh: true }),
  ]);

  const { report, items } = buildMetaCatalogFeed({
    products,
    categories,
    settings,
  });

  return <MetaCatalogManager initialReport={report} initialItems={items} />;
}
