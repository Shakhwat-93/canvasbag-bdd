"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/components/providers/cart-provider";
import { formatBDT, sanitizeImageUrl, isValidImageUrl } from "@/lib/format";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addItem, setIsCartOpen } = useCart();

  const variants = product.variants || [];
  const hasVariants = variants.length > 0;
  const firstInStockVariant = hasVariants
    ? variants.find((v) => v.inStock || v.in_stock)
    : null;
  const isOutOfStock = hasVariants ? !firstInStockVariant : false;

  // Extract primary image safely
  const productImages = product.images || [];
  const firstImgRaw = productImages[0] || product.image || product.imageUrl;
  const firstImage = sanitizeImageUrl(
    typeof firstImgRaw === "object" && firstImgRaw !== null ? (firstImgRaw as any).url : firstImgRaw
  );

  const vImgRaw = firstInStockVariant?.image;
  const validVariantImage = isValidImageUrl(vImgRaw)
    ? (vImgRaw as string).trim()
    : firstImage;

  // Calculate discount percentage
  const comparePrice = product.compareAtPrice || (product as any).compare_at_price;
  let discountPct = 0;
  if (comparePrice && Number(comparePrice) > Number(product.price)) {
    discountPct = Math.round(((Number(comparePrice) - Number(product.price)) / Number(comparePrice)) * 100);
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      db_product_name: product.db_product_name,
      image: validVariantImage,
      price: product.price,
      compareAtPrice: comparePrice,
      variantId: firstInStockVariant?.id || "standard",
      variantName: firstInStockVariant?.name || "Standard",
      quantity: 1,
    });
    setIsCartOpen(true);
  };

  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      db_product_name: product.db_product_name,
      image: validVariantImage,
      price: product.price,
      compareAtPrice: comparePrice,
      variantId: firstInStockVariant?.id || "standard",
      variantName: firstInStockVariant?.name || "Standard",
      quantity: 1,
    });
    router.push("/checkout");
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#e5e7eb] hover:border-[#ff6b35] hover:shadow-lg transition-all duration-200 flex flex-col h-full group">
      <Link className="block flex-1" href={`/product/${product.slug}`}>
        {/* Product Image Box */}
        <div className="relative aspect-square overflow-hidden bg-[#f8f9fa] flex items-center justify-center">
          <Image
            src={validVariantImage}
            alt={product.name}
            fill
            quality={85}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px"
            className="object-contain p-2 transition-transform duration-200"
          />

          {/* Discount Badge */}
          {discountPct > 0 && (
            <div
              style={{ backgroundColor: "var(--badge-color, #000000)" }}
              className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded-lg animate-pulse-badge shadow-xs"
            >
              {discountPct}% ছাড়
            </div>
          )}

          {/* Limited Stock Badge */}
          <div className="absolute top-2 right-2 bg-[#ef4444] text-white text-xs font-bold px-2 py-1 rounded-lg shadow-xs">
            {isOutOfStock ? "স্টক শেষ" : "সীমিত"}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3">
          <p className="text-sm font-semibold text-[#111827] line-clamp-2 leading-snug mb-1 group-hover:text-[#ff6b35] transition-colors">
            {product.name}
          </p>
          <div className="flex items-center gap-2">
            <span
              style={{ color: "var(--price-color, #12b76a)" }}
              className="text-base font-bold"
            >
              {formatBDT(product.price)}
            </span>
            {comparePrice && Number(comparePrice) > Number(product.price) && (
              <span className="text-xs text-[#6b7280] line-through">
                {formatBDT(Number(comparePrice))}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="p-3 pt-0 space-y-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="w-full flex items-center justify-center gap-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-[10px] min-[360px]:text-xs font-semibold py-2 px-1 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-gray-500 hidden min-[360px]:inline-block shrink-0" />
          <span className="whitespace-nowrap">কার্টে যোগ করুন</span>
        </button>

        <button
          type="button"
          onClick={handleOrderNow}
          disabled={isOutOfStock}
          className="w-full flex items-center justify-center gap-1 bg-gradient-to-r from-[#ff804e] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#e55520] text-white text-[10px] min-[360px]:text-xs font-bold py-2 px-1 rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="w-3.5 h-3.5 fill-white text-white hidden min-[360px]:inline-block shrink-0" />
          <span className="whitespace-nowrap">এখনি অর্ডার করুন</span>
        </button>
      </div>
    </div>
  );
}
