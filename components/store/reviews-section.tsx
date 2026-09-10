import React from "react";
import { Star, Quote } from "lucide-react";
import type { ProductReview } from "@/lib/types";

interface ReviewsSectionProps {
  reviews?: ProductReview[];
}

export function ReviewsSection({ reviews = [] }: ReviewsSectionProps) {
  const fallbackReviews: ProductReview[] = [
    {
      id: "rev-1",
      customer_name: "রাহেলা বেগম",
      location: "চট্টগ্রাম",
      rating: 5,
      comment: "প্রথমবার অনলাইনে ব্যাগ কিনে একটু ভয় ছিল। কিন্তু পণ্য পাওয়ার পরে সব ভয় দূর হয়ে গেছে। ১০০% অরিজিনাল এবং কোয়ালিটি অসাধারণ।",
    },
    {
      id: "rev-2",
      customer_name: "মোঃ তানভীর",
      location: "সিলেট",
      rating: 5,
      comment: "দামের চেয়ে অনেক বেশি ভালো পণ্য পেয়েছি। সেলাই ও ফ্যাব্রিক অত্যন্ত মজবুত। আগামী মাসে আবার অর্ডার করবো ইনশাআল্লাহ।",
    },
    {
      id: "rev-3",
      customer_name: "আরিফুল ইসলাম",
      location: "ঢাকা",
      rating: 5,
      comment: "ডেলিভারি অনেক ফাস্ট ছিল। পণ্য হাতে পেয়ে চেক করে পেমেন্ট করেছি। রাইডার ব্যাগটি মোটরবাইকে খুব চমৎকার ফিট হয়।",
    },
  ];

  const displayReviews: ProductReview[] = reviews.length > 0 ? reviews.slice(0, 6) : fallbackReviews;

  return (
    <section className="py-12 md:py-16 bg-[#f8f9fa] text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-5 h-5 fill-[#f59e0b] text-[#f59e0b]" />
            <span className="text-xs font-bold text-[#ff6b35] uppercase tracking-wider">
              গ্রাহক রিভিউ
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111827]">
            আমাদের গ্রাহকদের মতামত
          </h2>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayReviews.map((r, idx) => {
            const name = r.customer_name || r.name || "গ্রাহক";
            const initial = name.charAt(0);
            const location = r.location || (idx % 2 === 0 ? "ঢাকা" : "চট্টগ্রাম");

            return (
              <div
                key={String(r.id || idx)}
                className="bg-white rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    {/* Gradient Initial Avatar */}
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f59e0b] flex items-center justify-center flex-shrink-0 text-white font-bold text-base shadow-xs">
                      {initial}
                    </div>

                    <div>
                      <p className="font-semibold text-[#111827] text-sm leading-snug">
                        {name}
                      </p>
                      <p className="text-xs text-[#6b7280] mt-0.5">
                        📍 {location}
                      </p>
                    </div>

                    <Quote className="ml-auto text-[#e5e7eb] w-5 h-5 shrink-0" />
                  </div>

                  {/* Rating Stars */}
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, sIdx) => (
                      <Star
                        key={sIdx}
                        className={`w-3.5 h-3.5 ${
                          sIdx < Number(r.rating || 5)
                            ? "fill-[#f59e0b] text-[#f59e0b]"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-sm text-[#374151] leading-relaxed">
                    {r.comment || r.quote || ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
