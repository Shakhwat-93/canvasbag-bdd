import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Flame, ArrowRight } from "lucide-react";
import { supabaseCatalogService } from "@/lib/supabase";
import { getSortedProducts, getTopSellingProducts } from "@/lib/catalog";
import { getAllReviews } from "@/lib/db";
import { OriginHeroSlider } from "@/components/store/origin-hero-slider";
import { TrustBadgesMarquee } from "@/components/store/trust-badges-marquee";
import { CategoryMarquee } from "@/components/store/category-marquee";
import { ProductCard } from "@/components/store/product-card";
import { PromoCtaBanner } from "@/components/store/promo-cta-banner";
import { ReviewsSection } from "@/components/store/reviews-section";
import { WhyChooseUs } from "@/components/store/why-choose-us";
import type { ProductReview } from "@/lib/types";

export const revalidate = 60; // Revalidate every 60s

export default async function HomePage() {
  const headerList = await headers();
  const host = headerList.get("host")?.split(":")[0];

  // Custom domain check for landing pages
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    const landingPages = await supabaseCatalogService.getLandingPages();
    const matchedLp = landingPages.find((lp) => lp.custom_domain === host);
    if (matchedLp) {
      redirect(`/lp/${matchedLp.slug || matchedLp.id}`);
    }
  }

  const [settings, categories, bestSellers] = await Promise.all([
    supabaseCatalogService.getSettings(),
    supabaseCatalogService.getCategories(),
    getTopSellingProducts(8),
  ]);

  // Approved customer reviews from local DB
  let reviews: ProductReview[] = [];
  try {
    reviews = getAllReviews().filter((r) => r.status === "approved");
  } catch (e) {
    console.warn("[HomePage] Could not load customer reviews:", e);
  }

  return (
    <div className="w-full bg-[#fafaf9]">
      <h1 className="sr-only">
        CanvasBag — বাংলাদেশের সেরা অনলাইন ব্যাগ শপ | ক্যাশ অন ডেলিভারি
      </h1>

      {/* 1. Hero Carousel Section */}
      <OriginHeroSlider settings={settings} />

      {/* 2. Trust Badges Infinite Marquee */}
      <TrustBadgesMarquee />

      {/* 3. Product Categories Marquee */}
      <CategoryMarquee categories={categories} />

      {/* 4. Best Sellers / Hot Selling Products Grid */}
      <section id="best-sellers" className="py-12 md:py-16 bg-white text-black font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-[#ff6b35]" />
                <span className="text-xs sm:text-sm font-semibold text-[#ff6b35] uppercase tracking-wider">
                  বেস্ট সেলার
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111827]">
                আমাদের হট সেলিং পণ্যসমূহ
              </h2>
            </div>

            <Link
              href="/shop"
              className="flex items-center gap-1 text-sm font-bold text-[#ff6b35] hover:text-[#e55520] transition-colors group"
            >
              <span>সব দেখুন</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. High-Converting Promo CTA Banner */}
      <PromoCtaBanner settings={settings} />

      {/* 6. Customer Reviews Section */}
      <ReviewsSection reviews={reviews} />

      {/* 7. Why Choose Us Section */}
      <WhyChooseUs />
    </div>
  );
}
