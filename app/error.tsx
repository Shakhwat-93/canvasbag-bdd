"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function RouteErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Route Error Boundary caught]", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#fafaf9] font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 text-center shadow-xl shadow-black/5 space-y-6">
        <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl mx-auto flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            কিছু একটা সমস্যা হয়েছে
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            পেজটি লোড করার সময় সার্ভারে সাময়িক ত্রুটি দেখা দিয়েছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন অথবা হোমে ফিরে যান।
          </p>
          {error.digest && (
            <p className="text-[10px] text-slate-400 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#ff6b35] hover:bg-[#e55520] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            আবার চেষ্টা করুন
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Home className="w-4 h-4" />
            হোম পেজ
          </Link>
        </div>
      </div>
    </div>
  );
}
