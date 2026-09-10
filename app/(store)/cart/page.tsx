"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { formatBDT } from "@/lib/format";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, banglaSubtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto grid min-h-[55vh] max-w-xl place-items-center px-4 py-20 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <ShoppingBag className="w-10 h-10 stroke-1" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Your carry is quiet</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Find a canvas bag worth carrying.</h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Explore our best selling collections and add your preferred carry before checkout.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-2xl bg-primary-gradient text-[var(--primary-foreground)] text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-md"
          >
            <span>Shop All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fafaf9] min-h-screen py-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:gap-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        {/* Items list */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-4 bg-white p-4 rounded-2xl border">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">আপনার শপিং ব্যাগ</h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {items.length} {items.length === 1 ? "পণ্য" : "পণ্যসমূহ"}
            </span>
          </div>

          <div className="grid gap-3">
            {items.map((item) => (
              <article
                key={`${item.productId}-${item.variantId}`}
                className="grid grid-cols-[88px_1fr] sm:grid-cols-[100px_1fr] gap-4 rounded-2xl p-4 bg-white border border-[#e5e7eb] shadow-xs"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-50 border border-[#e5e7eb] shrink-0">
                  <Image
                    src={item.image || "/brand/logo.webp"}
                    alt={item.name}
                    fill
                    sizes="100px"
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-col justify-between gap-3 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${item.slug}`}
                        className="font-bold text-sm sm:text-base text-slate-900 hover:text-[#ff6b35] transition-colors line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      {item.variantName && item.variantName !== "Standard" && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{item.variantName}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-red-50"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-0.5 border border-[#e5e7eb]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-slate-100 text-slate-700 shadow-xs cursor-pointer transition-all font-bold"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-slate-100 text-slate-700 shadow-xs cursor-pointer transition-all font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span
                      style={{ color: "var(--price-color, #12b76a)" }}
                      className="font-extrabold text-base sm:text-lg"
                    >
                      {formatBDT(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Order summary */}
        <aside className="h-fit rounded-3xl p-6 bg-white border border-[#e5e7eb] shadow-xs space-y-6">
          <h2 className="font-black text-lg text-slate-900 uppercase tracking-wider pb-3 border-b border-[#e5e7eb]">
            অর্ডার সামারি
          </h2>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">সাবটোটাল</span>
              <span className="font-extrabold text-slate-900 text-base">{formatBDT(subtotal)}</span>
            </div>

            <div className="border-t border-[#e5e7eb] pt-3 flex justify-between items-center">
              <span className="font-extrabold text-slate-900 text-base">সর্বমোট</span>
              <span
                style={{ color: "var(--price-color, #12b76a)" }}
                className="font-black text-2xl"
              >
                {formatBDT(subtotal)}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal pt-1">
              * ডেলিভারি চার্জ ও প্রযোজ্য ছাড় চেকআউট পেইজে স্বয়ংক্রিয়ভাবে হিসাব করা হবে।
            </p>
          </div>

          <Link
            href="/checkout"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-[#ff804e] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#e55520] text-white text-xs font-black uppercase tracking-widest hover:opacity-95 transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <span>চেকআউট করুন (ক্যাশ অন ডেলিভারি)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

