import type { Category, Product } from "./types";

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  depth: number;
  directProductCount: number;
  totalProductCount: number;
}

export interface FlattenedCategoryItem {
  category: Category;
  depth: number;
  prefix: string;
  hasChildren: boolean;
  isLastChild: boolean;
}

export interface BreadcrumbItem {
  name: string;
  slug: string;
  href: string;
}

/**
 * Normalizes parent ID to null if empty or undefined
 */
export function normalizeParentId(parentId?: string | null): string | null {
  if (!parentId || parentId === "null" || parentId === "undefined" || parentId === "root") {
    return null;
  }
  return String(parentId).trim();
}

/**
 * Normalizes category sort order
 */
export function getCategorySortOrder(cat: Category): number {
  if (typeof cat.sortOrder === "number") return cat.sortOrder;
  if (typeof cat.sort_order === "number") return cat.sort_order;
  return 0;
}

/**
 * Normalizes category active status (default true)
 */
export function isCategoryActive(cat: Category): boolean {
  if (typeof cat.isActive === "boolean") return cat.isActive;
  if (typeof cat.is_active === "boolean") return cat.is_active;
  return true;
}

/**
 * Normalizes category visible in menu status (default true)
 */
export function isCategoryVisible(cat: Category): boolean {
  if (typeof cat.isVisible === "boolean") return cat.isVisible;
  if (typeof cat.is_visible === "boolean") return cat.is_visible;
  return true;
}

/**
 * Builds a hierarchical tree from a flat category list and calculates accurate product counts
 */
