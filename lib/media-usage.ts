import { getCatalogProducts, getCatalogCategories, getCatalogSettings } from "@/lib/supabase";
import { extractR2Key } from "@/lib/r2";

export interface MediaUsageItem {
  type: "product" | "variant" | "category" | "setting" | "landing_page";
  id: string;
  name: string;
  extra?: string;
}

export interface MediaUsageRecord {
  key: string;
  isUsed: boolean;
  usedIn: MediaUsageItem[];
}

/**
 * Scans all catalog products, categories, and site settings to build a comprehensive
 * usage map for every R2 object key.
 */
export async function getMediaUsageMap(): Promise<Record<string, MediaUsageItem[]>> {
  const usageMap: Record<string, MediaUsageItem[]> = {};

  function recordUsage(urlOrKey: string | null | undefined, item: MediaUsageItem) {
    if (!urlOrKey) return;
    const key = extractR2Key(urlOrKey);
    if (!key) return;

    if (!usageMap[key]) {
      usageMap[key] = [];
    }
    // Avoid duplicates for the same item
    const exists = usageMap[key].some(
      (u) => u.type === item.type && u.id === item.id && u.extra === item.extra
    );
    if (!exists) {
      usageMap[key].push(item);
    }
  }

  try {
    const [products, categories, settings] = await Promise.all([
      getCatalogProducts(),
      getCatalogCategories(),
      getCatalogSettings(),
    ]);

    // 1. Scan products
    for (const p of products) {
      // Main image
      recordUsage(p.image, { type: "product", id: p.id, name: p.name, extra: "Primary Image" });
      recordUsage(p.imageUrl, { type: "product", id: p.id, name: p.name, extra: "Image URL" });

      // Gallery images
      if (Array.isArray(p.images)) {
        for (const img of p.images) {
          const url = typeof img === "string" ? img : img?.url;
          recordUsage(url, { type: "product", id: p.id, name: p.name, extra: "Gallery Image" });
        }
      }

      // Variants
      if (Array.isArray(p.variants)) {
        for (const v of p.variants) {
          if (v.image) {
            recordUsage(v.image, {
              type: "variant",
              id: p.id,
              name: p.name,
              extra: `Variant: ${v.name}`,
            });
          }
        }
      }
    }

    // 2. Scan categories
    for (const c of categories) {
      recordUsage(c.image, { type: "category", id: c.id, name: c.name, extra: "Category Banner" });
    }

    // 3. Scan site settings
    if (settings) {
      const settingFields: (keyof typeof settings)[] = [
        "heroBgImage",
        "heroSliderImage1",
        "heroSliderImage2",
        "heroSliderImage3",
        "heroImage1",
        "heroImage2",
        "heroImage3",
        "heroImage4",
        "heroImage5",
        "heroImage6",
        "heroImage7",
      ];
      for (const f of settingFields) {
        const val = settings[f];
        if (typeof val === "string" && val) {
          recordUsage(val, { type: "setting", id: "site_settings", name: "Site Settings", extra: f });
        }
      }
    }
  } catch (err) {
    console.error("[Media Usage Map Error]", err);
  }

  return usageMap;
}
