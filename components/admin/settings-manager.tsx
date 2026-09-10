"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import type { SiteSettings } from "@/lib/types";

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
  );
}
