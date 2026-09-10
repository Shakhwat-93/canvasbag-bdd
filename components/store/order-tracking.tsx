"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  Phone,
  MessageCircle,
  MapPin,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { formatBDT } from "@/lib/format";

interface TrackedOrderData {
  id: string;
  status: string;
  status_label: string;
  step: number;
  is_cancelled: boolean;
  created_at: string;
  customer: {
    name: string;
    phone: string;
    city: string;
    address: string;
  };
  pricing: {
    subtotal: number;
    delivery_fee: number;
    discount: number;
    total: number;
    payment_method: string;
  };
  items: Array<{
    name: string;
    variant?: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

interface OrderSummary {
  id: string;
  status: string;
  status_label: string;
  step: number;
  is_cancelled: boolean;
  created_at: string;
  total: number;
  items_count: number;
  item_names?: string;
}

interface OrderTrackingProps {
  initialOrderId?: string;
  initialPhone?: string;
  supportPhone?: string;
  whatsappNumber?: string;
}

export function OrderTracking({
  initialOrderId = "",
  initialPhone = "",
  supportPhone = "01942212267",
  whatsappNumber = "01942212267",
}: OrderTrackingProps) {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresPhone, setRequiresPhone] = useState(false);
  const [maskedPhoneHint, setMaskedPhoneHint] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrderData | null>(null);
  const [allOrders, setAllOrders] = useState<OrderSummary[]>([]);
  const [copied, setCopied] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const cleanSupportPhone = supportPhone.startsWith("+88") ? supportPhone : `+88${supportPhone}`;
  const cleanWhatsApp = (whatsappNumber || supportPhone).replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanWhatsApp.startsWith("88") ? cleanWhatsApp : `88${cleanWhatsApp}`}?text=${encodeURIComponent(
    `Hello CanvasBag Support, I would like to check my order #${order?.id || orderIdInput}`
  )}`;

  // Fetch function
  const fetchOrderStatus = useCallback(
    async (idToFetch: string, phoneToFetch: string, isAutoPoll = false) => {
      const cleanId = (idToFetch || "").trim();
      const cleanPhone = (phoneToFetch || "").trim();

      if (!cleanId && !cleanPhone) {
        setError("অনুগ্রহ করে আপনার অর্ডার নাম্বার অথবা মোবাইল নাম্বার লিখুন।");
        return;
      }

      if (!isAutoPoll) {
        setLoading(true);
        setError(null);
      } else {
        setRefreshing(true);
      }

      try {
        const queryParams = new URLSearchParams();
        if (cleanId) queryParams.set("orderId", cleanId);
        if (cleanPhone) queryParams.set("phone", cleanPhone);

        const res = await fetch(`/api/track?${queryParams.toString()}`);
        const data = await res.json();

        if (!res.ok || data.error) {
          if (data.requires_phone) {
            setRequiresPhone(true);
            setMaskedPhoneHint(data.masked_phone || null);
          }
          setError(data.error || "অর্ডারটি খুঁজে পাওয়া যায়নি");
          if (!isAutoPoll) setOrder(null);
          return;
        }

        if (data.requires_phone) {
          setRequiresPhone(true);
          setMaskedPhoneHint(data.masked_phone || null);
          setError(data.message || "নিরাপত্তার স্বার্থে অর্ডারে ব্যবহৃত মোবাইল নাম্বার দিয়ে ভেরিফাই করুন।");
          return;
        }

        if (data.success && data.order) {
          setOrder(data.order);
          setRequiresPhone(false);
          setMaskedPhoneHint(null);
          setError(null);
          setLastRefreshedAt(new Date());

          if (Array.isArray(data.all_orders)) {
            setAllOrders(data.all_orders);
          }

          if (!isAutoPoll) {
            toast.success("অর্ডার স্ট্যাটাস লোড হয়েছে!");
          }
        }
      } catch (err) {
        console.error("Tracking lookup failed:", err);
        if (!isAutoPoll) {
          setError("সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // Auto-fetch on mount if initial params provided
  useEffect(() => {
    if (initialOrderId || initialPhone) {
      fetchOrderStatus(initialOrderId, initialPhone);
    }
  }, [initialOrderId, initialPhone, fetchOrderStatus]);

  // Live Auto-polling (every 25 seconds while an order is actively loaded)
  useEffect(() => {
    if (!order?.id || order.is_cancelled || order.step === 5) return;

    const interval = setInterval(() => {
      fetchOrderStatus(order.id, phoneInput, true);
    }, 25000);

    return () => clearInterval(interval);
  }, [order?.id, order?.is_cancelled, order?.step, phoneInput, fetchOrderStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput.trim() && !phoneInput.trim()) {
      setError("অনুগ্রহ করে আপনার অর্ডার নাম্বার অথবা মোবাইল নাম্বার লিখুন।");
      return;
    }
    fetchOrderStatus(orderIdInput, phoneInput);
  };

  const handleCopyId = () => {
    if (!order?.id) return;
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    toast.success("Order ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Timeline Step Definitions
  const timelineSteps = [
    {
      stepNumber: 1,
      title: "অর্ডার গৃহীত",
      subtitle: "Order Placed",
      desc: "অর্ডারটি সফলভাবে ডাটাবেজে রেকর্ড করা হয়েছে",
      icon: Clock,
    },
    {
      stepNumber: 2,
      title: "অর্ডার নিশ্চিত",
      subtitle: "Confirmed",
      desc: "আমাদের প্রতিনিধি অর্ডারটি যাচাই করেছেন",
      icon: CheckCircle2,
    },
    {
      stepNumber: 3,
      title: "প্যাকিং ও প্রসেসিং",
      subtitle: "Packaging",
      desc: "প্রিমিয়াম কোয়ালিটি চেক শেষে পার্সেল প্রস্তুত",
      icon: Package,
    },
    {
      stepNumber: 4,
      title: "কুরিয়ারে হস্তান্তর",
      subtitle: "In Transit",
      desc: "ডেলিভারি পার্টনারের মাধ্যমে আপনার ঠিকানায় পাঠানো হয়েছে",
      icon: Truck,
    },
    {
      stepNumber: 5,
      title: "ডেলিভারি সম্পন্ন",
      subtitle: "Delivered",
      desc: "গ্রাহকের কাছে পণ্য নিরাপদে পৌঁছে দেওয়া হয়েছে",
      icon: Check,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 font-poppins">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff6b35]/10 border border-[#ff6b35]/20 text-[#ff6b35] text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CanvasBag Bangladesh Live Tracker</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          আপনার অর্ডার ট্র্যাক করুন
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          অর্ডার নাম্বার ও মোবাইল নাম্বার দিয়ে আপনার পার্সেলের সর্বশেষ ডেলিভারি আপডেট জেনে নিন
        </p>
      </div>

      {/* Tracking Search Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-md transition-all">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Phone Number Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  মোবাইল নাম্বার (Phone)
                </label>
                {requiresPhone ? (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    ভেরিফিকেশন আবশ্যক
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    শুধু নাম্বার দিয়েই ট্র্যাক সম্ভব
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="যেমন: 01540400247"
                  className={`w-full h-12 pl-4 pr-10 rounded-2xl border text-sm font-semibold text-slate-900 focus:outline-hidden transition-all shadow-2xs ${
                    requiresPhone
                      ? "border-amber-400 bg-amber-50/30 focus:border-amber-500 focus:bg-white ring-2 ring-amber-400/20"
                      : "border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#ff6b35]"
                  }`}
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
              </div>
            </div>

            {/* Order Number Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  অর্ডার নাম্বার (Order ID)
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  ঐচ্ছিক (যদি থাকে)
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={orderIdInput}
                  onChange={(e) => {
                    setOrderIdInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="যেমন: ORD-309529"
                  className="w-full h-12 pl-4 pr-10 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-900 focus:bg-white focus:border-[#ff6b35] focus:outline-hidden transition-all shadow-2xs font-mono"
                />
                <Package className="w-4 h-4 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Privacy Notice / Phone Hint */}
          {maskedPhoneHint && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center gap-2 text-xs text-amber-800">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                গ্রাহকের গোপনীয়তার স্বার্থে অর্ডারের ফোন নাম্বার (<strong>{maskedPhoneHint}</strong>) প্রদান করে
                ভেরিফাই করুন।
              </span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 font-medium animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>মোবাইল নাম্বার অথবা অর্ডার নাম্বার যেকোনো একটি দিয়ে সার্চ করুন</span>
            </span>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-7 h-12 rounded-2xl bg-primary-gradient text-white font-extrabold text-xs uppercase tracking-wider hover:opacity-95 cursor-pointer shadow-md shadow-[var(--primary)]/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>তথ্য খোঁজা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>অর্ডার ট্র্যাক করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Multiple Orders Selector */}
      {allOrders.length > 1 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#ff6b35]" />
              <h3 className="text-sm font-black text-slate-800">
                আপনার নাম্বারে মোট {allOrders.length}টি অর্ডার পাওয়া গেছে
              </h3>
            </div>
            <span className="text-xs text-slate-400">যে কোনো একটি নির্বাচন করে ট্র্যাক করুন</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {allOrders.map((o) => {
              const isSelected = order?.id === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setOrderIdInput(o.id);
                    fetchOrderStatus(o.id, phoneInput);
                  }}
                  className={`p-3.5 rounded-2xl text-left border transition-all text-xs flex flex-col gap-1.5 cursor-pointer ${
                    isSelected
                      ? "border-[#ff6b35] bg-[#ff6b35]/5 shadow-xs ring-2 ring-[#ff6b35]/20"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-900 font-bold">{o.id}</span>
                    <span className="text-[#ff6b35] font-black">{formatBDT(o.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-medium truncate max-w-[150px]">
                      {o.status_label || o.status}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(o.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TRACKING RESULTS VIEW */}
      {order && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Status Header Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-150">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Order Reference
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Copy Order ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {order.id}
                  </h2>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      order.is_cancelled
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : order.step === 5
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {order.status_label}
                  </span>
                </div>
              </div>

              {/* Live Refresh Badge & Action */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>লাইভ ট্র্যাকিং সক্রিয়</span>
                </div>
                <button
                  type="button"
                  onClick={() => fetchOrderStatus(order.id, phoneInput, true)}
                  disabled={refreshing}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Refresh status now"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#ff6b35]" : ""}`} />
                </button>
              </div>
            </div>

            {/* CANCELLED ORDER BANNER */}
            {order.is_cancelled ? (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 text-left">
                <div className="flex items-center gap-2.5 text-rose-700">
                  <XCircle className="w-5 h-5 shrink-0" />
                  <h3 className="font-black text-sm">অর্ডারটি বাতিল করা হয়েছে (Order Cancelled)</h3>
                </div>
                <p className="text-xs text-rose-600 leading-relaxed font-medium">
                  আপনার এই অর্ডারটি বাতিল তালিকায় রয়েছে। কোনো জিজ্ঞাসা বা ভুলবশত বাতিল হয়ে থাকলে আমাদের
                  সাপোর্ট টিমের সাথে যোগাযোগ করার অনুরোধ করা হচ্ছে।
                </p>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Support</span>
                  </a>
                  <a
                    href={`tel:${cleanSupportPhone}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Support ({supportPhone})</span>
                  </a>
                </div>
              </div>
            ) : (
              /* VISUAL 5-STAGE TIMELINE */
              <div className="py-4">
                <div className="relative">
                  {/* Progress Line */}
                  <div className="hidden sm:block absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-[#ff6b35] to-[#ff6b35] rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(Math.max(((order.step - 1) / 4) * 100, 0), 100)}%`,
                      }}
                    />
                  </div>

                  {/* Stage Points */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2 relative z-10">
                    {timelineSteps.map((step) => {
                      const isCompleted = order.step >= step.stepNumber;
                      const isCurrent = order.step === step.stepNumber;
                      const StepIcon = step.icon;

                      return (
                        <div
                          key={step.stepNumber}
                          className={`flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 p-3 sm:p-2 rounded-2xl transition-all ${
                            isCurrent
                              ? "bg-orange-50/60 border border-orange-200/80 shadow-2xs"
                              : "bg-transparent"
                          }`}
                        >
                          {/* Circle Icon */}
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${
                              isCompleted
                                ? isCurrent
                                  ? "bg-[#ff6b35] border-[#ff6b35] text-white shadow-md shadow-[#ff6b35]/25 ring-4 ring-[#ff6b35]/15"
                                  : "bg-emerald-500 border-emerald-500 text-white shadow-2xs"
                                : "bg-white border-slate-200 text-slate-400"
                            }`}
                          >
                            <StepIcon className="w-5 h-5" />
                          </div>

                          {/* Text Info */}
                          <div className="min-w-0 flex-1 sm:w-full">
                            <span
                              className={`text-xs font-black block truncate ${
                                isCurrent
                                  ? "text-[#ff6b35]"
                                  : isCompleted
                                  ? "text-slate-900"
                                  : "text-slate-400"
                              }`}
                            >
                              {step.title}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {step.subtitle}
                            </span>
                            <p className="text-[10px] text-slate-500 hidden sm:block mt-0.5 leading-tight">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TWO-COLUMN DETAILS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delivery Destination Info */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-2 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-[#ff6b35]" />
                <span>ডেলিভারি গন্তব্য (Shipping Info)</span>
              </div>
              <div className="text-xs space-y-2 text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-400">গ্রাহকের নাম:</span>
                  <span className="font-bold text-slate-800">{order.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">মোবাইল নাম্বার:</span>
                  <span className="font-mono font-bold text-slate-800">{order.customer.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">শহর / জোন:</span>
                  <span className="font-bold text-slate-800">{order.customer.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ডেলিভারি ঠিকানা:</span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]" title={order.customer.address}>
                    {order.customer.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial & Payment Summary */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-2 border-b border-slate-100">
                <CreditCard className="w-4 h-4 text-[#ff6b35]" />
                <span>বিলিং ও পেমেন্ট (Payment Info)</span>
              </div>
              <div className="text-xs space-y-2 text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-400">সাবটোটাল:</span>
                  <span className="font-bold text-slate-800">{formatBDT(order.pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ডেলিভারি চার্জ:</span>
                  <span className="font-bold text-slate-800">
                    {order.pricing.delivery_fee === 0 ? "FREE" : formatBDT(order.pricing.delivery_fee)}
                  </span>
                </div>
                {order.pricing.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>ডিসকাউন্ট:</span>
                    <span className="font-bold">-{formatBDT(order.pricing.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-150">
                  <div>
                    <span className="font-black text-slate-900 text-sm block">সর্বমোট বকেয়া (COD)</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{order.pricing.payment_method}</span>
                  </div>
                  <span className="font-black text-slate-950 text-base font-mono">
                    {formatBDT(order.pricing.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ORDERED ITEMS LIST */}
          {order.items && order.items.length > 0 && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                  <Package className="w-4 h-4 text-[#ff6b35]" />
                  <span>অর্ডারের পণ্যসমূহ ({order.items.length})</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 truncate">{item.name}</p>
                      {item.variant && item.variant !== "Standard" && (
                        <span className="text-[11px] text-slate-400 font-medium">ভ্যারিয়েন্ট: {item.variant}</span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-slate-500 font-semibold mr-3">× {item.quantity}</span>
                      <span className="font-bold text-slate-900">{formatBDT(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NEED HELP / SUPPORT BANNER */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="text-center sm:text-left space-y-1">
              <h3 className="font-black text-sm sm:text-base tracking-tight">
                অর্ডার সম্পর্কিত যেকোনো সহায়তায় আমরা প্রস্তুত
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                ডেলিভারি অ্যাড্রেস পরিবর্তন বা স্পেশাল নোট যোগ করতে সরাসরি কল অথবা হোয়াটসঅ্যাপ করুন
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
              <a
                href={`tel:${cleanSupportPhone}`}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>কল করুন</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
