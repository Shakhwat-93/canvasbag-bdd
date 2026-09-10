"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  ShoppingBag,
  Zap,
  Phone,
  CheckCircle2,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Product, ProductReview, SiteSettings } from "@/lib/types";
import { useCart } from "@/components/providers/cart-provider";
import { formatBDT, isValidImageUrl, sanitizeImageUrl } from "@/lib/format";
import { trackClientEvent } from "@/lib/analytics";
import { ProductCard } from "@/components/store/product-card";

interface ProductViewProps {
  product: Product;
  reviews: ProductReview[];
  settings: SiteSettings;
  relatedProducts: Product[];
}

export function ProductView({ product, reviews: initialReviews, settings, relatedProducts }: ProductViewProps) {
  const router = useRouter();
  const { addItem } = useCart();

  // Variants & normalization
  const variants = product.variants || [];
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const activeVariant = variants[selectedVariantIndex] || null;

  // Images & normalization
  const rawImages = product.images || [];
  const validFallback = sanitizeImageUrl(product.image || product.imageUrl, "/brand/logo.webp");
  const productImages: string[] = rawImages
    .map((img) => (typeof img === "object" && img !== null ? (img as any).url : img))
    .filter((url): url is string => isValidImageUrl(url));

  if (productImages.length === 0) {
    productImages.push(validFallback);
  }

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "specs">("description");

  // Review Form States
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [customerName, setCustomerName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Active prices
  const activePrice = activeVariant?.price ?? product.price;
  const activeComparePrice = activeVariant?.compareAtPrice || (activeVariant as any)?.compare_at_price || product.compareAtPrice || (product as any)?.compare_at_price || 0;
  const discountPercent =
    activeComparePrice > activePrice
      ? Math.round(((activeComparePrice - activePrice) / activeComparePrice) * 100)
      : 0;

  // Stock status
  const isOutOfStock = activeVariant
    ? !activeVariant.inStock && !(activeVariant as any).in_stock
    : false;

  // Fire view_item event on mount and when variant changes
  useEffect(() => {
    trackClientEvent("view_item", {
      value: activePrice,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_brand: "CanvasBag",
          item_category: product.categoryName || product.categorySlug || "",
          item_variant: activeVariant ? activeVariant.name : "Standard",
          price: activePrice,
          quantity: 1,
        },
      ],
    });
  }, [product, activeVariant, activePrice]);

  // Handle variant selection
  const handleSelectVariant = (index: number) => {
    setSelectedVariantIndex(index);
    const v = variants[index];
    if (v?.image) {
      const matchIdx = productImages.indexOf(v.image);
      if (matchIdx !== -1) {
        setActiveImageIndex(matchIdx);
      }
    }
  };

  // Gallery Navigation
  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
  };

  // Resolved Image for Cart
  const resolvedCartImage = isValidImageUrl(activeVariant?.image)
    ? (activeVariant!.image as string).trim()
    : productImages[activeImageIndex] || productImages[0] || "/brand/logo.webp";

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      db_product_name: product.db_product_name,
      image: resolvedCartImage,
      price: activePrice,
      compareAtPrice: activeComparePrice,
      variantId: activeVariant?.id || "standard",
      variantName: activeVariant?.name || "Standard",
      quantity,
    });
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      db_product_name: product.db_product_name,
      image: resolvedCartImage,
      price: activePrice,
      compareAtPrice: activeComparePrice,
      variantId: activeVariant?.id || "standard",
      variantName: activeVariant?.name || "Standard",
      quantity,
    });
    router.push("/checkout");
  };

  // WhatsApp Order Link
  const phoneClean = (settings.phone || "01942212267").replace(/\D/g, "");
  const waPhone = phoneClean.length === 11 && phoneClean.startsWith("0") ? `88${phoneClean}` : phoneClean;
  const activeVariantName = activeVariant ? activeVariant.name : "Standard";
  const waText = `আসসালামু আলাইকুম, আমি এই প্রোডাক্টটি অর্ডার করতে চাই: ${product.name} (বাছাই: ${activeVariantName}, দাম: ${activePrice} টাকা)`;
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;

  // Submit Review Form
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !reviewComment.trim()) {
      toast.error("অনুগ্রহ করে আপনার নাম ও রিভিউ লিখুন।");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/product/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          customer_name: customerName,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("ধন্যবাদ! আপনার রিভিউটি সফলভাবে জমা হয়েছে।");
        setCustomerName("");
        setReviewComment("");
        setIsReviewFormOpen(false);
      } else {
        toast.error(data.error || "রিভিউ জমা দেওয়া সম্ভব হয়নি।");
      }
    } catch (err) {
      console.error("Submit review error:", err);
      toast.error("রিভিউ পাঠানো ব্যর্থ হয়েছে।");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-800 pb-16">
      {/* Breadcrumb section */}
      <div className="bg-white border-b border-[#e5e7eb] py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-xs font-bold text-slate-500 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-[#ff6b35] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link
            href={`/category/${product.categorySlug || (product as any).category_slug || "everyday-totes"}`}
            className="hover:text-[#ff6b35] transition-colors"
          >
            {product.categoryName || "Category"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 truncate font-semibold">{product.name}</span>
        </div>
      </div>

      {/* Main product overview */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start p-5 sm:p-8 rounded-3xl bg-white border border-[#e5e7eb] shadow-xs">
          {/* Column 1: Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl bg-[#f8f9fa] border border-[#e5e7eb] overflow-hidden flex items-center justify-center group shadow-xs">
              <Image
                src={productImages[activeImageIndex] || "/brand/logo.webp"}
                alt={product.name}
                fill
                priority
                quality={90}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 750px"
                className="object-cover"
              />

              {discountPercent > 0 && (
                <div
                  style={{ backgroundColor: "var(--badge-color, #000000)" }}
                  className="absolute top-4 left-4 text-white font-bold text-xs px-2.5 py-1 rounded-lg animate-pulse-badge z-10 shadow-xs"
                >
                  <span>{discountPercent}</span>% ছাড়
                </div>
              )}

              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 hover:bg-white border border-[#e5e7eb] flex items-center justify-center shadow-md text-slate-700 hover:text-slate-900 transition-all cursor-pointer z-10"
                    aria-label="Previous Image"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 hover:bg-white border border-[#e5e7eb] flex items-center justify-center shadow-md text-slate-700 hover:text-slate-900 transition-all cursor-pointer z-10"
                    aria-label="Next Image"
                  >
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex gap-2.5 items-center overflow-x-auto py-1 no-scrollbar justify-center">
                {productImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-14 h-14 rounded-xl bg-white border overflow-hidden shrink-0 transition-all cursor-pointer ${
                      idx === activeImageIndex
                        ? "border-[#ff6b35] ring-2 ring-[#ff6b35]/20 scale-[0.98]"
                        : "border-[#e5e7eb] hover:border-slate-400"
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`${product.name} Thumbnail ${idx + 1}`}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Purchasing Details */}
          <div className="space-y-6">
            <div className="space-y-3 text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Rating Star Summary */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(product.rating || 5) ? "fill-current text-amber-400" : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-extrabold text-slate-800">{(product.rating || 5.0).toFixed(1)}</span>
                <span className="text-slate-400">·</span>
                <a
                  href="#reviews-section"
                  className="text-[#ff6b35] hover:underline font-extrabold transition-all cursor-pointer"
                >
                  {initialReviews.length || product.reviewCount || 0} রিভিউ দেখুন
                </a>
              </div>

              {/* Pricing block */}
              <div className="flex items-center gap-3.5 py-2 border-y border-[#e5e7eb]">
                <span
                  style={{ color: "var(--price-color, #12b76a)" }}
                  className="text-3xl font-bold"
                >
                  {formatBDT(activePrice)}
                </span>
                {activeComparePrice > activePrice && (
                  <span className="text-base font-semibold text-slate-400 line-through">
                    {formatBDT(activeComparePrice)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span
                    style={{ backgroundColor: "var(--badge-color, #000000)" }}
                    className="text-white text-[11px] font-bold px-2 py-0.5 rounded-lg animate-pulse-badge shadow-2xs"
                  >
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Variants Selector */}
            {variants.length > 1 && (
              <div className="space-y-2 pt-2 text-left">
                <p className="text-sm font-semibold text-slate-900">কালার / ভ্যারিয়েন্ট:</p>
                <div className="flex flex-wrap gap-2.5">
                  {variants.map((v, idx) => {
                    const isSelected = idx === selectedVariantIndex;
                    const vComparePrice = v.compareAtPrice || (v as any).compare_at_price || activeComparePrice;
                    const vPrice = v.price || activePrice;
                    const vDiscount =
                      vComparePrice > vPrice
                        ? Math.round(((vComparePrice - vPrice) / vComparePrice) * 100)
                        : 0;

                    return (
                      <button
                        key={v.id || idx}
                        type="button"
                        onClick={() => handleSelectVariant(idx)}
                        className={`flex items-center gap-2 border px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                          isSelected
                            ? "border-[#ff6b35] bg-[#fff3ef] text-[#ff6b35] ring-1 ring-[#ff6b35]"
                            : "border-[#e5e7eb] hover:border-slate-300 text-slate-800 bg-white"
                        }`}
                      >
                        <span>{v.name}</span>
                        {vDiscount > 0 && (
                          <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                            {vDiscount}% OFF
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="space-y-4 pt-4 border-t border-[#e5e7eb]">
              <div className="flex flex-col gap-4">
                {/* Quantity selector */}
                <div className="flex items-center select-none">
                  <div className="flex items-center bg-white border border-[#e5e7eb] rounded-xl h-10 w-32 overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-full flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 border-r border-[#e5e7eb] transition-colors cursor-pointer text-lg"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm text-slate-900 flex-1 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                      className="w-10 h-full flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 border-l border-[#e5e7eb] transition-colors cursor-pointer text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 2x2 Buttons Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Add to Cart */}
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    className="h-12 bg-white hover:bg-gray-50 border border-[#e5e7eb] text-gray-800 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="w-4 h-4 text-gray-500" />
                    <span>{isOutOfStock ? "স্টক আউট" : "কার্টে যোগ করুন"}</span>
                  </button>

                  {/* Buy Now */}
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    className="h-12 bg-gradient-to-r from-[#ff804e] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#e55520] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-4 h-4 fill-white text-white" />
                    <span>{isOutOfStock ? "স্টক আউট" : "এখনি অর্ডার করুন"}</span>
                  </button>

                  {/* Order via WhatsApp */}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="col-span-2 sm:col-span-1 h-12 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                  >
                    <svg className="w-4.5 h-4.5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.787-1.455L0 24zm6.09-3.921c1.65.981 3.265 1.502 4.908 1.503 5.432.002 9.851-4.42 9.855-9.86.002-2.63-1.019-5.101-2.876-6.96C16.177 2.9 13.702 1.88 11.069 1.88 5.637 1.88 1.219 6.302 1.215 11.741c-.002 1.685.443 3.329 1.292 4.796L1.472 21.09l4.675-1.226z" />
                    </svg>
                    <span>হোয়াটসঅ্যাপে অর্ডার করুন</span>
                  </a>

                  {/* Call to Order */}
                  <a
                    href={`tel:${settings.phone || "01942212267"}`}
                    className="col-span-2 sm:col-span-1 h-12 bg-white hover:bg-gray-50 border border-[#e5e7eb] text-gray-800 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                  >
                    <Phone className="w-4 h-4 text-[#ff6b35]" />
                    <span>কল অর্ডার: {settings.phone || "01942-212267"}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Category Link */}
            <div className="text-xs font-bold text-slate-500 pt-1 text-left">
              ক্যাটাগরি:{" "}
              <Link
                href={`/category/${product.categorySlug || (product as any).category_slug || "everyday-totes"}`}
                className="text-slate-800 hover:text-[#ff6b35] transition-colors"
              >
                {product.categoryName || "Category"}
              </Link>
            </div>

            {/* Trust Guidelines Block */}
            <div className="border border-[#e5e7eb] bg-[#f8f9fa] p-4.5 rounded-2xl space-y-3.5 text-xs font-semibold text-slate-700 leading-relaxed text-left">
              <div className="space-y-1">
                <p className="text-slate-900 font-bold text-sm flex items-center gap-1.5">🛵 ডেলিভারি চার্জ:</p>
                <p className="text-xs pl-6 text-slate-600 font-medium leading-normal">
                  ঢাকার মধ্যে {settings.shippingInsideDhaka || 70} টাকা, ঢাকার বাইরে {settings.shippingOutsideDhaka || 150} টাকা!
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold text-sm flex items-center gap-1.5">💵 সম্পূর্ণ ক্যাশ অন ডেলিভারি:</p>
                <p className="text-xs pl-6 text-slate-600 font-medium leading-normal">
                  অর্ডার করতে অগ্রিম ১ টাকাও দিতে হবেনা, পণ্য রিসিভ করার সময় টাকা পরিশোধ করবেন!
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold text-sm flex items-center gap-1.5">🔎 প্রোডাক্ট চেক করে নেওয়ার সুযোগ:</p>
                <p className="text-xs pl-6 text-slate-600 font-medium leading-normal">
                  ডেলিভারি ম্যানের সামনে পণ্য ভালোভাবে দেখে তারপর রিসিভ করতে পারবেন।
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Specifications Tabs */}
      <div id="details-tabs" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl shadow-xs overflow-hidden bg-white border border-[#e5e7eb]">
          <div className="flex border-b border-[#e5e7eb] bg-white">
            <button
              type="button"
              onClick={() => setActiveTab("description")}
              className={`px-6 py-4 md:px-8 md:py-4.5 text-sm md:text-[15px] font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "description"
                  ? "border-[#ff6b35] text-[#ff6b35]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Product Description
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("specs")}
              className={`px-6 py-4 md:px-8 md:py-4.5 text-sm md:text-[15px] font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "specs"
                  ? "border-[#ff6b35] text-[#ff6b35]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Specifications
            </button>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            {activeTab === "description" ? (
              <div className="space-y-8">
                {product.story && (
                  <div className="space-y-4">
                    <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                      {product.name} - এর ব্যবহার ও কার্যকারিতা
                    </h3>
                    <p className="text-base md:text-[18px] leading-loose text-slate-700 font-medium max-w-5xl whitespace-pre-line">
                      {product.story}
                    </p>
                  </div>
                )}

                {product.benefits && product.benefits.length > 0 && (
                  <div className="space-y-5 border-t border-[#e5e7eb] pt-8">
                    <h4 className="text-base md:text-[17px] font-extrabold text-slate-900 flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-[#ff6b35] shrink-0" />
                      প্রোডাক্টের বৈশিষ্ট্যসমূহ:
                    </h4>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {product.benefits.map((benefit, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 text-base md:text-[17px] font-medium text-slate-800 leading-relaxed text-left"
                        >
                          <span className="w-6 h-6 rounded-full bg-[#fff3ef] text-[#ff6b35] flex items-center justify-center shrink-0 mt-0.5 font-black text-xs">
                            ✓
                          </span>
                          <span>{benefit.replace(/^[✓✔*•-]\s*/, "")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-3 text-left">
                  <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    প্রোডাক্টের টেকনিক্যাল স্পেসিফিকেশন
                  </h3>
                  <p className="text-base md:text-[17px] text-slate-500 font-medium">
                    ভ্রমণ ও দৈনন্দিন ব্যবহারের জন্য সঠিক ও নিখুঁত পরিমাপসমূহ
                  </p>
                </div>

                <div className="border border-[#e5e7eb] rounded-2xl overflow-hidden divide-y divide-[#e5e7eb] max-w-2xl bg-white text-left">
                  {product.specs && product.specs.length > 0 ? (
                    product.specs.map((spec, idx) => {
                      const isObj = typeof spec === "object" && spec !== null;
                      const parts = isObj ? [] : String(spec).split(":");
                      const hasKey = isObj ? Boolean((spec as any).key) : parts.length > 1;
                      const keyName = isObj ? (spec as any).key : (hasKey ? parts[0].trim() : `Spec ${idx + 1}`);
                      const valName = isObj ? (spec as any).value : (hasKey ? parts.slice(1).join(":").trim() : String(spec).trim());

                      return (
                        <div key={idx} className="grid grid-cols-[140px_1fr] gap-4 p-4.5 hover:bg-[#f8f9fa] transition-colors">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px] md:text-xs pt-1">
                            {keyName}
                          </span>
                          <span className="font-semibold text-slate-800 text-base md:text-[17px] leading-relaxed">
                            {valName}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="p-4 text-sm text-slate-400">কোনো স্পেসিফিকেশন তথ্য যোগ করা হয়নি।</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div id="reviews-section" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8 px-4">
          <span className="w-1.5 h-6 bg-[#ff6b35] rounded-full shrink-0" />
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-normal text-left flex-1">
            Customer Reviews ({initialReviews.length || product.reviewCount || 0})
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Column 1: Rating Summary & Write Review Form */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl shadow-xs bg-white border border-[#e5e7eb] text-center space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Average Rating</h3>
              <div className="text-4xl font-black text-slate-900 font-mono">
                {(product.rating || 5.0).toFixed(1)}
              </div>

              <div className="flex justify-center text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(product.rating || 5) ? "fill-current text-amber-400" : "text-slate-200"
                    }`}
                  />
                ))}
              </div>

              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {initialReviews.length || product.reviewCount || 0} Verified Ratings
              </p>

              <button
                type="button"
                onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                className="w-full py-3 bg-[#111827] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5"
              >
                ✍️ Write a Review
              </button>
            </div>

            {/* Write Review Form Card */}
            {isReviewFormOpen && (
              <div className="p-6 rounded-3xl shadow-md bg-white border border-[#e5e7eb] space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
                  Write a Review
                </h4>

                <form onSubmit={handleSubmitReview} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 uppercase">
                      Your Rating <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-1.5 text-slate-300 text-2xl">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`hover:scale-110 active:scale-95 transition-transform cursor-pointer ${
                            star <= reviewRating ? "text-amber-400" : "text-slate-300"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 uppercase">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your name..."
                      className="w-full h-10 px-3 border border-[#e5e7eb] rounded-xl focus:outline-none focus:border-[#ff6b35] bg-white font-medium text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 uppercase">
                      Your Review <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Write your review here..."
                      className="w-full p-2.5 border border-[#e5e7eb] rounded-xl focus:outline-none focus:border-[#ff6b35] bg-white font-medium resize-none text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full h-10 bg-gradient-to-r from-[#ff804e] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#e55520] text-white font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmittingReview ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        জমা হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Submit Review
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Column 2: Reviews List */}
          <div className="lg:col-span-2 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 bg-white border border-[#e5e7eb]">
            <div className="space-y-6 max-h-[550px] overflow-y-auto pr-2 no-scrollbar divide-y divide-[#e5e7eb]">
              {initialReviews.length > 0 ? (
                initialReviews.map((review, i) => (
                  <div key={review.id || i} className="pt-6 first:pt-0 flex flex-col gap-3 text-left">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-base md:text-lg text-slate-900">
                          {review.name || review.customer_name}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wide">
                          ✔ Verified Purchaser
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-400 font-mono">{review.date}</span>
                    </div>

                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-4 h-4 ${
                            idx < (review.rating || 5) ? "fill-current text-amber-400" : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-base md:text-[17px] text-slate-700 leading-relaxed font-medium max-w-4xl">
                      {review.comment || review.quote}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 font-bold">
                  No reviews yet. Click &quot;Write a Review&quot; to share your thoughts!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3.5 mb-8">
            <div className="flex items-center gap-3 flex-1">
              <span className="w-1.5 h-6 bg-[#ff6b35] rounded-full shrink-0" />
              <h2 className="text-lg md:text-xl font-black text-slate-900 leading-normal flex-1">
                Most Popular Products
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider shrink-0"
            >
              View All
            </Link>
          </div>

          <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
