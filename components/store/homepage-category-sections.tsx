import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import type { HomepageCategorySection } from "@/lib/catalog";

interface HomepageCategorySectionsProps {
  sections: HomepageCategorySection[];
}

export function HomepageCategorySections({ sections }: HomepageCategorySectionsProps) {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-12 md:space-y-16 py-8 md:py-12 bg-white text-black font-sans">
      {sections.map(({ category, products }) => (
        <section
          key={category.id || category.slug}
          id={`category-section-${category.slug}`}
          className="w-full"
          aria-labelledby={`heading-${category.slug}`}
        >
          <div className="max-w-7xl 2xl:max-w-[1536px] 3xl:max-w-[1728px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header: Category Name on left, View All on right */}
            <div className="flex items-center justify-between mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <span className="w-1.5 sm:w-2 h-6 sm:h-7 bg-[#c2410c] rounded-full shrink-0" />
                <div className="min-w-0">
                  <h2
                    id={`heading-${category.slug}`}
                    className="text-xl sm:text-2xl md:text-3xl font-bold text-[#111827] tracking-tight truncate"
                  >
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 hidden sm:block">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Category-Specific Navigation Button ("View All →" / "সব দেখুন →") */}
              <Link
                href={`/category/${category.slug}`}
                className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold text-[#c2410c] hover:text-[#9a3412] px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200/70 transition-all duration-200 group shrink-0 active:scale-95"
                title={`সব দেখুন - ${category.name}`}
              >
                <span>সব দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Responsive Product Grid: Exactly 2 cols on Mobile (4 items take 2 rows), 4 cols on Desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 2xl:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
