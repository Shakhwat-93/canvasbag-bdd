"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, Search } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount, setIsCartOpen } = useCart();

  const handleSearchClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const searchInput = document.querySelector<HTMLInputElement>("input[type='text'][placeholder*='Search']");
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 150);
    }
  };

  return (
    <div className="block md:hidden fixed bottom-0 inset-x-0 z-40 bg-primary-gradient border-t border-white/10 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-4 h-14 w-full">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center active:scale-95 transition-transform ${
            pathname === "/" ? "text-[var(--primary-foreground)] font-black" : "text-[var(--primary-foreground)]/80"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Home</span>
        </Link>

        {/* Categories / Shop */}
        <Link
          href="/shop"
          className={`flex flex-col items-center justify-center active:scale-95 transition-transform ${
            pathname.startsWith("/shop") || pathname.startsWith("/category")
              ? "text-[var(--primary-foreground)] font-black"
              : "text-[var(--primary-foreground)]/80"
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Categories</span>
        </Link>

        {/* Cart */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center text-[var(--primary-foreground)]/80 active:scale-95 transition-transform cursor-pointer"
          aria-label="Open Cart"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-[var(--primary-foreground)]" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-white text-[var(--primary)] text-[9px] font-black leading-none px-1 shadow-xs">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-0.5 text-[var(--primary-foreground)]">Cart</span>
        </button>

        {/* Search */}
        <button
          type="button"
          onClick={handleSearchClick}
          className="flex flex-col items-center justify-center text-[var(--primary-foreground)]/80 active:scale-95 transition-transform cursor-pointer"
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-[var(--primary-foreground)]" />
          <span className="text-[10px] font-bold mt-0.5 text-[var(--primary-foreground)]">Search</span>
        </button>
      </div>
    </div>
  );
}
