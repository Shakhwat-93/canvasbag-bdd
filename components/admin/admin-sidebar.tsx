"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FolderTree,
  Layers,
  Sliders,
  Star,
  ImageIcon,
  MessageSquare,
  LineChart,
  Settings as SettingsIcon,
  ExternalLink,
  Sparkles,
  LogOut,
} from "lucide-react";
import { AdminSignoutButton } from "@/components/admin/admin-signout-button";

interface AdminSidebarProps {
  supportCount?: number;
  pendingReviewsCount?: number;
  ordersCount?: number;
  onNavigate?: () => void;
  className?: string;
  isMobileDrawer?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
  isActive: (pathname: string) => boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
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
      title: "OVERVIEW",
      items: [
        {
          label: "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
          isActive: (path) => path === "/admin",
        },
      ],
    },
    {
      title: "STORE",
      items: [
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
          label: "Collections",
          href: "/admin/landing-pages",
          icon: Layers,
          isActive: (path) => path.startsWith("/admin/landing-pages"),
        },
      ],
    },
    {
      title: "CONTENT & CMS",
      items: [
        {
          label: "Hero Slides",
          href: "/admin/settings#hero-slides",
          icon: Sliders,
          isActive: (path) => path === "/admin/settings#hero-slides",
        },
        {
          label: "Testimonials",
          href: "/admin/reviews",
          icon: Star,
          badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
          badgeColor: "bg-amber-500 text-white",
          isActive: (path) => path.startsWith("/admin/reviews"),
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
      title: "MARKETING & ANALYTICS",
      items: [
        {
          label: "Analytics & Tracking",
          href: "/admin/settings#analytics",
          icon: LineChart,
          isActive: (path) => path === "/admin/settings#analytics",
        },
        {
          label: "Support Inbox",
          href: "/admin/support",
          icon: MessageSquare,
          badge: supportCount > 0 ? supportCount : undefined,
          badgeColor: "bg-stone-800 text-white",
          isActive: (path) => path.startsWith("/admin/support"),
        },
        {
          label: "Settings",
          href: "/admin/settings",
          icon: SettingsIcon,
          isActive: (path) => path === "/admin/settings",
        },
      ],
    },
  ];

  return (
    <aside
      className={`w-full lg:w-64 shrink-0 flex flex-col bg-white border-r border-[#EFECE6] select-none h-full ${className}`}
    >
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-[#EFECE6] flex items-center justify-between shrink-0">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="flex items-center gap-1.5 font-sans">
            <span className="text-lg font-black text-stone-900 tracking-tight">
              CanvasBag
            </span>
            <span className="text-[#D45266] text-sm font-black tracking-normal">
              • Admin
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 pb-1.5 text-[10px] font-black text-stone-400 tracking-widest uppercase">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.isActive(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      active
                        ? "bg-[#D45266] text-white shadow-xs"
                        : "text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F5]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          active ? "text-white" : "text-stone-400 group-hover:text-stone-700"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                          active
                            ? "bg-white/20 text-white"
                            : item.badgeColor || "bg-stone-200 text-stone-700"
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

      {/* Bottom Profile / Manager Card */}
      <div className="p-4 border-t border-[#EFECE6] bg-[#FAF8F5]/60 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-[#D45266] text-white font-black text-xs grid place-items-center shadow-xs shrink-0">
              CB
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-stone-900 truncate">
                CanvasBag Manager
              </div>
              <div className="text-[10px] text-stone-400 font-medium capitalize truncate">
                Owner
              </div>
            </div>
          </div>
          <AdminSignoutButton />
        </div>
      </div>
    </aside>
  );
}
