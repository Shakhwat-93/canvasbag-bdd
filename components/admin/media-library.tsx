"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import {
  Image as ImageIcon,
  Search,
  Upload,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Filter,
  Grid,
  List,
  AlertTriangle,
  X,
  Loader2,
  Calendar,
  HardDrive,
  Eye,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminAlert } from "@/components/admin/admin-alert-provider";
import type { MediaUsageItem } from "@/lib/media-usage";

export interface MediaItem {
  key: string;
  url: string;
  size: number;
  lastModified?: string;
  isUsed: boolean;
  usedIn: MediaUsageItem[];
}

interface MediaLibraryProps {
  initialItems: MediaItem[];
  initialUsageMap?: Record<string, MediaUsageItem[]>;
}

export function MediaLibrary({ initialItems }: MediaLibraryProps) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "used" | "unused">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Alert & Confirm
  const { confirm, confirmDelete: askDeleteConfirm, alert: showAlert } = useAdminAlert();

  // Format bytes
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Usage filter
      if (filterType === "used" && !item.isUsed) return false;
      if (filterType === "unused" && item.isUsed) return false;

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesKey = item.key.toLowerCase().includes(term);
        const matchesUsage = item.usedIn.some((u) => u.name.toLowerCase().includes(term));
        if (!matchesKey && !matchesUsage) return false;
      }

      return true;
    });
  }, [items, filterType, searchTerm]);

  // Copy public URL
  const handleCopyUrl = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    toast.success("CDN URL copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Handle file uploads
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.uploaded)) {
        setItems((prev) => [...data.uploaded, ...prev]);
        toast.success(`Successfully uploaded ${data.uploaded.length} image(s) to Cloudflare R2`);
      } else {
        toast.error(data.error || "Failed to upload images");
      }
    } catch {
      toast.error("Failed to upload images to R2");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle safe delete with unified sweet alert
  const handleDeleteMedia = async (item: MediaItem) => {
    let confirmed = false;

    if (item.isUsed) {
      confirmed = await confirm({
        title: "Image Currently in Use!",
        description: `This image is actively referenced by ${item.usedIn.length} product(s) or collection(s). Deleting it will cause broken images on your live storefront. Are you sure you want to force delete it?`,
        variant: "warning",
        confirmText: "Force Delete Anyway",
        cancelText: "Cancel",
      });
    } else {
      const fileName = item.key.split("/").pop() || "media file";
      confirmed = await askDeleteConfirm(
        fileName,
        `Are you sure you want to permanently delete "${fileName}" (${formatSize(item.size)}) from Cloudflare R2 storage?`
      );
    }

    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/admin/media?key=${encodeURIComponent(item.key)}${item.isUsed ? "&force=true" : ""}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i.key !== item.key));
        if (selectedMedia?.key === item.key) {
          setSelectedMedia(null);
        }
        toast.success("Media deleted from Cloudflare R2");
      } else if (res.status === 409) {
        await showAlert({
          title: "Cannot Delete Image",
          description: data.error || "This image is in use. Check active products.",
          variant: "error",
        });
      } else {
        await showAlert({
          title: "Delete Failed",
          description: data.error || "Failed to delete media from storage.",
          variant: "error",
        });
      }
    } catch {
      await showAlert({
        title: "Delete Failed",
        description: "An unexpected error occurred while deleting media.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Media Library</span>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
              {items.length} Assets
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Cloudflare R2 storage bucket: crystal-clear WebP assets & catalog references
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-primary-gradient text-[var(--primary-foreground)] hover:opacity-90 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Optimizing & Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Media</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter / Search & View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search filename or product..."
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-900"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Usage Filter */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
            {(
              [
                { id: "all", label: `All (${items.length})` },
                { id: "used", label: `Used (${items.filter((i) => i.isUsed).length})` },
                { id: "unused", label: `Unused (${items.filter((i) => !i.isUsed).length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterType === tab.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 self-end sm:self-auto bg-white p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              viewMode === "grid"
                ? "bg-slate-900 text-white"
                : "text-slate-400 hover:text-slate-700"
            }`}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              viewMode === "list"
                ? "bg-slate-900 text-white"
                : "text-slate-400 hover:text-slate-700"
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Media Grid View */}
      {viewMode === "grid" ? (
        filteredItems.length === 0 ? (
          <div className="py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">No media found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or upload new images.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filteredItems.map((item) => {
              const filename = item.key.split("/").pop() || item.key;
              const isCopied = copiedKey === item.key;

              return (
                <div
                  key={item.key}
                  className="group relative bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col"
                >
                  {/* Thumbnail Image */}
                  <div
                    onClick={() => setSelectedMedia(item)}
                    className="relative aspect-square bg-slate-100 cursor-pointer overflow-hidden"
                  >
                    <Image
                      src={item.url}
                      alt={filename}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Usage Pill Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      {item.isUsed ? (
                        <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                          {item.usedIn.length} in use
                        </span>
                      ) : (
                        <span className="bg-slate-100/90 backdrop-blur-xs text-slate-600 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-200">
                          Unused
                        </span>
                      )}
                    </div>

                    {/* Quick View Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="p-2 bg-white text-slate-900 rounded-xl shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <Eye className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div className="min-w-0">
                      <div
                        title={filename}
                        className="text-xs font-bold text-slate-900 truncate"
                      >
                        {filename}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatSize(item.size)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyUrl(item.url, item.key);
                        }}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Copy CDN URL"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMedia(item);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Media List View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4 w-16">Preview</th>
                <th className="py-3 px-4">Filename / Key</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Usage</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No media found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const filename = item.key.split("/").pop() || item.key;
                  const isCopied = copiedKey === item.key;
                  const dateStr = item.lastModified
                    ? new Date(item.lastModified).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr
                      key={item.key}
                      onClick={() => setSelectedMedia(item)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <Image
                            src={item.url}
                            alt={filename}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900">{filename}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.key}</div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">
                        {formatSize(item.size)}
                      </td>
                      <td className="py-2.5 px-4">
                        {item.isUsed ? (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-full text-[10px] font-bold">
                            {item.usedIn.length} product(s)/page(s)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">Unused</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{dateStr}</td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(item.url, item.key)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="Copy URL"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMedia(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Preview Drawer / Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="min-w-0 pr-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Cloudflare R2 Asset
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight truncate">
                  {selectedMedia.key.split("/").pop()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-res Image Preview */}
            <div className="relative aspect-video sm:aspect-square max-h-[340px] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <Image
                src={selectedMedia.url}
                alt={selectedMedia.key}
                fill
                sizes="600px"
                className="object-contain"
              />
            </div>

            {/* Details List */}
            <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-200/80 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">Storage Key:</span>
                <span className="font-mono text-slate-900 text-[11px] truncate max-w-[300px]">
                  {selectedMedia.key}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">File Size:</span>
                <span className="font-semibold text-slate-900">{formatSize(selectedMedia.size)}</span>
              </div>
              {selectedMedia.lastModified && (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500">Uploaded:</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(selectedMedia.lastModified).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex flex-col gap-1.5">
                <span className="font-bold text-slate-500">Public CDN URL:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedMedia.url}
                    className="flex-1 h-8 px-3 rounded-lg border border-slate-200 bg-white font-mono text-[11px] text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(selectedMedia.url, selectedMedia.key)}
                    className="px-3 h-8 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                  <a
                    href={selectedMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg shrink-0"
                    title="Open full size in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Catalog References */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Catalog Usage ({selectedMedia.usedIn.length})
              </span>
              {selectedMedia.usedIn.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-xs font-medium border border-slate-200/60">
                  This image is currently not used in any published products, categories, or settings. It is safe to delete.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedMedia.usedIn.map((usage, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                          {usage.type}
                        </span>
                        <span className="font-bold text-slate-900">{usage.name}</span>
                      </div>
                      {usage.extra && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {usage.extra}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (selectedMedia) handleDeleteMedia(selectedMedia);
                }}
                className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Media</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
