"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Phone,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Flame,
  Lock,
  ArrowRight,
  Package,
  Layers,
  Droplets,
  Feather,
  Check,
  Plus,
  Minus,
  MessageCircle,
  X,
  Clock,
  Briefcase,
  GraduationCap,
  Plane,
  Bike,
  Gift,
  HelpCircle,
  Mail,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import type { LandingPage, Product, SiteSettings } from "@/lib/types";
import { formatBDT, isValidBDPhone } from "@/lib/format";
import { trackClientEvent } from "@/lib/analytics";
import { resolveLandingPageProductData, safeImageSrc } from "@/lib/landing-page-defaults";

interface TemplateProps {
  page: LandingPage;
  products: Product[];
  settings: SiteSettings;
}

export function HighConvertingTemplate({ page, products, settings }: TemplateProps) {
  const router = useRouter();
  const resolved = resolveLandingPageProductData(page, products, settings);

  // Variant & Image Selection
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    resolved.variants[0]?.id || "default"
  );
  const selectedVariant =
    resolved.variants.find((v) => v.id === selectedVariantId) || resolved.variants[0];

  const [activeImage, setActiveImage] = useState<string>(
    selectedVariant?.image || resolved.primaryImage
  );

  useEffect(() => {
    if (selectedVariant?.image) {
      setActiveImage(selectedVariant.image);
    }
  }, [selectedVariantId]);

  // Bundle Selection
  const [selectedBundleId, setSelectedBundleId] = useState<string>(
    resolved.bundles[0]?.id || "bundle-1"
  );
  const selectedBundle =
    resolved.bundles.find((b) => b.id === selectedBundleId) || resolved.bundles[0];

  // Quantity selection (if custom quantity needed or bundle quantity)
  const [quantity, setQuantity] = useState<number>(selectedBundle?.quantity || 1);

  // Sync quantity when bundle changes
  const handleSelectBundle = (bId: string) => {
    setSelectedBundleId(bId);
    const found = resolved.bundles.find((b) => b.id === bId);
    if (found) {
      setQuantity(found.quantity);
    }
  };

  // Live Urgency Countdown Timer (ticks every second)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: resolved.countdownMinutes || 45,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 0, minutes: 30, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [shippingZone, setShippingZone] = useState<"Inside Dhaka" | "Outside Dhaka">("Inside Dhaka");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // Pricing & Calculations
  const unitPrice = selectedVariant?.price || resolved.price || 0;
  const comparePrice = resolved.compareAtPrice || Math.round(unitPrice * 1.35);

  // Bundle calculations
  const bundleEffectivePrice = selectedBundle ? selectedBundle.price : unitPrice * quantity;
  const bundleComparePrice = selectedBundle
    ? selectedBundle.compare_at_price || comparePrice * (selectedBundle.quantity || 1)
    : comparePrice * quantity;

  const discountSavings = bundleComparePrice > bundleEffectivePrice ? bundleComparePrice - bundleEffectivePrice : 0;
  const discountPercent =
    bundleComparePrice > bundleEffectivePrice
      ? Math.round(((bundleComparePrice - bundleEffectivePrice) / bundleComparePrice) * 100)
      : 0;

  const shippingInsideFee = Number(settings.shippingInsideDhaka) || 70;
  const shippingOutsideFee = Number(settings.shippingOutsideDhaka) || 130;

  // Free shipping if bundle grants it or subtotal threshold
  const isFreeShipping = selectedBundle?.free_delivery || bundleEffectivePrice >= 2500;
  const deliveryFee = isFreeShipping
    ? 0
    : shippingZone === "Inside Dhaka"
    ? shippingInsideFee
    : shippingOutsideFee;

  const total = Math.max(bundleEffectivePrice + deliveryFee, 0);

  // FAQ accordion open states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Sticky mobile bottom bar visibility
  const [showMobileBar, setShowMobileBar] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setShowMobileBar(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Tracking: ViewContent strictly once
  const hasTrackedViewRef = useRef(false);
  useEffect(() => {
    if (!hasTrackedViewRef.current) {
      hasTrackedViewRef.current = true;
      trackClientEvent("view_item", {
        value: unitPrice,
        items: [
          {
            item_id: page.product_id || page.slug || page.id,
            item_name: resolved.name,
            price: unitPrice,
            quantity: 1,
            item_brand: "CanvasBag",
            item_variant: selectedVariant?.name || "Standard",
          },
        ],
      });
    }
  }, [unitPrice, page, resolved.name, selectedVariant]);

  // Tracking: InitiateCheckout trigger
  const hasInitiatedRef = useRef(false);
  const triggerInitiateCheckout = () => {
    if (!hasInitiatedRef.current) {
      hasInitiatedRef.current = true;
      trackClientEvent("begin_checkout", {
        value: bundleEffectivePrice,
        items: [
          {
            item_id: page.product_id || page.slug || page.id,
            item_name: resolved.name,
            item_brand: "CanvasBag",
            item_variant: selectedVariant?.name || "Standard",
            price: bundleEffectivePrice,
            quantity: selectedBundle?.quantity || quantity,
          },
        ],
      });
    }
  };

  const handleShippingChange = (zone: "Inside Dhaka" | "Outside Dhaka") => {
    setShippingZone(zone);
    triggerInitiateCheckout();
    trackClientEvent("add_shipping_info", {
      value: bundleEffectivePrice,
      shipping_zone: zone,
      items: [
        {
          item_id: page.product_id || page.slug || page.id,
          item_name: resolved.name,
          item_brand: "CanvasBag",
          item_variant: selectedVariant?.name || "Standard",
          price: bundleEffectivePrice,
          quantity: selectedBundle?.quantity || quantity,
        },
      ],
    });
  };

  const scrollToOrderForm = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    triggerInitiateCheckout();
    const el = document.getElementById("order-form-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidBDPhone(phone)) {
      setPhoneError("সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 01712345678)");
      toast.error("সঠিক মোবাইল নাম্বার দিন");
      return;
    }
    setPhoneError("");

    if (!address.trim() || address.trim().length < 5) {
      toast.error("আপনার বিস্তারিত ঠিকানা লিখুন");
      return;
    }

    setIsSubmitting(true);

    const bundleNote = selectedBundle ? `[প্যাকেজ: ${selectedBundle.title}]` : "";
    const fullNote = [bundleNote, note.trim()].filter(Boolean).join(" - ");

    const cartItems = [
      {
        productId: page.product_id || page.slug || page.id,
        slug: resolved.baseProduct?.slug || page.slug || page.id,
        name: selectedBundle ? `${resolved.name} - ${selectedBundle.title}` : resolved.name,
        price: bundleEffectivePrice,
        variantId: selectedVariant?.id || "standard",
        variantName: selectedVariant?.name || "Standard",
        image: activeImage || resolved.primaryImage,
        quantity: 1, // Full bundle treated as single line item or total price
      },
    ];

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          shipping_zone: shippingZone,
          note: fullNote,
          items: cartItems,
          source: `Landing Page: ${page.title || page.slug || page.id}`,
          lp_slug: page.slug || page.id,
        }),
      });

      const data = await res.json();
      if (data.success && data.orderId) {
        const pendingOrder = {
          orderId: data.orderId,
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          shippingZone,
          subtotal: bundleEffectivePrice,
          deliveryFee,
          discount: 0,
          total: data.total || total,
          items: cartItems,
        };
        try {
          localStorage.setItem("cb_pending_order", JSON.stringify(pendingOrder));
        } catch (err) {
          console.warn("Storage error", err);
        }

        toast.success("অর্ডার সফলভাবে সম্পন্ন হয়েছে!");
        router.push(`/order/success/${data.orderId}`);
      } else {
        toast.error(data.error || "অর্ডার প্রক্রিয়া ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("[Landing Page Checkout Error]", err);
      toast.error("অর্ডার সম্পন্ন করা সম্ভব হয়নি। সংযোগ পরীক্ষা করুন।");
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppOrder = () => {
    const rawWa = resolved.whatsapp || "01942212267";
    const cleanWa = rawWa.replace(/\D/g, "");
    const targetWa = cleanWa.startsWith("88") ? cleanWa : `88${cleanWa}`;

    const bundleText = selectedBundle
      ? `${selectedBundle.title} (${formatBDT(selectedBundle.price)})`
      : `${resolved.name} - ${quantity}টি (${formatBDT(unitPrice * quantity)})`;

    let msg = `আসসালামু আলাইকুম, আমি "${resolved.name}" অর্ডার করতে চাই।\n\n`;
    msg += `📦 প্যাকেজ: ${bundleText}\n`;
    if (selectedVariant && selectedVariant.name !== "Standard") {
      msg += `🎨 ভ্যারিয়েন্ট: ${selectedVariant.name}\n`;
    }
    msg += `🚚 ডেলিভারি এলাকা: ${shippingZone === "Inside Dhaka" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে"}\n`;
    msg += `💰 মোট বিল: ${formatBDT(total)}\n`;

    if (name.trim()) msg += `👤 নাম: ${name.trim()}\n`;
    if (phone.trim()) msg += `📱 মোবাইল: ${phone.trim()}\n`;
    if (address.trim()) msg += `📍 ঠিকানা: ${address.trim()}\n`;
    if (note.trim()) msg += `📝 বিশেষ নির্দেশনা: ${note.trim()}\n`;

    try {
      trackClientEvent("contact", {
        method: "whatsapp",
        value: total,
        currency: "BDT",
      });
    } catch (e) {
      console.warn("Analytics error", e);
    }

    const waUrl = `https://wa.me/${targetWa}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  };

  // Section visibility check
  const isSectionEnabled = (type: string): boolean => {
    if (type === "footer") return false; // Landing pages have no footer
    if (!page.sections || page.sections.length === 0) return true;
    const sec = page.sections.find((s) => s.type === type);
    return sec ? sec.enabled : true;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-sans selection:bg-[#D45266] selection:text-white pb-24 sm:pb-0">
      {/* 1. TOP ANNOUNCEMENT MARQUEE / TICKER */}
      {isSectionEnabled("top_marquee") && (
        <aside aria-label="Announcement" className="bg-[#0e3a22] text-white py-2.5 px-4 text-xs font-semibold overflow-hidden border-b border-emerald-950/40">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap text-[11px] sm:text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-[10px] tracking-wide inline-flex items-center gap-1 shadow-xs">
                <Flame className="w-3 h-3 text-red-600 fill-current" />
                <span>বিশেষ ধামাকা অফার</span>
              </span>
              <span className="text-emerald-100 hidden sm:inline">
                {resolved.marqueeText}
              </span>
            </div>

            <div className="flex items-center gap-4 text-emerald-200">
              <span className="hidden md:inline-flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>পণ্য হাতে পেয়ে চেক করে টাকা দিন</span>
              </span>
              {resolved.phone && (
                <a
                  href={`tel:${resolved.phone}`}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5 font-bold text-white bg-white/10 px-2.5 py-1 rounded-full text-[11px]"
                >
                  <Phone className="w-3 h-3 text-amber-300" />
                  <span>হটলাইন: {resolved.phone}</span>
                </a>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* 2. STICKY TOP NAVBAR */}
      {isSectionEnabled("navbar") && (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src={resolved.logoUrl || "/brand/logo.webp"}
                alt="CanvasBag Logo"
                width={40}
                height={40}
                className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
                unoptimized
              />
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-[#ff6b35] transition-colors leading-none">
                Canvas<span className="text-[#ff6b35]">Bag</span>
              </span>
            </Link>

            <div className="flex items-center gap-3 sm:gap-4">
              {resolved.phone && (
                <a
                  href={`tel:${resolved.phone}`}
                  className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-full transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#ff6b35]" />
                  <span>হটলাইন: {resolved.phone}</span>
                </a>
              )}
              <button
                type="button"
                onClick={scrollToOrderForm}
                className="bg-primary-gradient text-[var(--primary-foreground)] font-bold text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer animate-pulse hover:animate-none"
              >
                <span>অর্ডার করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* 3. HERO SPOTLIGHT & PRODUCT HERO */}
      {isSectionEnabled("hero") && (
        <section className="pt-6 sm:pt-8 pb-6 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto bg-white rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Product Pitch & Buy Box (Left side in reference) */}
              <div className="lg:col-span-6 space-y-5 order-2 lg:order-1">
                <div className="space-y-3">
                  {/* Top Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-800 text-xs font-bold">
                    <Flame className="w-3.5 h-3.5 text-[#D45266]" />
                    <span>{resolved.badge || "অফার শেষ হওয়ার আগেই অর্ডার করুন!"}</span>
                  </div>

                  {/* Gripping Hook Headline */}
                  <h1 className="text-2xl sm:text-3xl md:text-[34px] font-black text-slate-950 leading-snug">
                    {resolved.hookHeadline}
                  </h1>

                  {/* Subheadline Quote Card */}
                  {resolved.quoteHighlight && (
                    <div className="bg-[#F8FAFC] border-l-4 border-emerald-600 p-4 rounded-r-2xl my-2 text-slate-700 text-xs sm:text-sm font-semibold leading-relaxed">
                      {resolved.quoteHighlight}
                    </div>
                  )}

                  {/* Problem-Solution Bullet Points */}
                  <div className="space-y-2 py-1">
                    {resolved.heroBullets && resolved.heroBullets.length > 0 ? (
                      resolved.heroBullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>{bullet}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>১০০% প্রিমিয়াম ও টেকসই ম্যাটেরিয়াল</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>ক্যাশ অন ডেলিভারি — হাতে পেয়ে চেক করে পেমেন্ট</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>দ্রুততম সময়ে সারা দেশে হোম ডেলিভারি নিশ্চয়তা</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Price Display */}
                <div className="bg-[#FAF8F5] rounded-2xl p-4 sm:p-5 border border-amber-200/70 flex flex-wrap items-baseline gap-3 sm:gap-4">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-500">রেগুলার প্রাইজঃ</span>
                    {comparePrice > unitPrice && (
                      <span className="text-base sm:text-lg text-slate-400 line-through font-bold">
                        {formatBDT(comparePrice)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-xs sm:text-sm font-black text-slate-900">অফার প্রাইজঃ</span>
                    <span className="text-2xl sm:text-3xl font-black text-[#D45266]">
                      {formatBDT(unitPrice)}
                    </span>
                  </div>

                  {discountSavings > 0 && (
                    <span className="text-xs font-black text-white bg-[#D45266] px-3 py-1 rounded-full shadow-xs ml-auto">
                      {formatBDT(discountSavings)} ছাড়
                    </span>
                  )}
                </div>

                {/* Guarantee Trust Chip */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{resolved.returnPolicyNotice || "১০০% প্রিমিয়াম ও আসল পণ্য — পছন্দ না হলে সাথে সাথে রিটার্ন করতে পারবেন"}</span>
                </div>

                {/* Big Direct Call to Action Button */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={scrollToOrderForm}
                    className="w-full bg-[#0b6b38] hover:bg-[#08522b] text-white font-black text-base sm:text-lg py-4 px-6 rounded-2xl shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-98 animate-pulse hover:animate-none"
                  >
                    <span>👉 {resolved.ctaText}</span>
                  </button>

                  <p className="text-center text-xs text-slate-500 font-semibold flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{resolved.ctaSubtext}</span>
                  </p>
                </div>
              </div>

              {/* Product Gallery & Stacked Feature Badges (Right side in reference) */}
              <div className="lg:col-span-6 space-y-4 order-1 lg:order-2">
                <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/90 shadow-md group">
                  <Image
                    src={safeImageSrc(activeImage)}
                    alt={resolved.name}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 550px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Floating Badges */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    {discountPercent > 0 && (
                      <span className="bg-[#D45266] text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-md w-max">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-md text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-md border border-slate-200 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#D45266]" />
                    <span>ক্যাশ অন ডেলিভারি</span>
                  </div>
                </div>

                {/* Thumbnails */}
                {resolved.galleryImages.length > 1 && (
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                    {resolved.galleryImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImage(img)}
                        className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                          activeImage === img
                            ? "border-[#D45266] scale-105 shadow-md"
                            : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <Image src={safeImageSrc(img)} alt={`Thumbnail ${idx + 1}`} fill sizes="64px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Stack of 3 Trust Features Under Hero Image */}
                <div className="space-y-2 pt-2">
                  <div className="bg-[#FAF9F6] p-3 rounded-xl border border-slate-200/80 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">১০০% কোয়ালিটি গ্যারান্টি</h4>
                      <p className="text-[11px] text-slate-500 font-medium">প্রিমিয়াম মেটেরিয়াল ও মজবুত ফিনিশিং</p>
                    </div>
                  </div>

                  <div className="bg-[#FAF9F6] p-3 rounded-xl border border-slate-200/80 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-100 text-[#D45266] flex items-center justify-center flex-shrink-0 font-bold">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">দ্রুততম হোম ডেলিভারি</h4>
                      <p className="text-[11px] text-slate-500 font-medium">সারাদেশে ২-৩ দিনের মধ্যে হোম ডেলিভারি</p>
                    </div>
                  </div>

                  <div className="bg-[#FAF9F6] p-3 rounded-xl border border-slate-200/80 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">৭ দিনের রিটার্ন পলিসি</h4>
                      <p className="text-[11px] text-slate-500 font-medium">পছন্দ না হলে কোনো ঝামেলা ছাড়াই পরিবর্তন</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. LIVE URGENCY COUNTDOWN & STOCK BAR */}
      {isSectionEnabled("urgency_timer") && (
        <section className="py-2 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            {/* Countdown Clock */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm animate-bounce">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider block">
                  বিশেষ অফার বাকি মাত্র:
                </span>
                <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-black text-amber-900">
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-300 shadow-xs">
                    {String(timeLeft.hours).padStart(2, "0")} ঘন্টা
                  </span>
                  <span>:</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-300 shadow-xs">
                    {String(timeLeft.minutes).padStart(2, "0")} মিনিট
                  </span>
                  <span>:</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-300 shadow-xs text-red-600">
                    {String(timeLeft.seconds).padStart(2, "0")} সেকেন্ড
                  </span>
                </div>
              </div>
            </div>

            {/* Scarcity meter */}
            <div className="flex items-center gap-3 ml-auto sm:ml-0">
              <div className="text-right">
                <p className="text-xs font-black text-rose-700">
                  স্টক খুব সীমিত (বাকি মাত্র {resolved.stockLeft}টি)
                </p>
                <div className="w-36 sm:w-48 h-2.5 bg-rose-200 rounded-full overflow-hidden mt-1 shadow-inner">
                  <div className="bg-gradient-to-r from-amber-500 to-rose-600 h-full w-4/5 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. PAIN POINTS / PROBLEM AGITATION ("আপনি কি প্রতিদিন এই ধরণের সমস্যার সাথে যুদ্ধ করছেন?") */}
      {isSectionEnabled("pain_points") && resolved.painPoints.length > 0 && (
        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-block relative">
                <h2 className="text-2xl sm:text-3xl font-black text-[#A81C2E] leading-snug">
                  আপনি কি প্রতিদিন এই ধরণের সমস্যাগুলোর সাথে যুদ্ধ করছেন?
                </h2>
                <div className="w-24 h-1 bg-[#A81C2E] mx-auto rounded-full mt-2" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed">
                আমাদের দৈনন্দিন জীবনযাপনে এই সাধারণ সমস্যাগুলো আসলে বড় ধরণের বিরক্তি ও ক্ষতির কারণ হতে পারে:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {resolved.painPoints.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#FFF5F5] border border-[#FED7D7] rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-start space-y-2.5"
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
                    ✕
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-[#9B1C2E] leading-snug">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* CTA Order Button in Pain Points */}
            <div className="text-center pt-3">
              <button
                type="button"
                onClick={scrollToOrderForm}
                className="inline-flex items-center gap-2.5 bg-[#0b6b38] hover:bg-[#08522b] text-white font-black text-sm sm:text-base py-3.5 px-8 rounded-2xl shadow-xl shadow-emerald-950/20 cursor-pointer transition-all active:scale-95 animate-pulse hover:animate-none"
              >
                <span>👉 এখনই ব্যথামুক্ত জীবনের জন্য অর্ডার করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 6. SOLUTION SPOTLIGHT & DIMENSIONAL BREAKDOWN ("কেন আমাদের ব্যাগটি সেরা?") */}
      {isSectionEnabled("solution_spotlight") && (
        <section className="py-10 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Product Dimension/Technical Image */}
              <div className="lg:col-span-6">
                <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group">
                  <Image
                    src={safeImageSrc(resolved.dimensionsImage)}
                    alt="Technical breakdown"
                    fill
                    sizes="(max-width: 768px) 100vw, 550px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">
                    📐 নিখুঁত সাইজ ও পরিমাপ
                  </div>
                </div>
              </div>

              {/* Mint/Emerald Solution Pitch Card */}
              <div className="lg:col-span-6 bg-[#F0FDF4] border border-[#DCFCE7] rounded-3xl p-6 sm:p-8 space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3.5 py-1.5 rounded-full inline-block">
                  কেন আমাদের এই প্রডাক্টটি সেরা?
                </span>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {resolved.solutionTitle}
                </h3>

                <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed">
                  {resolved.solutionDescription}
                </p>

                <div className="space-y-2.5 pt-2">
                  {resolved.solutionPoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-bold text-slate-800">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={scrollToOrderForm}
                    className="bg-[#0b6b38] hover:bg-[#08522b] text-white text-xs sm:text-sm font-black px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>অর্ডার করতে এখানে ক্লিক করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. BENEFITS GRID ("এই প্রডাক্টটি ব্যবহারে আপনি যা পাবেন") */}
      {isSectionEnabled("benefits") && resolved.benefits.length > 0 && (
        <section className="py-10 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {resolved.benefitsTitle || "এই প্রডাক্টটি নিয়মিত ব্যবহারে আপনি যা পাবেন:"}
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                {resolved.benefitsSubtitle || "ব্যথা মুক্ত জীবন ও স্বাভাবিক চলাফেরার জন্য চমৎকার শারীরিক কার্যকারিতা"}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {resolved.benefits.map((b, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all text-center space-y-3"
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#FDF2F4] text-[#D45266] flex items-center justify-center font-black mx-auto">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">{b.title}</h3>
                  {b.description && (
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{b.description}</p>
                  )}
                </div>
              ))}
            </div>

            {/* CTA Order Button in Benefits */}
            <div className="text-center pt-3">
              <button
                type="button"
                onClick={scrollToOrderForm}
                className="inline-flex items-center gap-2.5 bg-[#0b6b38] hover:bg-[#08522b] text-white font-black text-sm sm:text-base py-3.5 px-8 rounded-2xl shadow-xl shadow-emerald-950/20 cursor-pointer transition-all active:scale-95 animate-pulse hover:animate-none"
              >
                <span>👉 অফার মূল্যে এখনই অর্ডার কনফার্ম করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 8. TARGET AUDIENCE ("এটি বিশেষভাবে যাদের জন্য উপযোগী:") */}
      {isSectionEnabled("target_audience") && resolved.targetAudience.length > 0 && (
        <section className="py-10 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-900">
                {resolved.targetAudienceTitle || "এটি বিশেষভাবে যাদের জন্য উপযোগী:"}
              </h2>
              <p className="text-xs text-slate-600 font-semibold">
                {resolved.targetAudienceSubtitle || "আমাদের এই প্রডাক্টটি ডিজাইন করা হয়েছে বিভিন্ন ধরণের সমস্যা সমাধানের জন্য"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {resolved.targetAudience.map((aud, idx) => (
                <div
                  key={idx}
                  className="bg-[#F0FDF4] border border-emerald-100 rounded-2xl p-5 space-y-2.5 text-center sm:text-left hover:shadow-md transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mx-auto sm:mx-0">
                    {idx === 0 && <Briefcase className="w-4 h-4" />}
                    {idx === 1 && <GraduationCap className="w-4 h-4" />}
                    {idx === 2 && <Plane className="w-4 h-4" />}
                    {idx === 3 && <Bike className="w-4 h-4" />}
                    {idx >= 4 && <Gift className="w-4 h-4" />}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 leading-snug">{aud.title}</h3>
                  {aud.description && (
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{aud.description}</p>
                  )}
                </div>
              ))}
            </div>

            {/* CTA Order Button in Target Audience */}
            <div className="text-center pt-3">
              <button
                type="button"
                onClick={scrollToOrderForm}
                className="inline-flex items-center gap-2.5 bg-[#0b6b38] hover:bg-[#08522b] text-white font-black text-sm sm:text-base py-3.5 px-8 rounded-2xl shadow-xl shadow-emerald-950/20 cursor-pointer transition-all active:scale-95"
              >
                <span>👉 আপনার পছন্দের প্যাকেজটি অর্ডার করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 9. REAL PRODUCT PHOTO GALLERY ("আমাদের প্রোডাক্ট গ্যালারি") */}
      {isSectionEnabled("gallery") && resolved.galleryImages.length > 1 && (
        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">আমাদের প্রোডাক্ট গ্যালারি</h2>
              <p className="text-xs text-slate-500 font-semibold">ক্যামেরায় তোলা বাস্তব পণ্যের কিছু রিয়েল ছবি ও ফিনিশিং</p>
            </div>

            {/* 2-column or 3-column Real Authentic Showcase Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {resolved.galleryImages.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-4/3 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/90 shadow-md group"
                >
                  <Image
                    src={safeImageSrc(img)}
                    alt={`Real photo ${idx + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold px-3 py-1 rounded-full shadow-xs">
                    রিয়েল প্রোডাক্ট ফটো #{idx + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Order Button in Gallery */}
            <div className="text-center pt-3">
              <button
                type="button"
                onClick={scrollToOrderForm}
                className="inline-flex items-center gap-2.5 bg-[#0b6b38] hover:bg-[#08522b] text-white font-black text-sm sm:text-base py-3.5 px-8 rounded-2xl shadow-xl shadow-emerald-950/20 cursor-pointer transition-all active:scale-95 animate-pulse hover:animate-none"
              >
                <span>👉 আসল পণ্য হাতে পেতে এখনই অর্ডার করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 10. EMOTIONAL / INSPIRING WARNING BANNER ("একটি কথা মনে রাখবেন...") */}
      {isSectionEnabled("urgent_notice") && resolved.urgentNotice && (
        <section className="py-10 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto bg-[#0B1528] rounded-3xl p-8 sm:p-12 text-center text-white space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-4 py-1.5 rounded-full inline-block border border-amber-400/20">
              বিশেষ বার্তা
            </span>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              {resolved.urgentNotice.title}
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
              {resolved.urgentNotice.message}
            </p>

            <div className="pt-3">
              <button
                type="button"
                onClick={scrollToOrderForm}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm px-8 py-3.5 rounded-xl shadow-lg transition-all cursor-pointer active:scale-95 inline-flex items-center gap-2"
              >
                <span>{resolved.urgentNotice.button_text}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 11. SPECIFICATIONS TABLE */}
      {isSectionEnabled("specs") && resolved.specs.length > 0 && (
        <section className="py-10 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{resolved.specsTitle || "স্পেসিফিকেশন ও বিবরণ"}</h2>
              <p className="text-xs text-slate-500 font-semibold">{resolved.specsSubtitle || "প্রডাক্টের প্রতিটি উপাদান ও পরিমাপের তালিকা"}</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <tbody className="divide-y divide-slate-150">
                  {resolved.specs.map((spec, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-[#FAF9F6]"}>
                      <td className="py-3.5 px-5 sm:px-6 font-bold text-slate-700 w-1/3 border-r border-slate-150">
                        {spec.key}
                      </td>
                      <td className="py-3.5 px-5 sm:px-6 text-slate-900 font-semibold">
                        {spec.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 12. CUSTOMER REVIEWS */}
      {isSectionEnabled("reviews") && resolved.reviews.length > 0 && (
        <section className="py-10 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                কাস্টমারদের মতামত
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                আমাদের সন্তুষ্ট ক্রেতাদের বাস্তব অভিজ্ঞতা
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {resolved.reviews.map((rev, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      {rev.verified && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed italic">
                      &ldquo;{rev.text}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{rev.author}</span>
                    {rev.date && <span className="text-slate-400">{rev.date}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Order Button in Reviews */}
            <div className="text-center pt-3">
              <button
                type="button"
                onClick={scrollToOrderForm}
                className="inline-flex items-center gap-2.5 bg-[#0b6b38] hover:bg-[#08522b] text-white font-black text-sm sm:text-base py-3.5 px-8 rounded-2xl shadow-xl shadow-emerald-950/20 cursor-pointer transition-all active:scale-95 animate-pulse hover:animate-none"
              >
                <span>👉 গ্রাহকদের মতো সেরা রেজাল্ট পেতে এখনই অর্ডার করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 13. FAQ ACCORDION */}
      {isSectionEnabled("faq") && resolved.faqs.length > 0 && (
        <section className="py-10 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">সাধারণ জিজ্ঞাসা (FAQ)</h2>
              <p className="text-xs text-slate-500 font-semibold">আপনার মনের প্রশ্নগুলোর উত্তর জেনে নিন</p>
            </div>

            <div className="space-y-3">
              {resolved.faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full py-4 px-5 text-left font-bold text-slate-900 text-xs sm:text-sm flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#D45266]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 font-medium border-t border-slate-100 leading-relaxed bg-[#FAF8F5]/50">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA Order Button in FAQ */}
            <div className="text-center pt-3">
              <button
                type="button"
                onClick={scrollToOrderForm}
                className="inline-flex items-center gap-2.5 bg-[#0b6b38] hover:bg-[#08522b] text-white font-black text-sm sm:text-base py-3.5 px-8 rounded-2xl shadow-xl shadow-emerald-950/20 cursor-pointer transition-all active:scale-95 animate-pulse hover:animate-none"
              >
                <span>👉 সরাসরি ক্যাশ অন ডেলিভারিতে অর্ডার করতে নিচে ফর্মটি পূরণ করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 14. HIGH-CONVERTING 2-COLUMN CASH ON DELIVERY CHECKOUT FORM */}
      {isSectionEnabled("order_form") && (
        <section id="order-form-section" className="py-14 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl border-2 border-emerald-200 shadow-2xl p-6 sm:p-10 space-y-8 relative overflow-hidden">
              {/* Form Header */}
              <div className="text-center space-y-2 border-b border-slate-150 pb-6">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full inline-block border border-emerald-200">
                  ⚡ ক্যাশ অন ডেলিভারিতে অর্ডার করুন
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  অর্ডার কনফার্ম করতে ফর্মটি পূরণ করুন
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                  অর্ডার করতে নিচের তথ্যগুলো সঠিকভাবে পূরণ করে অর্ডার কনফার্ম করুন
                </p>
              </div>

              <form onSubmit={handleCheckoutSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* LEFT COLUMN: BUNDLE SELECTION, VARIANTS, CUSTOMER INFO (lg:col-span-7) */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Step 1: Bundle Selection Cards */}
                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">১</span>
                        <span>অফার বা প্যাকেজ সিলেক্ট করুন:</span>
                      </label>

                      <div className="space-y-2.5">
                        {resolved.bundles.map((bundle) => {
                          const isSelected = selectedBundleId === bundle.id;
                          return (
                            <button
                              key={bundle.id}
                              type="button"
                              onClick={() => handleSelectBundle(bundle.id)}
                              className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex items-center justify-between gap-3 ${
                                isSelected
                                  ? "border-emerald-600 bg-emerald-50/60 shadow-sm ring-2 ring-emerald-600"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"
                                  }`}
                                >
                                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs sm:text-sm font-black text-slate-900 truncate">
                                      {bundle.title}
                                    </p>
                                    {bundle.is_popular && (
                                      <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                                        বেস্ট ভ্যালু
                                      </span>
                                    )}
                                  </div>
                                  {bundle.subtitle && (
                                    <p className="text-[11px] text-slate-500 font-semibold">{bundle.subtitle}</p>
                                  )}
                                </div>
                              </div>

                              <div className="text-right flex-shrink-0">
                                <p className="text-sm sm:text-base font-black text-emerald-800">
                                  {formatBDT(bundle.price)}
                                </p>
                                {bundle.compare_at_price && bundle.compare_at_price > bundle.price && (
                                  <p className="text-[11px] text-slate-400 line-through font-semibold">
                                    {formatBDT(bundle.compare_at_price)}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Variant Selection */}
                    {resolved.variants.length > 1 && (
                      <div className="space-y-3 pt-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">২</span>
                          <span>কালার বা মডেল নির্বাচন করুন:</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {resolved.variants.map((v) => {
                            const isSelected = selectedVariantId === v.id;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => setSelectedVariantId(v.id)}
                                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                                  isSelected
                                    ? "border-emerald-600 bg-emerald-50 text-slate-900 shadow-sm ring-2 ring-emerald-600"
                                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                                }`}
                              >
                                {v.image && (
                                  <div className="relative w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                                    <Image src={safeImageSrc(v.image)} alt={v.name} fill sizes="36px" className="object-cover" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold truncate">{v.name}</p>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Customer Information Fields */}
                    <div className="space-y-4 pt-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">৩</span>
                        <span>আপনার ডেলিভারি তথ্য দিন:</span>
                      </label>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">আপনার নাম *</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="সম্পূর্ণ নাম লিখুন"
                          className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নাম্বার *</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (phoneError) setPhoneError("");
                          }}
                          placeholder="01XXXXXXXXX"
                          className={`w-full h-12 px-4 rounded-xl border text-sm font-semibold outline-none transition-all bg-slate-50/50 ${
                            phoneError
                              ? "border-red-500 focus:ring-2 focus:ring-red-100"
                              : "border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                          }`}
                        />
                        {phoneError && <p className="text-xs text-red-500 font-semibold mt-1">{phoneError}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">সম্পূর্ণ ঠিকানা *</label>
                        <textarea
                          required
                          rows={3}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="বাসা নং, রোড নং, এলাকা, থানা ও জেলা লিখুন"
                          className="w-full p-4 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all bg-slate-50/50 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">ডেলিভারি এলাকা *</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => handleShippingChange("Inside Dhaka")}
                            className={`p-3 rounded-xl border text-left text-xs font-bold cursor-pointer transition-all ${
                              shippingZone === "Inside Dhaka"
                                ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black ring-1 ring-emerald-600"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <p>ঢাকার ভেতরে</p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {isFreeShipping ? "ফ্রি ডেলিভারি" : `৳${shippingInsideFee}`}
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShippingChange("Outside Dhaka")}
                            className={`p-3 rounded-xl border text-left text-xs font-bold cursor-pointer transition-all ${
                              shippingZone === "Outside Dhaka"
                                ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black ring-1 ring-emerald-600"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <p>ঢাকার বাইরে</p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {isFreeShipping ? "ফ্রি ডেলিভারি" : `৳${shippingOutsideFee}`}
                            </p>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">স্পেশাল কোনো নির্দেশনা (অপশনাল)</label>
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="ডেলিভারির সময় বা বিশেষ কোনো অনুরোধ থাকলে লিখুন"
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-emerald-600 bg-slate-50/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: "YOUR ORDER" SUMMARY BOX (lg:col-span-5) */}
                  <div className="lg:col-span-5 lg:sticky lg:top-24">
                    <div className="bg-[#FAF9F6] rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-5 shadow-sm">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 border-b border-slate-200 pb-3">
                        Your Order (আপনার অর্ডার)
                      </h3>

                      {/* Product Preview Card */}
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0">
                          <Image
                            src={safeImageSrc(activeImage)}
                            alt={resolved.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-slate-900 truncate">
                            {resolved.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-semibold truncate">
                            {selectedBundle ? selectedBundle.title : `কালার: ${selectedVariant?.name || "Standard"}`}
                          </p>
                          <p className="text-xs font-black text-emerald-800 mt-0.5">
                            {formatBDT(bundleEffectivePrice)}
                          </p>
                        </div>
                      </div>

                      {/* Calculations breakdown */}
                      <div className="space-y-2 text-xs font-semibold text-slate-600">
                        <div className="flex justify-between items-center">
                          <span>পণ্য মূল্য (Subtotal):</span>
                          <span className="font-bold text-slate-900">{formatBDT(bundleEffectivePrice)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span>ডেলিভারি চার্জ:</span>
                          <span className={`font-bold ${deliveryFee === 0 ? "text-emerald-700" : "text-slate-900"}`}>
                            {deliveryFee === 0 ? "ফ্রি (Free)" : formatBDT(deliveryFee)}
                          </span>
                        </div>

                        {discountSavings > 0 && (
                          <div className="flex justify-between items-center text-emerald-700">
                            <span>বিশেষ ডিসকাউন্ট:</span>
                            <span className="font-bold">-{formatBDT(discountSavings)}</span>
                          </div>
                        )}
                      </div>

                      {/* Total */}
                      <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                        <span className="text-sm font-black text-slate-900">সর্বমোট (Total):</span>
                        <span className="text-2xl font-black text-emerald-800">
                          {formatBDT(total)}
                        </span>
                      </div>

                      {/* Big Order Confirmation Buttons */}
                      <div className="space-y-2.5 pt-2">
                        {/* Primary Web COD Button */}
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-[#0b6b38] hover:bg-[#08522b] text-white font-black text-sm sm:text-base py-3.5 sm:py-4 rounded-xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>অর্ডার প্রসেস হচ্ছে...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5" />
                              <span>অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)</span>
                            </>
                          )}
                        </button>

                        {/* WhatsApp Order Button */}
                        <button
                          type="button"
                          onClick={handleWhatsAppOrder}
                          className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-sm sm:text-base py-3.5 sm:py-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-98"
                        >
                          <MessageCircle className="w-5 h-5 fill-white" />
                          <span>হোয়াটসঅ্যাপে অর্ডার করতে চাই</span>
                        </button>
                      </div>

                      {/* Security Trust Note Under Button */}
                      <p className="text-center text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1.5 pt-1">
                        <Lock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>কোনো অগ্রিম পেমেন্ট নেই • পণ্য হাতে পেয়ে দেখে টাকা দিন</span>
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* 16. STICKY BOTTOM MOBILE ORDER BAR */}
      {showMobileBar && (
        <aside aria-label="Quick Order" className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:hidden shadow-2xl flex items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
              <Image src={safeImageSrc(activeImage)} alt={resolved.name} fill sizes="44px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-600 truncate">{resolved.name}</p>
              <p className="text-sm font-black text-emerald-800">{formatBDT(total)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={scrollToOrderForm}
            className="bg-[#0b6b38] text-white text-xs font-black py-3 px-5 rounded-xl shadow-md flex items-center gap-1.5 flex-shrink-0 active:scale-95 cursor-pointer"
          >
            <span>অর্ডার করুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* 17. FLOATING WHATSAPP & HOTLINE QUICK CONTACT WIDGET */}
      <aside aria-label="Customer Support" className={`fixed z-40 transition-all ${showMobileBar ? "bottom-20 right-4 sm:bottom-6 sm:right-6" : "bottom-6 right-6"}`}>
        <a
          href={`https://wa.me/88${resolved.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`আসসালামু আলাইকুম, আমি CanvasBag থেকে "${resolved.name}" সম্পর্কে জানতে চাই।`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all group font-bold text-xs cursor-pointer border-2 border-white"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
          <span className="hidden sm:inline font-bold">হোয়াটসঅ্যাপে চ্যাট করুন</span>
          <span className="sm:hidden font-bold">WhatsApp</span>
        </a>
      </aside>
    </div>
  );
}
