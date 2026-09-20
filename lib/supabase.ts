import { createClient } from "@supabase/supabase-js";
import type { Category, Product, SiteSettings, LandingPage, RemoteOrder } from "@/lib/types";
import { categories as fallbackCategories, products as fallbackProducts, defaultSettings } from "@/lib/data";

const CATALOG_URL = process.env.SUPABASE_CATALOG_URL || "http://supabasekong-a5tg2fvpwj6emkewfdknamid.187.77.159.209.sslip.io";
const CATALOG_KEY =
  process.env.SUPABASE_CATALOG_KEY ||
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4ODc3MzEwMCwiZXhwIjo0OTQ0NDQ2NzAwLCJyb2xlIjoiYW5vbiJ9.xKr5ARhjhbCSpBSFNjU9LuAl7Do_CMfN0So9h43swaQ";

const ORDERS_URL = process.env.SUPABASE_ORDERS_URL || "https://drbpysumezfjbudxzxzj.supabase.co";
const ORDERS_KEY =
  process.env.SUPABASE_ORDERS_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYnB5c3VtZXpmamJ1ZHh6eHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzE0MzQsImV4cCI6MjA4ODU0NzQzNH0.Ki7U_uXoTxZ4B9x1ExBuYOnTBZwXS9acMkx7CzlT2sA";

export const supabaseCatalog = createClient(CATALOG_URL, CATALOG_KEY);
export const supabaseOrders = createClient(ORDERS_URL, ORDERS_KEY);

function catalogHeaders() {
  return {
    apikey: CATALOG_KEY,
    Authorization: `Bearer ${CATALOG_KEY}`,
    "Content-Type": "application/json",
  };
}

function ordersHeaders() {
  return {
    apikey: ORDERS_KEY,
    Authorization: `Bearer ${ORDERS_KEY}`,
    "Content-Type": "application/json",
  };
}

/* ──────────────────────────────────────────────────────────
/* ──────────────────────────────────────────────────────────
   CATALOG CACHING & FRESH READ CONFIGURATION
   ────────────────────────────────────────────────────────── */

const CATALOG_CACHE_TTL = 15 * 1000; // 15 seconds short fallback cache

let memorySettingsCache: { data: SiteSettings; expiresAt: number } = {
  data: defaultSettings,
  expiresAt: 0,
};

let memoryCategoriesCache: { data: Category[]; expiresAt: number } = {
  data: fallbackCategories,
  expiresAt: 0,
};

let memoryProductCache: { data: Product[]; expiresAt: number } = {
  data: fallbackProducts,
  expiresAt: 0,
};

let memoryLandingPagesCache: { data: LandingPage[]; expiresAt: number } = {
  data: [],
  expiresAt: 0,
};

export function invalidateCatalogSettingsCache(): void {
  memorySettingsCache.expiresAt = 0;
}
export function invalidateCatalogCategoryCache(): void {
  memoryCategoriesCache.expiresAt = 0;
}
export function invalidateCatalogProductCache(): void {
  memoryProductCache.expiresAt = 0;
}
export function invalidateCatalogLandingPagesCache(): void {
  memoryLandingPagesCache.expiresAt = 0;
}
export function invalidateAllCatalogCaches(): void {
  memorySettingsCache.expiresAt = 0;
  memoryCategoriesCache.expiresAt = 0;
  memoryProductCache.expiresAt = 0;
  memoryLandingPagesCache.expiresAt = 0;
}

export async function revalidateCatalog(scope: "all" | "settings" | "products" | "categories" | "landing-pages" = "all"): Promise<void> {
  invalidateAllCatalogCaches();
  try {
    const { revalidateTag, revalidatePath } = await import("next/cache");
    const safeRevalidateTag = (tag: string) => {
      try {
        (revalidateTag as any)(tag, "max");
      } catch {
        try {
          (revalidateTag as any)(tag);
        } catch {}
      }
    };
    if (scope === "settings" || scope === "all") {
      safeRevalidateTag("cb-settings");
    }
    if (scope === "products" || scope === "all") {
      safeRevalidateTag("cb-products");
    }
    if (scope === "categories" || scope === "all") {
      safeRevalidateTag("cb-categories");
    }
    if (scope === "landing-pages" || scope === "all") {
      safeRevalidateTag("cb-landing-pages");
    }
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/shop");
  } catch (e) {
    // Non-fatal if invoked outside Next.js request context
  }
}

export interface CatalogQueryOptions {
  forceFresh?: boolean;
}

