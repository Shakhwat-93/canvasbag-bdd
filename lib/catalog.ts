import type { Product, Category, SiteSettings } from "./types";
import { supabaseCatalogService } from "./supabase";
import { getRealProductSalesStats } from "./sales-ranking";
import {
  buildCategoryTree,
  getCategoryDescendantSlugs,
  getCategoryBreadcrumbs,
  type CategoryTreeNode,
} from "./category-tree";

/**
 * Sort products based on Category Product Order settings
 */
export function sortProductsByOrder(
  products: Product[],
  categorySlug: string = "all",
  settings?: SiteSettings
): Product[] {
  const ordersMap = settings?.category_product_orders || {};

  let orderList: string[] = [];
  if (categorySlug && ordersMap[categorySlug] && Array.isArray(ordersMap[categorySlug])) {
    orderList = ordersMap[categorySlug];
  } else if (ordersMap.all && Array.isArray(ordersMap.all)) {
    orderList = ordersMap.all;
  }

  if (!orderList || orderList.length === 0) {
    return products;
  }

  const orderMap = new Map<string, number>();
  orderList.forEach((id, index) => {
    orderMap.set(id, index);
  });

  return [...products].sort((a, b) => {
    const posA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
    const posB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
    return posA - posB;
  });
}

/**
 * Get catalog products sorted by category or default order
 */
export async function getSortedProducts(categorySlug: string = "all"): Promise<Product[]> {
  const [products, settings, categories] = await Promise.all([
    supabaseCatalogService.getCatalogProducts(),
    supabaseCatalogService.getSettings(),
    supabaseCatalogService.getCategories(),
  ]);

  const activeProducts = products.filter((p) => p.status !== "inactive" && p.status !== "draft");

  if (categorySlug !== "all") {
    // Collect target slug and all descendant slugs for rollup support
    const matchingSlugs = getCategoryDescendantSlugs(categorySlug, categories);
    const filtered = activeProducts.filter((p) => {
      const pSlug = p.categorySlug || (p as any).category_slug;
      if (matchingSlugs.includes(pSlug)) return true;
      if (Array.isArray(p.additionalCategorySlugs)) {
        return p.additionalCategorySlugs.some((s) => matchingSlugs.includes(s));
      }
      return false;
    });

    return sortProductsByOrder(filtered, categorySlug, settings);
  }

  return sortProductsByOrder(activeProducts, "all", settings);
}

/**
 * Get Top Selling products derived strictly from real customer sales data
 */
export async function getTopSellingProducts(limit = 8): Promise<Product[]> {
  const products = await supabaseCatalogService.getCatalogProducts();
  const activeProducts = products.filter((p) => p.status !== "inactive" && p.status !== "draft");

  try {
    const salesStats = await getRealProductSalesStats(activeProducts);

    // Attach salesCount and sort by unitsSold DESC, then lastSoldAt DESC
    const scoredProducts = activeProducts.map((p) => {
      const stat = salesStats.get(p.id);
      const unitsSold = stat?.unitsSold || 0;
      return {
        ...p,
        salesCount: unitsSold,
        _lastSoldAt: stat?.lastSoldAt || null,
      };
    });

    scoredProducts.sort((a, b) => {
      // Primary: units sold
      if (b.salesCount !== a.salesCount) {
        return (b.salesCount || 0) - (a.salesCount || 0);
      }
      // Secondary: latest sale
      if (a._lastSoldAt && b._lastSoldAt) {
        return new Date(b._lastSoldAt).getTime() - new Date(a._lastSoldAt).getTime();
      }
      // Fallback: isBestSeller flag
      if (b.isBestSeller && !a.isBestSeller) return 1;
      if (a.isBestSeller && !b.isBestSeller) return -1;
      return 0;
    });

    return scoredProducts.slice(0, limit);
  } catch (error) {
    console.error("[Catalog] getTopSellingProducts failed:", error);
    // Graceful fallback to isBestSeller if order DB unreachable
    return activeProducts
      .filter((p) => p.isBestSeller || p.is_best_seller)
      .slice(0, limit);
  }
}

/**
 * Get New Arrivals ordered by newest creation date / timestamp
 */
export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const products = await supabaseCatalogService.getCatalogProducts();
  const activeProducts = products.filter((p) => p.status !== "inactive" && p.status !== "draft");

  return [...activeProducts]
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : extractTimestampFromId(a.id);
      const dateB = b.created_at ? new Date(b.created_at).getTime() : extractTimestampFromId(b.id);
      return dateB - dateA;
    })
    .slice(0, limit);
}

/**
 * Helper to extract timestamp from IDs like 'prod-1780987405757'
 */
function extractTimestampFromId(id: string): number {
  const match = id.match(/\d{10,13}/);
  if (match) {
    const num = Number(match[0]);
    if (num > 100000000000) return num; // 13-digit ms
    if (num > 100000000) return num * 1000; // 10-digit s
  }
  return 0;
}

/**
 * Get Featured Products manually configured by admin
 */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const products = await supabaseCatalogService.getCatalogProducts();
  const activeProducts = products.filter((p) => p.status !== "inactive" && p.status !== "draft");

  const featured = activeProducts.filter(
    (p) => p.isFeatured || p.is_featured || (p.badge && p.badge.toLowerCase().includes("featured"))
  );

  return featured.slice(0, limit);
}

/**
 * Get category tree with accurate product count rollups
 */
export async function getCategoryTreeData(): Promise<CategoryTreeNode[]> {
  const [categories, products] = await Promise.all([
    supabaseCatalogService.getCategories(),
    supabaseCatalogService.getCatalogProducts(),
  ]);

  return buildCategoryTree(categories, products);
}

/**
 * Get dynamic category breadcrumbs
 */
export async function getCategoryBreadcrumbsData(categorySlug: string) {
  const categories = await supabaseCatalogService.getCategories();
  return getCategoryBreadcrumbs(categorySlug, categories);
}
