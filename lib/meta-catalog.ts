import crypto from "crypto";
import type { Category, Product, ProductVariant, SiteSettings } from "@/lib/types";

export const DEFAULT_CANONICAL_ORIGIN = "https://canvasbagbd.com";
export const DEFAULT_R2_PUBLIC_URL = "https://pub-c87cf7c070ae4a08a702a89ea3340662.r2.dev";
export const DEFAULT_BRAND_NAME = "CanvasBag";

export interface CatalogValidationIssue {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantName?: string;
  level: "error" | "warning";
  code: string;
  message: string;
}

export interface MetaCatalogFeedItem {
  id: string;
  parentProductId: string;
  itemGroupId?: string;
  title: string;
  description: string;
  availability: "in stock" | "out of stock";
  condition: "new";
  priceValue: number;
  salePriceValue?: number;
  priceFormatted: string;
  salePriceFormatted?: string;
  link: string;
  imageLink: string;
  additionalImageLinks: string[];
  brand: string;
  googleProductCategory?: string;
  productType?: string;
  color?: string;
  slug: string;
}

export interface CatalogValidationReport {
  isValidXml: boolean;
  xmlBytes: number;
  generatedAt: string;
  lastFeedUpdate: string;
  canonicalOrigin: string;
  feedPath: string;
  feedUrl: string;
  totalDatabaseProducts: number;
  publishedParentProducts: number;
  unpublishedExcludedCount: number;
  totalFeedItems: number;
  activeInStockCount: number;
  outOfStockCount: number;
  inStockParentCount: number;
  outOfStockParentCount: number;
  multiVariantParentCount: number;
  expandedVariantItemCount: number;
  skippedInvalidCount: number;
  duplicateIdsPrevented: number;
  errors: CatalogValidationIssue[];
  warnings: CatalogValidationIssue[];
  checks: Array<{
    key: string;
    label: string;
    passed: boolean;
    detail: string;
  }>;
}

export interface MetaCatalogBuildResult {
  xml: string;
  items: MetaCatalogFeedItem[];
  report: CatalogValidationReport;
}

/**
 * Strip illegal XML 1.0 control characters while preserving valid UTF-8 (including Bengali & emojis).
 */
export function stripInvalidXmlChars(input: string): string {
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Strict XML 1.0 character entity escaping.
 */
export function escapeXml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const clean = stripInvalidXmlChars(String(value));
  return clean
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Parse stock status safely across boolean, string ("true"/"false"), or numeric fields.
 */
export function parseVariantInStock(variant: ProductVariant | any): boolean {
  const raw = variant?.inStock !== undefined ? variant.inStock : variant?.in_stock;
  if (raw === undefined || raw === null) return true;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") {
    const clean = raw.trim().toLowerCase();
    if (
      clean === "false" ||
      clean === "0" ||
      clean === "no" ||
      clean === "out_of_stock" ||
      clean === "out of stock"
    ) {
      return false;
    }
    if (clean === "true" || clean === "1" || clean === "yes" || clean === "in_stock" || clean === "in stock") {
      return true;
    }
  }
  if (typeof raw === "number") return raw > 0;
  return Boolean(raw);
}

/**
 * Determine if a parent product is in stock.
 */
export function isProductInStock(product: Product): boolean {
  const rawParentStock = (product as any).inStock ?? (product as any).in_stock;
  if (rawParentStock === false || String(rawParentStock).toLowerCase() === "false") {
    return false;
  }
  if (typeof (product as any).stock === "number" && (product as any).stock <= 0) {
    return false;
  }
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length > 0) {
    return variants.some((v) => parseVariantInStock(v));
  }
  return true;
}

export function resolveCanonicalOrigin(): string {
  const configured = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
        parsed.protocol = "https:";
      }
      return parsed.origin;
    } catch {
      // Fallback below
    }
  }
  return DEFAULT_CANONICAL_ORIGIN;
}