/* ──────────────────────────────────────────────────────────
   CATALOG SETTINGS APIS
   ────────────────────────────────────────────────────────── */

export async function getCatalogSettings(opts?: CatalogQueryOptions): Promise<SiteSettings> {
  const forceFresh = Boolean(opts?.forceFresh);
  const now = Date.now();

  if (!forceFresh && memorySettingsCache.expiresAt > now) {
    return memorySettingsCache.data;
  }

  try {
    const fetchOptions: RequestInit = {
      headers: catalogHeaders(),
      signal: AbortSignal.timeout(4500),
      ...(forceFresh
        ? { cache: "no-store" }
        : { next: { revalidate: 30, tags: ["cb-settings"] } }),
    };

    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_settings?id=eq.main_settings&select=*`, fetchOptions);
    if (res.ok) {
      const rows = await res.json();
      if (rows?.[0]?.data && Object.keys(rows[0].data).length > 0) {
        const merged: SiteSettings = { ...defaultSettings, ...rows[0].data };
        memorySettingsCache = {
          data: merged,
          expiresAt: now + CATALOG_CACHE_TTL,
        };
        return merged;
      }
    }
  } catch (e) {
    console.warn("[Supabase] getCatalogSettings failed, using fallback:", e);
  }

  return memorySettingsCache.data;
}

export async function updateCatalogSettings(settings: SiteSettings): Promise<SiteSettings | null> {
  invalidateCatalogSettingsCache();

  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_settings`, {
      method: "POST",
      headers: {
        ...catalogHeaders(),
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: "main_settings",
        data: settings,
      }),
    });

    if (!res.ok) {
      console.error("[Supabase] updateCatalogSettings POST failed:", res.status, await res.text());
      return null;
    }

    // Read back immediately from database to verify and return real saved data
    const verifyRes = await fetch(`${CATALOG_URL}/rest/v1/cb_settings?id=eq.main_settings&select=*`, {
      headers: catalogHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });

    if (verifyRes.ok) {
      const rows = await verifyRes.json();
      if (rows?.[0]?.data) {
        const savedSettings: SiteSettings = { ...defaultSettings, ...rows[0].data };
        memorySettingsCache = {
          data: savedSettings,
          expiresAt: Date.now() + CATALOG_CACHE_TTL,
        };
        await revalidateCatalog("settings");
        return savedSettings;
      }
    }

    // If verify query couldn't parse row, still return merged payload
    const merged = { ...defaultSettings, ...settings };
    memorySettingsCache = { data: merged, expiresAt: Date.now() + CATALOG_CACHE_TTL };
    await revalidateCatalog("settings");
    return merged;
  } catch (e) {
    console.error("[Supabase] updateCatalogSettings error:", e);
    return null;
  }
}

/* ──────────────────────────────────────────────────────────
   CATALOG PRODUCTS APIS
   ────────────────────────────────────────────────────────── */

export async function getCatalogProducts(opts?: CatalogQueryOptions): Promise<Product[]> {
  const forceFresh = Boolean(opts?.forceFresh);
  const now = Date.now();

  if (!forceFresh && memoryProductCache.data && memoryProductCache.data.length > 0 && now < memoryProductCache.expiresAt) {
    return memoryProductCache.data;
  }

  try {
    const fetchOptions: RequestInit = {
      headers: catalogHeaders(),
      signal: AbortSignal.timeout(5000),
      ...(forceFresh
        ? { cache: "no-store" }
        : { next: { revalidate: 30, tags: ["cb-products"] } }),
    };

    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_products?select=*`, fetchOptions);
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        const products = rows.map((r: any) => r.data).filter(Boolean);
        if (products.length > 0) {
          memoryProductCache = {
            data: products as Product[],
            expiresAt: now + CATALOG_CACHE_TTL,
          };
          return products as Product[];
        }
      }
    }
  } catch (e) {
    console.warn("[Supabase] getCatalogProducts failed, using fallback:", e);
  }

  return memoryProductCache.data || fallbackProducts;
}

export async function upsertCatalogProduct(id: string, productData: Partial<Product>): Promise<Product | null> {
  invalidateCatalogProductCache();

  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_products`, {
      method: "POST",
      headers: {
        ...catalogHeaders(),
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id,
        data: productData,
      }),
    });

    if (!res.ok) {
      console.error("[Supabase] upsertCatalogProduct POST failed:", res.status, await res.text());
      return null;
    }

    // Read back immediately from database to verify and return real saved data
    const verifyRes = await fetch(`${CATALOG_URL}/rest/v1/cb_products?id=eq.${encodeURIComponent(id)}&select=*`, {
      headers: catalogHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });

    if (verifyRes.ok) {
      const rows = await verifyRes.json();
      if (rows?.[0]?.data) {
        const savedProduct = rows[0].data as Product;
        const existing = memoryProductCache.data.filter((p) => p.id !== id);
        memoryProductCache = {
          data: [...existing, savedProduct],
          expiresAt: Date.now() + CATALOG_CACHE_TTL,
        };
        await revalidateCatalog("products");
        return savedProduct;
      }
    }

    const fallbackSaved = { id, ...productData } as Product;
    await revalidateCatalog("products");
    return fallbackSaved;
  } catch (e) {
    console.error("[Supabase] upsertCatalogProduct error:", e);
    return null;
  }
}

