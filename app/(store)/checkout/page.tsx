"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingBag, Minus, Plus, Trash2, Zap, Phone, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import { formatBDT, isValidBDPhone } from "@/lib/format";
import { trackClientEvent } from "@/lib/analytics";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [shippingZone, setShippingZone] = useState<"Inside Dhaka" | "Outside Dhaka">("Inside Dhaka");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const shippingInsideFee = 70;
  const shippingOutsideFee = 150;

  // Calculation rules
  const discount = subtotal >= 3200 ? 250 : 0;
  const isFreeShipping = subtotal >= 2500 && subtotal > 0;
  const deliveryFee = isFreeShipping ? 0 : shippingZone === "Inside Dhaka" ? shippingInsideFee : shippingOutsideFee;
  const total = Math.max(subtotal + deliveryFee - discount, 0);

  // Trigger begin_checkout on mount
  useEffect(() => {
    if (items.length > 0) {
      trackClientEvent("begin_checkout", {
        value: subtotal,
        items: items.map((item) => ({
          item_id: item.productId,
          item_name: item.name,
          item_brand: "CanvasBag",
          item_variant: item.variantName || "Standard",
          price: item.price,
          quantity: item.quantity,
        })),
      });
    }
  }, [items, subtotal]);

  // Handle shipping zone change
  const handleShippingChange = (zone: "Inside Dhaka" | "Outside Dhaka") => {
    setShippingZone(zone);
    trackClientEvent("add_shipping_info", {
      value: subtotal,
      shipping_zone: zone,
      items: items.map((item) => ({
        item_id: item.productId,
        item_name: item.name,
        item_brand: "CanvasBag",
        item_variant: item.variantName || "Standard",
        price: item.price,
        quantity: item.quantity,
      })),
    });
  };

  const handlePhoneBlur = () => {
    if (phone && !isValidBDPhone(phone)) {
      setPhoneError("মোবাইল নাম্বারটি অবশ্যই ০১ দিয়ে শুরু হওয়া ১১ ডিজিটের নাম্বার হতে হবে (যেমন: 01712345678)।");
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("আপনার কার্ট খালি। প্রোডাক্ট যোগ করুন।");
      return;
    }

    if (!isValidBDPhone(phone)) {
      setPhoneError("সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 01712345678)");
      toast.error("ভুল মোবাইল নাম্বার");
      return;
    }

    setIsSubmitting(true);

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
          items,
        }),
      });

      const data = await res.json();

      if (data.success && data.orderId) {
        // Save pending order details in localStorage for client-side Pixel/GA4 attribution on success page
        const pendingOrder = {
          orderId: data.orderId,
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          shippingZone,
          subtotal,
          deliveryFee,
          discount,
          total: data.total || total,
          items,
        };
        try {
          localStorage.setItem("cb_pending_order", JSON.stringify(pendingOrder));
        } catch (err) {
          console.warn("Storage write error", err);
        }

        toast.success("অর্ডার সফলভাবে সম্পন্ন হয়েছে!");
        router.push(`/order/success/${data.orderId}`);
      } else {
        toast.error(data.error || "অর্ডার সম্পন্ন করা সম্ভব হয়নি।");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Order submission error:", err);
      toast.error("অর্ডার প্রক্রিয়া ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen text-slate-800 pb-16">
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="flex flex-col items-center justify-center space-y-4 bg-white border border-slate-200/60 rounded-3xl p-8 shadow-xs">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-50 border border-slate-100">
              <ShoppingBag className="w-8 h-8 text-slate-400 stroke-1" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
              <p className="text-xs text-slate-500">Please add products to your cart before proceeding to checkout.</p>
            </div>
            <Link
              href="/shop"
              className="bg-primary-gradient text-[var(--primary-foreground)] rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-wider shadow-sm hover:opacity-90 transition-all"
            >
              Go to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fafaf9] min-h-screen text-slate-800 pb-16 font-sans">
      {/* Title / Header */}
      <div className="bg-white border-b border-[#e5e7eb] py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)
          </h1>
          <p className="text-xs text-[#ff6b35] font-bold tracking-wider mt-1">
            পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করুন
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 sm:gap-8 items-start">
            {/* Left Column: Billing & Shipping */}
            <div className="w-full flex flex-col gap-6">
              <section className="rounded-3xl border border-[#e5e7eb] bg-white p-5 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-4">
                  <h2 className="text-base font-bold text-slate-900">
                    ডেলিভারি তথ্য
                  </h2>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    ক্যাশ অন ডেলিভারি (COD)
                  </span>
                </div>

                <div className="grid gap-5">
                  <div className="grid gap-2">
                    <label htmlFor="name" className="text-xs font-bold text-slate-700">
                      আপনার নাম লিখুন <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. হাসান মাহমুদ"
                      className="rounded-xl h-11 px-4 border-2 border-[#e5e7eb] focus:outline-none focus:border-[#ff6b35] text-slate-900 text-sm font-medium bg-white transition-colors"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="address" className="text-xs font-bold text-slate-700">
                      আপনার ঠিকানা (বাসা নং, রোড, এলাকা, থানা, জেলা) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. বাড়ি ১২, রোড ৪, ধানমন্ডি, ঢাকা"
                      className="rounded-xl h-11 px-4 border-2 border-[#e5e7eb] focus:outline-none focus:border-[#ff6b35] text-slate-900 text-sm font-medium bg-white transition-colors"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="phone" className="text-xs font-bold text-slate-700">
                      মোবাইল নাম্বার <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      maxLength={11}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (phoneError) setPhoneError("");
                      }}
                      onBlur={handlePhoneBlur}
                      placeholder="01XXXXXXXXX"
                      className={`rounded-xl h-11 px-4 border-2 focus:outline-none text-slate-900 text-sm font-medium bg-white transition-colors ${
                        phoneError
                          ? "border-red-500 focus:border-red-500"
                          : "border-[#e5e7eb] focus:border-[#ff6b35]"
                      }`}
                    />
                    {phoneError && (
                      <p className="text-xs text-red-600 flex items-center gap-1 font-semibold mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {phoneError}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="note" className="text-xs font-bold text-slate-700">
                      অর্ডার নোট (অপশনাল)
                    </label>
                    <textarea
                      id="note"
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="ডেলিভারি সংক্রান্ত কোনো বিশেষ নির্দেশনা থাকলে লিখুন..."
                      className="rounded-xl p-3 border-2 border-[#e5e7eb] focus:outline-none focus:border-[#ff6b35] text-slate-900 text-sm font-medium bg-white resize-none transition-colors"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Order Summary & Place Order */}
            <aside className="w-full h-fit rounded-3xl border border-[#e5e7eb] bg-white p-5 sm:p-6 shadow-xs space-y-5">
              <h2 className="font-bold text-slate-900 text-base border-b border-[#e5e7eb] pb-3">
                আপনার অর্ডার
              </h2>

              {/* Items List */}
              <div className="divide-y divide-[#e5e7eb] max-h-64 overflow-y-auto pr-1 no-scrollbar">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 py-3 relative">
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden shrink-0 border border-[#e5e7eb] bg-[#f8f9fa] flex items-center justify-center">
                      <Image
                        src={item.image || "/brand/logo.webp"}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-contain p-0.5"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                        {item.name}
                      </p>
                      {item.variantName && item.variantName !== "Standard" && (
                        <p className="text-[11px] text-slate-500 font-medium">{item.variantName}</p>
                      )}
                      {/* Quantity adjuster */}
                      <div className="flex items-center gap-1 border border-[#e5e7eb] rounded-lg bg-white p-0.5 mt-1.5 w-fit">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.productId, item.variantId, item.quantity - 1);
                            } else {
                              removeItem(item.productId, item.variantId);
                            }
                          }}
                          className="h-5 w-5 rounded-md bg-[#f8f9fa] flex items-center justify-center font-extrabold text-slate-700 hover:bg-slate-100 text-xs shadow-xs cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-slate-900 w-5 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          className="h-5 w-5 rounded-md bg-[#f8f9fa] flex items-center justify-center font-extrabold text-slate-700 hover:bg-slate-100 text-xs shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 bg-[#f8f9fa] border border-[#e5e7eb] px-2 py-0.5 rounded-lg">
                        {formatBDT(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal & Shipping Zone Radios */}
              <div className="space-y-3.5 pt-2">
                <div className="flex justify-between items-center py-2.5 px-3.5 bg-[#f8f9fa] rounded-2xl border border-[#e5e7eb]">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">সাবটোটাল</span>
                  <span className="font-bold text-slate-900 text-sm">{formatBDT(subtotal)}</span>
                </div>

                {/* Shipping zone selector */}
                <div className="grid gap-2.5">
                  <label
                    onClick={() => handleShippingChange("Inside Dhaka")}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer select-none transition-all ${
                      shippingZone === "Inside Dhaka"
                        ? "border-[#ff6b35] bg-[#fff3ef] shadow-xs"
                        : "border-[#e5e7eb] bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-800 flex flex-col">
                      <span>ঢাকার ভিতরে ডেলিভারি</span>
                      <span className="text-[#ff6b35] font-extrabold text-sm mt-0.5">
                        {isFreeShipping ? "ফ্রি" : `${shippingInsideFee} ৳`}
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="shipping_zone"
                      checked={shippingZone === "Inside Dhaka"}
                      onChange={() => handleShippingChange("Inside Dhaka")}
                      className="h-4.5 w-4.5 text-[#ff6b35] cursor-pointer accent-[#ff6b35]"
                    />
                  </label>

                  <label
                    onClick={() => handleShippingChange("Outside Dhaka")}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer select-none transition-all ${
                      shippingZone === "Outside Dhaka"
                        ? "border-[#ff6b35] bg-[#fff3ef] shadow-xs"
                        : "border-[#e5e7eb] bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-800 flex flex-col">
                      <span>ঢাকার বাইরে ডেলিভারি</span>
                      <span className="text-[#ff6b35] font-extrabold text-sm mt-0.5">
                        {isFreeShipping ? "ফ্রি" : `${shippingOutsideFee} ৳`}
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="shipping_zone"
                      checked={shippingZone === "Outside Dhaka"}
                      onChange={() => handleShippingChange("Outside Dhaka")}
                      className="h-4.5 w-4.5 text-[#ff6b35] cursor-pointer accent-[#ff6b35]"
                    />
                  </label>
                </div>

                {/* Free Shipping Announcement */}
                {isFreeShipping && (
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-700 text-center">
                    🎉 ২৫০০+ অর্ডারে পাচ্ছেন সম্পূর্ণ ফ্রি হোম ডেলিভারি!
                  </div>
                )}

                {/* Discount Row */}
                {discount > 0 && (
                  <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-xl border border-red-200 text-xs font-bold text-red-600 uppercase tracking-wider">
                    <span>Discount (Tk 3,200+ Order)</span>
                    <span className="font-black text-sm">-250 Tk</span>
                  </div>
                )}

                {/* Total Row */}
                <div className="flex justify-between items-center py-3.5 px-4 bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-xs">
                  <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">সর্বমোট</span>
                  <span
                    style={{ color: "var(--price-color, #12b76a)" }}
                    className="text-2xl font-black tracking-tight"
                  >
                    {formatBDT(total)}
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 h-13 w-full bg-gradient-to-r from-[#ff804e] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#e55520] text-white font-bold text-sm uppercase tracking-wider rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      অর্ডার প্রসেস হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white text-white animate-pulse" />
                      অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)
                    </>
                  )}
                </button>

                {/* Help details */}
                <p className="text-[10px] font-bold text-slate-400 text-center mt-3 leading-normal flex items-center justify-center gap-1">
                  <Phone className="w-3 h-3 text-[#ff6b35]" />
                  <span>
                    সহায়তা / কল অর্ডার:{" "}
                    <a href="tel:01942212267" className="text-slate-700 hover:text-[#ff6b35] underline">
                      01942-212267
                    </a>
                  </span>
                </p>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
}

