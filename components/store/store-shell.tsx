"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { SiteSettings, Category } from "@/lib/types";
import { AnnouncementBar, isAnnouncementVisible } from "@/components/store/announcement-bar";
import { Header } from "@/components/store/header";
import { useCart } from "@/components/providers/cart-provider";

interface StoreShellProps {
  settings: SiteSettings;
  categories: Category[];
  children: React.ReactNode;
}

export function StoreShell({ settings, categories, children }: StoreShellProps) {
  const pathname = usePathname();
  const { isCartOpen } = useCart();
  const hasAnnouncement = isAnnouncementVisible(pathname, settings);

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Always show header on route change
  useEffect(() => {
    setIsVisible(true);
    lastScrollY.current = 0;
  }, [pathname]);

  // Smooth scroll direction detection
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollY.current;

          // Always visible near top of page or when cart is open
          if (isCartOpen || currentScrollY < 60) {
            setIsVisible(true);
          } else if (delta > 8 && currentScrollY > 100) {
            // Scrolling DOWN past 100px -> smoothly slide header UP and vanish
            setIsVisible(false);
          } else if (delta < -8) {
            // Scrolling UP -> smoothly reveal header
            setIsVisible(true);
          }

          lastScrollY.current = currentScrollY <= 0 ? 0 : currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isCartOpen]);

  return (
    <>
      {/* Sticky Header System with Smooth Auto-Hide on Scroll */}
      <div
        className={`fixed inset-x-0 top-0 z-50 flex flex-col transition-transform duration-300 ease-in-out will-change-transform shadow-xs ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <AnnouncementBar text={settings.announcementText} settings={settings} />
        <Header categories={categories} settings={settings} />
      </div>

      {/* Main Content Area with Dynamic Padding */}
      <main
        className={`flex-1 w-full max-w-full overflow-x-hidden pb-0 transition-all duration-150 ${
          hasAnnouncement
            ? "pt-[148px] md:pt-[138px]"
            : "pt-[112px] md:pt-[102px]"
        }`}
      >
        {children}
      </main>
    </>
  );
}