export async function deleteCatalogProduct(id: string): Promise<boolean> {
  invalidateCatalogProductCache();

  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_products?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: catalogHeaders(),
    });

    if (res.ok) {
      memoryProductCache = {
        data: memoryProductCache.data.filter((p) => p.id !== id),
        expiresAt: Date.now() + CATALOG_CACHE_TTL,
      };
      await revalidateCatalog("products");
      return true;
    }
    return false;
  } catch (e) {
    console.error("[Supabase] deleteCatalogProduct error:", e);
    return false;
  }
}

/* ──────────────────────────────────────────────────────────
   CATALOG CATEGORIES APIS
   ────────────────────────────────────────────────────────── */

export async function getCatalogCategories(opts?: CatalogQueryOptions): Promise<Category[]> {
  const forceFresh = Boolean(opts?.forceFresh);
  const now = Date.now();

  if (!forceFresh && memoryCategoriesCache.data && memoryCategoriesCache.data.length > 0 && now < memoryCategoriesCache.expiresAt) {
    return memoryCategoriesCache.data;
  }

  try {
    const fetchOptions: RequestInit = {
      headers: catalogHeaders(),
      signal: AbortSignal.timeout(4500),
      ...(forceFresh
        ? { cache: "no-store" }
        : { next: { revalidate: 30, tags: ["cb-categories"] } }),
    };

    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_categories?select=*`, fetchOptions);
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        const categories = rows.map((r: any) => r.data).filter(Boolean);
        if (categories.length > 0) {
          memoryCategoriesCache = {
            data: categories as Category[],
            expiresAt: now + CATALOG_CACHE_TTL,
          };
          return categories as Category[];
        }
      }
    }
  } catch (e) {
    console.warn("[Supabase] getCatalogCategories failed, using fallback:", e);
  }

  return memoryCategoriesCache.data || fallbackCategories;
}

export async function upsertCatalogCategory(id: string, categoryData: Partial<Category>): Promise<Category | null> {
  invalidateCatalogCategoryCache();

  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_categories`, {
      method: "POST",
      headers: {
        ...catalogHeaders(),
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id,
        data: categoryData,
      }),
    });

    if (!res.ok) {
      console.error("[Supabase] upsertCatalogCategory POST failed:", res.status, await res.text());
      return null;
    }

    // Read back immediately from database to verify and return real saved data
    const verifyRes = await fetch(`${CATALOG_URL}/rest/v1/cb_categories?id=eq.${encodeURIComponent(id)}&select=*`, {
      headers: catalogHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });

    if (verifyRes.ok) {
      const rows = await verifyRes.json();
      if (rows?.[0]?.data) {
        const savedCategory = rows[0].data as Category;
        const existing = memoryCategoriesCache.data.filter((c) => c.id !== id);
        memoryCategoriesCache = {
          data: [...existing, savedCategory],
          expiresAt: Date.now() + CATALOG_CACHE_TTL,
        };
        await revalidateCatalog("categories");
        return savedCategory;
      }
    }

    const fallbackSaved = { id, ...categoryData } as Category;
    await revalidateCatalog("categories");
    return fallbackSaved;
  } catch (e) {
    console.error("[Supabase] upsertCatalogCategory error:", e);
    return null;
  }
}

export async function deleteCatalogCategory(id: string): Promise<boolean> {
  invalidateCatalogCategoryCache();

  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_categories?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: catalogHeaders(),
    });

    if (res.ok) {
      memoryCategoriesCache = {
        data: memoryCategoriesCache.data.filter((c) => c.id !== id),
        expiresAt: Date.now() + CATALOG_CACHE_TTL,
      };
      await revalidateCatalog("categories");
      return true;
    }
    return false;
  } catch (e) {
    console.error("[Supabase] deleteCatalogCategory error:", e);
    return false;
  }
}

