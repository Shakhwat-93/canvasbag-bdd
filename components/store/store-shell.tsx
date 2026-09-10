"use client";

import React from "react";
import { usePathname } from "next/navigation";
import type { SiteSettings, Category } from "@/lib/types";
import { AnnouncementBar, isAnnouncementVisible } from "@/components/store/announcement-bar";
import { Header } from "@/components/store/header";

interface StoreShellProps {
  settings: SiteSettings;
  categories: Category[];
  children: React.ReactNode;
}

export function StoreShell({ settings, categories, children }: StoreShellProps) {
  const pathname = usePathname();
  const hasAnnouncement = isAnnouncementVisible(pathname, settings);

  return (
    <>
      {/* Sticky Header System */}
      <div className="fixed inset-x-0 top-0 z-50 flex flex-col">
        <AnnouncementBar text={settings.announcementText} settings={settings} />
        <Header categories={categories} settings={settings} />
      </div>

      {/* Main Content Area with Dynamic Padding */}
      <main
        className={`flex-1 w-full max-w-full overflow-x-hidden pb-16 md:pb-0 transition-all duration-150 ${
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
