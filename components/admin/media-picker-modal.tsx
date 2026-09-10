"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Image as ImageIcon,
  Search,
  Check,
  X,
  Upload,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { MediaItem } from "@/components/admin/media-library";

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedUrls: string[]) => void;
  multiple?: boolean;
  title?: string;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  multiple = true,
  title = "Select from Media Library",
}: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);

  // Fetch media on open
  useEffect(() => {
    if (isOpen) {
      setSelectedUrls(new Set());
      setLoading(true);
      fetch("/api/admin/media?limit=100")
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.objects)) {
            setItems(data.objects);
          }
        })
        .catch((err) => {
          console.error("[Media Picker Fetch Error]", err);
          toast.error("Failed to load media library");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  // Filter items
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase().trim();
    return items.filter((item) => item.key.toLowerCase().includes(term));
  }, [items, searchTerm]);

  const toggleSelect = (url: string) => {
    if (!multiple) {
      setSelectedUrls(new Set([url]));
      return;
    }
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const urls = Array.from(selectedUrls);
    if (urls.length === 0) {
      toast.error("Please select at least one image");
      return;
    }
    onSelect(urls);
    onClose();
  };

  // Upload new directly in picker
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        // Auto select newly uploaded
        const newUrls = data.uploaded.map((u: any) => u.url);
        if (multiple) {
          setSelectedUrls((prev) => new Set([...Array.from(prev), ...newUrls]));
        } else {
          setSelectedUrls(new Set([newUrls[0]]));
        }
        toast.success(`Uploaded ${data.uploaded.length} image(s)`);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-150 flex items-center justify-between gap-4 shrink-0 bg-white">
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-700" />
              <span>{title}</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Select existing Cloudflare R2 assets to add without re-uploading
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors">
              <input
                type="file"
                multiple={multiple}
                accept="image/*"
                onChange={handleDirectUpload}
                className="hidden"
                disabled={isUploading}
              />
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>Upload New</span>
            </label>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 sm:px-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search images by name..."
              className="w-full h-8.5 pl-9 pr-7 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-900"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs font-bold text-slate-500 shrink-0">
            <span>{selectedUrls.size} selected</span>
          </div>
        </div>

        {/* Media Grid Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Loading R2 assets...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-slate-600">No media found</p>
              <p className="text-xs text-slate-400 mt-1">Upload an image or adjust your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filtered.map((item) => {
                const isSelected = selectedUrls.has(item.url);
                const filename = item.key.split("/").pop() || item.key;

                return (
                  <div
                    key={item.key}
                    onClick={() => toggleSelect(item.url)}
                    className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-150 select-none ${
                      isSelected
                        ? "border-slate-950 shadow-md ring-2 ring-slate-950/20"
                        : "border-slate-200 hover:border-slate-400 bg-slate-50"
                    }`}
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={item.url}
                        alt={filename}
                        fill
                        sizes="200px"
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />

                      {/* Selection Checkmark Overlay */}
                      <div
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-slate-950 text-white shadow-md scale-100"
                            : "bg-white/80 backdrop-blur-xs text-slate-400 opacity-0 group-hover:opacity-100 scale-90"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>

                      {/* Used Badge */}
                      {item.isUsed && (
                        <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs">
                          In Use
                        </div>
                      )}
                    </div>

                    <div className="p-2 bg-white border-t border-slate-100">
                      <p className="text-[11px] font-bold text-slate-800 truncate" title={filename}>
                        {filename}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-150 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={selectedUrls.size === 0}
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-primary-gradient text-[var(--primary-foreground)] hover:opacity-90 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Insert Selected {selectedUrls.size > 0 ? `(${selectedUrls.size})` : ""}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
