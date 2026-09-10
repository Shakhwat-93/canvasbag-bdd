"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ExternalLink, ChevronRight, Sparkles } from "lucide-react";
import { AdminSignoutButton } from "@/components/admin/admin-signout-button";

interface AdminHeaderProps {
  adminEmail: string;
  onOpenMobileMenu: () => void;
}

export function AdminHeader({ adminEmail, onOpenMobileMenu }: AdminHeaderProps) {
  const pathname = usePathname();

  // Dynamic breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    if (pathname === "/admin") {
      return [{ label: "Dashboard", href: "/admin" }];
    }
    if (pathname.startsWith("/admin/products/new")) {
      return [
        { label: "Products", href: "/admin/products" },
        { label: "Add Product", href: "/admin/products/new" },
      ];
    }
    if (pathname.startsWith("/admin/products") && pathname.includes("/edit")) {
      return [
        { label: "Products", href: "/admin/products" },
        { label: "Edit Product", href: pathname },
      ];
    }
    if (pathname.startsWith("/admin/products")) {
      return [{ label: "Products", href: "/admin/products" }];
    }
    if (pathname.startsWith("/admin/categories")) {
      return [{ label: "Categories", href: "/admin/categories" }];
    }
    if (pathname.startsWith("/admin/media")) {
      return [{ label: "Media Library", href: "/admin/media" }];
    }
    if (pathname.startsWith("/admin/orders")) {
      return [{ label: "Orders", href: "/admin/orders" }];
    }
    if (pathname.startsWith("/admin/landing-pages")) {
      return [{ label: "Landing Pages", href: "/admin/landing-pages" }];
    }
    if (pathname.startsWith("/admin/reviews")) {
      return [{ label: "Reviews Moderation", href: "/admin/reviews" }];
    }
    if (pathname.startsWith("/admin/support")) {
      return [{ label: "Support Inbox", href: "/admin/support" }];
    }
    if (pathname.startsWith("/admin/settings")) {
      return [{ label: "Site Settings", href: "/admin/settings" }];
    }
    return [{ label: "Admin", href: "/admin" }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs transition-all">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Trigger */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 overflow-hidden">
          <Link
            href="/admin"
            className="hover:text-slate-900 transition-colors hidden sm:inline truncate"
          >
            Admin
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.href + idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 hidden sm:inline" />
              <Link
                href={crumb.href}
                className={`truncate transition-colors ${
                  idx === breadcrumbs.length - 1
                    ? "font-bold text-slate-900"
                    : "hover:text-slate-900"
                }`}
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Live Storefront Link */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-all cursor-pointer"
          title="Open live customer store in new tab"
        >
          <span>Live Store</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Admin Email Pill */}
        <span className="text-xs font-semibold text-slate-500 hidden md:inline px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
          {adminEmail}
        </span>

        {/* Sign Out */}
        <AdminSignoutButton />
      </div>
    </header>
  );
}
