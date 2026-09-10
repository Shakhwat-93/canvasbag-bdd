import React from "react";
import Link from "next/link";
import { ShoppingBag, MessageCircle, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import type { SiteSettings } from "@/lib/types";

interface PromoCtaBannerProps {
  settings?: SiteSettings;
}

export function PromoCtaBanner({ settings = {} }: PromoCtaBannerProps) {
  const whatsappNumber = settings.whatsappNumber || "01942212267";
  const cleanPhone = whatsappNumber.replace(/\D/g, "");
  const waUrl = `https://wa.me/88${cleanPhone.startsWith("0") ? cleanPhone : "0" + cleanPhone}`;

  return (
    <section
      className="relative py-20 md:py-28 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #fff7f3 0%, #fff1eb 40%, #fde8dc 100%)",
      }}
    >
      {/* Decorative Radial Blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-20 w-96 h-96 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
      {/* Dot Matrix Pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,107,53,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#111827] tracking-tight leading-tight mb-4">
          আজই অর্ডার করুন,{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #ff6b35 20%, #f97316 60%, #f59e0b 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            বিশেষ ছাড় পান!
          </span>
        </h2>

        <p className="text-base sm:text-lg text-[#6b7280] font-medium mb-8 max-w-xl mx-auto">
          অফার সীমিত সময়ের জন্য — দেরি না করে এখনই অর্ডার সম্পন্ন করুন।
        </p>

        {/* Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Link
            href="/#best-sellers"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff804e] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#e55520] text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-sm md:text-base cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>এখনই কেনাকাটা করুন</span>
          </Link>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-[#e5e7eb] text-gray-800 font-bold px-8 py-3.5 rounded-2xl shadow-xs transition-all active:scale-95 text-sm md:text-base cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 text-emerald-500" />
            <span>WhatsApp করুন</span>
          </a>
        </div>

        {/* Guarantees Row */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#6b7280]">
          <span className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-full border border-[#ff6b35]/15">
            <Truck className="w-4 h-4 text-[#ff6b35]" /> ফ্রি ডেলিভারি (৳২৫০০+)
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-full border border-[#ff6b35]/15">
            <ShieldCheck className="w-4 h-4 text-[#ff6b35]" /> ক্যাশ অন ডেলিভারি
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-full border border-[#ff6b35]/15">
            <RefreshCw className="w-4 h-4 text-[#ff6b35]" /> ৭ দিন রিটার্ন পলিসি
          </span>
        </div>
      </div>
    </section>
  );
}
