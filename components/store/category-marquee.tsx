import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Grid2X2 } from "lucide-react";
import type { Category } from "@/lib/types";

interface CategoryMarqueeProps {
  categories: Category[];
}

export function CategoryMarquee({ categories = [] }: CategoryMarqueeProps) {
  if (categories.length === 0) return null;

  // Repeat items so that marquee smoothly loops continuously
  const displayItems = [...categories, ...categories, ...categories];

  return (
    <section id="categories" className="py-10 md:py-16 bg-[#fcfdfe] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3 bg-[#fff3ef] px-4 py-1.5 rounded-full border border-[#ff6b35]/10">
            <Grid2X2 className="w-4 h-4 text-[#ff6b35]" />
            <span className="text-xs font-bold text-[#ff6b35] uppercase tracking-wider">
              ক্যাটাগরি
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
            প্রোডাক্ট ক্যাটাগরি
          </h2>
          <p className="text-[#6b7280] mt-2 text-sm md:text-base max-w-md mx-auto">
            পছন্দের ক্যাটাগরি বেছে নিয়ে স্টোরের সেরা ডিল ও নতুন কালেকশন এক্সপ্লোর করুন
          </p>
        </div>

        {/* Marquee Carousel */}
        <div className="relative">
          {/* Gradient Edge Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-[#fcfdfe] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-[#fcfdfe] to-transparent z-10 pointer-events-none" />

          <div className="overflow-hidden py-2">
            <div className="animate-marquee-categories gap-4 md:gap-6">
              {displayItems.map((cat, idx) => (
                <Link
                  key={`${cat.id}-${idx}`}
                  href={`/category/${cat.slug}`}
                  className="flex-shrink-0 w-[110px] md:w-[130px] flex flex-col items-center bg-white rounded-3xl p-4 border border-gray-150 shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:border-[#ff6b35] hover:shadow-[0_12px_32px_rgba(255,107,53,0.06)] hover:-translate-y-1 transition-all duration-300 text-center cursor-pointer group"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#fff3ef] flex items-center justify-center mb-3 shadow-[inset_0_2px_4px_rgba(255,107,53,0.05)] overflow-hidden">
                    {cat.image ? (
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        width={48}
                        height={48}
                        className="w-8 h-8 md:w-10 md:h-10 object-contain group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <Grid2X2 className="w-6 h-6 text-[#ff6b35]" />
                    )}
                  </div>
                  <p className="text-xs md:text-sm font-bold text-[#111827] leading-tight truncate w-full group-hover:text-[#ff6b35] transition-colors">
                    {cat.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
