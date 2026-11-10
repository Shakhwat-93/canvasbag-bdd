"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Download,
  RefreshCw,
  ExternalLink,
  Search,
  Package,
  Clock,
  ShieldCheck,
  FileCode2,
  ShoppingBag,
  Layers,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import type { CatalogValidationReport, MetaCatalogFeedItem } from "@/lib/meta-catalog";

interface MetaCatalogManagerProps {
  initialReport: CatalogValidationReport;
  initialItems: MetaCatalogFeedItem[];
}

export function MetaCatalogManager({
  initialReport,
  initialItems,
}: MetaCatalogManagerProps) {
  const [report, setReport] = useState<CatalogValidationReport>(initialReport);
  const [items, setItems] = useState<MetaCatalogFeedItem[]>(initialItems);
  const [copied, setCopied] = useState(false);
  const [copiedLocal, setCopiedLocal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [runtimeOrigin, setRuntimeOrigin] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRuntimeOrigin(window.location.origin);
    }
  }, []);

  const isLocalHost =
    runtimeOrigin.includes("localhost") || runtimeOrigin.includes("127.0.0.1");

  // Always show authoritative production feed URL for Meta Commerce Manager,
  // plus active runtime URL when running on localhost or staging.
  const displayFeedUrl = report.feedUrl;
  const runtimeFeedUrl = runtimeOrigin ? `${runtimeOrigin}${report.feedPath}` : report.feedUrl;

  const handleCopyUrl = async (url: string, isLocalCopy = false) => {
    try {
      await navigator.clipboard.writeText(url);
      if (isLocalCopy) {
        setCopiedLocal(true);
        setTimeout(() => setCopiedLocal(false), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      toast.success("Feed URL copied to clipboard!");
    } catch {
      toast.error("Failed to copy URL. Please copy manually.");
    }
  };

  const handleSyncAndValidate = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/meta-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReport(data.report);
        setItems(data.items || []);
        toast.success(
          `Feed revalidated: ${data.report.totalFeedItems} items (${data.report.isValidXml ? "Valid XML" : "Needs Review"})`
        );
      } else {
        toast.error(data.error || "Failed to refresh catalog feed");
      }
    } catch {
      toast.error("Network error while validating feed");
    } finally {
      setSyncing(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (stockFilter === "in_stock" && item.availability !== "in stock") return false;
      if (stockFilter === "out_of_stock" && item.availability !== "out of stock") return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.itemGroupId || "").toLowerCase().includes(q) ||
        (item.productType || "").toLowerCase().includes(q) ||
        (item.googleProductCategory || "").toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, stockFilter]);

  const formatDateTime = (iso: string) => {
    try {
      return (
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Dhaka",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date(iso)) + " (BDT)"
      );
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Meta Facebook &amp; Instagram Product Catalog
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                report.isValidXml && report.errors.length === 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : report.isValidXml
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {report.isValidXml ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {report.isValidXml && report.errors.length === 0
                ? "Feed Valid & Synced"
                : report.isValidXml
                ? `Valid XML (${report.errors.length} Product Warning)`
                : "Validation Errors Found"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time RSS 2.0 XML product catalog synchronized automatically with your live store inventory, offer pricing, and variants.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleSyncAndValidate}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Validating..." : "Sync & Validate"}
          </button>

          <a
            href="/facebook-catalog.xml?download=1&fresh=1"
            download="facebook-catalog.xml"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff6b35] hover:bg-[#e55520] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download XML
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Products in Feed
            </span>
            <span className="w-8 h-8 rounded-xl bg-orange-50 text-[#ff6b35] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{report.totalFeedItems}</span>
            <span className="text-xs font-semibold text-slate-500">XML items</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            From <strong className="text-slate-700">{report.publishedParentProducts}</strong> published products ({report.unpublishedExcludedCount} draft/inactive excluded)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Products
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{report.activeInStockCount}</span>
            <span className="text-xs font-semibold text-emerald-600">in stock</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            <strong className="text-slate-700">{report.inStockParentCount}</strong> unique products ready for Meta Shops &amp; Ads
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Out of Stock Products
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{report.outOfStockCount}</span>
            <span className="text-xs font-semibold text-amber-600">out of stock</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Synced directly from real variant &amp; inventory availability
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Last Feed Update
            </span>
            <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-sm font-black text-slate-900 leading-snug" suppressHydrationWarning>
            {formatDateTime(report.lastFeedUpdate)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            XML Size: <strong className="text-slate-700">{(report.xmlBytes / 1024).toFixed(1)} KB</strong>
          </p>
        </div>
      </div>

      {/* Feed Endpoint & Copy Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-[#ff6b35]" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              Public XML Feed Endpoint (Unauthenticated Access)
            </h2>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Public HTTPS Ready
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Production Meta Commerce Feed URL (Paste into Meta Commerce Manager → Scheduled Feed)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                aria-label="Meta Catalog Feed URL"
                value={displayFeedUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-[#ff6b35]"
              />
              <button
                type="button"
                onClick={() => handleCopyUrl(displayFeedUrl, false)}
                className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Feed URL"}
              </button>
              <a
                href="/facebook-catalog.xml?fresh=1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition-all shrink-0"
              >
                <span>Open XML</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {isLocalHost && runtimeFeedUrl !== displayFeedUrl && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="text-slate-600">
                <strong className="text-slate-800">Localhost Test Endpoint:</strong>{" "}
                <code className="font-mono text-[#c2410c] font-semibold">{runtimeFeedUrl}</code>
              </div>
              <button
                type="button"
                onClick={() => handleCopyUrl(runtimeFeedUrl, true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer self-start sm:self-auto"
              >
                {copiedLocal ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLocal ? "Copied Local URL" : "Copy Local URL"}
              </button>
            </div>
          )}
        </div>

        {/* Commerce Manager Quick Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          {[
            { step: "1", title: "Open Commerce Manager", desc: "Go to Catalog → Data Sources → Add Items" },
            { step: "2", title: "Select Data Feed", desc: "Choose Scheduled Feed and paste the Feed URL above" },
            { step: "3", title: "Set Schedule & Currency", desc: "Hourly or Daily auto-sync; Default Currency: BDT" },
            { step: "4", title: "Automatic Sync", desc: "Price, stock & new products sync without manual edits" },
          ].map((item) => (
            <div key={item.step} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-[#ff6b35] text-white text-[11px] font-black flex items-center justify-center">
                  {item.step}
                </span>
                <span className="text-xs font-bold text-slate-900">{item.title}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feed Validation & Error Report */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#ff6b35]" />
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                Feed Validation &amp; Error Report
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated compliance verification against Meta Facebook &amp; Instagram Catalog RSS 2.0 specification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
              {report.errors.length} Blocking Errors
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              {report.warnings.length} Warnings
            </span>
          </div>
        </div>

        {/* Specification Checks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {report.checks.map((chk) => (
            <div
              key={chk.key}
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                chk.passed
                  ? "bg-emerald-50/40 border-emerald-200/80"
                  : "bg-red-50/60 border-red-200"
              }`}
            >
              {chk.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900">{chk.label}</div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{chk.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Blocking Errors & Warnings List */}
        {report.errors.length === 0 && report.warnings.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Zero Feed Errors or Warnings Detected</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Every active product has a unique ID, valid HTTPS image URL, valid BDT price, canonical link, description, and taxonomy mapping.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {[...report.errors, ...report.warnings].map((issue) => (
              <div
                key={issue.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  issue.level === "error"
                    ? "bg-red-50/70 border-red-200"
                    : "bg-amber-50/60 border-amber-200"
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  {issue.level === "error" ? (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {issue.productName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                        {issue.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{issue.message}</p>
                  </div>
                </div>
                <Link
                  href={`/admin/products/${encodeURIComponent(issue.productId)}/edit`}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-[11px] font-bold text-slate-700 shrink-0"
                >
                  <span>Edit</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Feed Preview Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              Live Feed Items Inspector ({filteredItems.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact items &amp; fields currently served in `/facebook-catalog.xml`
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#ff6b35]"
            >
              <option value="all">All Stock ({items.length})</option>
              <option value="in_stock">In Stock ({report.activeInStockCount})</option>
              <option value="out_of_stock">Out of Stock ({report.outOfStockCount})</option>
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ID, title, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:border-[#ff6b35]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-3.5">Product / Variant</th>
                <th className="py-3 px-3.5">Meta ID / Group</th>
                <th className="py-3 px-3.5">Google Category</th>
                <th className="py-3 px-3.5">Price (BDT)</th>
                <th className="py-3 px-3.5">Availability</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-3 min-w-[220px]">
                      <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden relative shrink-0">
                        <Image
                          src={item.imageLink}
                          alt={item.title}
                          fill
                          sizes="40px"
                          className="object-contain p-0.5"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 line-clamp-1">{item.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {item.productType || "Uncategorized"}
                          {item.color ? ` • Color: ${item.color}` : ""}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3.5 font-mono text-[11px]">
                    <div className="text-slate-800 font-semibold truncate max-w-[190px]" title={item.id}>
                      {item.id}
                    </div>
                    {item.itemGroupId && (
                      <div
                        className="text-[10px] text-slate-400 truncate max-w-[190px]"
                        title={`Group: ${item.itemGroupId}`}
                      >
                        grp: {item.itemGroupId}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-3.5 text-[11px] text-slate-600 max-w-[220px]">
                    {item.googleProductCategory ? (
                      <span className="line-clamp-2">{item.googleProductCategory}</span>
                    ) : (
                      <span className="text-slate-400 italic">None mapped</span>
                    )}
                  </td>

                  <td className="py-3 px-3.5 whitespace-nowrap">
                    {item.salePriceFormatted ? (
                      <div>
                        <span className="font-black text-emerald-700">{item.salePriceFormatted}</span>
                        <span className="block text-[10px] text-slate-400 line-through">
                          {item.priceFormatted}
                        </span>
                      </div>
                    ) : (
                      <span className="font-black text-slate-900">{item.priceFormatted}</span>
                    )}
                  </td>

                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        item.availability === "in stock"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {item.availability}
                    </span>
                  </td>

                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/admin/products/${encodeURIComponent(item.parentProductId)}/edit`}
                        className="px-2 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-[11px] font-bold text-slate-700"
                      >
                        Edit
                      </Link>
                      <a
                        href={`/product/${item.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-500 hover:text-slate-800"
                        title="View storefront page"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    <AlertCircle className="w-5 h-5 mx-auto mb-1.5 text-slate-300" />
                    No matching catalog items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
