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
   CATALOG SETTINGS APIS
   ────────────────────────────────────────────────────────── */

export async function getCatalogSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_settings?id=eq.main_settings&select=*`, {
      headers: catalogHeaders(),
      next: { revalidate: 60, tags: ["cb-settings"] },
    });
    if (res.ok) {
      const rows = await res.json();
      if (rows?.[0]?.data && Object.keys(rows[0].data).length > 0) {
        return rows[0].data as SiteSettings;
      }
    }
  } catch (e) {
    console.error("[Supabase] getCatalogSettings error:", e);
  }
  return defaultSettings;
}

export async function updateCatalogSettings(settings: SiteSettings): Promise<boolean> {
  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_settings`, {
      method: "POST",
      headers: {
        ...catalogHeaders(),
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        id: "main_settings",
        data: settings,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error("[Supabase] updateCatalogSettings error:", e);
    return false;
  }
}

/* ──────────────────────────────────────────────────────────
   CATALOG PRODUCTS APIS
   ────────────────────────────────────────────────────────── */

let memoryProductCache: { data: Product[]; expiresAt: number } | null = null;

export function invalidateCatalogProductCache(): void {
  memoryProductCache = null;
}

export async function getCatalogProducts(): Promise<Product[]> {
  const now = Date.now();
  if (memoryProductCache && now < memoryProductCache.expiresAt) {
    return memoryProductCache.data;
  }

  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_products?select=*`, {
      headers: catalogHeaders(),
      cache: "no-store",
    });
    if (res.ok) {
      const rows = await res.json();
      const products = rows.map((r: any) => r.data).filter(Boolean);
      if (products.length > 0) {
        memoryProductCache = {
          data: products as Product[],
          expiresAt: now + 60_000, // 60 seconds TTL
        };
        return memoryProductCache.data;
      }
    }
  } catch (e) {
    console.error("[Supabase] getCatalogProducts error:", e);
  }
  return fallbackProducts;
}

export async function upsertCatalogProduct(id: string, productData: Partial<Product>): Promise<boolean> {
  invalidateCatalogProductCache();
  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_products`, {
      method: "POST",
      headers: {
        ...catalogHeaders(),
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        id,
        data: productData,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error("[Supabase] upsertCatalogProduct error:", e);
    return false;
  }
}

export async function deleteCatalogProduct(id: string): Promise<boolean> {
  invalidateCatalogProductCache();
  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_products?id=eq.${id}`, {
      method: "DELETE",
      headers: catalogHeaders(),
    });
    return res.ok;
  } catch (e) {
    console.error("[Supabase] deleteCatalogProduct error:", e);
    return false;
  }
}

/* ──────────────────────────────────────────────────────────
   CATALOG CATEGORIES APIS
   ────────────────────────────────────────────────────────── */

export async function getCatalogCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_categories?select=*`, {
      headers: catalogHeaders(),
      next: { revalidate: 60, tags: ["cb-categories"] },
    });
    if (res.ok) {
      const rows = await res.json();
      const categories = rows.map((r: any) => r.data).filter(Boolean);
      if (categories.length > 0) {
        return categories as Category[];
      }
    }
  } catch (e) {
    console.error("[Supabase] getCatalogCategories error:", e);
  }
  return fallbackCategories;
}

export async function upsertCatalogCategory(id: string, categoryData: Partial<Category>): Promise<boolean> {
  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_categories`, {
      method: "POST",
      headers: {
        ...catalogHeaders(),
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        id,
        data: categoryData,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error("[Supabase] upsertCatalogCategory error:", e);
    return false;
  }
}

export async function deleteCatalogCategory(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_categories?id=eq.${id}`, {
      method: "DELETE",
      headers: catalogHeaders(),
    });
    return res.ok;
  } catch (e) {
    console.error("[Supabase] deleteCatalogCategory error:", e);
    return false;
  }
}

/* ──────────────────────────────────────────────────────────
   LANDING PAGES APIS
   ────────────────────────────────────────────────────────── */

export async function getLandingPages(): Promise<LandingPage[]> {
  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_landing_pages?select=*`, {
      headers: catalogHeaders(),
      next: { revalidate: 60, tags: ["cb-landing-pages"] },
    });
    if (res.ok) {
      const rows = await res.json();
      return rows.map((r: any) => {
        const data = r.data || {};
        if (!data.id && r.id) data.id = r.id;
        return data as LandingPage;
      });
    }
  } catch (e) {
    console.error("[Supabase] getLandingPages error:", e);
  }
  return [];
}

export async function getLandingPage(slug: string): Promise<LandingPage | null> {
  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_landing_pages?id=eq.${slug}&select=*`, {
      headers: catalogHeaders(),
      next: { revalidate: 60, tags: ["cb-landing-pages"] },
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
    console.error("[Supabase] getLandingPage error:", e);
  }
  return null;
}

export async function upsertLandingPage(id: string, data: Partial<LandingPage>): Promise<boolean> {
  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_landing_pages`, {
      method: "POST",
      headers: {
        ...catalogHeaders(),
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        id,
        data,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error("[Supabase] upsertLandingPage error:", e);
    return false;
  }
}

export async function deleteLandingPage(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${CATALOG_URL}/rest/v1/cb_landing_pages?id=eq.${id}`, {
      method: "DELETE",
      headers: catalogHeaders(),
    });
    return res.ok;
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
  getCategories: getCatalogCategories,
  upsertCategory: upsertCatalogCategory,
  deleteCategory: deleteCatalogCategory,
  getCatalogProducts: getCatalogProducts,
  upsertProduct: upsertCatalogProduct,
  deleteProduct: deleteCatalogProduct,
  getLandingPages: getLandingPages,
  getLandingPage: getLandingPage,
  upsertLandingPage: upsertLandingPage,
  deleteLandingPage: deleteLandingPage,
};

export const supabaseOrdersService = {
  insertOrder: insertRemoteOrder,
  getOrderById: getRemoteOrderById,
  getOrdersByPhone: getRemoteOrdersByPhone,
  updateOrderStatus: updateRemoteOrderStatus,
  deleteOrder: deleteRemoteOrder,
};