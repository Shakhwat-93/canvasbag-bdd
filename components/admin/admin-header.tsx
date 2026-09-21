"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Plus,
  Bell,
  ExternalLink,
  ChevronRight,
  User,
  LogOut,
  X,
} from "lucide-react";
import { AdminSignoutButton } from "@/components/admin/admin-signout-button";

interface AdminHeaderProps {
  adminEmail: string;
  onOpenMobileMenu: () => void;
  pendingAlertsCount?: number;
}

export function AdminHeader({
  adminEmail,
  onOpenMobileMenu,
  pendingAlertsCount = 0,
}: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/admin/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Dynamic breadcrumb label
  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard";
    if (pathname.startsWith("/admin/products/new")) return "Add New Product";
    if (pathname.startsWith("/admin/products") && pathname.includes("/edit")) return "Edit Product";
    if (pathname.startsWith("/admin/products")) return "Products";
    if (pathname.startsWith("/admin/categories")) return "Categories";
    if (pathname.startsWith("/admin/media")) return "Media Library";
    if (pathname.startsWith("/admin/landing-pages")) return "Collections / Drops";
    if (pathname.startsWith("/admin/reviews")) return "Reviews & Testimonials";
    if (pathname.startsWith("/admin/support")) return "Support Inbox";
    if (pathname.startsWith("/admin/settings")) return "Settings";
    return "Admin";
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-[#EFECE6] sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-3 sm:gap-6 max-w-7xl mx-auto">
        {/* Left: Mobile Trigger & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-1 text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-stone-500 truncate">
            <Link href="/admin" className="hover:text-stone-900 transition-colors">
              CanvasBag
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-300 shrink-0" />
            <span className="font-bold text-stone-900 truncate">{getPageTitle()}</span>
          </div>

          <span className="sm:hidden font-bold text-stone-900 text-sm truncate">
            {getPageTitle()}
          </span>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-[#FAF8F5] hover:bg-stone-100/80 border border-[#E8E4DD] rounded-full text-xs text-stone-600 focus-within:border-[#D45266] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#D45266]/15 transition-all">
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, customers, products..."
                className="w-full bg-transparent outline-none text-xs text-stone-800 placeholder-stone-400 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-stone-400 hover:text-stone-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* + Add Product Primary Action */}
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#D45266] hover:bg-[#BF4357] text-white rounded-full text-xs font-bold shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline">+ Add Product</span>
            <span className="xs:hidden">Add</span>
          </Link>

          {/* Notifications / Support Bell */}
          <Link
            href="/admin/support"
            className="relative h-9 w-9 rounded-full border border-[#E8E4DD] bg-white hover:bg-[#FAF8F5] grid place-items-center text-stone-600 transition-colors cursor-pointer"
            title="Customer Inquiries & Messages"
          >
            <Bell className="w-4 h-4" />
            {pendingAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D45266] text-[9px] font-black text-white ring-2 ring-white">
                {pendingAlertsCount > 9 ? "9+" : pendingAlertsCount}
              </span>
            )}
          </Link>

          {/* Live Store Shortcut */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-[#E8E4DD] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-stone-700 transition-colors cursor-pointer"
            title="Open customer storefront in new tab"
          >
            <span>Live Store</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </Link>

          {/* Admin Avatar Pill */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2">
            <div className="h-8 w-8 rounded-full bg-[#D45266] text-white font-black text-xs grid place-items-center shadow-xs">
              CB
            </div>
            <span className="text-xs font-bold text-stone-800 hidden xl:inline">
              CanvasBag
            </span>
            <AdminSignoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
