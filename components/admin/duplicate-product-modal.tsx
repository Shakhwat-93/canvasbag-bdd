"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  Copy,
  Loader2,
  Check,
  Edit2,
  ArrowRight,
  Layers,
  Sparkles,
  ImageIcon,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { formatBDT } from "@/lib/format";
import { slugifyCategory } from "@/lib/category-tree";

interface DuplicateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess?: (duplicatedProduct: Product, shouldRedirectToEdit: boolean) => void;
}

export function DuplicateProductModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: DuplicateProductModalProps) {
  const router = useRouter();

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [status, setStatus] = useState<"draft" | "active">("draft");
  const [copyImages, setCopyImages] = useState(true);
  const [copyVariants, setCopyVariants] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<"edit" | "stay">("edit");

  // Reset and pre-fill form when product changes or modal opens
  useEffect(() => {
    if (product && isOpen) {
      const defaultName = `${product.name} (Copy)`;
      setNewName(defaultName);
      setNewSlug(`${product.slug || slugifyCategory(product.name)}-copy`);
      setIsSlugManuallyEdited(false);
      setStatus("draft");
      setCopyImages(true);
      setCopyVariants(true);
      setIsSubmitting(false);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewName(val);
    if (!isSlugManuallyEdited) {
      const base = slugifyCategory(val) || `${slugifyCategory(product.name)}-copy`;
      setNewSlug(base);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true);
    setNewSlug(slugifyCategory(e.target.value));
  };

  const handleDuplicate = async (redirectToEdit: boolean) => {
    if (!newName.trim()) {
      toast.error("প্রোডাক্টের নাম লিখুন");
      return;
    }

    setSubmitMode(redirectToEdit ? "edit" : "stay");
    setIsSubmitting(true);

    const toastId = toast.loading(`"${product.name}" ডুপ্লিকেট করা হচ্ছে...`);

    try {
      const res = await fetch("/api/admin/product/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: product.id,
          name: newName.trim(),
          slug: newSlug.trim() || undefined,
          status,
          copyImages,
          copyVariants,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "প্রোডাক্ট ডুপ্লিকেট করা সম্ভব হয়নি", { id: toastId });
        setIsSubmitting(false);
        return;
      }

      toast.success(`"${data.product.name}" সফলভাবে ডুপ্লিকেট হয়েছে!`, {
        id: toastId,
        description:
          status === "draft"
            ? "প্রোডাক্টটি ড্রাফট (লুকানো) হিসেবে সেভ হয়েছে।"
            : "প্রোডাক্টটি সরাসরি ওয়েবসাইটে লাইভ হয়েছে।",
      });

      onClose();

      if (onSuccess) {
        onSuccess(data.product, redirectToEdit);
      } else {
        if (redirectToEdit) {
          router.push(`/admin/products/${data.product.id}/edit`);
        } else {
          router.refresh();
        }
      }
    } catch (err: any) {
      console.error("[Duplicate Error]", err);
      toast.error("নেটওয়ার্ক সমস্যার কারণে ডুপ্লিকেট করা যায়নি", { id: toastId });
      setIsSubmitting(false);
    }
  };

  const imgSrc =
    product.image ||
    product.imageUrl ||
    (product.images?.[0]
      ? typeof product.images[0] === "string"
        ? product.images[0]
        : product.images[0].url
      : "/brand/logo.webp");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden text-left flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 text-[#ff6b35] flex items-center justify-center shadow-xs">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h2 id="duplicate-modal-title" className="text-sm font-extrabold text-slate-900 tracking-tight">
                Duplicate Product (ডুপ্লিকেট প্রোডাক্ট)
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Create an instant copy with matching specifications and variants
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Source Product Mini Banner */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0">
              <Image src={imgSrc} alt={product.name} fill sizes="48px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Source Product (মূল প্রোডাক্ট)
              </span>
              <h3 className="text-xs font-bold text-slate-900 truncate">{product.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-extrabold text-slate-900">{formatBDT(product.price)}</span>
                <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                  {product.categoryName || product.categorySlug}
                </span>
                {product.variants && product.variants.length > 0 && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    • {product.variants.length}টি ভ্যারিয়েন্ট
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* New Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              New Product Title (নতুন প্রোডাক্টের নাম) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newName}
              onChange={handleNameChange}
              disabled={isSubmitting}
              placeholder="e.g. Canvas Weekender - Olive (Copy)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs"
            />
          </div>

          {/* New Slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                URL Slug (লিংক পাথ)
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                /product/{newSlug || "your-slug"}
              </span>
            </div>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-[#ff6b35] focus-within:ring-2 focus-within:ring-[#ff6b35]/20 transition-all shadow-2xs">
              <span className="px-3 text-[11px] text-slate-400 font-mono select-none border-r border-slate-200 bg-slate-100 py-2.5">
                /product/
              </span>
              <input
                type="text"
                value={newSlug}
                onChange={handleSlugChange}
                disabled={isSubmitting}
                placeholder="product-slug-copy"
                className="w-full px-3 py-2 bg-transparent text-xs font-mono font-semibold text-slate-800 placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Publish Status (প্রাথমিক স্ট্যাটাস)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus("draft")}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col gap-1 ${
                  status === "draft"
                    ? "border-[#ff6b35] bg-orange-50/50 ring-1 ring-[#ff6b35]"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900">Draft (ড্রাফট)</span>
                  {status === "draft" && <Check className="w-3.5 h-3.5 text-[#ff6b35]" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  স্টোরফ্রন্ট থেকে লুকানো থাকবে। এডিট ও চেক করে পরে অন করুন।
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStatus("active")}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col gap-1 ${
                  status === "active"
                    ? "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-emerald-900">Active (সক্রিয়)</span>
                  {status === "active" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  কপি হওয়ার সাথে সাথেই ওয়েবসাইটে সরাসরি লাইভ দেখাবে।
                </p>
              </button>
            </div>
          </div>

          {/* Options (Checkboxes) */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={copyImages}
                onChange={(e) => setCopyImages(e.target.checked)}
                className="w-4 h-4 rounded text-[#ff6b35] focus:ring-[#ff6b35] border-slate-300"
              />
              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>সব ছবি ও গ্যালারি কপি করুন (Copy gallery images)</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={copyVariants}
                onChange={(e) => setCopyVariants(e.target.checked)}
                className="w-4 h-4 rounded text-[#ff6b35] focus:ring-[#ff6b35] border-slate-300"
              />
              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>সব কালার ও ভ্যারিয়েন্ট কপি করুন (Copy variants with fresh IDs)</span>
              </div>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel (বাতিল)
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDuplicate(false)}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-extrabold text-xs rounded-xl shadow-2xs hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && submitMode === "stay" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>Duplicate Only</span>
            </button>

            <button
              type="button"
              onClick={() => handleDuplicate(true)}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-[#ff804e] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#e55520] text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 active:scale-98"
            >
              {isSubmitting && submitMode === "edit" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Edit2 className="w-3.5 h-3.5" />
              )}
              <span>Duplicate &amp; Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