/* ──────────────────────────────────────────────────────────
   LANDING PAGES APIS
   ────────────────────────────────────────────────────────── */

export async function getLandingPages(opts?: CatalogQueryOptions): Promise<LandingPage[]> {
  const forceFresh = Boolean(opts?.forceFresh);
  const now = Date.now();

  if (!forceFresh && memoryLandingPagesCache.data && memoryLandingPagesCache.data.length > 0 && now < memoryLandingPagesCache.expiresAt) {
    return memoryLandingPagesCache.data;
  }

  try {
    const fetchOptions: RequestInit = {
      headers: catalogHeaders(),
      signal: AbortSignal.timeout(4500),
      ...(forceFresh
        ? { cache: "no-store" }
        : { next: { revalidate: 30, tags: ["cb-landing-pages"] } }),
    };

    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_landing_pages?select=*`, fetchOptions);
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        const lps = rows.map((r: any) => {
          const data = r.data || {};
          if (!data.id && r.id) data.id = r.id;
          return data as LandingPage;
        });
        memoryLandingPagesCache = {
          data: lps,
          expiresAt: now + CATALOG_CACHE_TTL,
        };
        return lps;
      }
    }
  } catch (e) {
    console.warn("[Supabase] getLandingPages failed, using fallback:", e);
  }

  return memoryLandingPagesCache.data || [];
}

export async function getLandingPage(slug: string, opts?: CatalogQueryOptions): Promise<LandingPage | null> {
  const forceFresh = Boolean(opts?.forceFresh);
  if (!forceFresh) {
    const lps = await getLandingPages();
    const match = lps.find((lp) => lp.id === slug || lp.slug === slug);
    if (match) return match;
  }

  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_landing_pages?id=eq.${encodeURIComponent(slug)}&select=*`, {
      headers: catalogHeaders(),
      cache: forceFresh ? "no-store" : "default",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const rows = await res.json();
      if (rows?.[0]) {
        const data = rows[0].data || {};
        if (!data.id) data.id = rows[0].id || slug;
        return data as LandingPage;
      }
    }
  } catch (e) {
    // Non-fatal fallback
  }
  return null;
}

export async function upsertLandingPage(id: string, data: Partial<LandingPage>): Promise<LandingPage | null> {
  invalidateCatalogLandingPagesCache();

  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_landing_pages`, {
      method: "POST",
      headers: {
        ...catalogHeaders(),
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id,
        data,
      }),
    });

    if (!res.ok) {
      console.error("[Supabase] upsertLandingPage POST failed:", res.status, await res.text());
      return null;
    }

    // Read back immediately from database to verify and return real saved data
    const verifyRes = await fetch(`${CATALOG_URL}/rest/v1/cb_landing_pages?id=eq.${encodeURIComponent(id)}&select=*`, {
      headers: catalogHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });

    if (verifyRes.ok) {
      const rows = await verifyRes.json();
      if (rows?.[0]?.data) {
        const savedLp = rows[0].data as LandingPage;
        if (!savedLp.id) savedLp.id = rows[0].id || id;
        const existing = memoryLandingPagesCache.data.filter((lp) => lp.id !== id && lp.slug !== id);
        memoryLandingPagesCache = {
          data: [...existing, savedLp],
          expiresAt: Date.now() + CATALOG_CACHE_TTL,
        };
        await revalidateCatalog("landing-pages");
        return savedLp;
      }
    }

    const fallbackSaved = { id, ...data } as LandingPage;
    await revalidateCatalog("landing-pages");
    return fallbackSaved;
  } catch (e) {
    console.error("[Supabase] upsertLandingPage error:", e);
    return null;
  }
}

export async function deleteLandingPage(id: string): Promise<boolean> {
  invalidateCatalogLandingPagesCache();

  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_landing_pages?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: catalogHeaders(),
    });

    if (res.ok) {
      memoryLandingPagesCache = {
        data: memoryLandingPagesCache.data.filter((lp) => lp.id !== id && lp.slug !== id),
        expiresAt: Date.now() + CATALOG_CACHE_TTL,
      };
      await revalidateCatalog("landing-pages");
      return true;
    }
    return false;
  } catch (e) {
    console.error("[Supabase] deleteLandingPage error:", e);
    return false;
  }
}

/* ──────────────────────────────────────────────────────────
   ORDERS DB APIS (REMOTE ORDERS)
   ────────────────────────────────────────────────────────── */

export async function getRemoteOrders(limit = 200): Promise<RemoteOrder[]> {
  try {
    const res = await fetch(
      `${ORDERS_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=${limit}`,
      {
        headers: ordersHeaders(),
        cache: "no-store",
      }
    );
    if (res.ok) {
      return (await res.json()) as RemoteOrder[];
    }
  } catch (e) {
    console.error("[Supabase] getRemoteOrders error:", e);
  }
  return [];
}

export async function getRemoteOrderById(orderId: string): Promise<RemoteOrder | null> {
  try {
    const res = await fetch(`${ORDERS_URL}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=*`, {
      headers: ordersHeaders(),
      cache: "no-store",
    });
    if (res.ok) {
      const rows = await res.json();
      return (rows?.[0] as RemoteOrder) || null;
    }
  } catch (e) {
    console.error(`[Supabase] getRemoteOrderById error for ${orderId}:`, e);
  }
  return null;
}

export async function getRemoteOrdersByPhone(phone: string): Promise<RemoteOrder[]> {
  try {
    const digits = phone.replace(/\D/g, "");
    if (!digits || digits.length < 4) return [];
    const last11 = digits.length >= 11 ? digits.slice(-11) : digits;

    const res = await fetch(
      `${ORDERS_URL}/rest/v1/orders?phone=ilike.*${encodeURIComponent(last11)}*&order=created_at.desc&limit=20`,
      {
        headers: ordersHeaders(),
        cache: "no-store",
      }
    );
    if (res.ok) {
      return (await res.json()) as RemoteOrder[];
    }
  } catch (e) {
    console.error("[Supabase] getRemoteOrdersByPhone error:", e);
  }
  return [];
}

export async function insertRemoteOrder(orderData: Partial<RemoteOrder>): Promise<boolean> {
  try {
    const res = await fetch(`${ORDERS_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        ...ordersHeaders(),
        Prefer: "return=representation",
      },
      body: JSON.stringify(orderData),
    });
    return res.ok;
  } catch (e) {
    console.error("[Supabase] insertRemoteOrder error:", e);
    return false;
  }
}

