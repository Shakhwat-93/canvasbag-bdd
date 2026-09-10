"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  Save,
  Loader2,
  Bell,
  Eye,
  Check,
  Home,
  ShoppingBag,
  FolderTree,
  Store,
  ShoppingCart,
  CreditCard,
  Truck,
  Phone,
  BarChart,
  Layers,
  Upload,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  Sparkles,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Plus,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import type { SiteSettings } from "@/lib/types";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";

interface SettingsManagerProps {
  initialSettings: SiteSettings;
}

export function SettingsManager({ initialSettings }: SettingsManagerProps) {
  const [settings, setSettings] = useState<SiteSettings>({
    ...initialSettings,
    announcementEnabled: initialSettings.announcementEnabled ?? true,
    announcementShowHome: initialSettings.announcementShowHome ?? true,
    announcementShowProduct: initialSettings.announcementShowProduct ?? true,
    announcementShowCategory: initialSettings.announcementShowCategory ?? true,
    announcementShowShop: initialSettings.announcementShowShop ?? true,
    announcementShowCart: initialSettings.announcementShowCart ?? true,
    announcementShowCheckout: initialSettings.announcementShowCheckout ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<string | null>(null);
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleDirectUpload = async (key: string, file: File) => {
    if (!file) return;
    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setSettings((prev) => ({ ...prev, [key]: data.url }));
        toast.success("ছবি সফলভাবে আপলোড হয়েছে!");
      } else {
        toast.error(data.error || "আপলোড ব্যর্থ হয়েছে");
      }
    } catch (e: any) {
      toast.error(e?.message || "আপলোড ব্যর্থ হয়েছে। সংযোগ পরীক্ষা করুন।");
    } finally {
      setUploadingKey(null);
    }
  };

  const openMediaPicker = (key: string) => {
    setMediaPickerTarget(key);
    setMediaPickerOpen(true);
  };

  const handleMediaSelected = (urls: string[]) => {
    if (urls.length > 0 && mediaPickerTarget) {
      setSettings((prev) => ({ ...prev, [mediaPickerTarget]: urls[0] }));
      toast.success("মিডিয়া সিলেক্ট করা হয়েছে!");
    }
    setMediaPickerOpen(false);
    setMediaPickerTarget(null);
  };

  const heroSlides = [
    {
      num: 1,
      imgKey: "heroSliderImage1" as const,
      linkKey: "heroSliderLink1" as const,
      label: "Slide 1 (Primary Banner)",
      defaultImg: "/brand/hero-slider-1.webp",
      defaultLink: "/#best-sellers",
    },
    {
      num: 2,
      imgKey: "heroSliderImage2" as const,
      linkKey: "heroSliderLink2" as const,
      label: "Slide 2",
      defaultImg: "/brand/hero-banner.webp",
      defaultLink: "/shop",
    },
    {
      num: 3,
      imgKey: "heroSliderImage3" as const,
      linkKey: "heroSliderLink3" as const,
      label: "Slide 3",
      defaultImg: "/brand/smart-travel-bag/black-color.webp",
      defaultLink: "/category/everyday-totes",
    },
    {
      num: 4,
      imgKey: "heroSliderImage4" as const,
      linkKey: "heroSliderLink4" as const,
      label: "Slide 4",
      defaultImg: "",
      defaultLink: "/shop",
    },
    {
      num: 5,
      imgKey: "heroSliderImage5" as const,
      linkKey: "heroSliderLink5" as const,
      label: "Slide 5",
      defaultImg: "",
      defaultLink: "/shop",
    },
  ];

  const activePreviewSlides = heroSlides
    .map((s) => ({
      image: (settings[s.imgKey] as string) || s.defaultImg,
      link: (settings[s.linkKey] as string) || s.defaultLink,
      title: s.label,
    }))
    .filter((s) => Boolean(s.image && s.image.trim() !== ""));

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Settings saved successfully!");
        if (typeof (window as any).applyTheme === "function" && settings.themeColor) {
          (window as any).applyTheme(settings.themeColor);
        }
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch {
      toast.error("An error occurred while saving settings");
    } finally {
      setLoading(false);
    }
  };

  const pageToggles = [
    {
      key: "announcementShowHome" as const,
      label: "Home Page",
      path: "/",
      icon: Home,
      desc: "Top bar on primary storefront landing page",
    },
    {
      key: "announcementShowProduct" as const,
      label: "Product Pages",
      path: "/product/[slug]",
      icon: ShoppingBag,
      desc: "Top bar on individual product detail views",
    },
    {
      key: "announcementShowCategory" as const,
      label: "Category Pages",
      path: "/category/[slug]",
      icon: FolderTree,
      desc: "Top bar on category listing pages",
    },
    {
      key: "announcementShowShop" as const,
      label: "Shop Catalog",
      path: "/shop",
      icon: Store,
      desc: "Top bar on main all-products shop view",
    },
    {
      key: "announcementShowCart" as const,
      label: "Cart Page",
      path: "/cart",
      icon: ShoppingCart,
      desc: "Top bar on shopping cart review page",
    },
    {
      key: "announcementShowCheckout" as const,
      label: "Checkout Page",
      path: "/checkout",
      icon: CreditCard,
      desc: "Top bar on Cash on Delivery checkout page",
    },
  ];

  return (
    <>
      <form onSubmit={handleSaveSettings} className="space-y-8 text-left pb-16 max-w-5xl mx-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 -mx-4 px-4 sm:-mx-6 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Site &amp; Storefront Settings</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Announcement top bar, page-wise visibility, shipping rates, and tracking pixels
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-slate-900 text-white hover:bg-black px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────
          SECTION 0A: STORE LOGO & BRAND IDENTITY
         ──────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-6 bg-[#ff6b35] rounded-full" />
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff6b35]" />
                Store Logo &amp; Brand Identity (স্টোর লোগো)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Navbar, Mobile Drawer, Footer এবং Admin ড্যাশবোর্ডে প্রদর্শিত স্টোর লোগো পরিবর্তন করুন
              </p>
            </div>
          </div>
          {settings.logoUrl && (
            <button
              type="button"
              onClick={() => {
                setSettings({ ...settings, logoUrl: null });
                toast.success("ডিফল্ট লোগো রিস্টোর করা হয়েছে!");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Default
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Logo Previews (Checkerboard, Light Navbar, Dark Navbar) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Current Active Logo
              </span>
              <div className="relative aspect-video w-full rounded-xl border border-slate-200 bg-white flex items-center justify-center p-6 overflow-hidden [background-image:linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0]">
                <Image
                  src={settings.logoUrl || "/brand/logo.webp"}
                  alt="Store Logo Preview"
                  width={140}
                  height={140}
                  className="max-h-20 w-auto object-contain drop-shadow-xs"
                  unoptimized
                />
              </div>

              {/* Context Mock Previews */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Live Storefront Context Previews
                </span>
                {/* Light Navbar Mock */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Image
                      src={settings.logoUrl || "/brand/logo.webp"}
                      alt="Light Logo"
                      width={24}
                      height={24}
                      className="h-6 w-auto object-contain"
                      unoptimized
                    />
                    <span className="text-xs font-black text-slate-900">
                      Canvas<span className="text-[#ff6b35]">Bag</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    Light Mode
                  </span>
                </div>

                {/* Dark Header / Admin Mock */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 text-white shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Image
                      src={settings.logoUrl || "/brand/logo.webp"}
                      alt="Dark Logo"
                      width={24}
                      height={24}
                      className="h-6 w-auto object-contain brightness-0 invert"
                      unoptimized
                    />
                    <span className="text-xs font-black tracking-wider uppercase">
                      CanvasBag
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                    Admin Sidebar
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Logo Actions & URL Configuration */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Change Logo (লোগো পরিবর্তন করুন)
              </label>
              
              <div className="flex flex-wrap gap-2.5">
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => { fileInputRefs.current["logoUrl"] = el; }}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDirectUpload("logoUrl", file);
                  }}
                />
                
                <button
                  type="button"
                  disabled={uploadingKey === "logoUrl"}
                  onClick={() => fileInputRefs.current["logoUrl"]?.click()}
                  className="bg-[#ff6b35] hover:bg-[#e85d29] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                >
                  {uploadingKey === "logoUrl" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading &amp; Optimizing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload New Logo
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openMediaPicker("logoUrl")}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-slate-600" />
                  Media Library
                </button>
              </div>
            </div>

            {/* Direct URL Input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Direct Logo URL / CDN Link</span>
                <span className="text-[11px] text-slate-400 font-normal">Can be external or R2 storage URL</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.logoUrl || ""}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  placeholder="/brand/logo.webp or https://..."
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 outline-hidden bg-white text-xs font-mono font-medium text-slate-900 shadow-2xs"
                />
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Recommendation Tip Box */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/70 rounded-xl text-amber-900 text-xs leading-relaxed space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-950">
                💡 সেরা আউটপুটের জন্য পরামর্শ:
              </span>
              <p className="text-[11px] text-amber-900/90">
                স্বচ্ছ ব্যাকগ্রাউন্ড (Transparent PNG/WebP) যুক্ত লোগো ব্যবহার করুন। স্কয়ার বা অনুভূমিক রেশিও (যেমন 512x512px বা 600x200px) সবচেয়ে সুন্দরভাবে ফিট হয়।
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          SECTION 0B: HERO BANNER CAROUSEL SLIDER
         ──────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-6 bg-[#ff6b35] rounded-full" />
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#ff6b35]" />
                Hero Banner Carousel Slider (হিরো ব্যানার ও স্লাইডার)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                হোমপেজের টপ ব্যানার স্লাইডারের ছবি ও রিডাইরেক্ট লিংক ম্যানেজ করুন (১ থেকে ৫ টি স্লাইড)
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold bg-[#fff3ef] text-[#ff6b35] px-3 py-1 rounded-full border border-[#ff6b35]/20">
            {activePreviewSlides.length} Active {activePreviewSlides.length === 1 ? "Slide" : "Slides"}
          </span>
        </div>

        {/* Real-time Interactive Hero Slider Preview */}
        {activePreviewSlides.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                Live Storefront Carousel Preview
              </label>
              <span className="text-[11px] font-bold text-slate-400">
                Slide {((previewSlideIdx % activePreviewSlides.length) + 1)} of {activePreviewSlides.length}
              </span>
            </div>

            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-72 bg-slate-950 rounded-2xl border border-slate-200 shadow-md overflow-hidden group">
              {activePreviewSlides.map((slide, idx) => {
                const isCurrent = idx === (previewSlideIdx % activePreviewSlides.length);
                return (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                      isCurrent ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      sizes="(max-width: 1280px) 100vw, 1000px"
                      className="object-cover object-center w-full h-full"
                      unoptimized
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between text-white text-xs">
                      <span className="font-bold drop-shadow-xs">{slide.title}</span>
                      <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-xs">
                        Target: {slide.link || "/#best-sellers"}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Slider Navigation Arrows */}
              {activePreviewSlides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewSlideIdx(
                        (prev) => (prev - 1 + activePreviewSlides.length) % activePreviewSlides.length
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Previous preview slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewSlideIdx((prev) => (prev + 1) % activePreviewSlides.length)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Next preview slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Dots */}
              {activePreviewSlides.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                  {activePreviewSlides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreviewSlideIdx(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === (previewSlideIdx % activePreviewSlides.length)
                          ? "w-6 bg-[#ff6b35]"
                          : "w-2 bg-white/60 hover:bg-white"
                      }`}
                      aria-label={`Preview slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Individual Slide Configuration Cards */}
        <div className="space-y-4 pt-2">
          <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
            Slide Configurations (১ থেকে ৫ টি স্লাইডার ছবি ও লিংক)
          </label>

          <div className="grid grid-cols-1 gap-5">
            {heroSlides.map((slide) => {
              const currentImg = (settings[slide.imgKey] as string) || (slide.num <= 3 ? slide.defaultImg : "");
              const currentLink = (settings[slide.linkKey] as string) || slide.defaultLink;
              const hasCustomImg = Boolean(settings[slide.imgKey]);
              const isUploading = uploadingKey === slide.imgKey;

              return (
                <div
                  key={slide.num}
                  className={`p-5 rounded-2xl border transition-all ${
                    currentImg
                      ? "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                      : "bg-slate-50/25 border-dashed border-slate-200"
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-5 items-start">
                    {/* Slide Thumbnail Preview */}
                    <div className="w-full md:w-56 shrink-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">{slide.label}</span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            currentImg
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {currentImg ? "Active" : "Empty"}
                        </span>
                      </div>

                      <div className="relative aspect-[16/9] w-full rounded-xl border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                        {currentImg ? (
                          <Image
                            src={currentImg}
                            alt={slide.label}
                            fill
                            sizes="250px"
                            className="object-cover object-center w-full h-full"
                            unoptimized
                          />
                        ) : (
                          <div className="text-center p-3 text-slate-400">
                            <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                            <span className="text-[11px] font-medium block">কোনো ছবি নেই</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Slide Form Inputs & Actions */}
                    <div className="flex-1 w-full space-y-3.5">
                      {/* Image Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          ref={(el) => { fileInputRefs.current[slide.imgKey] = el; }}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDirectUpload(slide.imgKey, file);
                          }}
                        />

                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => fileInputRefs.current[slide.imgKey]?.click()}
                          className="bg-slate-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50 transition-colors"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              {currentImg ? "Change Image" : "Upload Image"}
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => openMediaPicker(slide.imgKey)}
                          className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                          Media Library
                        </button>

                        {currentImg && (
                          <button
                            type="button"
                            onClick={() => {
                              setSettings({
                                ...settings,
                                [slide.imgKey]: "",
                              });
                              toast.success(`${slide.label} ছবি রিমুভ করা হয়েছে`);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Clear Image
                          </button>
                        )}
                      </div>

                      {/* Image URL Input */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">
                          Banner Image URL (ছবির লিংক)
                        </label>
                        <input
                          type="text"
                          value={(settings[slide.imgKey] as string) || ""}
                          onChange={(e) => setSettings({ ...settings, [slide.imgKey]: e.target.value })}
                          placeholder={slide.defaultImg || "https://... or /brand/..."}
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs font-mono bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 outline-hidden"
                        />
                      </div>

                      {/* Click Target URL Input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-600">
                            Click Destination Link (ক্লিক করলে যেখানে যাবে)
                          </label>
                          <span className="text-[10px] text-slate-400">Can be internal link or full URL</span>
                        </div>

                        <input
                          type="text"
                          value={(settings[slide.linkKey] as string) || ""}
                          onChange={(e) => setSettings({ ...settings, [slide.linkKey]: e.target.value })}
                          placeholder={slide.defaultLink || "/#best-sellers"}
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs font-medium bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 outline-hidden"
                        />

                        {/* Quick Presets for Redirect Link */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] font-bold text-slate-400">Quick presets:</span>
                          {[
                            { label: "Best Sellers", val: "/#best-sellers" },
                            { label: "All Shop", val: "/shop" },
                            { label: "Active Gear", val: "/category/everyday-totes" },
                            { label: "Backpacks", val: "/category/crossbody-bags" },
                            { label: "Travel & Storage", val: "/category/travel-canvas" },
                          ].map((preset) => (
                            <button
                              key={preset.val}
                              type="button"
                              onClick={() => setSettings({ ...settings, [slide.linkKey]: preset.val })}
                              className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          SECTION 1: ANNOUNCEMENT BAR CONTROL SUITE
         ──────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-6 bg-[#ff6b35] rounded-full" />
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#ff6b35]" />
                Announcement Top Bar (Page-Wise Control)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enable or disable the announcement bar globally or selectively on individual pages
              </p>
            </div>
          </div>

          {/* Master Toggle */}
          <label className="flex items-center gap-3 cursor-pointer bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
            <span className="text-xs font-extrabold text-slate-800">Master Switch</span>
            <input
              type="checkbox"
              checked={Boolean(settings.announcementEnabled)}
              onChange={(e) => setSettings({ ...settings, announcementEnabled: e.target.checked })}
              className="w-4 h-4 text-[#ff6b35] rounded border-slate-300 focus:ring-[#ff6b35] cursor-pointer"
            />
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                settings.announcementEnabled
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              {settings.announcementEnabled ? "ON" : "OFF"}
            </span>
          </label>
        </div>

        {/* Announcement Text Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Announcement Message Text</span>
            <span className="text-[11px] text-slate-400 font-normal">Supports emoji &amp; bangla characters</span>
          </label>
          <input
            type="text"
            value={settings.announcementText || ""}
            onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
            placeholder="🚚 ৮৯৯+ অর্ডারে ফ্রি ডেলিভারি | ঢাকায় ২৪ ঘণ্টা | সারাদেশে ২-৩ দিন"
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 outline-hidden bg-white text-sm font-semibold text-slate-900 shadow-2xs"
          />
        </div>

        {/* Live Preview Banner */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            Live Storefront Preview
          </label>
          {settings.announcementEnabled ? (
            <div className="px-4 py-2.5 rounded-xl text-center text-xs font-bold bg-[#ff6b35] text-white shadow-2xs flex items-center justify-center gap-2">
              <span>🚚</span>
              <span>
                {settings.announcementText || "৮৯৯+ অর্ডারে ফ্রি ডেলিভারি | ঢাকায় ২৪ ঘণ্টা | সারাদেশে ২-৩ দিন"}
              </span>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 text-slate-400 text-xs rounded-xl text-center italic border border-dashed border-slate-200">
              Announcement bar is currently disabled globally.
            </div>
          )}
        </div>

        {/* Page-Wise Visibility Switches */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
            Page-Wise Display Visibility Rules
          </label>
          <p className="text-xs text-slate-500 leading-relaxed">
            Choose exactly which pages should display the announcement bar. When turned OFF for a page, the
            storefront automatically adjusts header padding with zero layout shifts.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {pageToggles.map((item) => {
              const Icon = item.icon;
              const isEnabled = Boolean(settings[item.key]);

              return (
                <div
                  key={item.key}
                  onClick={() => {
                    if (settings.announcementEnabled) {
                      setSettings({ ...settings, [item.key]: !isEnabled });
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all select-none cursor-pointer flex items-start justify-between gap-3 ${
                    !settings.announcementEnabled
                      ? "opacity-50 pointer-events-none bg-slate-50 border-slate-200"
                      : isEnabled
                      ? "bg-[#fffaf7] border-[#ff6b35]/40 shadow-2xs hover:border-[#ff6b35]"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-4 h-4 ${
                          isEnabled ? "text-[#ff6b35]" : "text-slate-400"
                        }`}
                      />
                      <span className="font-extrabold text-xs text-slate-900">{item.label}</span>
                    </div>
                    <code className="text-[10px] font-mono text-slate-400 block">{item.path}</code>
                    <p className="text-[11px] text-slate-500 leading-tight pt-0.5">{item.desc}</p>
                  </div>

                  {/* Toggle Switch Pill */}
                  <div className="pt-0.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isEnabled
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-slate-200 text-slate-600 border border-slate-300"
                      }`}
                    >
                      {isEnabled ? (
                        <>
                          <Check className="w-2.5 h-2.5" /> ON
                        </>
                      ) : (
                        "OFF"
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          SECTION 2: DELIVERY FEES
         ──────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Truck className="w-4 h-4 text-[#ff6b35]" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
            Delivery Fees (BDT)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700">Inside Dhaka Delivery Fee</label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
              <input
                type="number"
                value={settings.shippingInsideDhaka || 70}
                onChange={(e) => setSettings({ ...settings, shippingInsideDhaka: Number(e.target.value) })}
                className="w-full h-11 pl-7 pr-3 rounded-xl border border-slate-200 text-sm font-black text-slate-900 bg-white shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Outside Dhaka Delivery Fee</label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
              <input
                type="number"
                value={settings.shippingOutsideDhaka || 150}
                onChange={(e) => setSettings({ ...settings, shippingOutsideDhaka: Number(e.target.value) })}
                className="w-full h-11 pl-7 pr-3 rounded-xl border border-slate-200 text-sm font-black text-slate-900 bg-white shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          SECTION 3: CONTACT & SUPPORT CHANNELS
         ──────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Phone className="w-4 h-4 text-[#ff6b35]" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
            Contact &amp; Order Channels
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700">Customer Phone Number</label>
            <input
              type="text"
              value={settings.phone || ""}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              placeholder="01942212267"
              className="w-full h-10 px-3 mt-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white shadow-2xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">WhatsApp Order Number</label>
            <input
              type="text"
              value={settings.whatsappNumber || ""}
              onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
              placeholder="01942212267"
              className="w-full h-10 px-3 mt-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white shadow-2xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Messenger Username</label>
            <input
              type="text"
              value={settings.messengerUsername || ""}
              onChange={(e) => setSettings({ ...settings, messengerUsername: e.target.value })}
              placeholder="canvas.bangladesh"
              className="w-full h-10 px-3 mt-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          SECTION 4: ANALYTICS & CONVERSION TRACKING
         ──────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <BarChart className="w-4 h-4 text-[#ff6b35]" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
            Analytics &amp; Conversion Tracking
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700">Google Tag Manager (GTM)</label>
            <input
              type="text"
              value={settings.gtmId || ""}
              onChange={(e) => setSettings({ ...settings, gtmId: e.target.value })}
              placeholder="GTM-PVHHM8CX"
              className="w-full h-10 px-3 mt-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white shadow-2xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Google Analytics 4 (GA4)</label>
            <input
              type="text"
              value={settings.ga4Id || ""}
              onChange={(e) => setSettings({ ...settings, ga4Id: e.target.value })}
              placeholder="G-KF0PE2GR6K"
              className="w-full h-10 px-3 mt-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white shadow-2xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Meta / Facebook Pixel ID</label>
            <input
              type="text"
              value={settings.pixelId || ""}
              onChange={(e) => setSettings({ ...settings, pixelId: e.target.value })}
              placeholder="1614327189772228"
              className="w-full h-10 px-3 mt-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white shadow-2xs"
            />
          </div>
        </div>
      </div>
    </form>

    <MediaPickerModal
      isOpen={mediaPickerOpen}
      onClose={() => {
        setMediaPickerOpen(false);
        setMediaPickerTarget(null);
      }}
      onSelect={handleMediaSelected}
      multiple={false}
      title={
        mediaPickerTarget === "logoUrl"
          ? "Select Store Logo from Media Library"
          : "Select Hero Slide Banner from Media Library"
      }
    />
    </>
  );
}
