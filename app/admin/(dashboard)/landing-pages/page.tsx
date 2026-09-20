import React from "react";
import { getLandingPages, getCatalogProducts } from "@/lib/supabase";
import { LandingPagesManager } from "@/components/admin/landing-pages-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Landing Pages | CanvasBag Admin",
};

export default async function AdminLandingPagesPage() {
  const [landingPages, products] = await Promise.all([
    getLandingPages({ forceFresh: true }),
    getCatalogProducts({ forceFresh: true }),
  ]);

  return <LandingPagesManager initialLandingPages={landingPages} initialProducts={products} />;
}