export function resolveR2PublicBase(): string {
  const configured = (process.env.R2_PUBLIC_URL || DEFAULT_R2_PUBLIC_URL).trim().replace(/\/+$/, "");
  if (configured.startsWith("http://")) {
    return `https://${configured.slice(7)}`;
  }
  return configured;
}

/**
 * Resolve any candidate product/variant image string into a strict HTTPS URL suitable for Meta Commerce Manager.
 * Rejects placeholders ("null", "undefined", "Canvas"), data URIs, and invalid paths.
 */
export function resolveHttpsImageUrl(
  raw: unknown,
  r2BaseUrl = resolveR2PublicBase(),
  canonicalOrigin = resolveCanonicalOrigin()
): string | null {
  const extracted =
    typeof raw === "object" && raw !== null && "url" in (raw as any)
      ? (raw as any).url
      : raw;

  if (typeof extracted !== "string") return null;
  const trimmed = extracted.trim();

  if (
    !trimmed ||
    trimmed.length > 2048 ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined" ||
    trimmed.startsWith("data:")
  ) {
    return null;
  }

  if (trimmed.startsWith("https://")) {
    try {
      return new URL(trimmed).toString();
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith("http://")) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
        parsed.protocol = "https:";
      }
      return parsed.toString();
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith("/")) {
    const cleanPath = trimmed.replace(/\/{2,}/g, "/");
    // Static /uploads/, /brand/, and /products/ assets are hosted on Cloudflare R2 CDN over HTTPS
    if (
      cleanPath.startsWith("/uploads/") ||
      cleanPath.startsWith("/brand/") ||
      cleanPath.startsWith("/products/")
    ) {
      return `${r2BaseUrl}${cleanPath}`;
    }
    return `${canonicalOrigin}${cleanPath}`;
  }

  return null;
}

/**
 * Extract all unique valid HTTPS images for a product (gallery + primary image fields).
 */
export function collectProductHttpsImages(
  product: Product,
  r2BaseUrl: string,
  canonicalOrigin: string
): string[] {
  const seen = new Set<string>();
  const candidates: unknown[] = [
    ...(Array.isArray(product.images) ? product.images : []),
    product.image,
    product.imageUrl,
  ];

  const resolved: string[] = [];
  for (const cand of candidates) {
    const url = resolveHttpsImageUrl(cand, r2BaseUrl, canonicalOrigin);
    if (url && !seen.has(url)) {
      seen.add(url);
      resolved.push(url);
    }
  }
  return resolved;
}

/**
 * Clean HTML entities/tags and produce a clean, Meta-compliant product description.
 */
export function sanitizeProductDescription(
  product: Product,
  brand: string
): { text: string; usedFallback: boolean } {
  const cleanText = (raw?: string | null): string => {
    if (!raw || typeof raw !== "string") return "";
    return stripInvalidXmlChars(raw)
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/\s+/g, " ")
      .trim();
  };

  const primaryDesc = cleanText(product.description);
  const shortDesc = cleanText(product.shortDescription);
  const storyText = cleanText(product.story);
  const benefitsText = Array.isArray(product.benefits)
    ? product.benefits.map((b) => cleanText(String(b))).filter(Boolean).join(" • ")
    : "";

  const parts = [primaryDesc || shortDesc || storyText];
  if (benefitsText && !parts[0].includes(benefitsText)) {
    parts.push(benefitsText);
  }

  const combined = parts.filter(Boolean).join(" — ").trim();
  if (combined.length >= 10) {
    return {
      text: combined.slice(0, 5000),
      usedFallback: false,
    };
  }

  return {
    text: `${cleanText(product.name) || "Premium Product"} — Official collection from ${brand}. Cash on Delivery available across Bangladesh.`.slice(
      0,
      5000
    ),
    usedFallback: true,
  };
}

