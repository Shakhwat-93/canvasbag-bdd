"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { formatBDT, sanitizeImageUrl } from "@/lib/format";

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeItem, subtotal, banglaSubtotal } = useCart();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        setIsCartOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  // Lock body scroll when cart drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  return (
    <div
      className={`fixed inset-0 z-[110] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!isCartOpen}
    >
      {/* Backdrop click close */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 cursor-pointer"
        aria-label="Close cart drawer"
      />

      {/* Cart Drawer Panel */}
      <div
        className={`relative w-[90%] sm:max-w-md h-full bg-white shadow-2xl transition-transform duration-300 flex flex-col justify-between z-10 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-150 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-slate-900" />
            <h2 className="font-black text-slate-900 text-lg uppercase tracking-wider">Your Carry</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="p-2.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5.5 h-5.5" />
          </button>
        </div>

        {/* Items container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-10 h-10 stroke-1" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-base">আপনার কার্ট বর্তমানে খালি আছে</h3>
                <p className="text-xs text-slate-500 max-w-xs">পছন্দের ক্যানভাস ব্যাগ খুঁজে নিতে আমাদের কালেকশন ঘুরে দেখুন।</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="mt-2 px-6 py-2.5 rounded-xl bg-primary-gradient text-[var(--primary-foreground)] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-sm"
              >
                Explore Products
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex gap-4 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-slate-200 transition-all"
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-20 min-w-20 min-h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <Image
                    src={sanitizeImageUrl(item.image, "/brand/logo.webp")}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={() => setIsCartOpen(false)}
                        className="text-xs sm:text-sm font-bold text-slate-850 hover:text-[var(--primary)] line-clamp-1 transition-colors"
                      >
                        {item.name}
                      </Link>
                      {item.variantName && item.variantName !== "Standard" && (
                        <p className="text-[11px] text-slate-500 font-medium">{item.variantName}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-black text-slate-900">
                      {formatBDT(item.price * item.quantity)}
                    </span>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateQuantity(item.productId, item.variantId, item.quantity - 1);
                          } else {
                            removeItem(item.productId, item.variantId);
                          }
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-white hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer transition-all"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-white hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer transition-all"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom summary & actions */}
        {items.length > 0 && (
          <div className="border-t border-slate-200 p-6 bg-slate-50/90 space-y-4 shadow-[0_-8px_30px_rgba(0,0,0,0.03)]">
            <div className="flex justify-between items-center py-3 px-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Subtotal</span>
              <span className="font-black text-xl text-slate-900 bg-slate-100 px-4 py-1.5 rounded-xl border border-slate-200 shadow-inner min-w-[120px] text-center tracking-tight">
                ৳{banglaSubtotal}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="border-2 border-slate-300 hover:bg-slate-100 text-slate-800 rounded-2xl py-3.5 text-xs font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 text-center"
              >
                Keep Shopping
              </button>
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="bg-primary-gradient text-[var(--primary-foreground)] rounded-2xl py-3.5 text-xs font-black uppercase tracking-widest text-center shadow-lg shadow-[var(--primary)]/25 active:scale-95 transition-all flex items-center justify-center hover:opacity-95"
              >
                Checkout COD
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
