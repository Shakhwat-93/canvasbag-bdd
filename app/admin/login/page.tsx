"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("ইমেইল ও পাসওয়ার্ড প্রদান করুন");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("সফলভাবে লগইন হয়েছে!");
        
        const nextParam = searchParams.get("next");
        let safeTarget = "/admin/products";
        if (
          nextParam &&
          nextParam.startsWith("/admin") &&
          !nextParam.startsWith("/admin/login") &&
          !nextParam.startsWith("//")
        ) {
          safeTarget = nextParam;
        }

        router.push(safeTarget);
        router.refresh();
      } else {
        toast.error(data.error || "ভুল ইমেইল বা পাসওয়ার্ড");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("লগইন ব্যর্থ হয়েছে। সংযোগ পরীক্ষা করুন।");
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4 text-slate-800 font-poppins">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm space-y-6">
        {/* Brand Info */}
        <div className="text-center space-y-2">
          <span className="inline-grid h-12 w-12 place-items-center rounded-full bg-black text-white shadow-md mb-2 p-2">
            <Image
              src="/brand/logo.webp"
              alt="CanvasBag Logo"
              width={28}
              height={28}
              className="object-contain brightness-0 invert"
              unoptimized
            />
          </span>
          <h1 className="text-xl font-black uppercase tracking-widest text-slate-900">CanvasBag Admin</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Secured with Supabase Auth</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label htmlFor="email" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@canvasbagbd.com"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[var(--primary)] text-sm font-medium bg-slate-50/30"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label htmlFor="password" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[var(--primary)] text-sm font-medium bg-slate-50/30"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-black text-white hover:bg-black/90 text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
