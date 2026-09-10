"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, Phone, ShoppingCart, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import type { Category, SiteSettings } from "@/lib/types";
import { buildCategoryTree } from "@/lib/category-tree";

interface HeaderProps {
  categories?: Category[];
  settings?: SiteSettings;
}

export function Header({ categories = [], settings = {} }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMobileCats, setExpandedMobileCats] = useState<Set<string>>(new Set());

  const categoryTree = React.useMemo(() => {
    const visibleCategories = categories.filter(
      (c) => c.isActive !== false && c.is_active !== false && c.isVisible !== false && c.is_visible !== false
    );
    return buildCategoryTree(visibleCategories);
  }, [categories]);

  const toggleMobileCat = (id: string) => {
    setExpandedMobileCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const rawPhone = settings.phone || settings.whatsappNumber || "01942212267";
  const displayPhone = rawPhone.startsWith("+88") ? rawPhone : `+88${rawPhone.startsWith("0") ? rawPhone : "0" + rawPhone}`;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white transition-shadow duration-200 border-b border-[#e5e7eb] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Mobile Header Row 1 */}
          <div className="flex md:hidden items-center justify-between h-16">
            <div className="flex items-center justify-start w-28">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#f8f9fa] hover:bg-[#fff3ef] transition-colors cursor-pointer text-[#374151]"
                aria-label="মেনু"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex justify-center">
              <Link href="/" className="flex items-center gap-2 group">
                <Image
                  src="/brand/logo.webp"
                  alt="CanvasBag Logo"
                  width={36}
                  height={36}
                  className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                  priority
                  unoptimized
                />
                <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-[#ff6b35] transition-colors">
                  Canvas<span className="text-[#ff6b35]">Bag</span>
                </span>
              </Link>
            </div>

            <div className="flex items-center justify-end w-28 gap-2">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-[#f8f9fa] hover:bg-[#fff3ef] transition-colors text-[#374151] hover:text-[#ff6b35] cursor-pointer"
                aria-label={`কার্ট — ${itemCount} টি পণ্য`}
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ff6b35] text-white px-1 text-[11px] font-bold border-2 border-white shadow-xs">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Header Row 1 */}
          <div className="hidden md:flex items-center justify-between h-16 gap-6">
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <Image
                src="/brand/logo.webp"
                alt="CanvasBag Logo"
                width={38}
                height={38}
                className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                priority
                unoptimized
              />
              <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-[#ff6b35] transition-colors">
                Canvas<span className="text-[#ff6b35]">Bag</span>
              </span>
            </Link>

            {/* Desktop Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl mx-auto">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="পণ্য খুঁজুন..."
                  className="w-full pl-4 pr-12 py-2.5 border-2 border-[#e5e7eb] rounded-xl text-sm focus:border-[#ff6b35] focus:outline-none transition-colors text-black bg-white"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-4 bg-[#ff6b35] hover:bg-[#e55520] rounded-r-xl text-white transition-colors cursor-pointer flex items-center justify-center"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Desktop Right Phone & Cart */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <a
                href={`tel:${rawPhone}`}
                className="hidden lg:flex items-center gap-2 text-sm text-[#374151] hover:text-[#ff6b35] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#ff6b35]" />
                <span className="font-semibold">{displayPhone}</span>
              </a>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-[#f8f9fa] hover:bg-[#fff3ef] transition-colors text-[#374151] hover:text-[#ff6b35] cursor-pointer"
                aria-label={`কার্ট — ${itemCount} টি পণ্য`}
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ff6b35] text-white px-1 text-[11px] font-bold border-2 border-white shadow-xs">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Form (Row 2 on mobile) */}
          <form onSubmit={handleSearchSubmit} className="md:hidden pb-3">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="পণ্য খুঁজুন..."
                className="w-full pl-4 pr-12 py-2 border-2 border-[#e5e7eb] rounded-xl text-sm focus:border-[#ff6b35] focus:outline-none transition-colors text-black bg-white"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-4 bg-[#ff6b35] hover:bg-[#e55520] rounded-r-xl text-white transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Desktop Subnav Navigation */}
          <nav className="hidden md:flex items-center gap-6 pb-3 text-sm font-medium border-t border-gray-50 pt-2.5">
            <Link
              href="/"
              className={`transition-colors ${pathname === "/" ? "text-[#ff6b35] font-bold" : "text-[#374151] hover:text-[#ff6b35]"}`}
            >
              হোম
            </Link>
            <Link
              href="/shop"
              className={`transition-colors ${pathname === "/shop" ? "text-[#ff6b35] font-bold" : "text-[#374151] hover:text-[#ff6b35]"}`}
            >
              শপ
            </Link>

            {/* Categories Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsCategoryDropdownOpen(true)}
              onMouseLeave={() => setIsCategoryDropdownOpen(false)}
            >
              <button
                type="button"
                className="flex items-center gap-1 text-[#374151] hover:text-[#ff6b35] transition-colors py-1 cursor-pointer"
              >
                ক্যাটেগরি <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 w-72 bg-white rounded-2xl shadow-xl border border-gray-150 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {categoryTree.map((cat) => (
                    <div key={cat.id} className="relative group/sub">
                      <Link
                        href={`/category/${cat.slug}`}
                        className="flex items-center justify-between px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff3ef] hover:text-[#ff6b35] transition-colors font-medium"
                      >
                        <span className="truncate">{cat.name}</span>
                        {cat.children && cat.children.length > 0 ? (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/sub:text-[#ff6b35] transition-colors" />
                        ) : null}
                      </Link>

                      {/* Level 2 Flyout Submenu */}
                      {cat.children && cat.children.length > 0 && (
                        <div className="hidden group-hover/sub:block absolute left-full top-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-150 py-2 -ml-1 animate-in fade-in duration-100 z-50">
                          {cat.children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/category/${child.slug}`}
                              className="flex items-center justify-between px-4 py-2 text-xs text-slate-700 hover:bg-[#fff3ef] hover:text-[#ff6b35] transition-colors font-medium"
                            >
                              <span className="truncate">{child.name}</span>
                              <ChevronRight className="w-3 h-3 text-slate-300" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link
                    href="/shop"
                    className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-[#ff6b35] hover:bg-[#fff3ef] transition-colors"
                  >
                    <span>সকল পণ্য দেখুন</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/cart"
              className={`transition-colors ${pathname === "/cart" ? "text-[#ff6b35] font-bold" : "text-[#374151] hover:text-[#ff6b35]"}`}
            >
              কার্ট
            </Link>
            <Link
              href="/track"
              className={`transition-colors ${pathname === "/track" ? "text-[#ff6b35] font-bold" : "text-[#374151] hover:text-[#ff6b35]"}`}
            >
              অর্ডার ট্র্যাক
            </Link>
          </nav>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 group"
              >
                <Image
                  src="/brand/logo.webp"
                  alt="CanvasBag Logo"
                  width={32}
                  height={32}
                  className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
                  unoptimized
                />
                <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-[#ff6b35] transition-colors">
                  Canvas<span className="text-[#ff6b35]">Bag</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-6">
              <nav className="space-y-1">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-semibold text-slate-800 hover:bg-[#fff3ef] hover:text-[#ff6b35] transition-colors"
                >
                  হোম
                </Link>
                <Link
                  href="/shop"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-semibold text-slate-800 hover:bg-[#fff3ef] hover:text-[#ff6b35] transition-colors"
                >
                  শপ
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-800 hover:bg-[#fff3ef] hover:text-[#ff6b35] transition-colors"
                >
                  <span>কার্ট</span>
                  {itemCount > 0 && (
                    <span className="bg-[#ff6b35] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {itemCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/track"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-semibold text-slate-800 hover:bg-[#fff3ef] hover:text-[#ff6b35] transition-colors"
                >
                  অর্ডার ট্র্যাক
                </Link>
              </nav>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-4 mb-2">
                  ক্যাটেগরিসমূহ
                </p>
                <div className="space-y-1">
                  {categoryTree.map((cat) => {
                    const hasChildren = cat.children && cat.children.length > 0;
                    const isExpanded = expandedMobileCats.has(cat.id);

                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-[#fff3ef] hover:text-[#ff6b35] transition-colors">
                          <Link
                            href={`/category/${cat.slug}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex-1 truncate"
                          >
                            <span>{cat.name}</span>
                          </Link>
                          {hasChildren && (
                            <button
                              type="button"
                              onClick={() => toggleMobileCat(cat.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-800"
                              aria-label="Toggle subcategories"
                            >
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  isExpanded ? "rotate-180 text-[#ff6b35]" : ""
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        {hasChildren && isExpanded && (
                          <div className="pl-4 ml-3 border-l-2 border-[#ff6b35]/20 space-y-1 py-1">
                            {cat.children.map((child) => (
                              <Link
                                key={child.id}
                                href={`/category/${child.slug}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-[#fff3ef] hover:text-[#ff6b35] transition-colors"
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Contact Box */}
              <div className="bg-[#fff3ef] rounded-2xl p-4 border border-[#ff6b35]/15 space-y-2">
                <p className="text-xs font-bold text-[#ff6b35]">সরাসরি কল করুন</p>
                <a
                  href={`tel:${rawPhone}`}
                  className="flex items-center gap-2 text-sm font-black text-slate-900"
                >
                  <Phone className="w-4 h-4 text-[#ff6b35]" />
                  <span>{displayPhone}</span>
                </a>
                <p className="text-[10px] text-slate-500 font-medium">সকাল ১০টা — রাত ৯টা (সাত দিন)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}