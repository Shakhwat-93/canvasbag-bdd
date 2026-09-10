import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getSortedProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/store/product-card";

export const metadata: Metadata = {
  title: "Shop All Premium Bags | CanvasBag",
  description: "Browse our complete collection of premium canvas bags with nationwide cash on delivery in Bangladesh.",
};

export const revalidate = 60;

interface ShopPageProps {
  searchParams: Promise<{ search?: string; q?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const sParams = await searchParams;
  const rawQuery = sParams?.q || sParams?.search || "";
  const searchQuery = rawQuery.toLowerCase().trim();

  let products = await getSortedProducts("all");

  if (searchQuery) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery) ||
        p.slug.toLowerCase().includes(searchQuery) ||
        (p.description && p.description.toLowerCase().includes(searchQuery))
    );
  }

  return (
    <div className="bg-[#fafaf9] min-h-screen py-8">
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center mb-8 text-center bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-xs">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {rawQuery ? `অনুসন্ধানের ফলাফল: "${rawQuery}"` : "সকল প্রিমিয়াম কালেকশন"}
          </h1>
          <span className="mt-2.5 h-1 w-12 rounded bg-[#ff6b35]" />
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            {products.length} টি ব্যাগ পাওয়া গেছে
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 space-y-4 bg-white border border-[#e5e7eb] rounded-3xl p-8">
            <p className="text-slate-500 font-medium">কোনো প্রোডাক্ট খুঁজে পাওয়া যায়নি।</p>
            <Link
              href="/shop"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff804e] to-[#ff6b35] text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-sm"
            >
              সব প্রোডাক্ট দেখুন
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