export function buildCategoryTree(
  categories: Category[],
  products: Product[] = []
): CategoryTreeNode[] {
  if (!Array.isArray(categories)) return [];

  // Map direct product count by category slug & category ID
  const directCountsBySlug = new Map<string, number>();
  const directCountsById = new Map<string, number>();

  for (const product of products) {
    if (product.status && product.status !== "active") continue;

    if (product.categorySlug) {
      directCountsBySlug.set(
        product.categorySlug,
        (directCountsBySlug.get(product.categorySlug) || 0) + 1
      );
    }
    if (product.categoryId) {
      directCountsById.set(
        product.categoryId,
        (directCountsById.get(product.categoryId) || 0) + 1
      );
    }
    // Also count additionalCategorySlugs if defined
    if (Array.isArray(product.additionalCategorySlugs)) {
      for (const slug of product.additionalCategorySlugs) {
        directCountsBySlug.set(slug, (directCountsBySlug.get(slug) || 0) + 1);
      }
    }
  }

  // Create lookup map for nodes
  const nodeMap = new Map<string, CategoryTreeNode>();
  for (const cat of categories) {
    const direct =
      (cat.slug ? directCountsBySlug.get(cat.slug) : 0) ||
      (cat.id ? directCountsById.get(cat.id) : 0) ||
      cat.productCount ||
      0;

    nodeMap.set(cat.id, {
      ...cat,
      parentId: normalizeParentId(cat.parentId ?? cat.parent_id),
      sortOrder: getCategorySortOrder(cat),
      isActive: isCategoryActive(cat),
      isVisible: isCategoryVisible(cat),
      children: [],
      depth: 0,
      directProductCount: direct,
      totalProductCount: direct,
    });
  }

  // Build tree hierarchy
  const rootNodes: CategoryTreeNode[] = [];

  for (const node of nodeMap.values()) {
    const parentId = node.parentId;
    if (parentId && nodeMap.has(parentId) && parentId !== node.id) {
      const parentNode = nodeMap.get(parentId)!;
      parentNode.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  // Recursive post-order function to calculate depths, total product counts, and sort children
  function finalizeNode(node: CategoryTreeNode, depth: number): number {
    node.depth = depth;

    // Sort children by sortOrder ASC, then name
    node.children.sort((a, b) => {
      const orderA = a.sortOrder ?? 0;
      const orderB = b.sortOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    let rollupCount = node.directProductCount;
    for (const child of node.children) {
      rollupCount += finalizeNode(child, depth + 1);
    }

    node.totalProductCount = rollupCount;
    return rollupCount;
  }

  // Sort root nodes
  rootNodes.sort((a, b) => {
    const orderA = a.sortOrder ?? 0;
    const orderB = b.sortOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  for (const root of rootNodes) {
    finalizeNode(root, 0);
  }

  return rootNodes;
}

/**
 * Flattens a category tree into an ordered list with visual prefixes (for select dropdowns or table list)
 */
export function flattenCategoryTree(
  nodes: CategoryTreeNode[],
  depth = 0
): FlattenedCategoryItem[] {
  const result: FlattenedCategoryItem[] = [];

  nodes.forEach((node, index) => {
    const isLastChild = index === nodes.length - 1;
    let prefix = "";
    if (depth > 0) {
      prefix = "— ".repeat(depth);
    }

    result.push({
      category: node,
      depth,
      prefix,
      hasChildren: node.children.length > 0,
      isLastChild,
    });

    if (node.children.length > 0) {
      result.push(...flattenCategoryTree(node.children, depth + 1));
    }
  });

  return result;
}

/**
 * Returns all descendant category IDs of a given category ID (to prevent circular parent references)
 */
export function getCategoryDescendantIds(
  categoryId: string,
  categories: Category[]
): Set<string> {
  const descendants = new Set<string>();
  const childrenMap = new Map<string, string[]>();

  for (const cat of categories) {
    const parentId = normalizeParentId(cat.parentId ?? cat.parent_id);
    if (parentId) {
      if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
      childrenMap.get(parentId)!.push(cat.id);
    }
  }

  function walk(id: string) {
    const children = childrenMap.get(id) || [];
    for (const childId of children) {
      if (!descendants.has(childId)) {
        descendants.add(childId);
        walk(childId);
      }
    }
  }

  walk(categoryId);
  return descendants;
}

/**
 * Validates hierarchy to strictly prevent circular references or self-parenting
 */
export function validateHierarchy(
  categoryId: string,
  newParentId: string | null | undefined,
  categories: Category[]
): { valid: boolean; error?: string } {
  const normalizedNewParent = normalizeParentId(newParentId);

  if (!normalizedNewParent) {
    return { valid: true }; // Becoming root category is always valid
  }

  if (categoryId && normalizedNewParent === categoryId) {
    return { valid: false, error: "A category cannot be its own parent." };
  }

  if (categoryId) {
    const descendantIds = getCategoryDescendantIds(categoryId, categories);
    if (descendantIds.has(normalizedNewParent)) {
      return {
        valid: false,
        error: "Circular hierarchy detected: A category cannot be moved under its own subcategory.",
      };
    }
  }

  return { valid: true };
}

/**
 * Builds breadcrumb trail from root down to the specified category slug
 */
export function getCategoryBreadcrumbs(
  categorySlug: string,
  categories: Category[]
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  if (!categorySlug || !Array.isArray(categories)) return breadcrumbs;

  const bySlug = new Map<string, Category>();
  const byId = new Map<string, Category>();

  for (const cat of categories) {
    if (cat.slug) bySlug.set(cat.slug, cat);
    if (cat.id) byId.set(cat.id, cat);
  }

  let current = bySlug.get(categorySlug);
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    breadcrumbs.unshift({
      name: current.name,
      slug: current.slug,
      href: `/category/${current.slug}`,
    });

    const parentId = normalizeParentId(current.parentId ?? current.parent_id);
    if (parentId && byId.has(parentId)) {
      current = byId.get(parentId);
    } else {
      break;
    }
  }

  return breadcrumbs;
}

/**
 * Returns an array containing the target category slug and all of its descendant category slugs.
 * Used by parent category storefront pages to show products in child categories.
 */
export function getCategoryDescendantSlugs(
  categorySlug: string,
  categories: Category[]
): string[] {
  const slugs: string[] = [categorySlug];
  const bySlug = new Map<string, Category>();
  const byId = new Map<string, Category>();
  const childrenOf = new Map<string, Category[]>();

  for (const cat of categories) {
    if (cat.slug) bySlug.set(cat.slug, cat);
    if (cat.id) byId.set(cat.id, cat);

    const parentId = normalizeParentId(cat.parentId ?? cat.parent_id);
    if (parentId) {
      if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
      childrenOf.get(parentId)!.push(cat);
    }
  }

  const target = bySlug.get(categorySlug);
  if (!target) return slugs;

  function collect(id: string) {
    const children = childrenOf.get(id) || [];
    for (const child of children) {
      if (child.slug && !slugs.includes(child.slug)) {
        slugs.push(child.slug);
        collect(child.id);
      }
    }
  }

  collect(target.id);
  return slugs;
}

/**
 * Generates an SEO-safe URL slug from a name string
 */
export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special non-alphanumeric chars
    .replace(/[\s_-]+/g, "-") // Collapse whitespace and underscores to -
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing -
}
