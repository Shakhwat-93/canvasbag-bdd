"use client";

import React from "react";
import { usePathname } from "next/navigation";
import type { SiteSettings } from "@/lib/types";

export function isAnnouncementVisible(pathname: string, settings?: SiteSettings): boolean {
  if (!settings) return true;

  // Master global toggle: if explicitly disabled globally
  if (settings.announcementEnabled === false) return false;

  // Home Page
  if (pathname === "/") {
    return settings.announcementShowHome ?? true;
  }

  // Product Page (/product/...)
  if (pathname.startsWith("/product")) {
    return settings.announcementShowProduct ?? true;
  }

  // Category Page (/category/...)
  if (pathname.startsWith("/category")) {
    return settings.announcementShowCategory ?? true;
  }

  // Shop Page (/shop)
  if (pathname === "/shop" || pathname.startsWith("/shop")) {
    return settings.announcementShowShop ?? true;
  }

  // Cart Page (/cart)
  if (pathname === "/cart") {
    return settings.announcementShowCart ?? true;
  }

  // Checkout Page (/checkout)
  if (pathname === "/checkout") {
    return settings.announcementShowCheckout ?? true;
  }

  return true;
}

interface AnnouncementBarProps {
  text?: string;
  settings?: SiteSettings;
}

export function AnnouncementBar({ text, settings }: AnnouncementBarProps) {
  const pathname = usePathname();

  const visible = isAnnouncementVisible(pathname, settings);
  if (!visible) return null;

  const displayText = text || settings?.announcementText || "৮৯৯+ অর্ডারে ফ্রি ডেলিভারি | ঢাকায় ২৪ ঘণ্টা | সারাদেশে ২-৩ দিন";

  return (
    <div className="px-4 py-2 text-center text-[11px] sm:text-xs font-bold bg-[var(--primary)] text-white transition-colors duration-300 w-full flex items-center justify-center gap-1.5 select-none shrink-0 z-50">
      <span>🚚</span>
      <span>{displayText}</span>
    </div>
  );
}