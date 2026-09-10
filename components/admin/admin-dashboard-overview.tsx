"use client";

import React from "react";
import Link from "next/link";
import {
  Package,
  FolderTree,
  Image as ImageIcon,
  ShoppingBag,
  Star,
  MessageSquare,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  ExternalLink,
  Settings as SettingsIcon,
} from "lucide-react";
import { formatBDT } from "@/lib/format";
import type { LocalOrder, Product, Category, ProductReview, SupportMessage } from "@/lib/types";

interface DashboardOverviewProps {
  products: Product[];
  categories: Category[];
  orders: LocalOrder[];
  reviews: ProductReview[];
  supportMessages: SupportMessage[];
  mediaCount: number;
}

export function AdminDashboardOverview({
  products,
  categories,
  orders,
  reviews,
  supportMessages,
  mediaCount,
}: DashboardOverviewProps) {
  const activeProductsCount = products.filter((p) => p.status !== "inactive" && p.status !== "draft").length;
  const pendingOrdersCount = orders.filter((o) => o.status === "pending" || o.status === "new" || !o.status).length;
  const pendingReviewsCount = reviews.filter((r) => r.status === "pending").length;

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const recentOrders = orders.slice(0, 6);

  const statCards = [
    {
      title: "Total Revenue",
      value: formatBDT(totalRevenue),
      subtitle: `${orders.length} total orders recorded`,
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      href: "/admin/orders",
    },
    {
      title: "Orders to Process",
      value: pendingOrdersCount,
      subtitle: `${orders.length - pendingOrdersCount} completed or dispatched`,
      icon: ShoppingBag,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      href: "/admin/orders",
      highlight: pendingOrdersCount > 0,
    },
    {
      title: "Catalog Products",
      value: products.length,
      subtitle: `${activeProductsCount} published & active`,
      icon: Package,
      color: "text-slate-900 bg-slate-100 border-slate-200",
      href: "/admin/products",
    },
    {
      title: "Active Categories",
      value: categories.length,
      subtitle: "Multi-level hierarchy tree",
      icon: FolderTree,
      color: "text-purple-600 bg-purple-50 border-purple-100",
      href: "/admin/categories",
    },
    {
      title: "Pending Reviews",
      value: pendingReviewsCount,
      subtitle: `${reviews.length} total customer reviews`,
      icon: Star,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      href: "/admin/reviews",
      highlight: pendingReviewsCount > 0,
    },
    {
      title: "Cloudflare R2 Media",
      value: mediaCount,
      subtitle: "Optimized WebP assets in bucket",
      icon: ImageIcon,
      color: "text-rose-600 bg-rose-50 border-rose-100",
      href: "/admin/media",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Operations Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time overview of catalog, customer orders, media storage, and support inquiries
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-gradient text-[var(--primary-foreground)] rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
          <Link
            href="/admin/media"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Media Library</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <span>Live Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`group relative p-5 rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                card.highlight
                  ? "bg-amber-50/40 border-amber-200"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                    {card.value}
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1">{card.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Orders Section */}
      <div className="bg-slate-50/60 rounded-3xl border border-slate-200/80 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-700" />
              <span>Recent Customer Orders</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Latest cash on delivery orders received from the storefront
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1 group"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">No orders recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              When customers complete checkout, orders will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">City / Area</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentOrders.map((order) => {
                  const statusColors: Record<string, string> = {
                    pending: "bg-amber-50 text-amber-700 border-amber-200",
                    new: "bg-amber-50 text-amber-700 border-amber-200",
                    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
                    dispatched: "bg-purple-50 text-purple-700 border-purple-200",
                    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
                  };
                  const badgeClass = statusColors[order.status?.toLowerCase() || "pending"] || statusColors.pending;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{order.customer_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{order.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700 font-semibold">{order.city}</span>
                        {order.area && <span className="text-slate-400 text-[11px]"> ({order.area})</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {order.items?.length || 1} item(s)
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatBDT(order.total)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeClass}`}>
                          {order.status || "pending"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href="/admin/orders"
                          className="text-xs font-bold text-slate-600 hover:text-slate-950 underline underline-offset-2"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/support"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Support Inbox</div>
              <div className="text-[11px] text-slate-400">{supportMessages.length} customer messages</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors" />
        </Link>

        <Link
          href="/admin/reviews"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Reviews Moderation</div>
              <div className="text-[11px] text-slate-400">{pendingReviewsCount} pending review(s)</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors" />
        </Link>

        <Link
          href="/admin/settings"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Site Settings</div>
              <div className="text-[11px] text-slate-400">Tracking, shipping & banners</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
