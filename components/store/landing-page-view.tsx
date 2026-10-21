"use client";

import React from "react";
import type { LandingPage, Product, SiteSettings } from "@/lib/types";
import { HighConvertingTemplate } from "@/components/store/templates/high-converting-template";
import { LuxuryMinimalTemplate } from "@/components/store/templates/luxury-minimal-template";

interface LandingPageViewProps {
  page: LandingPage;
  products: Product[];
  settings: SiteSettings;
}

export function LandingPageView({ page, products, settings }: LandingPageViewProps) {
  const template = page.template || "high_converting";

  if (template === "modern_luxury") {
    return <LuxuryMinimalTemplate page={page} products={products} settings={settings} />;
  }

  // Default to High-Converting Template (the e-commerce direct response style)
  return <HighConvertingTemplate page={page} products={products} settings={settings} />;
}
