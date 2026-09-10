"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Image as ImageIcon,
  FileText,
  Star,
  MessageSquare,
  Settings as SettingsIcon,
  ExternalLink,
} from "lucide-react";

interface AdminSidebarProps {
  supportCount?: number;
  pendingReviewsCount?: number;
  ordersCount?: number;
  onNavigate?: () => void;
  className?: string;
  isMobileDrawer?: boolean;
}

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
    isActive: (pathname: string) => boolean;
  }[];
}

export function AdminSidebar({
  supportCount = 0,
  pendingReviewsCount = 0,
  ordersCount = 0,
  onNavigate,
  className = "",
  isMobileDrawer = false,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const sections: NavSection[] = [
    {
      title: "MAIN",
      items: [
        {
          label: "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
          isActive: (path) => path === "/admin",
        },
        {
          label: "Products",
          href: "/admin/products",
          icon: Package,
          isActive: (path) => path.startsWith("/admin/products"),
        },
        {
          label: "Categories",
          href: "/admin/categories",
          icon: FolderTree,
          isActive: (path) => path.startsWith("/admin/categories"),
        },
        {
          label: "Media Library",
          href: "/admin/media",
          icon: ImageIcon,
          isActive: (path) => path.startsWith("/admin/media"),
        },
      ],
    },
    {
      title: "CONTENT",
      items: [
        {
          label: "Landing Pages",
          href: "/admin/landing-pages",
          icon: FileText,
          isActive: (path) => path.startsWith("/admin/landing-pages"),
        },
        {
          label: "Reviews Moderation",
          href: "/admin/reviews",
          icon: Star,
          badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
          badgeColor: "bg-amber-500 text-white",
          isActive: (path) => path.startsWith("/admin/reviews"),
        },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [
        {
          label: "Support Inbox",
          href: "/admin/support",
          icon: MessageSquare,
          badge: supportCount > 0 ? supportCount : undefined,
          badgeColor: "bg-[var(--primary)] text-white",
          isActive: (path) => path.startsWith("/admin/support"),
        },
      ],
    },
    {
      title: "SETTINGS",
      items: [
        {
          label: "Site Settings",
          href: "/admin/settings",
          icon: SettingsIcon,
          isActive: (path) => path.startsWith("/admin/settings"),
        },
      ],
    },
  ];

  return (
    <aside
      className={`w-full lg:w-64 shrink-0 flex flex-col bg-white border-r border-slate-200/80 select-none h-full ${className}`}
    >
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white shadow-xs group-hover:scale-105 transition-transform p-1.5">
            <Image
              src="/brand/logo.webp"
              alt="CanvasBag Logo"
              width={22}
              height={22}
              className="object-contain brightness-0 invert"
              unoptimized
            />
          </div>
          <div>
            <div className="text-sm font-black uppercase tracking-wider text-slate-900 leading-tight">
              CanvasBag
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">
              Admin Portal
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-black text-slate-400 tracking-wider uppercase">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.isActive(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? "bg-slate-950 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          active ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                          item.badgeColor || "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Quick Live Link */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Storefront Live</span>
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>
    </aside>
  );
}
