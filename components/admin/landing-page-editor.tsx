"use client";

import React, { useState, useRef, useMemo } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Save,
  Globe,
  Eye,
  Layers,
  Sparkles,
  ShoppingBag,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  HelpCircle,
  Phone,
  Plus,
  Trash2,
  Upload,
  Loader2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Check,
  Star,
  Flame,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminAlert } from "@/components/admin/admin-alert-provider";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";
import type {
  LandingPage,
  Product,
  LandingPageSectionConfig,
  LandingPageTemplateId,
  LandingPageProductOverride,
} from "@/lib/types";
import {
  DEFAULT_LANDING_PAGE_SECTIONS,
  createDefaultLandingPageFromProduct,
  generateUniqueSlug,
  safeImageSrc,
} from "@/lib/landing-page-defaults";
import { formatBDT } from "@/lib/format";

interface LandingPageEditorProps {
  initialLandingPage?: Partial<LandingPage> | null;
  existingLandingPages?: LandingPage[];
  products: Product[];
  onSave: (savedPage: LandingPage) => void;
  onCancel: () => void;
}

type TabKey =
  | "product"
  | "images"
  | "copy"
  | "features"
  | "social"
  | "offers"
  | "order"
  | "sections"
  | "seo";

export function LandingPageEditor({
  initialLandingPage,
  existingLandingPages = [],
  products,
  onSave,
  onCancel,
}: LandingPageEditorProps) {
  const { alert: showAlert, confirm: showConfirm } = useAdminAlert();

  const isNew = !initialLandingPage || !initialLandingPage.id;

  const existingSlugs = useMemo(() => {
    return (existingLandingPages || [])
      .map((p) => (p.slug || p.id || "").toLowerCase().trim())
      .filter(
        (s) =>
          Boolean(s) &&
          (!initialLandingPage?.id ||
            (s !== initialLandingPage.id.toLowerCase() &&
              s !== initialLandingPage.slug?.toLowerCase()))
      );
  }, [existingLandingPages, initialLandingPage]);

  // State initialization
  const [formData, setFormData] = useState<Partial<LandingPage>>(() => {
    if (initialLandingPage && initialLandingPage.id) {
      return {
        ...initialLandingPage,
        status: initialLandingPage.status || "published",
        template: initialLandingPage.template || "high_converting",
        sections: initialLandingPage.sections?.length
          ? initialLandingPage.sections
          : DEFAULT_LANDING_PAGE_SECTIONS,
        product_override: initialLandingPage.product_override || {},
      };
    }
    // New landing page: auto-fill from first active product if available, with a GUARANTEED unique slug
    const otherSlugs = (existingLandingPages || []).map((p) =>
      (p.slug || p.id || "").toLowerCase()
    );
    const firstProduct = products.find((p) => p.status !== "inactive") || products[0];
    return createDefaultLandingPageFromProduct(firstProduct, "high_converting", otherSlugs);
  });

  const [activeTab, setActiveTab] = useState<TabKey>("product");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);

  // Media Picker state
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"hero" | "gallery" | null>(null);

  const heroFileInputRef = useRef<HTMLInputElement>(null);

  const override = formData.product_override || {};

  const updateOverride = (updates: Partial<LandingPageProductOverride>) => {
    setFormData((prev) => ({
      ...prev,
      product_override: {
        ...(prev.product_override || {}),
        ...updates,
      },
    }));
  };

  // Direct product change handler with auto-population option
  const handleSelectProduct = async (productId: string) => {
    const selectedProd = products.find((p) => p.id === productId);
    if (!selectedProd) return;

    const shouldAutofill = await showConfirm({
      title: "Auto-Fill Content?",
      description: `Would you like to auto-populate headlines, images, variants, prices, and benefits from "${selectedProd.name}"? (Existing edits will be replaced)`,
      confirmText: "Yes, Auto-fill",
      cancelText: "No, Keep current edits",
      variant: "info",
    });

    if (shouldAutofill) {
      const template = (formData.template as LandingPageTemplateId) || "high_converting";
      const populated = createDefaultLandingPageFromProduct(selectedProd, template, existingSlugs);
      setFormData((prev) => ({
        ...prev,
        ...populated,
        id: isNew ? populated.id : prev.id,
        slug: isNew ? populated.slug : prev.slug,
        title: populated.title,
        product_id: selectedProd.id,
      }));
      toast.success("Content populated from " + selectedProd.name);
    } else {
      setFormData((prev) => ({
        ...prev,
        product_id: productId,
      }));
    }
  };

  // Direct Hero Upload to Cloudflare R2 via /api/admin/upload
  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingHero(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.success && data.url) {
        updateOverride({ hero_image: data.url });
        toast.success("Hero image uploaded to Cloudflare R2!");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed. Connection error.");
    } finally {
      setIsUploadingHero(false);
    }
  };

  // Media Picker Callback
  const handleMediaSelected = (urls: string[]) => {
    if (!urls || urls.length === 0) return;
    if (mediaPickerTarget === "hero") {
      updateOverride({ hero_image: urls[0] });
      toast.success("Hero image selected");
    } else if (mediaPickerTarget === "gallery") {
      const currentGallery = override.gallery_images || [];
      const updated = [...currentGallery, ...urls.filter((u) => !currentGallery.includes(u))];
      updateOverride({ gallery_images: updated });
      toast.success(`${urls.length} images added to gallery`);
    }
    setIsMediaPickerOpen(false);
    setMediaPickerTarget(null);
  };

  // Section Ordering & Visibility
  const toggleSection = (id: string) => {
    const current = formData.sections || DEFAULT_LANDING_PAGE_SECTIONS;
    const updated = current.map((sec) =>
      sec.id === id ? { ...sec, enabled: !sec.enabled } : sec
    );
    setFormData((prev) => ({ ...prev, sections: updated }));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const current = [...(formData.sections || DEFAULT_LANDING_PAGE_SECTIONS)];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= current.length) return;

    const temp = current[index];
    current[index] = current[targetIndex];
    current[targetIndex] = temp;

    setFormData((prev) => ({ ...prev, sections: current }));
  };

  // Submit & Save
  const handleSave = async (statusOverride?: "published" | "draft") => {
    const statusToSave = statusOverride || formData.status || "published";

    if (!formData.title?.trim()) {
      toast.error("Page title is required");
      setActiveTab("product");
      return;
    }

    const slug = (formData.slug || formData.id || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)+/g, "");

    if (!slug) {
      toast.error("A valid URL slug is required");
      setActiveTab("product");
      return;
    }

    if (existingSlugs.includes(slug)) {
      await showAlert({
        title: "URL Slug Already Taken",
        description: `The URL slug "${slug}" is already used by another landing page. Click "Auto-Fix Slug" or enter a unique slug to ensure unlimited landing pages.`,
        variant: "warning",
      });
      setActiveTab("product");
      return;
    }

    setIsSaving(true);
    try {
      const payload: LandingPage = {
        id: slug,
        slug: slug,
        title: formData.title.trim(),
        status: statusToSave,
        product_id: formData.product_id,
        template: formData.template || "high_converting",
        custom_domain: formData.custom_domain ? formData.custom_domain.trim() : null,
        subdomain: formData.subdomain ? formData.subdomain.trim() : null,
        meta_title: formData.meta_title?.trim() || formData.title.trim(),
        meta_description: formData.meta_description?.trim() || override.subheadline || "",
        og_image: formData.og_image || override.hero_image,
        canonical_url: formData.canonical_url || `/lp/${slug}`,
        gtm_id: formData.gtm_id?.trim() || null,
        ga4_id: formData.ga4_id?.trim() || null,
        pixel_id: formData.pixel_id?.trim() || null,
        product_override: override,
        sections: formData.sections || DEFAULT_LANDING_PAGE_SECTIONS,
      };

      const res = await fetch("/api/admin/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          isNew: isNew,
          originalId: initialLandingPage?.id || null,
        }),
      });

      const data = await res.json();
      if (data.success && data.landingPage) {
        toast.success(
          statusToSave === "published"
            ? "Landing page published successfully!"
            : "Draft saved successfully!"
        );
        onSave(data.landingPage);
      } else {
        await showAlert({
          title: "Save Failed",
          description: data.error || "Failed to save landing page",
          variant: "error",
        });
      }
    } catch {
      await showAlert({
        title: "Network Error",
        description: "An unexpected error occurred while saving. Please try again.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentSlug = (formData.slug || formData.id || "").toLowerCase().trim();
  const normalizedCurrentSlug = currentSlug
    .replace(/[^a-z0-9\-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const isSlugTaken = useMemo(() => {
    if (!normalizedCurrentSlug) return false;
    return existingSlugs.includes(normalizedCurrentSlug);
  }, [normalizedCurrentSlug, existingSlugs]);

  const handleAutoFixSlug = () => {
    const base = normalizedCurrentSlug || "landing-page";
    const unique = generateUniqueSlug(base, existingSlugs);
    setFormData((prev) => ({
      ...prev,
      slug: unique,
      id: isNew ? unique : prev.id,
    }));
    toast.success(`URL slug updated to unique path: /lp/${unique}`);
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen text-slate-850 flex flex-col font-sans -m-4 sm:-m-6 md:-m-8">
      {/* Top Action Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
            title="Back to Landing Pages"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 truncate">
                {formData.title || "Untitled Landing Page"}
              </h1>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  formData.status === "published"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {formData.status === "published" ? "Published" : "Draft"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-1 truncate">
              <span>/lp/{currentSlug}</span>
              {formData.custom_domain && <span>• {formData.custom_domain}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Live Preview Button */}
          <a
            href={`/lp/${currentSlug}?preview=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Preview Live</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Save Draft */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave("draft")}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            Save Draft
          </button>

          {/* Publish Main Button */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave("published")}
            className="bg-primary-gradient text-[var(--primary-foreground)] hover:opacity-95 font-black text-xs px-5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Publish Page</span>
          </button>
        </div>
      </header>

      {/* Editor Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar Tabs */}
        <aside className="lg:col-span-3 space-y-1 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs h-fit sticky top-20">
          {[
            { key: "product", label: "Product & Pricing", icon: ShoppingBag },
            { key: "images", label: "Hero & Gallery", icon: ImageIcon },
            { key: "copy", label: "Story & Benefits", icon: FileText },
            { key: "features", label: "Features & Specs", icon: Layers },
            { key: "social", label: "Reviews & FAQs", icon: Star },
            { key: "offers", label: "Offers & Urgency", icon: Flame },
            { key: "order", label: "Order Form & Delivery", icon: CheckCircle2 },
            { key: "sections", label: "Section Ordering", icon: Layers },
            { key: "seo", label: "URL, Domain & SEO", icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  isActive
                    ? "bg-[#FDF2F4] text-[#D45266] shadow-2xs font-black"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#D45266]" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Tab Content Panels */}
        <main className="lg:col-span-9 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          {/* TAB 1: PRODUCT & PRICING */}
          {activeTab === "product" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Product & Pricing Configuration</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Select a catalog product to auto-fill or customize specific details for this landing page.
                </p>
              </div>

              {/* Product Selection */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-rose-100/70 space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  Connected Catalog Product *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={formData.product_id || ""}
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-[#D45266]"
                  >
                    <option value="">— Select Catalog Product —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatBDT(p.price)})
                      </option>
                    ))}
                  </select>

                  <select
                    value={formData.template || "high_converting"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        template: e.target.value as LandingPageTemplateId,
                      }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-[#D45266]"
                  >
                    <option value="high_converting">Template: High-Converting COD (Direct Response)</option>
                    <option value="modern_luxury">Template: Modern Luxury (Apple / Minimal)</option>
                  </select>
                </div>
              </div>

              {/* Title & Headline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Internal Page Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Travel Bag Special Offer"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#D45266]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Promotional Badge
                  </label>
                  <input
                    type="text"
                    value={override.badge || ""}
                    onChange={(e) => updateOverride({ badge: e.target.value })}
                    placeholder="e.g. 🔥 সীমিত সময়ের মেগা অফার • ৩৫% ছাড়"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#D45266]"
                  />
                </div>
              </div>

              {/* URL Slug & Uniqueness Indicator */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#D45266]" />
                    Landing Page URL Slug (Path) *
                  </label>
                  {isSlugTaken ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        ⚠️ Slug already taken by another page
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoFixSlug}
                        className="text-[11px] font-bold text-[#D45266] bg-rose-50 hover:bg-rose-100 px-2.5 py-0.5 rounded-md border border-rose-200 transition-colors cursor-pointer"
                      >
                        Auto-Fix Slug
                      </button>
                    </div>
                  ) : normalizedCurrentSlug ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Unique & Ready (Unlimited Pages Supported)
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center">
                  <span className="h-10 px-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-mono text-slate-500 flex items-center select-none">
                    canvasbagbd.com/lp/
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.slug || formData.id || ""}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/\s+/g, "-");
                      setFormData((prev) => ({
                        ...prev,
                        slug: val,
                        id: isNew ? val : prev.id,
                      }));
                    }}
                    placeholder="e.g. travel-bag-offer-2"
                    className={`flex-1 h-10 px-3 rounded-r-xl border text-xs font-mono outline-none transition-colors ${
                      isSlugTaken
                        ? "border-amber-400 bg-amber-50/30 focus:border-amber-500"
                        : "border-slate-200 bg-white focus:border-[#D45266]"
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Each landing page must have a unique URL. Create unlimited landing pages for different ad sets, campaigns, and offers.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Main Headline (Hero Title) *
                </label>
                <input
                  type="text"
                  value={override.headline || ""}
                  onChange={(e) => updateOverride({ headline: e.target.value, name: e.target.value })}
                  placeholder="e.g. প্রিমিয়াম ক্যানভাস ট্রাভেল ব্যাগ"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#D45266]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Subheadline / Hook
                </label>
                <textarea
                  rows={2}
                  value={override.subheadline || ""}
                  onChange={(e) => updateOverride({ subheadline: e.target.value })}
                  placeholder="e.g. দৈনন্দিন অফিস, ভ্রমণ ও ক্লাসের জন্য এক ব্যাগেই সব সমাধান।"
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#D45266] resize-none"
                />
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Offer Price (৳) *
                  </label>
                  <input
                    type="number"
                    value={override.price ?? ""}
                    onChange={(e) => updateOverride({ price: Number(e.target.value) || 0 })}
                    placeholder="1850"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 outline-none focus:border-[#D45266]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Regular / Strikethrough Price (৳)
                  </label>
                  <input
                    type="number"
                    value={override.compare_at_price ?? ""}
                    onChange={(e) => updateOverride({ compare_at_price: Number(e.target.value) || 0 })}
                    placeholder="2450"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 outline-none focus:border-[#D45266]"
                  />
                </div>
              </div>

              {/* Variants Repeater */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Product Color Variants ({override.variants?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const current = override.variants || [];
                      updateOverride({
                        variants: [
                          ...current,
                          {
                            id: `var_${Date.now()}`,
                            name: "নতুন কালার (New Color)",
                            price: override.price || 1850,
                            image: override.hero_image,
                            in_stock: true,
                          },
                        ],
                      });
                    }}
                    className="text-xs font-bold text-[#D45266] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(override.variants || []).map((v, idx) => (
                    <div
                      key={v.id || idx}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3 text-xs"
                    >
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => {
                          const updated = [...(override.variants || [])];
                          updated[idx].name = e.target.value;
                          updateOverride({ variants: updated });
                        }}
                        placeholder="Color Name"
                        className="flex-1 h-9 px-3 rounded-lg border border-slate-200 font-semibold"
                      />
                      <input
                        type="number"
                        value={v.price || ""}
                        onChange={(e) => {
                          const updated = [...(override.variants || [])];
                          updated[idx].price = Number(e.target.value) || 0;
                          updateOverride({ variants: updated });
                        }}
                        placeholder="Price"
                        className="w-24 h-9 px-3 rounded-lg border border-slate-200 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (override.variants || []).filter((_, i) => i !== idx);
                          updateOverride({ variants: updated });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HERO & GALLERY */}
          {activeTab === "images" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Hero Image & Photo Gallery</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Upload crisp product photos to Cloudflare R2 or select from your existing media library.
                </p>
              </div>

              {/* Main Hero Image */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-[#FAF8F5] space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Primary Hero Image *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={heroFileInputRef}
                      onChange={handleHeroFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingHero}
                      onClick={() => heroFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingHero ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>Upload R2</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaPickerTarget("hero");
                        setIsMediaPickerOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#D45266] text-white hover:bg-[#BF4357] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Choose from Library</span>
                    </button>
                  </div>
                </div>

                {override.hero_image && override.hero_image !== "null" && override.hero_image !== "undefined" ? (
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                    <Image
                      src={safeImageSrc(override.hero_image)}
                      alt="Hero preview"
                      fill
                      sizes="192px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-xs text-slate-400 font-semibold">
                    No hero image set
                  </div>
                )}
              </div>

              {/* Gallery Images */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Gallery Showcase Images ({override.gallery_images?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaPickerTarget("gallery");
                      setIsMediaPickerOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add from Library</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(override.gallery_images || [])
                    .filter((img) => img && img !== "null" && img !== "undefined")
                    .map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group"
                    >
                      <Image src={safeImageSrc(imgUrl)} alt={`Gallery ${idx + 1}`} fill sizes="150px" className="object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (override.gallery_images || []).filter((_, i) => i !== idx);
                          updateOverride({ gallery_images: updated });
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STORY & BENEFITS */}
          {activeTab === "copy" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Product Story & Benefits</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Highlight key selling points and craftsmanship to build buyer conviction.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Craftsmanship & Product Story
                </label>
                <textarea
                  rows={4}
                  value={override.story || ""}
                  onChange={(e) => updateOverride({ story: e.target.value })}
                  placeholder="প্রতিটি ক্যানভাস ব্যাগ সূক্ষ্ম কারুকার্য ও শতভাগ নিখুঁত ফিনিশিংয়ের মাধ্যমে তৈরি..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#D45266] resize-none"
                />
              </div>

              {/* Benefits Repeater */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Key Benefits ({override.benefits?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const current = override.benefits || [];
                      updateOverride({
                        benefits: [
                          ...current,
                          { title: "নতুন সুবিধা", description: "সুবিধার বিস্তারিত বিবরণ লিখুন" },
                        ],
                      });
                    }}
                    className="text-xs font-bold text-[#D45266] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Benefit</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(override.benefits || []).map((b, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-400">Benefit #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (override.benefits || []).filter((_, i) => i !== idx);
                            updateOverride({ benefits: updated });
                          }}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={b.title}
                        onChange={(e) => {
                          const updated = [...(override.benefits || [])];
                          updated[idx].title = e.target.value;
                          updateOverride({ benefits: updated });
                        }}
                        placeholder="Benefit Title (e.g. ওয়াটারপ্রুফ মেটেরিয়াল)"
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs font-bold"
                      />
                      <textarea
                        rows={2}
                        value={b.description}
                        onChange={(e) => {
                          const updated = [...(override.benefits || [])];
                          updated[idx].description = e.target.value;
                          updateOverride({ benefits: updated });
                        }}
                        placeholder="Benefit description..."
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FEATURES & SPECS */}
          {activeTab === "features" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Features & Technical Specs</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Detailed specifications table and breakdown of internal features.
                </p>
              </div>

              {/* Specs Key-Value Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Specifications Table ({override.specs?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const current = override.specs || [];
                      updateOverride({
                        specs: [...current, { key: "বৈশিষ্ট্য", value: "বিবরণ" }],
                      });
                    }}
                    className="text-xs font-bold text-[#D45266] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Spec Row</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(override.specs || []).map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={s.key}
                        onChange={(e) => {
                          const updated = [...(override.specs || [])];
                          updated[idx].key = e.target.value;
                          updateOverride({ specs: updated });
                        }}
                        placeholder="Attribute (e.g. ডাইমেনশন)"
                        className="w-1/3 h-9 px-3 rounded-lg border border-slate-200 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={s.value}
                        onChange={(e) => {
                          const updated = [...(override.specs || [])];
                          updated[idx].value = e.target.value;
                          updateOverride({ specs: updated });
                        }}
                        placeholder="Value (e.g. ১৮ x ১২ x ৬.৫ ইঞ্চি)"
                        className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (override.specs || []).filter((_, i) => i !== idx);
                          updateOverride({ specs: updated });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features Breakdown */}
              <div className="space-y-3 pt-4 border-t border-slate-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Smart Feature Cards ({override.features?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const current = override.features || [];
                      updateOverride({
                        features: [...current, { title: "নতুন ফিচার", description: "ফিচারের বিবরণ" }],
                      });
                    }}
                    className="text-xs font-bold text-[#D45266] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Feature Card</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(override.features || []).map((f, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400">Feature #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (override.features || []).filter((_, i) => i !== idx);
                            updateOverride({ features: updated });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={f.title}
                        onChange={(e) => {
                          const updated = [...(override.features || [])];
                          updated[idx].title = e.target.value;
                          updateOverride({ features: updated });
                        }}
                        placeholder="Feature Title"
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={f.description}
                        onChange={(e) => {
                          const updated = [...(override.features || [])];
                          updated[idx].description = e.target.value;
                          updateOverride({ features: updated });
                        }}
                        placeholder="Feature Description"
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REVIEWS & FAQS */}
          {activeTab === "social" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Reviews & FAQ Accordions</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Provide social proof and overcome purchase objections to maximize conversion.
                </p>
              </div>

              {/* Reviews */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Customer Testimonials ({override.reviews?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const current = override.reviews || [];
                      updateOverride({
                        reviews: [
                          ...current,
                          {
                            author: "গ্রাহকের নাম (ঠিকানা)",
                            rating: 5,
                            text: "অসাধারণ কোয়ালিটি! খুব পছন্দ হয়েছে।",
                            date: "২ দিন আগে",
                            verified: true,
                          },
                        ],
                      });
                    }}
                    className="text-xs font-bold text-[#D45266] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Review</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(override.reviews || []).map((r, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={r.author}
                          onChange={(e) => {
                            const updated = [...(override.reviews || [])];
                            updated[idx].author = e.target.value;
                            updateOverride({ reviews: updated });
                          }}
                          placeholder="Author Name"
                          className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-bold w-1/2"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (override.reviews || []).filter((_, i) => i !== idx);
                            updateOverride({ reviews: updated });
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={r.text}
                        onChange={(e) => {
                          const updated = [...(override.reviews || [])];
                          updated[idx].text = e.target.value;
                          updateOverride({ reviews: updated });
                        }}
                        placeholder="Review text..."
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQs */}
              <div className="space-y-3 pt-4 border-t border-slate-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Frequently Asked Questions ({override.faqs?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const current = override.faqs || [];
                      updateOverride({
                        faqs: [
                          ...current,
                          { question: "আপনার প্রশ্নটি লিখুন?", answer: "প্রশ্নের উত্তর লিখুন..." },
                        ],
                      });
                    }}
                    className="text-xs font-bold text-[#D45266] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add FAQ</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(override.faqs || []).map((faq, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const updated = [...(override.faqs || [])];
                            updated[idx].question = e.target.value;
                            updateOverride({ faqs: updated });
                          }}
                          placeholder="Question"
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (override.faqs || []).filter((_, i) => i !== idx);
                            updateOverride({ faqs: updated });
                          }}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...(override.faqs || [])];
                          updated[idx].answer = e.target.value;
                          updateOverride({ faqs: updated });
                        }}
                        placeholder="Answer..."
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: OFFERS & CALL TO ACTION */}
          {activeTab === "offers" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Urgency, Offers & CTA Buttons</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Configure top ticker, stock urgency alerts, and primary conversion buttons.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Top Announcement Marquee Ticker
                </label>
                <input
                  type="text"
                  value={override.marquee_text || ""}
                  onChange={(e) => updateOverride({ marquee_text: e.target.value })}
                  placeholder="⚡ সীমিত সময়ের বিশেষ অফার • সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা ⚡"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#D45266]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Urgency / Stock Scarcity Notice
                </label>
                <input
                  type="text"
                  value={override.urgency_text || ""}
                  onChange={(e) => updateOverride({ urgency_text: e.target.value })}
                  placeholder="স্টক সীমিত! অফারটি শেষ হওয়ার আগেই অর্ডার করুন।"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#D45266]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Primary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={override.cta_text || ""}
                    onChange={(e) => updateOverride({ cta_text: e.target.value })}
                    placeholder="অর্ডার করতে এখানে ক্লিক করুন"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-[#D45266]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    CTA Button Subtitle / Trust Reassurance
                  </label>
                  <input
                    type="text"
                    value={override.cta_subtext || ""}
                    onChange={(e) => updateOverride({ cta_subtext: e.target.value })}
                    placeholder="ক্যাশ অন ডেলিভারি • দেখে মূল্য পরিশোধ"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#D45266]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: ORDER FORM & CONTACT */}
          {activeTab === "order" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Order Form & Contact Hotlines</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Configure delivery guarantees and hotline telephone numbers shown on this page.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Shipping Guarantee Notice
                </label>
                <input
                  type="text"
                  value={override.shipping_notice || ""}
                  onChange={(e) => updateOverride({ shipping_notice: e.target.value })}
                  placeholder="হোম ডেলিভারি সারাদেশে। কোনো অগ্রিম পেমেন্ট ছাড়া পণ্য হাতে পেয়ে চেক করে টাকা দিন।"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#D45266]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Support Hotline Number
                  </label>
                  <input
                    type="text"
                    value={override.phone || ""}
                    onChange={(e) => updateOverride({ phone: e.target.value })}
                    placeholder="01942212267"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#D45266]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Leave blank to use main store hotline (01942212267)
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    WhatsApp Hotline
                  </label>
                  <input
                    type="text"
                    value={override.whatsapp || ""}
                    onChange={(e) => updateOverride({ whatsapp: e.target.value })}
                    placeholder="01942212267"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#D45266]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Leave blank to use main store WhatsApp (01942212267)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SECTION ORDERING & VISIBILITY */}
          {activeTab === "sections" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Section Ordering & Visibility</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Turn sections on or off, or reorder them to test different funnel flows.
                </p>
              </div>

              <div className="space-y-2">
                {(formData.sections || DEFAULT_LANDING_PAGE_SECTIONS).map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      sec.enabled ? "bg-white border-slate-200 shadow-xs" : "bg-slate-100/70 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-xs font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{sec.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveSection(idx, "up")}
                        disabled={idx === 0}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(idx, "down")}
                        disabled={idx === (formData.sections || []).length - 1}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSection(sec.id)}
                        className={`text-xs font-bold px-3 py-1 rounded-full cursor-pointer transition-all ${
                          sec.enabled
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                      >
                        {sec.enabled ? "Visible" : "Hidden"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: URL, DOMAIN & SEO */}
          {activeTab === "seo" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">URL, Domain Routing & SEO</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Configure clean URL paths, custom subdomains, and search engine meta tags.
                </p>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    URL Slug (Path) *
                  </label>
                  {isSlugTaken ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        ⚠️ Slug already in use
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoFixSlug}
                        className="text-[11px] font-bold text-[#D45266] bg-rose-50 hover:bg-rose-100 px-2.5 py-0.5 rounded-md border border-rose-200 transition-colors cursor-pointer"
                      >
                        Auto-Fix Slug
                      </button>
                    </div>
                  ) : normalizedCurrentSlug ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Unique URL Available
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center">
                  <span className="h-11 px-3.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-mono text-slate-500 flex items-center">
                    canvasbagbd.com/lp/
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.slug || formData.id || ""}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/\s+/g, "-");
                      setFormData((prev) => ({
                        ...prev,
                        slug: val,
                        id: isNew ? val : prev.id,
                      }));
                    }}
                    placeholder="travel-bag-offer"
                    className={`flex-1 h-11 px-3.5 rounded-r-xl border text-xs font-mono outline-none transition-colors ${
                      isSlugTaken
                        ? "border-amber-400 bg-amber-50/30 focus:border-amber-500"
                        : "border-slate-200 bg-white focus:border-[#D45266]"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Custom Subdomain or Full Domain (Optional)
                </label>
                <input
                  type="text"
                  value={formData.custom_domain || ""}
                  onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                  placeholder="e.g. store.canvasbd.digital or travel.canvasbagbd.com"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-[#D45266]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Any request to this domain/subdomain will automatically route directly to this landing page.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-150">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Meta Title (Google / Social Share)
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title || ""}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="e.g. Exclusive Offer | CanvasBag"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#D45266]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Meta Description
                  </label>
                  <input
                    type="text"
                    value={formData.meta_description || ""}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    placeholder="Search engine summary..."
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#D45266]"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Media Picker Modal */}
      {isMediaPickerOpen && (
        <MediaPickerModal
          isOpen={isMediaPickerOpen}
          onClose={() => {
            setIsMediaPickerOpen(false);
            setMediaPickerTarget(null);
          }}
          onSelect={handleMediaSelected}
          multiple={mediaPickerTarget === "gallery"}
          title={mediaPickerTarget === "hero" ? "Select Hero Image" : "Add Gallery Images"}
        />
      )}
    </div>
  );
}
