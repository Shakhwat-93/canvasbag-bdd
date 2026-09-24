import React from "react";
import { getLandingPages, getCatalogProducts } from "@/lib/supabase";
import { getAllLocalOrders } from "@/lib/db";
import { LandingPagesManager } from "@/components/admin/landing-pages-manager";
import type { LocalOrder } from "@/lib/types";

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

  let orders: LocalOrder[] = [];
  try {
    orders = getAllLocalOrders();
  } catch (e) {
    console.warn("[Admin Landing Pages] Could not load orders for analytics:", e);
  }

  return (
    <LandingPagesManager
      initialLandingPages={landingPages}
      initialProducts={products}
      initialOrders={orders}
    />
  );
}
