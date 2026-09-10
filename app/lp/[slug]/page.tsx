import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseCatalogService } from "@/lib/supabase";
import { LandingPageView } from "@/components/store/landing-page-view";

interface LandingPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: LandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const landingPages = await supabaseCatalogService.getLandingPages();
  const page = landingPages.find((lp) => lp.slug === slug || lp.id === slug);

  if (!page) {
    return { title: "Exclusive Deal | CanvasBag" };
  }

  return {
    title: `${page.title || "Exclusive Deal"} | CanvasBag`,
    description: "Premium Carry - Direct promotional offer with nationwide Cash on Delivery in Bangladesh.",
  };
}

export default async function DynamicLandingPage({ params }: LandingPageProps) {
  const { slug } = await params;

  const [landingPages, products, settings] = await Promise.all([
    supabaseCatalogService.getLandingPages(),
    supabaseCatalogService.getCatalogProducts(),
    supabaseCatalogService.getSettings(),
  ]);

  const page = landingPages.find((lp) => lp.slug === slug || lp.id === slug);
  if (!page) {
    notFound();
  }

  return <LandingPageView page={page} products={products} settings={settings} />;
}
