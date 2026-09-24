"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  CheckCircle,
  Phone,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Lock,
  ArrowRight,
  Package,
  Check,
  Plus,
  Minus,
  Mail,
  MapPin,
  MessageCircle,
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

export function LuxuryMinimalTemplate({ page, products, settings }: TemplateProps) {
  const router = useRouter();
  const resolved = resolveLandingPageProductData(page, products, settings);

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    resolved.variants[0]?.id || "default"
  );
  const selectedVariant =
    resolved.variants.find((v) => v.id === selectedVariantId) || resolved.variants[0];

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>(
    selectedVariant?.image || resolved.primaryImage
  );

  useEffect(() => {
    if (selectedVariant?.image) {
      setActiveImage(selectedVariant.image);
    }
  }, [selectedVariantId]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [shippingZone, setShippingZone] = useState<"Inside Dhaka" | "Outside Dhaka">("Inside Dhaka");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const unitPrice = selectedVariant?.price || resolved.price || 0;
  const comparePrice = resolved.compareAtPrice || Math.round(unitPrice * 1.3);
  const subtotal = unitPrice * quantity;

  const shippingInsideFee = Number(settings.shippingInsideDhaka) || 70;
  const shippingOutsideFee = Number(settings.shippingOutsideDhaka) || 150;
  const isFreeShipping = subtotal >= 2500 && subtotal > 0;
  const deliveryFee = isFreeShipping ? 0 : shippingZone === "Inside Dhaka" ? shippingInsideFee : shippingOutsideFee;
  const total = Math.max(subtotal + deliveryFee, 0);

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

  const scrollToOrder = () => {
    const el = document.getElementById("order-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");

    // If pasted with 88 or +88 prefix (e.g. 88017... -> 017...)
    if (raw.startsWith("8801")) {
      raw = raw.slice(2);
    }

    // Auto-prepend 0 if user types 1... (e.g. 17... -> 017...)
    if (raw.startsWith("1") && raw.length <= 10) {
      raw = "0" + raw;
    }

    // Strictly enforce starting with 01
    if (raw.length === 1 && raw !== "0") {
      raw = "0";
    }
    if (raw.length >= 2 && !raw.startsWith("01")) {
      raw = "01" + raw.replace(/^0+/, "").replace(/^1+/, "");
    }

    // Never allow more than 11 digits
    const cleaned = raw.slice(0, 11);
    setPhone(cleaned);

    if (cleaned.length === 11) {
      if (/^01[3-9]\d{8}$/.test(cleaned)) {
        setPhoneError("");
      } else {
        setPhoneError("সঠিক বাংলাদেশি মোবাইল অপারেটর নাম্বার দিন (যেমন: 01712345678)");
      }
    } else if (cleaned.length > 0) {
      setPhoneError(`১১ ডিজিটের মোবাইল নাম্বার দিন (বাকি ${11 - cleaned.length} ডিজিট)`);
    } else {
      setPhoneError("");
    }
  };

  const handlePhoneBlur = () => {
    if (!phone) {
      setPhoneError("মোবাইল নাম্বার আবশ্যক");
    } else if (!isValidBDPhone(phone)) {
      setPhoneError("মোবাইল নাম্বারটি অবশ্যই ০১ দিয়ে শুরু হওয়া ১১ ডিজিটের নাম্বার হতে হবে (যেমন: 01712345678)");
    } else {
      setPhoneError("");
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidBDPhone(phone)) {
      setPhoneError("মোবাইল নাম্বারটি অবশ্যই ০১ দিয়ে শুরু হওয়া ১১ ডিজিটের নাম্বার হতে হবে (যেমন: 01712345678)");
      toast.error("সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন");
      return;
    }
    setPhoneError("");

    if (!address.trim() || address.trim().length < 5) {
      toast.error("আপনার সম্পূর্ণ ঠিকানা দিন");
      return;
    }

    setIsSubmitting(true);
    // Clean short name for Database Orders & Invoices (e.g. "Leg strech")
    const cleanDbName =
      resolved.db_product_name ||
      (page.slug?.includes("flexpro") || page.id?.includes("flexpro")
        ? "Leg strech"
        : resolved.name.split(/[—–\-|]/)[0]?.trim() || resolved.name);

    const cartItems = [
      {
        productId: page.product_id || page.slug || page.id,
        slug: resolved.baseProduct?.slug || page.slug || page.id,
        name: cleanDbName,
        db_product_name: cleanDbName,
        price: unitPrice,
        variantId: selectedVariant?.id || "standard",
        variantName: selectedVariant?.name || "Standard",
        image: activeImage || resolved.primaryImage,
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
          delivery_fee: deliveryFee,
          db_product_name: cleanDbName,
          note: note.trim(),
          items: cartItems,
          source: `Landing Page: ${page.title || page.slug || page.id}`,
          lp_slug: page.slug || page.id,
        }),
      });

      const data = await res.json();
      if (data.success && data.orderId) {
        try {
          localStorage.setItem(
            "cb_pending_order",
            JSON.stringify({
              orderId: data.orderId,
              name: name.trim(),
              phone: phone.trim(),
              address: address.trim(),
              shippingZone,
              subtotal: unitPrice * quantity,
              deliveryFee,
              discount: 0,
              total: data.total || total,
              items: cartItems,
            })
          );
        } catch (storageErr) {
          console.warn("Storage write error", storageErr);
        }

        toast.success("অর্ডার সফলভাবে সম্পন্ন হয়েছে!");
        router.push(`/order/success/${data.orderId}`);
      } else {
        toast.error(data.error || "অর্ডার প্রক্রিয়া ব্যর্থ হয়েছে।");
        setIsSubmitting(false);
      }
    } catch {
      toast.error("অর্ডার সম্পন্ন করা সম্ভব হয়নি।");
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppOrder = () => {
    const rawWa = resolved.whatsapp || "01942212267";
    const cleanWa = rawWa.replace(/\D/g, "");
    const targetWa = cleanWa.startsWith("88") ? cleanWa : `88${cleanWa}`;

    let msg = `আসসালামু আলাইকুম, আমি "${resolved.name}" অর্ডার করতে চাই।\n\n`;
    if (selectedVariant && selectedVariant.name !== "Standard") {
      msg += `🎨 ভ্যারিয়েন্ট: ${selectedVariant.name}\n`;
    }
    msg += `🔢 পরিমাণ: ${quantity}টি\n`;
    msg += `🚚 ডেলিভারি এলাকা: ${shippingZone === "Inside Dhaka" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে"}\n`;
    msg += `💰 মোট বিল: ${formatBDT(total)}\n`;

    if (name.trim()) msg += `👤 নাম: ${name.trim()}\n`;
    if (phone.trim()) msg += `📱 মোবাইল: ${phone.trim()}\n`;
    if (address.trim()) msg += `📍 ঠিকানা: ${address.trim()}\n`;

    const waUrl = `https://wa.me/${targetWa}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-slate-900 selection:text-white">
      {/* Navigation */}
      <header className="border-b border-slate-100 py-4 px-6 sticky top-0 bg-white/90 backdrop-blur-md z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <Image
              src={resolved.logoUrl || "/brand/logo.webp"}
              alt="CanvasBag Logo"
              width={38}
              height={38}
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
              unoptimized
            />
            <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-[#ff6b35] transition-colors leading-none">
              Canvas<span className="text-[#ff6b35]">Bag</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {resolved.phone && (
              <a
                href={`tel:${resolved.phone}`}
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-full transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#ff6b35]" />
                <span>{resolved.phone}</span>
              </a>
            )}
            <button
              type="button"
              onClick={scrollToOrder}
              className="bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
            >
              অর্ডার করুন
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D45266]">
              Exclusive Edition
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              {resolved.headline}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              {resolved.subheadline}
            </p>
            <div className="flex items-baseline gap-4 pt-2">
              <span className="text-4xl font-black text-slate-950">{formatBDT(unitPrice)}</span>
              {comparePrice > unitPrice && (
                <span className="text-xl text-slate-400 line-through font-medium">
                  {formatBDT(comparePrice)}
                </span>
              )}
            </div>
            <div className="pt-4 flex items-center gap-4">
              <button
                type="button"
                onClick={scrollToOrder}
                className="bg-black text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider hover:bg-slate-800 shadow-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <span>অর্ডার নিশ্চিত করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="relative aspect-4/5 w-full rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 shadow-2xl">
              <Image src={safeImageSrc(activeImage)} alt={resolved.name} fill priority sizes="500px" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      {resolved.benefits.length > 0 && (
        <section className="py-16 bg-slate-50 px-6 border-y border-slate-100">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {resolved.benefits.map((b, i) => (
              <div key={i} className="space-y-3">
                <span className="text-xs font-black text-[#D45266]">0{i + 1}</span>
                <h3 className="text-lg font-black text-slate-950">{b.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Order Section */}
      <section id="order-section" className="py-20 px-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">অর্ডার কনফার্ম করুন</h2>
            <p className="text-xs text-slate-500 font-medium">ক্যাশ অন ডেলিভারি • দেখে মূল্য পরিশোধের সুবিধা</p>
          </div>

          <form onSubmit={handleCheckoutSubmit} className="space-y-6">
            {resolved.variants.length > 1 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">কালার নির্বাচন করুন:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {resolved.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        selectedVariantId === v.id
                          ? "border-black bg-black text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">আপনার নাম *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="আপনার নাম"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-black"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">মোবাইল নাম্বার *</label>
                  <span className={`text-[11px] font-bold ${
                    phone.length === 11 && isValidBDPhone(phone)
                      ? "text-emerald-600"
                      : phone.length > 0
                      ? "text-amber-600"
                      : "text-slate-400"
                  }`}>
                    {phone.length}/11 ডিজিট {phone.length === 11 && isValidBDPhone(phone) ? "✓" : ""}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={11}
                    value={phone}
                    onChange={handlePhoneChange}
                    onBlur={handlePhoneBlur}
                    placeholder="01XXXXXXXXX (১১ ডিজিট)"
                    className={`w-full h-12 px-4 pr-10 rounded-xl border text-sm font-semibold outline-none transition-colors ${
                      phoneError
                        ? "border-red-500 focus:border-red-500"
                        : phone.length === 11 && isValidBDPhone(phone)
                        ? "border-emerald-500 focus:border-emerald-500"
                        : "border-slate-200 focus:border-black"
                    }`}
                  />
                  {phone.length === 11 && isValidBDPhone(phone) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      <span>সঠিক</span>
                    </div>
                  )}
                </div>
                {phoneError ? (
                  <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {phoneError}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    ০১ দিয়ে শুরু হওয়া সঠিক ১১ ডিজিটের নাম্বার দিন
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ডেলিভারি ঠিকানা *</label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="বাসা, রোড, এলাকা, জেলা"
                  className="w-full p-4 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-black resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ডেলিভারি এলাকা *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShippingZone("Inside Dhaka")}
                    className={`p-3 rounded-xl border text-left text-xs font-bold cursor-pointer ${
                      shippingZone === "Inside Dhaka" ? "border-black bg-slate-900 text-white" : "border-slate-200 text-slate-700"
                    }`}
                  >
                    ঢাকার ভেতরে (৳{shippingInsideFee})
                  </button>
                  <button
                    type="button"
                    onClick={() => setShippingZone("Outside Dhaka")}
                    className={`p-3 rounded-xl border text-left text-xs font-bold cursor-pointer ${
                      shippingZone === "Outside Dhaka" ? "border-black bg-slate-900 text-white" : "border-slate-200 text-slate-700"
                    }`}
                  >
                    ঢাকার বাইরে (৳{shippingOutsideFee})
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-baseline font-bold text-sm">
              <span>মোট প্রদেয়:</span>
              <span className="text-2xl font-black text-slate-950">{formatBDT(total)}</span>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white font-black text-base py-4 rounded-2xl hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)</span>}
              </button>

              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="w-full bg-[#25D366] text-white font-black text-base py-3.5 rounded-2xl hover:bg-[#20ba59] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>হোয়াটসঅ্যাপে অর্ডার করতে চাই</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Floating WhatsApp Quick Contact Button */}
      <aside aria-label="Customer Support" className="fixed bottom-6 right-6 z-40">
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
