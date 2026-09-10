"use client";

import React from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";

export function MobileFloatingCart() {
  const { itemCount, banglaItemCount, banglaSubtotal, setIsCartOpen } = useCart();

  if (itemCount === 0) return null;

  return (
    <button
      type="button"
      onClick={() => setIsCartOpen(true)}
      className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-[var(--primary)] text-[var(--primary-foreground)] flex flex-col items-center justify-center w-16 py-4 rounded-l-2xl shadow-xl border border-r-0 border-white/20 active:scale-95 hover:opacity-95 transition-all select-none cursor-pointer"
      aria-label="View Shopping Cart"
    >
      <div className="h-9 w-9 rounded-full flex items-center justify-center border border-white/20 bg-white/15 mb-1.5 shadow-xs">
        <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
      </div>
      <span className="text-[9px] font-black uppercase tracking-wider leading-none text-center mb-2">
        {banglaItemCount} ITEMS
      </span>
      <span className="bg-white text-[var(--primary)] text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs leading-none">
        ৳{banglaSubtotal}
      </span>
    </button>
  );
}
