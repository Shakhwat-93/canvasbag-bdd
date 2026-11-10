import React from "react";
import { getCatalogSettings, getCatalogCategories, getCatalogProducts } from "@/lib/supabase";
import { buildMetaCatalogFeed } from "@/lib/meta-catalog";
import { SettingsManager } from "@/components/admin/settings-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Site Settings | CanvasBag Admin",
};

export default async function AdminSettingsPage() {
  const [settings, categories, products] = await Promise.all([
    getCatalogSettings({ forceFresh: true }),
    getCatalogCategories({ forceFresh: true }),
    getCatalogProducts({ forceFresh: true }),
  ]);

  const { report: metaCatalogReport } = buildMetaCatalogFeed({
    products,
    categories,
    settings,
  });

  return (
    <SettingsManager
      initialSettings={settings}
      categories={categories}
      metaCatalogReport={metaCatalogReport}
    />
  );
}
