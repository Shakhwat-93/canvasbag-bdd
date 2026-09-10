import React from "react";
import { getCatalogSettings } from "@/lib/supabase";
import { SettingsManager } from "@/components/admin/settings-manager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Site Settings | CanvasBag Admin",
};

export default async function AdminSettingsPage() {
  const settings = await getCatalogSettings();

  return <SettingsManager initialSettings={settings} />;
}
