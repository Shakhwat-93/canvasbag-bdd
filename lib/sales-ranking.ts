import type { Product } from "./types";
import { getAllLocalOrders } from "./db";

const ORDERS_URL =
  process.env.SUPABASE_ORDERS_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "http://supabasekong-a5tg2fvpwj6emkewfdknamid.187.77.159.209.sslip.io";
const ORDERS_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ORDERS_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4ODc3MzEwMCwiZXhwIjo0OTQ0NDQ2NzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.oJDLraUnEOqNYdxvPPozV4U2ugVcuedE-oNBNJNHhCU";

export interface ProductSalesStat {
  productId: string;
  unitsSold: number;
  orderCount: number;
  lastSoldAt: string | null;
}

// In-memory cache for fast SSR responses
let cachedRanking: { stats: Map<string, ProductSalesStat>; timestamp: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

/**
 * Normalizes text for reliable matching between catalog products and order line items
 */
function normalizeName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Derives genuine product sales statistics from real completed orders
 */
export async function getRealProductSalesStats(
  catalogProducts: Product[]
): Promise<Map<string, ProductSalesStat>> {
  const now = Date.now();
  if (cachedRanking && now - cachedRanking.timestamp < CACHE_TTL_MS) {
    return cachedRanking.stats;
  }

  const statsMap = new Map<string, ProductSalesStat>();
  for (const p of catalogProducts) {
    statsMap.set(p.id, {
      productId: p.id,
      unitsSold: 0,
      orderCount: 0,
      lastSoldAt: null,
    });
  }

  // 1. Fetch remote orders from primary orders Supabase (limit to 200 recent orders with 1.5s timeout)
  let remoteOrders: any[] = [];
  try {
    const res = await fetch(
      `${ORDERS_URL}/rest/v1/orders?select=id,product_name,ordered_items,quantity,status,created_at&order=created_at.desc&limit=200`,
      {
        headers: {
          apikey: ORDERS_KEY,
          Authorization: `Bearer ${ORDERS_KEY}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(1500),
        next: { revalidate: 600, tags: ["orders-sales-stats"] },
      }
    );
    if (res.ok) {
      remoteOrders = await res.json();
    }
  } catch (err) {
    // Non-fatal: fallback to local orders or flag
  }

  // 2. Fetch local orders from SQLite
  let localOrders: any[] = [];
  try {
    localOrders = getAllLocalOrders();
  } catch (err) {
    // Ignore if not initialized
  }

  // Pre-index catalog products with normalized search tokens
  const indexedCatalog = catalogProducts.map((p) => {
    const normName = normalizeName(p.name);
    const normSlug = normalizeName(p.slug.replace(/-/g, " "));
    return {
      product: p,
      normName,
      normSlug,
    };
  });

  // Helper to process an order
  function processOrder(order: any) {
    const st = String(order.status || "").toLowerCase().trim();
    // Exclude invalid, cancelled, fake, returned, or test orders
    if (
      st.includes("cancel") ||
      st.includes("fake") ||
      st.includes("incomplete") ||
      st.includes("return") ||
      st.includes("fail")
    ) {
      return;
    }

    const createdAt = order.created_at || new Date().toISOString();

    // Check items
    let lineItems: { name: string; quantity: number }[] = [];
    if (Array.isArray(order.ordered_items) && order.ordered_items.length > 0) {
      lineItems = order.ordered_items.map((it: any) => ({
        name: String(it.name || ""),
        quantity: Math.max(1, Number(it.quantity) || 1),
      }));
    } else if (Array.isArray(order.items) && order.items.length > 0) {
      lineItems = order.items.map((it: any) => ({
        name: String(it.product_name || ""),
        quantity: Math.max(1, Number(it.quantity) || 1),
      }));
    } else if (order.product_name) {
      lineItems = [
        {
          name: String(order.product_name),
          quantity: Math.max(1, Number(order.quantity) || 1),
        },
      ];
    }

    for (const item of lineItems) {
      if (!item.name) continue;
      const normItem = normalizeName(item.name);

      // Find matching catalog product
      let matchedProductId: string | null = null;

      for (const entry of indexedCatalog) {
        if (
          normItem.includes(entry.normName) ||
          entry.normName.includes(normItem) ||
          normItem.includes(entry.normSlug)
        ) {
          matchedProductId = entry.product.id;
          break;
        }
      }

      if (matchedProductId && statsMap.has(matchedProductId)) {
        const current = statsMap.get(matchedProductId)!;
        current.unitsSold += item.quantity;
        current.orderCount += 1;
        if (!current.lastSoldAt || new Date(createdAt) > new Date(current.lastSoldAt)) {
          current.lastSoldAt = createdAt;
        }
      }
    }
  }

  // Aggregate remote and local orders
  remoteOrders.forEach(processOrder);
  localOrders.forEach(processOrder);

  cachedRanking = {
    stats: statsMap,
    timestamp: now,
  };

  return statsMap;
}

/**
 * Invalidates the sales rankings cache when a new order is received
 */
export function invalidateSalesStatsCache() {
  cachedRanking = null;
}
