"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  Plus,
  ShoppingBag,
  Sliders,
  FolderTree,
  Settings as SettingsIcon,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Layers,
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

type DateFilter = "today" | "7days" | "30days" | "all";

export function AdminDashboardOverview({
  products,
  categories,
  orders,
  reviews,
  supportMessages,
  mediaCount,
}: DashboardOverviewProps) {
  const router = useRouter();
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Filter orders based on active date filter
  const filteredOrders = useMemo(() => {
    if (dateFilter === "all") return orders;

    const now = new Date();
    const filterMs =
      dateFilter === "today"
        ? 24 * 60 * 60 * 1000
        : dateFilter === "7days"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

    const threshold = new Date(now.getTime() - filterMs);

    return orders.filter((o) => {
      if (!o.created_at) return true;
      const orderDate = new Date(o.created_at);
      return orderDate >= threshold;
    });
  }, [orders, dateFilter]);

  // KPI Calculations
  const totalRevenue = useMemo(() => {
    return filteredOrders
      .filter((o) => (o.status || "").toLowerCase() !== "cancelled")
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [filteredOrders]);

  const pendingOrdersCount = useMemo(() => {
    return filteredOrders.filter((o) => {
      const s = (o.status || "pending").toLowerCase();
      return s === "pending" || s === "new" || !o.status;
    }).length;
  }, [filteredOrders]);

  const confirmedOrdersCount = useMemo(() => {
    return filteredOrders.filter((o) => {
      const s = (o.status || "").toLowerCase();
      return s === "confirmed" || s === "packaging" || s === "processing";
    }).length;
  }, [filteredOrders]);

  const deliveredOrdersCount = useMemo(() => {
    return filteredOrders.filter((o) => {
      const s = (o.status || "").toLowerCase();
      return s === "delivered" || s === "completed";
    }).length;
  }, [filteredOrders]);

  const activeProducts = useMemo(() => {
    return products.filter((p) => p.status !== "inactive" && p.status !== "draft");
  }, [products]);

  const activeProductsCount = activeProducts.length;

  const recentOrders = useMemo(() => {
    return filteredOrders.slice(0, 7);
  }, [filteredOrders]);

  const recentActiveProducts = useMemo(() => {
    return activeProducts.slice(0, 5);
  }, [activeProducts]);

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* ────────────────────────────────────────────────────────
          1. HEADER & DATE FILTER
         ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {/* Performance Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF2F4] border border-[#F4C7CF] text-[#D45266] text-[10px] font-black uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3 h-3 text-[#D45266]" />
            <span>Store Performance</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight">
            Welcome, CanvasBag
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
            Here&apos;s what&apos;s happening in your CanvasBag store today.
          </p>
        </div>

        {/* Date Filter Pills & Refresh */}
        <div className="flex items-center gap-2 self-start md:self-end">
          <div className="flex items-center bg-white border border-[#EFECE6] rounded-full p-1 shadow-xs text-xs font-bold text-stone-600">
            <button
              type="button"
              onClick={() => setDateFilter("today")}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                dateFilter === "today"
                  ? "bg-[#D45266] text-white shadow-xs"
                  : "hover:text-stone-900"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("7days")}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                dateFilter === "7days"
                  ? "bg-[#D45266] text-white shadow-xs"
                  : "hover:text-stone-900"
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("30days")}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                dateFilter === "30days"
                  ? "bg-[#D45266] text-white shadow-xs"
                  : "hover:text-stone-900"
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("all")}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                dateFilter === "all"
                  ? "bg-[#D45266] text-white shadow-xs"
                  : "hover:text-stone-900"
              }`}
            >
              All
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh dashboard metrics"
            className="h-9 w-9 rounded-full bg-white border border-[#EFECE6] hover:bg-[#FAF8F5] grid place-items-center text-stone-600 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#D45266]" : ""}`} />
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          2. 5 KPI CARDS ROW
         ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* TOTAL REVENUE */}
        <div className="bg-white rounded-3xl border border-[#EFECE6] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-[#E5DFD7] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FDF2F4] text-[#D45266] grid place-items-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {formatBDT(totalRevenue)}
            </div>
            <div className="text-xs text-stone-400 font-medium mt-1">
              {filteredOrders.length} orders
            </div>
          </div>
        </div>

        {/* PENDING */}
        <div className="bg-white rounded-3xl border border-[#EFECE6] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-[#E5DFD7] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
              Pending
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 grid place-items-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {pendingOrdersCount}
            </div>
            <div className="text-xs text-stone-400 font-medium mt-1">
              Needs review
            </div>
          </div>
        </div>

        {/* CONFIRMED */}
        <div className="bg-white rounded-3xl border border-[#EFECE6] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-[#E5DFD7] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
              Confirmed
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 grid place-items-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {confirmedOrdersCount}
            </div>
            <div className="text-xs text-stone-400 font-medium mt-1">
              Packaging
            </div>
          </div>
        </div>

        {/* DELIVERED */}
        <div className="bg-white rounded-3xl border border-[#EFECE6] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-[#E5DFD7] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
              Delivered
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {deliveredOrdersCount}
            </div>
            <div className="text-xs text-stone-400 font-medium mt-1">
              Completed
            </div>
          </div>
        </div>

        {/* ACTIVE PRODUCTS */}
        <div className="bg-white rounded-3xl border border-[#EFECE6] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-[#E5DFD7] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
              Active Products
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 grid place-items-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {activeProductsCount}
            </div>
            <div className="text-xs text-stone-400 font-medium mt-1">
              Published
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          3. QUICK ACTIONS SECTION
         ──────────────────────────────────────────────────────── */}
      <div className="bg-[#F5F1EB]/80 border border-[#EAE4DC] rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#D45266] text-white grid place-items-center text-xs font-black shadow-xs">
            +
          </div>
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-800">
            Quick Actions
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* + New Product */}
          <Link
            href="/admin/products/new"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#D45266] hover:bg-[#BF4357] text-white text-xs font-bold shadow-xs hover:shadow-sm active:scale-95 transition-all text-center"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Product</span>
          </Link>

          {/* Collections / Landing Pages */}
          <Link
            href="/admin/landing-pages"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-[#FAF8F5] border border-[#E5DFD7] text-stone-800 text-xs font-bold shadow-2xs transition-all text-center"
          >
            <Layers className="w-4 h-4 text-[#D45266]" />
            <span>Collections</span>
          </Link>

          {/* Hero Slides */}
          <Link
            href="/admin/settings#hero-slides"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-[#FAF8F5] border border-[#E5DFD7] text-stone-800 text-xs font-bold shadow-2xs transition-all text-center"
          >
            <Sliders className="w-4 h-4 text-[#D45266]" />
            <span>Hero Banner</span>
          </Link>

          {/* Categories */}
          <Link
            href="/admin/categories"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-[#FAF8F5] border border-[#E5DFD7] text-stone-800 text-xs font-bold shadow-2xs transition-all text-center"
          >
            <FolderTree className="w-4 h-4 text-[#D45266]" />
            <span>Categories</span>
          </Link>

          {/* Site Settings */}
          <Link
            href="/admin/settings"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-[#FAF8F5] border border-[#E5DFD7] text-stone-800 text-xs font-bold shadow-2xs transition-all text-center col-span-2 sm:col-span-1"
          >
            <SettingsIcon className="w-4 h-4 text-stone-500" />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          4. MAIN 2-COLUMN SPLIT: RECENT ORDERS & ACTIVE PRODUCTS
         ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: RECENT ORDERS (approx 65% width) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#EFECE6] p-5 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-lg font-black text-stone-900 tracking-tight">
                Recent Orders
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Latest purchases across Bangladesh
              </p>
            </div>

            <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
              {filteredOrders.length} records
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EFECE6] text-[10px] font-black text-stone-400 uppercase tracking-wider">
                  <th className="pb-3 font-black">Order</th>
                  <th className="pb-3 font-black">Customer</th>
                  <th className="pb-3 font-black">City</th>
                  <th className="pb-3 font-black">Amount</th>
                  <th className="pb-3 font-black">Status</th>
                  <th className="pb-3 font-black text-right">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F5F0]">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400 font-medium">
                      No orders recorded for this time range.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const normStatus = (order.status || "pending").toLowerCase();
                    return (
                      <tr key={order.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                        <td className="py-3.5 font-bold font-mono text-stone-900 text-xs">
                          {order.id}
                        </td>
                        <td className="py-3.5">
                          <div className="font-bold text-stone-900">{order.customer_name}</div>
                          <div className="text-[11px] text-stone-400 font-mono">
                            {order.phone || "—"}
                          </div>
                        </td>
                        <td className="py-3.5 text-stone-600 font-medium">
                          {order.city || "Outside Dhaka"}
                        </td>
                        <td className="py-3.5 font-black text-[#D45266]">
                          {formatBDT(order.total || 0)}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              normStatus === "confirmed" || normStatus === "packaging"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : normStatus === "delivered" || normStatus === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : normStatus === "cancelled"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {order.status || "Pending"}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-mono text-stone-400 text-[11px]">
                          {order.items?.length || 1} item(s)
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Orders Cards */}
          <div className="sm:hidden space-y-3">
            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs font-medium">
                No orders recorded.
              </div>
            ) : (
              recentOrders.map((order) => {
                const normStatus = (order.status || "pending").toLowerCase();
                return (
                  <div
                    key={order.id}
                    className="p-3.5 bg-[#FAF8F5]/60 border border-[#EFECE6] rounded-2xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-stone-900">{order.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          normStatus === "confirmed" || normStatus === "packaging"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : normStatus === "delivered" || normStatus === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : normStatus === "cancelled"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-stone-700">
                      <div>
                        <div className="font-bold">{order.customer_name}</div>
                        <div className="text-[11px] text-stone-400 font-mono">{order.phone}</div>
                      </div>
                      <div className="font-black text-[#D45266] text-sm">
                        {formatBDT(order.total || 0)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#EFECE6] text-[11px]">
                      <span className="text-stone-400">{order.city || "Outside Dhaka"}</span>
                      <span className="font-mono text-stone-500 font-semibold">
                        {order.items?.length || 1} item(s)
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE PRODUCTS / DROPS (approx 35% width) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EFECE6] p-5 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-lg font-black text-stone-900 tracking-tight">
              Active Products
            </h2>
            <Link
              href="/admin/products"
              className="text-xs font-bold text-[#D45266] hover:text-[#BF4357]"
            >
              Manage All ({products.length})
            </Link>
          </div>

          <div className="divide-y divide-[#F7F5F0]">
            {recentActiveProducts.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs font-medium">
                No active products found.
              </div>
            ) : (
              recentActiveProducts.map((p) => {
                const imgUrl =
                  p.image ||
                  p.imageUrl ||
                  (p.images?.[0]
                    ? typeof p.images[0] === "string"
                      ? p.images[0]
                      : p.images[0].url
                    : "/brand/logo.webp");

                return (
                  <Link
                    key={p.id}
                    href={`/admin/products/${p.id}/edit`}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-[#FAF8F5] -mx-2 px-2 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-stone-100 border border-[#EFECE6] shrink-0">
                        <Image
                          src={imgUrl}
                          alt={p.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-xs text-stone-900 truncate group-hover:text-[#D45266] transition-colors">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-black text-[#D45266] text-xs">
                            {formatBDT(p.price)}
                          </span>
                          <span className="text-[10px] text-stone-400 font-medium">
                            {p.categoryName || p.categorySlug}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-700 transition-colors shrink-0" />
                  </Link>
                );
              })
            )}
          </div>

          {/* Quick link to Add Product */}
          <div className="pt-2">
            <Link
              href="/admin/products/new"
              className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-[#E5DFD7] hover:border-[#D45266] hover:bg-[#FDF2F4] text-stone-600 hover:text-[#D45266] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Product</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
