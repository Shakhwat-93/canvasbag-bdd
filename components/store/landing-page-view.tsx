"use client";

import React, { useEffect } from "react";
import type { LandingPage, Product, SiteSettings } from "@/lib/types";
import { trackPageView } from "@/lib/analytics";
import { HighConvertingTemplate } from "@/components/store/templates/high-converting-template";
import { LuxuryMinimalTemplate } from "@/components/store/templates/luxury-minimal-template";

interface LandingPageViewProps {
  page: LandingPage;
  products: Product[];
  settings: SiteSettings;
}

export function LandingPageView({ page, products, settings }: LandingPageViewProps) {
  // Fire PageView strictly once on client mount
  useEffect(() => {
    trackPageView(window.location.pathname);
  }, []);

  const template = page.template || "high_converting";

  if (template === "modern_luxury") {
    return <LuxuryMinimalTemplate page={page} products={products} settings={settings} />;
  }

  // Default to High-Converting Template (the e-commerce direct response style)
  return <HighConvertingTemplate page={page} products={products} settings={settings} />;
}