export async function updateRemoteOrderStatus(orderId: string, status: string): Promise<boolean> {
  try {
    const res = await fetch(`${ORDERS_URL}/rest/v1/orders?id=eq.${orderId}`, {
      method: "PATCH",
      headers: ordersHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch (e) {
    console.error("[Supabase] updateRemoteOrderStatus error:", e);
    return false;
  }
}

export async function deleteRemoteOrder(orderId: string): Promise<boolean> {
  try {
    const res = await fetch(`${ORDERS_URL}/rest/v1/orders?id=eq.${orderId}`, {
      method: "DELETE",
      headers: ordersHeaders(),
    });
    return res.ok;
  } catch (e) {
    console.error("[Supabase] deleteRemoteOrder error:", e);
    return false;
  }
}

/* ──────────────────────────────────────────────────────────
   SUPABASE AUTH APIS
   ────────────────────────────────────────────────────────── */

export async function verifyAdminCredentials(email: string, password: string): Promise<any> {
  try {
    const res = await fetch(`${CATALOG_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: CATALOG_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("[Supabase] verifyAdminCredentials error:", e);
  }
  return null;
}

export const supabaseCatalogService = {
  getSettings: getCatalogSettings,
  updateSettings: updateCatalogSettings,
  invalidateSettingsCache: invalidateCatalogSettingsCache,
  getCategories: getCatalogCategories,
  upsertCategory: upsertCatalogCategory,
  deleteCategory: deleteCatalogCategory,
  invalidateCategoryCache: invalidateCatalogCategoryCache,
  getCatalogProducts: getCatalogProducts,
  upsertProduct: upsertCatalogProduct,
  deleteProduct: deleteCatalogProduct,
  invalidateProductCache: invalidateCatalogProductCache,
  getLandingPages: getLandingPages,
  getLandingPage: getLandingPage,
  upsertLandingPage: upsertLandingPage,
  deleteLandingPage: deleteLandingPage,
  invalidateLandingPagesCache: invalidateCatalogLandingPagesCache,
  invalidateAllCaches: invalidateAllCatalogCaches,
  revalidateCatalog,
};

export const supabaseOrdersService = {
  insertOrder: insertRemoteOrder,
  getOrderById: getRemoteOrderById,
  getOrdersByPhone: getRemoteOrdersByPhone,
  updateOrderStatus: updateRemoteOrderStatus,
  deleteOrder: deleteRemoteOrder,
};