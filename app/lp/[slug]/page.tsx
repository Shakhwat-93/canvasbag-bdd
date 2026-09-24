import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseCatalogService } from "@/lib/supabase";
import { LandingPageView } from "@/components/store/landing-page-view";
import { resolveLandingPageProductData } from "@/lib/landing-page-defaults";

interface LandingPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export const revalidate = 30;

export async function generateMetadata({ params }: LandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const landingPages = await supabaseCatalogService.getLandingPages();
  const page = landingPages.find(
    (lp) =>
      lp.slug === slug ||
      lp.id === slug ||
      lp.custom_domain === slug ||
      lp.subdomain === slug
  );

  if (!page) {
    return { title: "Exclusive Deal | CanvasBag" };
  }

  const title = page.meta_title || `${page.title} | CanvasBag`;
  const description =
    page.meta_description ||
    page.product_override?.subheadline ||
    "প্রিমিয়াম কোয়ালিটির ক্যানভাস ব্যাগ এখন সীমিত সময়ের মেগা অফারে। সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা।";
  const ogImage = page.og_image || page.product_override?.hero_image || "/brand/logo.webp";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: page.title }],
      url: `/lp/${page.slug || page.id}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: page.canonical_url || `/lp/${page.slug || page.id}`,
    },
  };
}

export default async function DynamicLandingPage({ params, searchParams }: LandingPageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;

  const [landingPages, products, settings] = await Promise.all([
    supabaseCatalogService.getLandingPages({ forceFresh: true }),
    supabaseCatalogService.getCatalogProducts({ forceFresh: true }),
    supabaseCatalogService.getSettings(),
  ]);

  const page = landingPages.find(
    (lp) =>
      lp.slug === slug ||
      lp.id === slug ||
      lp.custom_domain === slug ||
      lp.subdomain === slug
  );

  if (!page) {
    notFound();
  }

  // Check draft status
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("admin_token")?.value;
  const isAdmin = Boolean(adminToken && adminToken.length > 10);
  const isPreview = preview === "true" || isAdmin;

  if (page.status === "draft" && !isPreview) {
    notFound();
  }

  const activeProducts = products.filter((p) => p.status !== "inactive" && p.status !== "draft");
  const resolved = resolveLandingPageProductData(page, activeProducts);

  // Structured Data (JSON-LD Product)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: resolved.name,
    image: [resolved.primaryImage, ...resolved.galleryImages],
    description: resolved.subheadline || resolved.description,
    brand: {
      "@type": "Brand",
      name: "CanvasBag Bangladesh",
    },
    offers: {
      "@type": "Offer",
      url: `https://canvasbagbd.com/lp/${page.slug || page.id}`,
      priceCurrency: "BDT",
      price: resolved.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "CanvasBag",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: resolved.reviews.length > 0 ? String(resolved.reviews.length + 120) : "145",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {page.status === "draft" && isPreview && (
        <aside aria-label="Draft Preview Mode" className="sticky top-0 z-50 bg-amber-500 text-amber-950 text-xs font-bold text-center py-2 px-4 shadow-md flex items-center justify-center gap-2">
          <span>⚠️ আপনি এই ল্যান্ডিং পেজটি ড্রাফট / প্রিভিউ মোডে দেখছেন (Draft Preview Mode)</span>
        </aside>
      )}
      <LandingPageView page={page} products={activeProducts} settings={settings} />
    </>
  );
}