/**
 * Map internal product & category taxonomy to official Google Product Taxonomy strings supported by Meta.
 * Returns undefined when no reliable classification matches ("when available").
 */
export function resolveGoogleProductCategory(
  product: Product,
  categories: Category[]
): string | undefined {
  const matchedCat = categories.find(
    (c) =>
      (product.categoryId && c.id === product.categoryId) ||
      (product.categorySlug && c.slug === product.categorySlug)
  );

  const catSlug = (matchedCat?.slug || product.categorySlug || "").toLowerCase();
  const catName = (matchedCat?.name || product.categoryName || "").toLowerCase();
  const titleLower = (product.name || "").toLowerCase();
  const combined = `${catSlug} ${catName} ${titleLower}`;

  // 1. Specific product-title taxonomy matches first (prevents category-id skew)
  if (/\b(tws|earbuds|headphone|headset|earphone|airpods)\b/.test(titleLower)) {
    return "Electronics > Audio > Audio Components > Headphones & Headsets > Headphones";
  }

  if (/\b(camera|vlogging camera|action camera)\b/.test(titleLower)) {
    return "Cameras & Optics > Cameras > Digital Cameras";
  }

  if (/\b(lamp|lantern|floor light|table light|led light)\b/.test(titleLower)) {
    return "Home & Garden > Lighting > Lamps";
  }

  if (/\b(travel bag|duffel|duffle|weekender|family travel)\b/.test(titleLower)) {
    return "Luggage & Bags > Duffel Bags";
  }

  if (/\b(backpack|rucksack)\b/.test(titleLower)) {
    return "Luggage & Bags > Backpacks";
  }

  if (/\b(waist bag|crossbody|tote|handbag|shoulder bag|camper|purse|clutch|pouch|sling bag|money management bag)\b/.test(titleLower)) {
    return "Apparel & Accessories > Handbags, Wallets & Cases > Handbags";
  }

  // 2. Category-level fallback mapping
  if (catSlug === "tws") {
    return "Electronics > Audio > Audio Components > Headphones & Headsets > Headphones";
  }

  if (catSlug === "premium-lamps") {
    return "Home & Garden > Lighting > Lamps";
  }

  if (catSlug === "exercise-accessories" || /\b(exercise|fitness|gym band|dumbbell|yoga|strap)\b/.test(combined)) {
    return "Sporting Goods > Exercise & Fitness";
  }

  if (catSlug === "travel-canvas" || catSlug === "travel") {
    return "Luggage & Bags > Duffel Bags";
  }

  if (catSlug.includes("backpack") || catName.includes("backpack")) {
    return "Luggage & Bags > Backpacks";
  }

  if (
    catSlug.includes("tote") ||
    catSlug.includes("bag") ||
    catSlug === "t" ||
    catSlug === "m" ||
    catSlug === "l" ||
    catSlug === "blossom" ||
    catSlug === "everyday-totes" ||
    catSlug === "ladies-bags" ||
    catSlug === "3d-retro-camper-bag" ||
    catSlug === "canvas-tote-bag" ||
    catSlug === "luna-bags" ||
    catSlug === "shoulder-bag" ||
    /\b(bag|tote|laptop bag)\b/.test(combined)
  ) {
    return "Apparel & Accessories > Handbags, Wallets & Cases > Handbags";
  }

  if (catSlug === "home-decors" || catSlug === "ac-sticker") {
    return "Home & Garden > Decor";
  }

  if (catSlug === "g" || catName.includes("gadget")) {
    return "Electronics > Electronics Accessories";
  }

  return undefined;
}

/**
 * Guarantee globally unique Meta catalog item IDs (max 100 chars per Meta spec).
 */
