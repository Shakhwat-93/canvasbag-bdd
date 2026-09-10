"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, CheckCircle, ChevronDown, Zap, Phone, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { LandingPage, Product, SiteSettings } from "@/lib/types";
import { formatBDT, isValidBDPhone } from "@/lib/format";
import { trackClientEvent } from "@/lib/analytics";

interface LandingPageViewProps {
  page: LandingPage;
  products: Product[];
  settings: SiteSettings;
}

export function LandingPageView({ page, products, settings }: LandingPageViewProps) {
  const router = useRouter();

  // Find featured or showcased product
  const components = page.components || [];
  const checkoutComp = components.find((c) => c.type === "checkout");
  const showcaseComp = components.find((c) => c.type === "product_showcase");

  const targetProductId =
    checkoutComp?.settings?.product_id ||
    showcaseComp?.settings?.product_id ||
    products[0]?.id;

  const product = products.find((p) => p.id === targetProductId) || products[0];

  const variants = product?.variants || [];
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const activeVariant = variants[selectedVariantIndex] || null;

  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [shippingZone, setShippingZone] = useState<"Inside Dhaka" | "Outside Dhaka">("Inside Dhaka");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const shippingInsideFee = Number(settings.shippingInsideDhaka) || 70;
  const shippingOutsideFee = Number(settings.shippingOutsideDhaka) || 150;

  // Active prices
  const activePrice = activeVariant?.price || product?.price || 0;
  const subtotal = activePrice * quantity;
  const discount = subtotal >= 3200 ? 250 : 0;
  const isFreeShipping = subtotal >= 2500 && subtotal > 0;
  const deliveryFee = isFreeShipping ? 0 : shippingZone === "Inside Dhaka" ? shippingInsideFee : shippingOutsideFee;
  const total = Math.max(subtotal + deliveryFee - discount, 0);

  // Fire view_item on mount
  useEffect(() => {
    if (product) {
      trackClientEvent("view_item", {
        value: activePrice,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            price: activePrice,
            quantity: 1,
            item_brand: "CanvasBag",
            item_variant: activeVariant ? activeVariant.name : "Standard",
          },
        ],
      });
    }
  }, [product, activePrice, activeVariant]);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidBDPhone(phone)) {
      setPhoneError("সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 01712345678)");
      toast.error("ভুল মোবাইল নাম্বার");
      return;
    }

    setIsSubmitting(true);

    const cartItems = [
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: activePrice,
        variantId: activeVariant?.id || "standard",
        variantName: activeVariant?.name || "Standard",
        image: activeVariant?.image || product.images?.[0] || product.image || "/brand/logo.webp",
        quantity,
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
          note: note.trim(),
          items: cartItems,
        }),
      });

      const data = await res.json();
      if (data.success && data.orderId) {
        toast.success("অর্ডার সফলভাবে সম্পন্ন হয়েছে!");
        router.push(`/order/success/${data.orderId}`);
      } else {
        toast.error(data.error || "অর্ডার প্রক্রিয়া ব্যর্থ হয়েছে।");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Landing page checkout error:", err);
      toast.error("অর্ডার সম্পন্ন করা সম্ভব হয়নি। আবার চেষ্টা করুন।");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-poppins">
      {/* Sticky Minimal Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-150 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-slate-900 uppercase">
              CANVAS<span className="text-[var(--primary)]">BAG</span>
            </span>
          </Link>
          <a
            href="#checkout-section"
            className="bg-primary-gradient text-[var(--primary-foreground)] px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-sm active:scale-95"
          >
            অর্ডার করুন
          </a>
        </div>
      </nav>

      {/* Dynamic Landing Page Components */}
      <div className="flex flex-col w-full">
        {components.map((comp, compIdx) => {
          const { type, settings: compSettings = {} } = comp;

          // 1. HERO SECTION
          if (type === "hero") {
            return (
              <section
                key={compIdx}
                className="relative py-14 md:py-24 overflow-hidden"
                style={{ backgroundColor: compSettings.bg_color || "#F8FAFC" }}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                  <div className="space-y-6 text-left">
                    {compSettings.badge && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs">
                        {compSettings.badge}
                      </span>
                    )}
                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight uppercase">
                      {compSettings.title || "Premium Carry Solutions"}
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg">
                      {compSettings.subtitle || "Minimalist everyday essentials crafted for movement."}
                    </p>
                    <div className="pt-2">
                      <a
                        href="#checkout-section"
                        className="inline-flex items-center gap-2.5 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl text-sm font-extrabold uppercase tracking-wider shadow-lg shadow-red-500/25 transition-all active:scale-[0.98]"
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        {compSettings.cta_text || "অর্ডার করুন (ক্যাশ অন ডেলিভারি)"}
                      </a>
                    </div>
                  </div>

                  {compSettings.image && (
                    <div className="relative flex justify-center aspect-[4/3] max-h-[420px] rounded-3xl overflow-hidden shadow-2xl">
                      <Image
                        src={compSettings.image}
                        alt="Hero Banner"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // 2. PRODUCT SHOWCASE
          if (type === "product_showcase" && product) {
            const rawFirstImg =
              product.images?.[0] || product.image || product.imageUrl || "/brand/logo.webp";
            const firstImg =
              typeof rawFirstImg === "string" ? rawFirstImg : (rawFirstImg as any)?.url || "/brand/logo.webp";

            return (
              <section key={compIdx} className="py-16 bg-white border-y border-slate-150">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="relative aspect-square overflow-hidden bg-slate-50 rounded-3xl border border-slate-200 shadow-sm">
                    <Image
                      src={firstImg}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-6 text-left">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Featured Offer</span>
                    <h2 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">
                      {product.name}
                    </h2>

                    <div className="flex items-baseline gap-4 py-2 border-y border-slate-100">
                      <span className="text-3xl font-black text-slate-900">{formatBDT(product.price)}</span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <>
                          <span className="text-lg text-slate-400 line-through font-bold">
                            {formatBDT(product.compareAtPrice)}
                          </span>
                          <span className="bg-red-50 text-red-600 text-xs px-2.5 py-1 rounded-lg border border-red-200 font-black">
                            SAVE {formatBDT(product.compareAtPrice - product.price)}
                          </span>
                        </>
                      )}
                    </div>

                    {compSettings.benefits && Array.isArray(compSettings.benefits) && (
                      <ul className="space-y-3.5">
                        {compSettings.benefits.map((benefit: string, i: number) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs mt-0.5">
                              ✓
                            </span>
                            <span className="text-sm font-semibold text-slate-700">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="pt-4">
                      <a
                        href="#checkout-section"
                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl text-sm font-extrabold uppercase tracking-wider shadow-lg shadow-red-500/25 transition-all"
                      >
                        আজই অর্ডার করুন
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          // 3. BENEFITS GRID
          if (type === "benefits") {
            const items = compSettings.items || [];
            return (
              <section key={compIdx} className="py-16 bg-slate-50 border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {compSettings.title && (
                    <h2 className="text-2xl sm:text-3xl font-black text-center text-slate-900 uppercase tracking-wider mb-12">
                      {compSettings.title}
                    </h2>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {items.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="bg-white border border-slate-200/80 p-7 rounded-3xl flex flex-col items-center text-center space-y-4 shadow-xs hover:shadow-md transition-all"
                      >
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                            {item.title || "Feature Title"}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed">
                            {item.description || "Detail text explaining why this canvas bag stands out."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 4. TESTIMONIALS / REVIEWS
          if (type === "reviews") {
            const reviewsList = compSettings.reviews || [];
            return (
              <section key={compIdx} className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center max-w-xl mx-auto mb-12">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
                      {compSettings.title || "Customer Love"}
                    </h2>
                    <p className="text-xs font-bold tracking-widest text-[var(--primary)] uppercase mt-1">
                      Verified Ratings & Reviews
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {reviewsList.map((review: any, i: number) => (
                      <div
                        key={i}
                        className="bg-slate-50 border border-slate-200/70 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs"
                      >
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                        <p className="text-xs sm:text-sm font-medium italic text-slate-700 leading-relaxed">
                          &ldquo;{review.text}&rdquo;
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                          <div className="h-9 w-9 rounded-full bg-slate-200 grid place-items-center font-black text-xs text-slate-600 uppercase">
                            {(review.name || "U")[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{review.name || "Verified Customer"}</p>
                            <p className="text-[10px] font-bold text-slate-400">Verified Buyer</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 5. FAQS ACCORDION
          if (type === "faq") {
            const faqs = compSettings.faqs || [];
            return (
              <section key={compIdx} className="py-16 bg-slate-50 border-t border-slate-100">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-center text-slate-900 uppercase tracking-tight mb-10">
                    {compSettings.title || "Frequently Asked Questions"}
                  </h2>
                  <div className="space-y-3.5">
                    {faqs.map((faq: any, idx: number) => (
                      <details
                        key={idx}
                        className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
                      >
                        <summary className="flex justify-between items-center p-5 cursor-pointer font-bold text-slate-900 text-sm select-none">
                          <span>{faq.question}</span>
                          <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-4" />
                        </summary>
                        <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-50 pt-3">
                          {faq.answer}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          // 6. ON-PAGE CHECKOUT BLOCK
          if (type === "checkout" && product) {
            return (
              <section key={compIdx} id="checkout-section" className="py-16 bg-white border-t border-slate-150">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                  <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-2 w-full bg-[var(--primary)]" />

                    <div className="text-center max-w-md mx-auto mb-8">
                      <h2 className="text-xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
                        {compSettings.title || "অর্ডার কনফার্ম করুন"}
                      </h2>
                      <p className="text-xs text-slate-400 font-bold tracking-widest mt-1 uppercase">
                        ক্যাশ অন ডেলিভারি বাংলাদেশ
                      </p>
                    </div>

                    <form onSubmit={handleCheckoutSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 items-start">
                        {/* Left Side: Product Config & Address */}
                        <div className="space-y-5 text-left">
                          {/* Product Brief */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 shadow-xs">
                            <div className="relative h-16 w-16 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
                              <Image
                                src={
                                  activeVariant?.image ||
                                  (typeof product.images?.[0] === "string"
                                    ? product.images[0]
                                    : (product.images?.[0] as any)?.url) ||
                                  product.image ||
                                  "/brand/logo.webp"
                                }
                                alt={product.name}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-black text-slate-900 leading-snug truncate">
                                {product.name}
                              </h4>
                              <p className="text-xs font-bold text-[var(--primary)] mt-1">
                                {formatBDT(activePrice)}
                              </p>
                            </div>
                          </div>

                          {/* Variant Selector */}
                          {variants.length > 1 && (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                সিলেক্ট করুন <span className="text-red-500">*</span>
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                {variants.map((v, idx) => (
                                  <label
                                    key={v.id || idx}
                                    onClick={() => setSelectedVariantIndex(idx)}
                                    className={`border p-3 rounded-xl flex items-center justify-between cursor-pointer select-none transition-all shadow-xs ${
                                      idx === selectedVariantIndex
                                        ? "border-[var(--primary)] ring-1 ring-[var(--primary)] bg-white"
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                    }`}
                                  >
                                    <div className="flex flex-col text-left">
                                      <span className="text-xs font-bold text-slate-800">{v.name}</span>
                                      {v.price && (
                                        <span className="text-[10px] text-slate-400 font-extrabold">
                                          {formatBDT(v.price)}
                                        </span>
                                      )}
                                    </div>
                                    <input
                                      type="radio"
                                      name="lp_variant"
                                      checked={idx === selectedVariantIndex}
                                      onChange={() => setSelectedVariantIndex(idx)}
                                      className="h-4 w-4 text-[var(--primary)]"
                                    />
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quantity Selector */}
                          <div className="flex items-center justify-between bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                              পরিমাণ (Quantity)
                            </span>
                            <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl bg-slate-50 p-1">
                              <button
                                type="button"
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                className="h-7 w-7 rounded-lg bg-white flex items-center justify-center font-black text-slate-700 hover:bg-slate-100 shadow-xs cursor-pointer select-none"
                              >
                                -
                              </button>
                              <span className="text-sm font-black text-slate-900 w-6 text-center">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                                className="h-7 w-7 rounded-lg bg-white flex items-center justify-center font-black text-slate-700 hover:bg-slate-100 shadow-xs cursor-pointer select-none"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Customer Inputs */}
                          <div className="space-y-3.5 pt-1">
                            <div className="grid gap-1">
                              <label className="text-xs font-bold text-slate-650">
                                আপনার নাম <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="নাম লিখুন"
                                className="rounded-xl h-11 px-4 border border-slate-200 focus:outline-none focus:border-[var(--primary)] text-slate-800 text-sm font-medium bg-white"
                              />
                            </div>

                            <div className="grid gap-1">
                              <label className="text-xs font-bold text-slate-650">
                                মোবাইল নাম্বার <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="tel"
                                required
                                maxLength={11}
                                value={phone}
                                onChange={(e) => {
                                  setPhone(e.target.value);
                                  if (phoneError) setPhoneError("");
                                }}
                                placeholder="01XXXXXXXXX"
                                className={`rounded-xl h-11 px-4 border text-slate-800 text-sm font-medium bg-white focus:outline-none ${
                                  phoneError
                                    ? "border-red-500 focus:border-red-500"
                                    : "border-slate-200 focus:border-[var(--primary)]"
                                }`}
                              />
                              {phoneError && (
                                <p className="text-xs text-red-600 flex items-center gap-1 font-semibold mt-0.5">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  {phoneError}
                                </p>
                              )}
                            </div>

                            <div className="grid gap-1">
                              <label className="text-xs font-bold text-slate-650">
                                সম্পূর্ণ ঠিকানা (থানা ও জেলাসহ) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="e.g. বাড়ি নং ১২, রোড ৪, ধানমন্ডি, ঢাকা"
                                className="rounded-xl h-11 px-4 border border-slate-200 focus:outline-none focus:border-[var(--primary)] text-slate-800 text-sm font-medium bg-white"
                              />
                            </div>

                            <div className="grid gap-1">
                              <label className="text-xs font-bold text-slate-650">ডেলিভারি নোট (অপশনাল)</label>
                              <textarea
                                rows={2}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Write any specific instructions..."
                                className="rounded-xl p-3 border border-slate-200 focus:outline-none focus:border-[var(--primary)] text-slate-800 text-sm font-medium bg-white resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Calculation & Submit */}
                        <div className="space-y-4 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs text-left">
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-850 border-b border-slate-100 pb-3">
                            অর্ডার সামারি
                          </h3>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center font-semibold text-slate-600 py-1">
                              <span>সাব-টোটাল</span>
                              <span className="font-bold text-slate-900">{formatBDT(subtotal)}</span>
                            </div>

                            {/* Shipping Radios */}
                            <div className="grid gap-2 py-2">
                              <label
                                onClick={() => setShippingZone("Inside Dhaka")}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all shadow-xs ${
                                  shippingZone === "Inside Dhaka"
                                    ? "border-[var(--primary)] bg-white ring-1 ring-[var(--primary)]"
                                    : "border-slate-200 bg-slate-50"
                                }`}
                              >
                                <div className="text-[10px] font-bold text-slate-600 flex flex-col">
                                  <span>ঢাকার ভিতরে</span>
                                  <span className="text-[var(--primary)] font-black text-xs mt-0.5">
                                    {isFreeShipping ? "FREE" : `${shippingInsideFee} Tk`}
                                  </span>
                                </div>
                                <input
                                  type="radio"
                                  name="lp_zone"
                                  checked={shippingZone === "Inside Dhaka"}
                                  onChange={() => setShippingZone("Inside Dhaka")}
                                  className="h-4 w-4 text-[var(--primary)]"
                                />
                              </label>

                              <label
                                onClick={() => setShippingZone("Outside Dhaka")}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all shadow-xs ${
                                  shippingZone === "Outside Dhaka"
                                    ? "border-[var(--primary)] bg-white ring-1 ring-[var(--primary)]"
                                    : "border-slate-200 bg-slate-50"
                                }`}
                              >
                                <div className="text-[10px] font-bold text-slate-600 flex flex-col">
                                  <span>ঢাকার বাইরে</span>
                                  <span className="text-[var(--primary)] font-black text-xs mt-0.5">
                                    {isFreeShipping ? "FREE" : `${shippingOutsideFee} Tk`}
                                  </span>
                                </div>
                                <input
                                  type="radio"
                                  name="lp_zone"
                                  checked={shippingZone === "Outside Dhaka"}
                                  onChange={() => setShippingZone("Outside Dhaka")}
                                  className="h-4 w-4 text-[var(--primary)]"
                                />
                              </label>
                            </div>

                            {discount > 0 && (
                              <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-xl border border-red-100 text-[10px] font-bold text-red-600 uppercase tracking-wider">
                                <span>ডিসকাউন্ট (৳৩২০০+ অর্ডারে)</span>
                                <span>-250 Tk</span>
                              </div>
                            )}

                            {/* Total Amount */}
                            <div className="flex justify-between items-center py-3.5 px-4 bg-white rounded-xl border-2 border-slate-200 shadow-inner mt-4">
                              <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                                সর্বমোট মূল্য
                              </span>
                              <span className="text-xl font-black text-slate-900 tracking-tight">
                                {formatBDT(total)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                Processing Order...
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4 fill-current animate-pulse" />
                                {compSettings.button_text || "অর্ডার কনফার্ম করুন"}
                              </>
                            )}
                          </button>

                          <p className="text-[10px] font-bold text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                            <Phone className="w-3 h-3 text-[var(--primary)]" />
                            <span>
                              হেল্পলাইন:{" "}
                              <a href="tel:01942212267" className="text-slate-600 hover:underline">
                                01942-212267
                              </a>
                            </span>
                          </p>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </section>
            );
          }

          return null;
        })}
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 border-t border-slate-800 text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <p className="font-extrabold text-slate-200 uppercase tracking-wider">CanvasBag Bangladesh</p>
          <p className="max-w-md mx-auto leading-normal">
            Premium Carry products tailored for minimalist and confident everyday movement. Made in Bangladesh.
          </p>
          <p className="text-[10px] text-slate-500 font-medium flex flex-col sm:flex-row items-center justify-center gap-2">
            <span>© {new Date().getFullYear()} CanvasBag BD. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span>
              Build by{" "}
              <a
                href="https://shakhwatrasel.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--primary)] font-bold transition-colors text-slate-400"
              >
                Shakhwat Hossain Rasel
              </a>
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
