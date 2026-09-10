"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Boundary caught]", error);
  }, [error]);

  return (
    <html lang="bn">
      <body className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 text-center shadow-xl shadow-black/5 space-y-6">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl mx-auto flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              সার্ভারে সমস্যা দেখা দিয়েছে
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              পেজটি লোড করার সময় সার্ভারে সাময়িক সমস্যা হয়েছে। পুনরায় চেষ্টা করতে নিচের বাটনে ক্লিক করুন।
            </p>
            {error.digest && (
              <p className="text-[10px] text-slate-400 font-mono">
                Error Digest: {error.digest}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#ff6b35] hover:bg-[#e55520] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              পেজ রিলোড করুন
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
