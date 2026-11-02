import React from "react";
import { getCatalogSettings, getCatalogCategories } from "@/lib/supabase";
import { SettingsManager } from "@/components/admin/settings-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Site Settings | CanvasBag Admin",
};

export default async function AdminSettingsPage() {
  const [settings, categories] = await Promise.all([
    getCatalogSettings({ forceFresh: true }),
    getCatalogCategories({ forceFresh: true }),
  ]);

  return <SettingsManager initialSettings={settings} categories={categories} />;
}
