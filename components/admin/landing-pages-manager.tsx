"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Copy,
  Layers,
  Search,
  Eye,
  Check,
  Flame,
  Globe,
  Loader2,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  FileText,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminAlert } from "@/components/admin/admin-alert-provider";
import { LandingPageEditor } from "@/components/admin/landing-page-editor";
import type { LandingPage, Product, LocalOrder } from "@/lib/types";
import { formatBDT } from "@/lib/format";
import { safeImageSrc } from "@/lib/landing-page-defaults";

interface LandingPagesManagerProps {
  initialLandingPages: LandingPage[];
  initialProducts: Product[];
  initialOrders?: LocalOrder[];
}

export function LandingPagesManager({
  initialLandingPages,
  initialProducts,
  initialOrders = [],
}: LandingPagesManagerProps) {
  const [landingPages, setLandingPages] = useState<LandingPage[]>(initialLandingPages);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  // Editing state: when set, show full-screen Visual Studio Editor
  const [editingPage, setEditingPage] = useState<Partial<LandingPage> | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const { confirmDelete, alert: showAlert } = useAdminAlert();

  // Calculate landing page analytics
  const analytics = useMemo(() => {
    const publishedCount = landingPages.filter((lp) => lp.status !== "draft").length;
    const draftCount = landingPages.filter((lp) => lp.status === "draft").length;

    // Filter orders attributed to landing pages
    let lpOrdersCount = 0;
    let lpRevenue = 0;

    for (const order of initialOrders) {
      const src = order.attribution?.source || "";
      const lpSlug = order.attribution?.lp_slug || "";
      if (src.toLowerCase().includes("landing") || lpSlug) {
        lpOrdersCount += 1;
        lpRevenue += Number(order.total) || 0;
      }
    }

    return {
      total: landingPages.length,
      published: publishedCount,
      drafts: draftCount,
      ordersCount: lpOrdersCount,
      revenue: lpRevenue,
    };
  }, [landingPages, initialOrders]);

  // Filtered Landing Pages
  const filteredPages = useMemo(() => {
    return landingPages.filter((lp) => {
      const titleMatch = (lp.title || "").toLowerCase().includes(searchTerm.toLowerCase());
      const slugMatch = (lp.slug || lp.id || "").toLowerCase().includes(searchTerm.toLowerCase());
      const productMatch = (lp.product_override?.name || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSearch = titleMatch || slugMatch || productMatch;

      const isDraft = lp.status === "draft";
      if (statusFilter === "published") return matchesSearch && !isDraft;
      if (statusFilter === "draft") return matchesSearch && isDraft;
      return matchesSearch;
    });
  }, [landingPages, searchTerm, statusFilter]);

  // Quick 1-click Toggle Published / Draft Status
  const handleToggleStatus = async (lp: LandingPage) => {
    const newStatus = lp.status === "draft" ? "published" : "draft";
    setLoadingActionId(lp.id);

    try {
      const res = await fetch("/api/admin/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lp,
          id: lp.id || lp.slug,
          slug: lp.slug || lp.id,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (data.success && data.landingPage) {
        setLandingPages((prev) =>
          prev.map((item) => (item.id === lp.id ? data.landingPage : item))
        );
        toast.success(`Page marked as ${newStatus}`);
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoadingActionId(null);
    }
  };

  // Duplicate Landing Page
  const handleDuplicate = async (lp: LandingPage) => {
    setLoadingActionId(lp.id);
    try {
      const res = await fetch("/api/admin/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "duplicate",
          sourceId: lp.id || lp.slug,
        }),
      });

      const data = await res.json();
      if (data.success && data.landingPage) {
        setLandingPages((prev) => [data.landingPage, ...prev]);
        toast.success(`Duplicated as "${data.landingPage.title}"`);
      } else {
        toast.error(data.error || "Failed to duplicate landing page");
      }
    } catch {
      toast.error("Failed to duplicate landing page");
    } finally {
      setLoadingActionId(null);
    }
  };

  // Delete Landing Page with Sweet Alert
  const handleDelete = async (lp: LandingPage) => {
    const confirmed = await confirmDelete(
      lp.title || lp.id,
      `Are you sure you want to permanently delete this landing page (/lp/${lp.slug || lp.id})? This cannot be undone.`
    );
    if (!confirmed) return;

    setLoadingActionId(lp.id);
    try {
      const res = await fetch(`/api/admin/landing-page?id=${encodeURIComponent(lp.id || lp.slug || "")}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setLandingPages((prev) => prev.filter((item) => item.id !== lp.id && item.slug !== lp.id));
        toast.success("Landing page deleted");
      } else {
        await showAlert({
          title: "Delete Failed",
          description: data.error || "Could not delete landing page",
          variant: "error",
        });
      }
    } catch {
      await showAlert({
        title: "Delete Failed",
        description: "Network error occurred while deleting landing page",
        variant: "error",
      });
    } finally {
      setLoadingActionId(null);
    }
  };

  // Copy Public Link
  const handleCopyLink = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://canvasbagbd.com";
    const fullUrl = `${origin}/lp/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link copied: " + fullUrl);
  };

  // If Studio Editor is open, render Editor component
  if (editingPage || isCreatingNew) {
    return (
      <LandingPageEditor
        initialLandingPage={editingPage}
        existingLandingPages={landingPages}
        products={initialProducts}
        onSave={(savedPage) => {
          setLandingPages((prev) => {
            const idx = prev.findIndex((p) => p.id === savedPage.id || p.slug === savedPage.slug);
            if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = savedPage;
              return updated;
            }
            return [savedPage, ...prev];
          });
          setEditingPage(null);
          setIsCreatingNew(false);
        }}
        onCancel={() => {
          setEditingPage(null);
          setIsCreatingNew(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & PRIMARY ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Landing Pages</span>
            <span className="text-xs bg-[#FDF2F4] text-[#D45266] font-extrabold px-2.5 py-0.5 rounded-full border border-rose-100">
              {analytics.total} Total
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Unlimited high-converting promotional pages with dedicated templates, COD forms, and tracking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreatingNew(true)}
          className="bg-primary-gradient text-[var(--primary-foreground)] hover:opacity-95 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Create Landing Page</span>
        </button>
      </div>

      {/* 2. ANALYTICS KPI SUMMARY ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Total Pages</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{analytics.total}</p>
          <p className="text-[11px] text-emerald-600 font-bold">
            {analytics.published} Published • {analytics.drafts} Drafts
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Orders Generated</span>
            <ShoppingBag className="w-4 h-4 text-[#D45266]" />
          </div>
          <p className="text-2xl font-black text-slate-900">{analytics.ordersCount}</p>
          <p className="text-[11px] text-slate-400 font-medium">From Landing Pages</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{formatBDT(analytics.revenue)}</p>
          <p className="text-[11px] text-emerald-600 font-medium">Attributed Sales</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Active Funnel</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {analytics.published > 0 ? "Live" : "Ready"}
          </p>
          <p className="text-[11px] text-sky-600 font-medium">Direct COD Enabled</p>
        </div>
      </div>

      {/* 3. TOOLBAR: SEARCH & STATUS TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, slug or product..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-[#D45266] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {(["all", "published", "draft"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === tab
                  ? "bg-white text-slate-900 shadow-2xs font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === "all" ? "All Pages" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* 4. LANDING PAGES GRID / CARDS */}
      {filteredPages.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FDF2F4] text-[#D45266] flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">
              {searchTerm ? "No landing pages found" : "No landing pages created yet"}
            </h3>
            <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
              Create product landing pages with high-converting copy, photo showcases, reviews, and integrated cash on delivery checkout forms.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            className="bg-primary-gradient text-[var(--primary-foreground)] text-xs font-black px-5 py-2.5 rounded-xl shadow-sm inline-flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Landing Page</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredPages.map((lp) => {
            const slug = lp.slug || lp.id;
            const heroImage = safeImageSrc(
              lp.product_override?.hero_image ||
              lp.og_image ||
              "/brand/logo.webp"
            );

            const isPublished = lp.status !== "draft";
            const isLoadingThis = loadingActionId === lp.id;

            return (
              <div
                key={lp.id || slug}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                {/* Card Top: Preview Image & Status Badge */}
                <div>
                  <div className="relative aspect-16/9 w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                    <Image
                      src={heroImage}
                      alt={lp.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-md ${
                          isPublished
                            ? "bg-emerald-600/90 text-white"
                            : "bg-amber-500/90 text-white"
                        }`}
                      >
                        {isPublished ? "Published" : "Draft"}
                      </span>
                      {lp.template && (
                        <span className="text-[10px] font-bold bg-slate-900/80 text-white px-2 py-0.5 rounded-full backdrop-blur-md">
                          {lp.template === "modern_luxury" ? "Luxury Minimal" : "High-Converting"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 line-clamp-1 group-hover:text-[#D45266] transition-colors">
                        {lp.title}
                      </h3>
                      {lp.product_override?.headline && (
                        <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                          {lp.product_override.headline}
                        </p>
                      )}
                    </div>

                    {/* URL Path & Copy */}
                    <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 border border-slate-150 text-[11px] font-mono">
                      <span className="truncate text-slate-600">/lp/{slug}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(slug)}
                        className="text-slate-400 hover:text-[#D45266] p-1 cursor-pointer transition-colors"
                        title="Copy Public Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Custom Domain Badge if bound */}
                    {lp.custom_domain && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">
                        <Globe className="w-3 h-3" />
                        <span className="truncate">{lp.custom_domain}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-[#FAF8F5]/50 flex items-center justify-between gap-2">
                  {/* Status Toggle Switch */}
                  <button
                    type="button"
                    disabled={isLoadingThis}
                    onClick={() => handleToggleStatus(lp)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                      isPublished
                        ? "text-emerald-700 hover:bg-emerald-50"
                        : "text-amber-700 hover:bg-amber-50"
                    }`}
                  >
                    {isPublished ? "Unpublish" : "Publish"}
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Live Preview in New Tab */}
                    <a
                      href={`/lp/${slug}?preview=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      title="Preview Live Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {/* Duplicate */}
                    <button
                      type="button"
                      disabled={isLoadingThis}
                      onClick={() => handleDuplicate(lp)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      title="Duplicate Landing Page"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => setEditingPage(lp)}
                      className="p-1.5 text-[#D45266] hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Edit Landing Page"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete with Sweet Alert */}
                    <button
                      type="button"
                      disabled={isLoadingThis}
                      onClick={() => handleDelete(lp)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                      title="Delete Landing Page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