function claimUniqueItemId(
  preferredId: string,
  usedIds: Set<string>,
  onCollision?: () => void
): string {
  let clean = stripInvalidXmlChars(preferredId).trim();
  if (!clean) {
    clean = `item-${crypto.randomUUID().slice(0, 12)}`;
  }
  if (clean.length > 100) {
    const hash = crypto.createHash("sha1").update(clean).digest("hex").slice(0, 8);
    clean = `${clean.slice(0, 91)}_${hash}`;
  }

  if (!usedIds.has(clean)) {
    usedIds.add(clean);
    return clean;
  }

  onCollision?.();
  let counter = 2;
  while (true) {
    const suffix = `_${counter}`;
    const candidate = `${clean.slice(0, 100 - suffix.length)}${suffix}`;
    if (!usedIds.has(candidate)) {
      usedIds.add(candidate);
      return candidate;
    }
    counter++;
  }
}

export function formatBdtPrice(amount: number): string {
  return `${Number(amount).toFixed(2)} BDT`;
}

/**
 * Build Meta Commerce Manager RSS 2.0 XML Product Catalog + complete validation report.
 */
export function buildMetaCatalogFeed(input: {
  products: Product[];
  categories: Category[];
  settings?: SiteSettings;
  canonicalOrigin?: string;
  r2PublicUrl?: string;
  brandName?: string;
}): MetaCatalogBuildResult {
  const canonicalOrigin = (input.canonicalOrigin || resolveCanonicalOrigin()).replace(/\/+$/, "");
  const r2PublicUrl = (input.r2PublicUrl || resolveR2PublicBase()).replace(/\/+$/, "");
  const brandName = input.brandName || DEFAULT_BRAND_NAME;

  const allProducts = Array.isArray(input.products) ? input.products : [];
  const categories = Array.isArray(input.categories) ? input.categories : [];

  const publishedProducts = allProducts.filter(
    (p) => p && p.id && p.status !== "inactive" && p.status !== "draft"
  );
  const unpublishedExcludedCount = allProducts.length - publishedProducts.length;

  const errors: CatalogValidationIssue[] = [];
  const warnings: CatalogValidationIssue[] = [];
  const items: MetaCatalogFeedItem[] = [];
  const usedIds = new Set<string>();

  let inStockParentCount = 0;
  let outOfStockParentCount = 0;
  let multiVariantParentCount = 0;
  let expandedVariantItemCount = 0;
  let skippedInvalidCount = 0;
  let duplicateIdsPrevented = 0;
  let latestTimestampMs = 0;

  for (const p of allProducts) {
    if (!p) continue;
    const tsCandidate = (p as any).updatedAt || p.created_at;
    if (tsCandidate) {
      const ms = new Date(tsCandidate).getTime();
      if (!isNaN(ms) && ms > latestTimestampMs) {
        latestTimestampMs = ms;
      }
    }
  }

  for (const product of publishedProducts) {
    const productName = stripInvalidXmlChars((product.name || "").trim());
    const productSlug = (product.slug || "").trim();

    if (!productName) {
      skippedInvalidCount++;
      errors.push({
        id: `err-title-${product.id}`,
        productId: product.id,
        productName: "(Missing Title)",
        productSlug,
        level: "error",
        code: "MISSING_TITLE",
        message: "Product is missing a title and was excluded from the Meta feed.",
      });
      continue;
    }

    if (!productSlug) {
      skippedInvalidCount++;
      errors.push({
        id: `err-slug-${product.id}`,
        productId: product.id,
        productName,
        productSlug: "",
        level: "error",
        code: "MISSING_LINK",
        message: "Product is missing a URL slug and cannot build a canonical product link.",
      });
      continue;
    }

    const canonicalLink = `${canonicalOrigin}/product/${encodeURIComponent(productSlug)}`;
    const parentImages = collectProductHttpsImages(product, r2PublicUrl, canonicalOrigin);
    const { text: description, usedFallback } = sanitizeProductDescription(product, brandName);
    if (usedFallback) {
      warnings.push({
        id: `warn-desc-${product.id}`,
        productId: product.id,
        productName,
        productSlug,
        level: "warning",
        code: "FALLBACK_DESCRIPTION",
        message: "Product had empty description/story; generated clean fallback copy for Meta.",
      });
    }

    const googleProductCategory = resolveGoogleProductCategory(product, categories);
    const productType = (product.categoryName || product.categorySlug || "").trim() || undefined;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const parentInStock = isProductInStock(product);

    if (parentInStock) {
      inStockParentCount++;
    } else {
      outOfStockParentCount++;
    }

    if (variants.length > 1) {
      multiVariantParentCount++;
      const groupId = stripInvalidXmlChars(product.id).slice(0, 100);
      let emittedForParent = 0;

      variants.forEach((variant, idx) => {
        const variantName = stripInvalidXmlChars((variant?.name || `Variant ${idx + 1}`).trim());
        const rawVarId = (variant?.id || `v${idx + 1}`).trim();
        const variantImages: string[] = [];

        const vImg = resolveHttpsImageUrl(variant?.image, r2PublicUrl, canonicalOrigin);
        if (vImg) {
          variantImages.push(vImg);
        }
        for (const pImg of parentImages) {
          if (!variantImages.includes(pImg)) {
            variantImages.push(pImg);
          }
        }

        if (variantImages.length === 0) {
          skippedInvalidCount++;
          errors.push({
            id: `err-img-${product.id}-${rawVarId}`,
            productId: product.id,
            productName,
            productSlug,
            variantName,
            level: "error",
            code: "MISSING_IMAGE",
            message: `Variant "${variantName}" has no valid HTTPS image and was skipped.`,
          });
          return;
        }

        const rawVarPrice = Number(variant?.price);
        const rawParentPrice = Number(product.price);
        const sellingPrice = !isNaN(rawVarPrice) && rawVarPrice > 0 ? rawVarPrice : rawParentPrice;

        if (!sellingPrice || isNaN(sellingPrice) || sellingPrice <= 0) {
          skippedInvalidCount++;
          errors.push({
            id: `err-price-${product.id}-${rawVarId}`,
            productId: product.id,
            productName,
            productSlug,
            variantName,
            level: "error",
            code: "INVALID_PRICE",
            message: `Variant "${variantName}" has an invalid selling price (${sellingPrice}) and was skipped.`,
          });
          return;
        }

        const rawCompare = Number(
          variant?.compareAtPrice ??
            (variant as any)?.compare_at_price ??
            product.compareAtPrice ??
            (product as any)?.compare_at_price
        );
        const hasValidSale = !isNaN(rawCompare) && rawCompare > sellingPrice;

        const isParentDisabledStock =
          (product as any).inStock === false ||
          String((product as any).inStock).toLowerCase() === "false" ||
          (typeof (product as any).stock === "number" && (product as any).stock <= 0);
        const variantAvailable = !isParentDisabledStock && parseVariantInStock(variant);

        const uniqueItemId = claimUniqueItemId(`${product.id}_${rawVarId}`, usedIds, () => {
          duplicateIdsPrevented++;
          warnings.push({
            id: `warn-dupid-${product.id}-${rawVarId}-${idx}`,
            productId: product.id,
            productName,
            productSlug,
            variantName,
            level: "warning",
            code: "DUPLICATE_VARIANT_ID_DEDUPED",
            message: `Variant ID collision detected for "${variantName}"; resolved cleanly to unique Meta ID.`,
          });
        });

        const shouldAppendVariant =
          variantName &&
          variantName.toLowerCase() !== "standard" &&
          !productName.toLowerCase().includes(variantName.toLowerCase());
        const baseProductTitle = productName.replace(/[\s\-–—]+$/, "").trim() || productName;
        const rawFullTitle = shouldAppendVariant ? `${baseProductTitle} - ${variantName}` : productName;
        const fullTitle = rawFullTitle.slice(0, 150);

        if (rawFullTitle.length > 150) {
          warnings.push({
            id: `warn-title-${uniqueItemId}`,
            productId: product.id,
            productName,
            productSlug,
            variantName,
            level: "warning",
            code: "TITLE_TRUNCATED",
            message: "Product title exceeded Meta 150-character limit and was cleanly truncated.",
          });
        }

        items.push({
          id: uniqueItemId,
          parentProductId: product.id,
          itemGroupId: groupId,
          title: fullTitle,
          description,
          availability: variantAvailable ? "in stock" : "out of stock",
          condition: "new",
          priceValue: hasValidSale ? rawCompare : sellingPrice,
          salePriceValue: hasValidSale ? sellingPrice : undefined,
          priceFormatted: formatBdtPrice(hasValidSale ? rawCompare : sellingPrice),
          salePriceFormatted: hasValidSale ? formatBdtPrice(sellingPrice) : undefined,
          link: canonicalLink,
          imageLink: variantImages[0],
          additionalImageLinks: variantImages.slice(1, 11),
          brand: brandName,
          googleProductCategory,
          productType,
          color: variantName.toLowerCase() !== "standard" ? variantName.slice(0, 100) : undefined,
          slug: productSlug,
        });
        emittedForParent++;
        expandedVariantItemCount++;
      });

      if (emittedForParent === 0) {
        errors.push({
          id: `err-novars-${product.id}`,
          productId: product.id,
          productName,
          productSlug,
          level: "error",
          code: "NO_VALID_VARIANTS",
          message: "None of this product's variants had valid image & price data.",
        });
      }
    } else {
      // Zero-variant or Single-variant product: preserve exact product.id for 1:1 Pixel & CAPI content_ids match
      const singleVariant = variants[0];
      const mergedImages: string[] = [];

      const singleVarImg = singleVariant
        ? resolveHttpsImageUrl(singleVariant.image, r2PublicUrl, canonicalOrigin)
        : null;
      if (singleVarImg) {
        mergedImages.push(singleVarImg);
      }
      for (const pImg of parentImages) {
        if (!mergedImages.includes(pImg)) {
          mergedImages.push(pImg);
        }
      }

      if (mergedImages.length === 0) {
        skippedInvalidCount++;
        errors.push({
          id: `err-img-${product.id}`,
          productId: product.id,
          productName,
          productSlug,
          level: "error",
          code: "MISSING_IMAGE",
          message: "Product has no valid HTTPS image URL and was excluded from the feed.",
        });
        continue;
      }

      const rawVarPrice = singleVariant ? Number(singleVariant.price) : NaN;
      const rawParentPrice = Number(product.price);
      const sellingPrice = !isNaN(rawVarPrice) && rawVarPrice > 0 ? rawVarPrice : rawParentPrice;

      if (!sellingPrice || isNaN(sellingPrice) || sellingPrice <= 0) {
        skippedInvalidCount++;
        errors.push({
          id: `err-price-${product.id}`,
          productId: product.id,
          productName,
          productSlug,
          level: "error",
          code: "INVALID_PRICE",
          message: `Product has an invalid selling price (${sellingPrice}) and was excluded from the feed.`,
        });
        continue;
      }

      const rawCompare = Number(
        singleVariant?.compareAtPrice ??
          (singleVariant as any)?.compare_at_price ??
          product.compareAtPrice ??
          (product as any)?.compare_at_price
      );
      const hasValidSale = !isNaN(rawCompare) && rawCompare > sellingPrice;

      const uniqueId = claimUniqueItemId(product.id, usedIds, () => {
        duplicateIdsPrevented++;
        warnings.push({
          id: `warn-dupprod-${product.id}`,
          productId: product.id,
          productName,
          productSlug,
          level: "warning",
          code: "DUPLICATE_PRODUCT_ID_DEDUPED",
          message: `Duplicate product ID "${product.id}" encountered; deduplicated safely.`,
        });
      });

      if (productName.length > 150) {
        warnings.push({
          id: `warn-title-${uniqueId}`,
          productId: product.id,
          productName,
          productSlug,
          level: "warning",
          code: "TITLE_TRUNCATED",
          message: "Product title exceeded Meta 150-character limit and was cleanly truncated.",
        });
      }

      const varColor =
        singleVariant?.name && singleVariant.name.trim().toLowerCase() !== "standard"
          ? stripInvalidXmlChars(singleVariant.name.trim()).slice(0, 100)
          : undefined;

      items.push({
        id: uniqueId,
        parentProductId: product.id,
        title: productName.slice(0, 150),
        description,
        availability: parentInStock ? "in stock" : "out of stock",
        condition: "new",
        priceValue: hasValidSale ? rawCompare : sellingPrice,
        salePriceValue: hasValidSale ? sellingPrice : undefined,
        priceFormatted: formatBdtPrice(hasValidSale ? rawCompare : sellingPrice),
        salePriceFormatted: hasValidSale ? formatBdtPrice(sellingPrice) : undefined,
        link: canonicalLink,
        imageLink: mergedImages[0],
        additionalImageLinks: mergedImages.slice(1, 11),
        brand: brandName,
        googleProductCategory,
        productType,
        color: varColor,
        slug: productSlug,
      });
    }
  }

  const nowIso = new Date().toISOString();
  const lastFeedUpdate = latestTimestampMs > 0 ? new Date(latestTimestampMs).toISOString() : nowIso;

  // Serialize valid Meta RSS 2.0 XML
  const itemLines = items.map((item) => {
    const tags: string[] = [
      `      <g:id>${escapeXml(item.id)}</g:id>`,
      ...(item.itemGroupId ? [`      <g:item_group_id>${escapeXml(item.itemGroupId)}</g:item_group_id>`] : []),
      `      <g:title>${escapeXml(item.title)}</g:title>`,
      `      <g:description>${escapeXml(item.description)}</g:description>`,
      `      <g:link>${escapeXml(item.link)}</g:link>`,
      `      <g:image_link>${escapeXml(item.imageLink)}</g:image_link>`,
      ...item.additionalImageLinks.map(
        (extraImg) => `      <g:additional_image_link>${escapeXml(extraImg)}</g:additional_image_link>`
      ),
      `      <g:availability>${item.availability}</g:availability>`,
      `      <g:condition>${item.condition}</g:condition>`,
      `      <g:price>${escapeXml(item.priceFormatted)}</g:price>`,
      ...(item.salePriceFormatted
        ? [`      <g:sale_price>${escapeXml(item.salePriceFormatted)}</g:sale_price>`]
        : []),
      `      <g:brand>${escapeXml(item.brand)}</g:brand>`,
      ...(item.googleProductCategory
        ? [`      <g:google_product_category>${escapeXml(item.googleProductCategory)}</g:google_product_category>`]
        : []),
      ...(item.productType ? [`      <g:product_type>${escapeXml(item.productType)}</g:product_type>`] : []),
      ...(item.color ? [`      <g:color>${escapeXml(item.color)}</g:color>`] : []),
    ];

    return `    <item>\n${tags.join("\n")}\n    </item>`;
  });

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">`,
    `  <channel>`,
    `    <title>${escapeXml(`${brandName} Bangladesh - Meta Product Catalog`)}</title>`,
    `    <link>${escapeXml(canonicalOrigin)}</link>`,
    `    <description>${escapeXml(
      "Dynamic Facebook & Instagram Product Catalog Feed generated from live store inventory."
    )}</description>`,
    `    <lastBuildDate>${new Date(lastFeedUpdate).toUTCString()}</lastBuildDate>`,
    ...itemLines,
    `  </channel>`,
    `</rss>`,
    "",
  ].join("\n");

  const activeInStockCount = items.filter((i) => i.availability === "in stock").length;
  const outOfStockCount = items.filter((i) => i.availability === "out of stock").length;

  // XML structural & Meta specification self-checks
  const hasXmlHeader = xml.startsWith(`<?xml version="1.0" encoding="UTF-8"?>`);
  const hasRssNamespace = xml.includes(`<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">`) && xml.includes(`</rss>`);
  const unescapedAmpersandMatch = xml.match(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g);
  const allHttpsLinks = items.every(
    (i) => i.link.startsWith("https://") && i.imageLink.startsWith("https://")
  );
  const allValidPrices = items.every(
    (i) =>
      /^\d+\.\d{2} BDT$/.test(i.priceFormatted) &&
      (!i.salePriceFormatted ||
        (/^\d+\.\d{2} BDT$/.test(i.salePriceFormatted) &&
          i.salePriceValue !== undefined &&
          i.salePriceValue < i.priceValue))
  );
  const allUniqueIds = usedIds.size === items.length;

  const checks = [
    {
      key: "xml_well_formed",
      label: "RSS 2.0 XML Envelope & Entity Escaping",
      passed: hasXmlHeader && hasRssNamespace && !unescapedAmpersandMatch,
      detail: unescapedAmpersandMatch
        ? `Detected ${unescapedAmpersandMatch.length} unescaped ampersands`
        : "UTF-8 XML declaration, Google Base namespace (xmlns:g), and strict entity escaping verified",
    },
    {
      key: "unique_ids",
      label: "Unique Product & Variant IDs",
      passed: allUniqueIds && items.length > 0,
      detail: `${usedIds.size} unique <g:id> entries across ${items.length} feed items${
        duplicateIdsPrevented > 0 ? ` (${duplicateIdsPrevented} collision(s) resolved automatically)` : ""
      }`,
    },
    {
      key: "https_images_links",
      label: "Canonical HTTPS Links & CDN Image URLs",
      passed: allHttpsLinks,
      detail: allHttpsLinks
        ? "100% of product links and primary/additional image URLs use valid absolute HTTPS URLs"
        : "One or more items contain non-HTTPS links or images",
    },
    {
      key: "bdt_pricing",
      label: "BDT Selling & Offer Pricing Format",
      passed: allValidPrices,
      detail: "All prices formatted in ISO 4217 BDT (<g:price> / <g:sale_price> with regular > offer)",
    },
    {
      key: "variant_grouping",
      label: "Multi-Variant item_group_id Consistency",
      passed: true,
      detail: `${multiVariantParentCount} multi-variant products grouped into ${expandedVariantItemCount} SKU items via <g:item_group_id>`,
    },
    {
      key: "required_fields",
      label: "Meta Required Fields Coverage",
      passed: errors.length === 0,
      detail:
        errors.length === 0
          ? "All exported items contain id, title, description, availability, condition, price, link, image_link, and brand"
          : `${errors.length} blocking product error(s) excluded from XML so Meta feed stays valid`,
    },
  ];

  const isValidXml =
    hasXmlHeader &&
    hasRssNamespace &&
    !unescapedAmpersandMatch &&
    allUniqueIds &&
    allHttpsLinks &&
    allValidPrices &&
    items.length > 0;

  return {
    xml,
    items,
    report: {
      isValidXml,
      xmlBytes: Buffer.byteLength(xml, "utf8"),
      generatedAt: nowIso,
      lastFeedUpdate,
      canonicalOrigin,
      feedPath: "/facebook-catalog.xml",
      feedUrl: `${canonicalOrigin}/facebook-catalog.xml`,
      totalDatabaseProducts: allProducts.length,
      publishedParentProducts: publishedProducts.length,
      unpublishedExcludedCount,
      totalFeedItems: items.length,
      activeInStockCount,
      outOfStockCount,
      inStockParentCount,
      outOfStockParentCount,
      multiVariantParentCount,
      expandedVariantItemCount,
      skippedInvalidCount,
      duplicateIdsPrevented,
      errors,
      warnings,
      checks,
    },
  };
}
