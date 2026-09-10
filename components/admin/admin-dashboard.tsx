"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  FolderTree,
  Settings as SettingsIcon,
  FileText,
  MessageSquare,
  Star,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Save,
  CheckCircle,
  ExternalLink,
  Phone,
  Upload,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Eye,
  EyeOff,
  Search,
  AlertTriangle,
  CornerDownRight,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import type { Category, Product, SiteSettings, LandingPage, SupportMessage, ProductReview } from "@/lib/types";
import { formatBDT } from "@/lib/format";
import {
  buildCategoryTree,
  flattenCategoryTree,
  getCategoryDescendantIds,
  normalizeParentId,
  slugifyCategory,
  type CategoryTreeNode,
} from "@/lib/category-tree";

interface AdminDashboardProps {
  initialSettings: SiteSettings;
  initialCategories: Category[];
  initialProducts: Product[];
  initialLandingPages: LandingPage[];
  initialOrders?: any[];
  initialSupportMessages: SupportMessage[];
  initialReviews: ProductReview[];
}

function CategoryNodeRow({
  node,
  depth = 0,
  expandedIds,
  onToggleExpand,
  onEdit,
  onAddChild,
  onToggleVisibility,
  onMove,
  onDelete,
}: {
  node: CategoryTreeNode;
  depth?: number;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onEdit: (cat: Category) => void;
  onAddChild: (parentCat: Category) => void;
  onToggleVisibility: (cat: Category) => void;
  onMove: (cat: Category, dir: "up" | "down") => void;
  onDelete: (cat: Category) => void;
}) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isVisible = node.isVisible !== false && node.is_visible !== false;
  const isActive = node.isActive !== false && node.is_active !== false;

  return (
    <div className="space-y-1">
      <div
        className={`group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border transition-all duration-150 ${
          !isActive
            ? "bg-slate-100/70 border-slate-200 opacity-75"
            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
        }`}
        style={{ marginLeft: `${Math.min(depth * 22, 110)}px` }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Expand/Collapse Chevron */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggleExpand(node.id)}
              className="p-1 rounded-md hover:bg-slate-100 text-slate-500 cursor-pointer flex-shrink-0"
              aria-label={isExpanded ? "Collapse subcategories" : "Expand subcategories"}
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90 text-[var(--primary)]" : ""}`}
              />
            </button>
          ) : (
            <span className="w-6 flex-shrink-0 flex items-center justify-center text-slate-300">
              {depth > 0 && <CornerDownRight className="w-3.5 h-3.5" />}
            </span>
          )}

          {/* Thumbnail */}
          <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
            {node.image ? (
              <Image src={node.image} alt={node.name} fill sizes="40px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                {node.icon || "📁"}
              </div>
            )}
          </div>

          {/* Category Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-slate-900 text-sm truncate">{node.name}</h4>
              <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {node.directProductCount} {node.directProductCount === 1 ? "product" : "products"}
                {hasChildren && ` · ${node.totalProductCount} total`}
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                #{node.sortOrder ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <Link
                href={`/category/${node.slug}`}
                target="_blank"
                className="font-mono text-[11px] text-slate-500 hover:text-[var(--primary)] flex items-center gap-1 truncate"
              >
                <span>/category/{node.slug}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Badges & Actions */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 justify-between sm:justify-end">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-200 text-slate-600"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isVisible ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {isVisible ? "In Menu" : "Hidden"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onAddChild(node)}
              className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[var(--primary)] rounded-lg cursor-pointer transition-colors"
              title="Add Subcategory"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMove(node, "up")}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              title="Move Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMove(node, "down")}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              title="Move Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onToggleVisibility(node)}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              title={isVisible ? "Hide from Navigation" : "Show in Navigation"}
            >
              {isVisible ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5 text-amber-600" />}
            </button>
            <button
              type="button"
              onClick={() => onEdit(node)}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              title="Edit Category"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(node)}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
              title="Delete Category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="space-y-1 pt-0.5">
          {node.children.map((child) => (
            <CategoryNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onToggleVisibility={onToggleVisibility}
              onMove={onMove}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminDashboard({
  initialSettings,
  initialCategories,
  initialProducts,
  initialLandingPages,
  initialSupportMessages,
  initialReviews,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "products" | "categories" | "settings" | "landing_pages" | "support" | "reviews"
  >("products");

  // State collections
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [landingPages, setLandingPages] = useState<LandingPage[]>(initialLandingPages);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>(initialSupportMessages);
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);

  // Category filter for reordering
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Product modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Category modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // Category Tree UI states
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<"all" | "active" | "inactive" | "visible" | "hidden">("all");
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignChildrenTo, setReassignChildrenTo] = useState<string>("root");
  const [reassignProductsTo, setReassignProductsTo] = useState<string>("");
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Memoized hierarchical tree and flattened list
  const categoryTree = React.useMemo(() => {
    return buildCategoryTree(categories, products);
  }, [categories, products]);

  const flattenedCategories = React.useMemo(() => {
    return flattenCategoryTree(categoryTree);
  }, [categoryTree]);

  // Filtered Tree based on search and status
  const filteredTree = React.useMemo(() => {
    if (!categorySearchTerm.trim() && categoryStatusFilter === "all") {
      return categoryTree;
    }

    const term = categorySearchTerm.toLowerCase().trim();

    function filterNode(node: CategoryTreeNode): CategoryTreeNode | null {
      const matchesSearch =
        !term ||
        node.name.toLowerCase().includes(term) ||
        node.slug.toLowerCase().includes(term);

      const matchesStatus =
        categoryStatusFilter === "all" ||
        (categoryStatusFilter === "active" && (node.isActive !== false && node.is_active !== false)) ||
        (categoryStatusFilter === "inactive" && (node.isActive === false || node.is_active === false)) ||
        (categoryStatusFilter === "visible" && (node.isVisible !== false && node.is_visible !== false)) ||
        (categoryStatusFilter === "hidden" && (node.isVisible === false || node.is_visible === false));

      const filteredChildren: CategoryTreeNode[] = [];
      for (const child of node.children) {
        const res = filterNode(child);
        if (res) filteredChildren.push(res);
      }

      if ((matchesSearch && matchesStatus) || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    }

    return categoryTree.map(filterNode).filter(Boolean) as CategoryTreeNode[];
  }, [categoryTree, categorySearchTerm, categoryStatusFilter]);

  // Landing Page modal
  const [isLpModalOpen, setIsLpModalOpen] = useState(false);
  const [editingLp, setEditingLp] = useState<Partial<LandingPage> | null>(null);

  // Filtered products for reordering
  const displayedProducts = products.filter((p) => {
    if (selectedCategoryFilter === "all") return true;
    return p.categorySlug === selectedCategoryFilter || (p as any).category_slug === selectedCategoryFilter;
  });

  // Reordering controls
  const handleMoveProduct = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= displayedProducts.length) return;

    const reordered = [...displayedProducts];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Map back to global products
    const newGlobal = [...products];
    const movedId = moved.id;
    const swapWithId = displayedProducts[targetIndex].id;

    const idxA = newGlobal.findIndex((p) => p.id === movedId);
    const idxB = newGlobal.findIndex((p) => p.id === swapWithId);
    if (idxA !== -1 && idxB !== -1) {
      const temp = newGlobal[idxA];
      newGlobal[idxA] = newGlobal[idxB];
      newGlobal[idxB] = temp;
      setProducts(newGlobal);
    }
  };

  const handleSaveProductOrder = async () => {
    setIsSavingOrder(true);
    const orderedIds = displayedProducts.map((p) => p.id);
    try {
      const res = await fetch("/api/admin/product/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_slug: selectedCategoryFilter, ordered_ids: orderedIds }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Product order saved successfully!");
      } else {
        toast.error(data.error || "Failed to save product order");
      }
    } catch {
      toast.error("Failed to save product order");
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/admin/product/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Product deleted successfully");
      } else {
        toast.error(data.error || "Failed to delete product");
      }
    } catch {
      toast.error("Failed to delete product");
    }
  };

  // Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) {
      toast.error("Product name and price are required");
      return;
    }

    try {
      const res = await fetch("/api/admin/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct),
      });
      const data = await res.json();
      if (data.success && data.product) {
        setProducts((prev) => {
          const idx = prev.findIndex((p) => p.id === data.product.id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = data.product;
            return updated;
          }
          return [data.product, ...prev];
        });
        toast.success("Product saved successfully");
        setIsProductModalOpen(false);
      } else {
        toast.error(data.error || "Failed to save product");
      }
    } catch {
      toast.error("Failed to save product");
    }
  };

  // Category Tree Expand/Collapse
  const toggleExpandCategory = (id: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAllCategories = () => {
    const allIds = new Set(categories.map((c) => c.id));
    setExpandedCategoryIds(allIds);
  };

  const collapseAllCategories = () => {
    setExpandedCategoryIds(new Set());
  };

  // Toggle Category Visibility
  const handleToggleCategoryVisibility = async (cat: Category) => {
    const currentVis = cat.isVisible !== undefined ? cat.isVisible : cat.is_visible !== undefined ? cat.is_visible : true;
    const updated = {
      ...cat,
      isVisible: !currentVis,
      is_visible: !currentVis,
    };

    try {
      const res = await fetch("/api/admin/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success && data.category) {
        setCategories((prev) => prev.map((c) => (c.id === cat.id ? data.category : c)));
        toast.success(`Category ${!currentVis ? "visible in menu" : "hidden from menu"}`);
      } else {
        toast.error(data.error || "Failed to update category visibility");
      }
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  // Move Category (Order change among siblings)
  const handleMoveCategory = async (cat: Category, direction: "up" | "down") => {
    const pId = normalizeParentId(cat.parentId ?? cat.parent_id);
    const siblings = categories
      .filter((c) => normalizeParentId(c.parentId ?? c.parent_id) === pId)
      .sort((a, b) => {
        const ordA = a.sortOrder ?? a.sort_order ?? 0;
        const ordB = b.sortOrder ?? b.sort_order ?? 0;
        if (ordA !== ordB) return ordA - ordB;
        return a.name.localeCompare(b.name);
      });

    const currentIndex = siblings.findIndex((c) => c.id === cat.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const targetSibling = siblings[targetIndex];
    const currentOrder = cat.sortOrder ?? cat.sort_order ?? currentIndex;
    const targetOrder = targetSibling.sortOrder ?? targetSibling.sort_order ?? targetIndex;

    const newCurrentOrder = targetOrder;
    const newTargetOrder = currentOrder === targetOrder ? (direction === "up" ? targetOrder + 1 : targetOrder - 1) : currentOrder;

    const payload = [
      { id: cat.id, sortOrder: newCurrentOrder },
      { id: targetSibling.id, sortOrder: newTargetOrder },
    ];

    try {
      const res = await fetch("/api/admin/category/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) =>
          prev.map((c) => {
            if (c.id === cat.id) return { ...c, sortOrder: newCurrentOrder, sort_order: newCurrentOrder };
            if (c.id === targetSibling.id) return { ...c, sortOrder: newTargetOrder, sort_order: newTargetOrder };
            return c;
          })
        );
        toast.success("Category order updated");
      } else {
        toast.error(data.error || "Failed to reorder categories");
      }
    } catch {
      toast.error("Failed to reorder categories");
    }
  };

  // Safe Category Deletion
  const handleOpenDeleteCategory = (cat: Category) => {
    setCategoryToDelete(cat);
    const pId = normalizeParentId(cat.parentId ?? cat.parent_id);
    setReassignChildrenTo(pId || "root");

    // Default target for affected products
    const otherCats = categories.filter((c) => c.id !== cat.id);
    setReassignProductsTo(otherCats.length > 0 ? otherCats[0].slug : "");
  };

  const handleConfirmSafeDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeletingCategory(true);

    try {
      const res = await fetch(`/api/admin/category/${categoryToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reassignChildrenTo: reassignChildrenTo === "root" ? null : reassignChildrenTo,
          reassignProductsTo: reassignProductsTo || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));

        // If products reassigned, update local products state
        if (reassignProductsTo) {
          const targetCat = categories.find((c) => c.slug === reassignProductsTo || c.id === reassignProductsTo);
          if (targetCat) {
            setProducts((prev) =>
              prev.map((p) => {
                if (p.categorySlug === categoryToDelete.slug || p.categoryId === categoryToDelete.id) {
                  return {
                    ...p,
                    categorySlug: targetCat.slug,
                    categoryName: targetCat.name,
                    categoryId: targetCat.id,
                  };
                }
                return p;
              })
            );
          }
        }

        toast.success("Category deleted safely");
        setCategoryToDelete(null);
      } else {
        toast.error(data.error || "Failed to delete category");
      }
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setIsDeletingCategory(false);
    }
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name || !editingCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const res = await fetch("/api/admin/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCategory),
      });
      const data = await res.json();
      if (data.success && data.category) {
        setCategories((prev) => {
          const idx = prev.findIndex((c) => c.id === data.category.id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = data.category;
            return updated;
          }
          return [...prev, data.category];
        });
        toast.success("Category saved successfully");
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
      } else {
        toast.error(data.error || "Failed to save category");
      }
    } catch {
      toast.error("Failed to save category");
    }
  };

  // Save Site Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Settings updated successfully!");
      } else {
        toast.error(data.error || "Failed to update settings");
      }
    } catch {
      toast.error("Failed to update settings");
    }
  };

  // Delete Landing Page
  const handleDeleteLandingPage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this landing page?")) return;
    try {
      const res = await fetch(`/api/admin/landing-page/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setLandingPages((prev) => prev.filter((lp) => lp.id !== id && lp.slug !== id));
        toast.success("Landing page deleted");
      } else {
        toast.error(data.error || "Failed to delete landing page");
      }
    } catch {
      toast.error("Failed to delete landing page");
    }
  };

  // Save Landing Page
  const handleSaveLandingPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLp?.id && !editingLp?.title) {
      toast.error("Slug and title are required");
      return;
    }

    try {
      const res = await fetch("/api/admin/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingLp),
      });
      const data = await res.json();
      if (data.success && data.landingPage) {
        setLandingPages((prev) => {
          const idx = prev.findIndex((lp) => lp.id === data.landingPage.id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = data.landingPage;
            return updated;
          }
          return [data.landingPage, ...prev];
        });
        toast.success("Landing page saved");
        setIsLpModalOpen(false);
      } else {
        toast.error(data.error || "Failed to save landing page");
      }
    } catch {
      toast.error("Failed to save landing page");
    }
  };


  // Approve Review
  const handleApproveReview = async (id: number | string) => {
    try {
      const res = await fetch("/api/admin/review", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
        );
        toast.success("Review approved successfully");
      } else {
        toast.error(data.error || "Failed to approve review");
      }
    } catch {
      toast.error("Failed to approve review");
    }
  };

  // Delete Review
  const handleDeleteReview = async (id: number | string) => {
    if (!confirm("Delete this review?")) return;
    try {
      const res = await fetch(`/api/admin/review?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        toast.success("Review deleted");
      } else {
        toast.error(data.error || "Failed to delete review");
      }
    } catch {
      toast.error("Failed to delete review");
    }
  };

  // Delete Support Message
  const handleDeleteSupport = async (id: number | string) => {
    if (!confirm("Delete this support message?")) return;
    try {
      const res = await fetch(`/api/admin/support?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSupportMessages((prev) => prev.filter((m) => m.id !== id));
        toast.success("Support message deleted");
      } else {
        toast.error(data.error || "Failed to delete message");
      }
    } catch {
      toast.error("Failed to delete message");
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-[240px] shrink-0 space-y-1.5">
        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={`w-full flex items-center gap-3 px-4.5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
            activeTab === "products" ? "bg-black text-white shadow-md" : "text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          <Package className="w-4 h-4" />
          Products Manager
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`w-full flex items-center gap-3 px-4.5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
            activeTab === "categories" ? "bg-black text-white shadow-md" : "text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Categories
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`w-full flex items-center gap-3 px-4.5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
            activeTab === "settings" ? "bg-black text-white shadow-md" : "text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          Site Settings
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("landing_pages")}
          className={`w-full flex items-center gap-3 px-4.5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
            activeTab === "landing_pages" ? "bg-black text-white shadow-md" : "text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          <FileText className="w-4 h-4" />
          Landing Pages
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("support")}
          className={`w-full flex items-center justify-between px-4.5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
            activeTab === "support" ? "bg-black text-white shadow-md" : "text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4" />
            Support Inbox
          </div>
          {supportMessages.length > 0 && (
            <span className="bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-black px-2 py-0.5 rounded-full">
              {supportMessages.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`w-full flex items-center justify-between px-4.5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
            activeTab === "reviews" ? "bg-black text-white shadow-md" : "text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          <div className="flex items-center gap-3">
            <Star className="w-4 h-4" />
            Reviews Moderation
          </div>
          {reviews.filter((r) => r.status === "pending").length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {reviews.filter((r) => r.status === "pending").length}
            </span>
          )}
        </button>
      </aside>

      {/* Main Content Panels */}
      <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs min-h-[600px]">
        {/* TAB 1: PRODUCTS MANAGER */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Products Manager</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Manage product catalog, prices, stock, and reorder sorting
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingProduct({
                    id: "",
                    name: "",
                    slug: "",
                    price: 0,
                    compareAtPrice: 0,
                    categorySlug: categories[0]?.slug || "everyday-totes",
                    categoryName: categories[0]?.name || "Everyday Totes",
                    benefits: [],
                    specs: [],
                    images: [],
                    variants: [],
                  });
                  setIsProductModalOpen(true);
                }}
                className="bg-primary-gradient text-[var(--primary-foreground)] hover:opacity-90 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            {/* Category Filter & Save Order Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Filter / Order by Category:</span>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                >
                  <option value="all">All Products (Global Order)</option>
                  {categories.map((c) => (
                    <option key={c.id || c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleSaveProductOrder}
                disabled={isSavingOrder}
                className="bg-black text-white hover:bg-black/90 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSavingOrder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Order
              </button>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 w-14">Order</th>
                    <th className="pb-3 w-16">Image</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedProducts.map((p, idx) => {
                    const firstImg = p.images?.[0] || p.image || p.imageUrl || "/brand/logo.webp";
                    const imgUrl = typeof firstImg === "object" && firstImg !== null ? (firstImg as any).url : firstImg;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveProduct(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveProduct(idx, "down")}
                              disabled={idx === displayedProducts.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                            <Image src={imgUrl} alt={p.name} fill sizes="48px" className="object-cover" />
                          </div>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/product/${p.slug}`}
                            target="_blank"
                            className="font-bold text-slate-900 hover:text-[var(--primary)] flex items-center gap-1"
                          >
                            <span>{p.name}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Link>
                          {p.badge && (
                            <span className="inline-block mt-0.5 bg-slate-100 text-slate-600 font-bold text-[9px] px-1.5 py-0.5 rounded">
                              {p.badge}
                            </span>
                          )}
                        </td>
                        <td className="py-3 font-semibold text-slate-600">{p.categoryName || p.categorySlug}</td>
                        <td className="py-3">
                          <span className="font-bold text-slate-900">{formatBDT(p.price)}</span>
                          {p.compareAtPrice && p.compareAtPrice > p.price && (
                            <span className="text-slate-400 line-through ml-1.5 text-[11px]">
                              {formatBDT(p.compareAtPrice)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORIES MANAGER (ADVANCED HIERARCHICAL CMS) */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-[var(--primary)]" />
                  Category & Catalog Hierarchy
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Manage multi-level taxonomy, ordering, active/visibility status, and catalog discovery
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory({
                      id: "",
                      name: "",
                      slug: "",
                      description: "",
                      image: "",
                      icon: "",
                      parentId: null,
                      sortOrder: categories.length + 1,
                      isActive: true,
                      isVisible: true,
                    });
                    setIsCategoryModalOpen(true);
                  }}
                  className="bg-primary-gradient text-[var(--primary-foreground)] hover:opacity-90 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Add Root Category
                </button>
              </div>
            </div>

            {/* Controls: Search, Status Filter, Expand/Collapse */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    placeholder="Search category name or slug..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--primary)]"
                  />
                  {categorySearchTerm && (
                    <button
                      type="button"
                      onClick={() => setCategorySearchTerm("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={categoryStatusFilter}
                  onChange={(e) => setCategoryStatusFilter(e.target.value as any)}
                  className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 cursor-pointer"
                >
                  <option value="all">All Status ({categories.length})</option>
                  <option value="active">Active Only ({categories.filter((c) => c.isActive !== false && c.is_active !== false).length})</option>
                  <option value="inactive">Inactive ({categories.filter((c) => c.isActive === false || c.is_active === false).length})</option>
                  <option value="visible">Visible in Menu ({categories.filter((c) => c.isVisible !== false && c.is_visible !== false).length})</option>
                  <option value="hidden">Hidden from Menu ({categories.filter((c) => c.isVisible === false || c.is_visible === false).length})</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAllCategories}
                  className="px-3 py-1.5 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAllCategories}
                  className="px-3 py-1.5 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* Tree View Container */}
            <div className="space-y-2">
              {filteredTree.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <FolderTree className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600">No categories match your criteria</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or add a new category.</p>
                </div>
              ) : (
                filteredTree.map((rootNode) => (
                  <CategoryNodeRow
                    key={rootNode.id}
                    node={rootNode}
                    depth={0}
                    expandedIds={expandedCategoryIds}
                    onToggleExpand={toggleExpandCategory}
                    onEdit={(cat) => {
                      setEditingCategory(cat);
                      setIsCategoryModalOpen(true);
                    }}
                    onAddChild={(parentCat) => {
                      setEditingCategory({
                        id: "",
                        name: "",
                        slug: "",
                        description: "",
                        image: "",
                        icon: "",
                        parentId: parentCat.id,
                        sortOrder: 0,
                        isActive: true,
                        isVisible: true,
                      });
                      setIsCategoryModalOpen(true);
                      setExpandedCategoryIds((prev) => new Set([...prev, parentCat.id]));
                    }}
                    onToggleVisibility={handleToggleCategoryVisibility}
                    onMove={handleMoveCategory}
                    onDelete={handleOpenDeleteCategory}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SITE SETTINGS */}
        {activeTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-slate-150 pb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Site Settings</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Theme color, shipping rates, sliders, and tracking pixels
                </p>
              </div>
              <button
                type="submit"
                className="bg-black text-white hover:bg-black/90 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>

            {/* Delivery Fees */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Delivery Fees (BDT)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600">Inside Dhaka Delivery Fee</label>
                  <input
                    type="number"
                    value={settings.shippingInsideDhaka || 70}
                    onChange={(e) => setSettings({ ...settings, shippingInsideDhaka: Number(e.target.value) })}
                    className="w-full h-10 px-3 mt-1 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Outside Dhaka Delivery Fee</label>
                  <input
                    type="number"
                    value={settings.shippingOutsideDhaka || 150}
                    onChange={(e) => setSettings({ ...settings, shippingOutsideDhaka: Number(e.target.value) })}
                    className="w-full h-10 px-3 mt-1 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            {/* Announcement text */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Announcement Top Bar</label>
              <input
                type="text"
                value={settings.announcementText || ""}
                onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                placeholder="৮৯৯+ অর্ডারে ফ্রি ডেলিভারি..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50/50"
              />
            </div>

            {/* Social and Contact */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Contact & Support</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600">Phone</label>
                  <input
                    type="text"
                    value={settings.phone || ""}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full h-10 px-3 mt-1 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">WhatsApp Number</label>
                  <input
                    type="text"
                    value={settings.whatsappNumber || ""}
                    onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                    className="w-full h-10 px-3 mt-1 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Messenger Username</label>
                  <input
                    type="text"
                    value={settings.messengerUsername || ""}
                    onChange={(e) => setSettings({ ...settings, messengerUsername: e.target.value })}
                    className="w-full h-10 px-3 mt-1 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            {/* Analytics Tracking */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Analytics & Tracking</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600">Google Tag Manager ID</label>
                  <input
                    type="text"
                    value={settings.gtmId || ""}
                    onChange={(e) => setSettings({ ...settings, gtmId: e.target.value })}
                    placeholder="GTM-XXXXXXX"
                    className="w-full h-10 px-3 mt-1 rounded-xl border border-slate-200 text-sm font-mono bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Google Analytics 4 ID</label>
                  <input
                    type="text"
                    value={settings.ga4Id || ""}
                    onChange={(e) => setSettings({ ...settings, ga4Id: e.target.value })}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full h-10 px-3 mt-1 rounded-xl border border-slate-200 text-sm font-mono bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Meta Pixel ID</label>
                  <input
                    type="text"
                    value={settings.pixelId || ""}
                    onChange={(e) => setSettings({ ...settings, pixelId: e.target.value })}
                    placeholder="123456789012345"
                    className="w-full h-10 px-3 mt-1 rounded-xl border border-slate-200 text-sm font-mono bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 4: LANDING PAGES */}
        {activeTab === "landing_pages" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-150 pb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Landing Pages</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Promotional landing pages and custom domain bindings
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingLp({ id: "", title: "", custom_domain: "", components: [] });
                  setIsLpModalOpen(true);
                }}
                className="bg-primary-gradient text-[var(--primary-foreground)] hover:opacity-90 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                New Landing Page
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Title</th>
                    <th className="pb-3">URL Path</th>
                    <th className="pb-3">Custom Domain</th>
                    <th className="pb-3">Components</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {landingPages.map((lp) => (
                    <tr key={lp.id || lp.slug} className="hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-900">{lp.title}</td>
                      <td className="py-3">
                        <Link
                          href={`/lp/${lp.slug || lp.id}`}
                          target="_blank"
                          className="text-[var(--primary)] hover:underline font-mono flex items-center gap-1"
                        >
                          /lp/{lp.slug || lp.id}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                      <td className="py-3 font-semibold text-slate-600">{lp.custom_domain || "—"}</td>
                      <td className="py-3 font-semibold text-slate-500">{lp.components?.length || 0} sections</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLp(lp);
                              setIsLpModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLandingPage(lp.id || lp.slug || "")}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: SUPPORT INBOX */}
        {activeTab === "support" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-150 pb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Support Messages</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Messages submitted via the store live chat widget
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-150">
              {supportMessages.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold">No messages in inbox.</div>
              ) : (
                supportMessages.map((m) => (
                  <div key={m.id} className="py-4 flex items-start justify-between gap-4 text-left">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-sm text-slate-900">{m.name}</span>
                        <a
                          href={`tel:${m.phone}`}
                          className="text-xs font-mono font-bold text-[var(--primary)] flex items-center gap-1 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {m.phone}
                        </a>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">{m.message}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {m.created_at ? new Date(m.created_at).toLocaleString() : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSupport(m.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: REVIEWS MODERATION */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-150 pb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Customer Reviews</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Approve or remove customer reviews</p>
              </div>
            </div>

            <div className="divide-y divide-slate-150">
              {reviews.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold">No customer reviews yet.</div>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="py-4 flex items-start justify-between gap-4 text-left">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-sm text-slate-900">{r.customer_name || r.name}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            r.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {r.status}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">on {r.product_name}</span>
                      </div>

                      <div className="flex text-amber-400 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < r.rating ? "fill-current text-amber-400" : "text-slate-200"}`}
                          />
                        ))}
                      </div>

                      <p className="text-xs text-slate-700 font-medium leading-relaxed">{r.comment}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {r.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => r.id && handleApproveReview(r.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => r.id && handleDeleteReview(r.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: PRODUCT EDIT/CREATE */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-900">
                {editingProduct.id ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Slug</label>
                  <input
                    type="text"
                    value={editingProduct.slug || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700">Price (Tk) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Compare Price</label>
                  <input
                    type="number"
                    value={editingProduct.compareAtPrice || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, compareAtPrice: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Badge</label>
                  <input
                    type="text"
                    value={editingProduct.badge || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                    placeholder="e.g. Best Seller"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700">Category (Hierarchical)</label>
                  <select
                    value={editingProduct.categorySlug || ""}
                    onChange={(e) => {
                      const found = categories.find((c) => c.slug === e.target.value);
                      setEditingProduct({
                        ...editingProduct,
                        categorySlug: e.target.value,
                        categoryName: found?.name || e.target.value,
                        categoryId: found?.id,
                      });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-bold bg-white"
                  >
                    {flattenedCategories.map((item) => (
                      <option key={item.category.id} value={item.category.slug}>
                        {item.prefix}{item.category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Catalog Status</label>
                  <select
                    value={editingProduct.status || "active"}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-bold bg-white capitalize"
                  >
                    <option value="active">Active (Visible in Store)</option>
                    <option value="inactive">Inactive (Hidden from Store)</option>
                    <option value="draft">Draft (Unpublished)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isBestSellerCheck"
                    checked={Boolean(editingProduct.isBestSeller)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })}
                    className="h-4 w-4 text-[var(--primary)] rounded border-slate-300"
                  />
                  <label htmlFor="isBestSellerCheck" className="font-bold text-slate-700 text-xs">
                    Mark as Hot Seller Badge
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeaturedCheck"
                    checked={Boolean(editingProduct.isFeatured || editingProduct.is_featured)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked, is_featured: e.target.checked })}
                    className="h-4 w-4 text-[var(--primary)] rounded border-slate-300"
                  />
                  <label htmlFor="isFeaturedCheck" className="font-bold text-slate-700 text-xs">
                    Featured Product (Show in Featured Collection)
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Product Story / Long Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.story || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, story: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 mt-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-black text-white hover:bg-black/90 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CATEGORY EDIT/CREATE (HIERARCHICAL & SEO CAPABLE) */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 max-h-[90vh] overflow-y-auto space-y-4 text-left shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {editingCategory.id ? "Edit Category" : "Add Category"}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {editingCategory.id ? `Managing "${editingCategory.name}"` : "Create new root or subcategory"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={editingCategory.name || ""}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const updates: any = { ...editingCategory, name: newName };
                      if (!editingCategory.id) {
                        updates.slug = slugifyCategory(newName);
                      }
                      setEditingCategory(updates);
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-semibold"
                    placeholder="e.g. Tote Bags"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Slug (URL identifier) *</label>
                  <input
                    type="text"
                    required
                    value={editingCategory.slug || ""}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: slugifyCategory(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-mono text-slate-800"
                    placeholder="e.g. tote-bags"
                  />
                </div>
              </div>

              {/* Parent Category with Circular Reference Protection */}
              <div>
                <label className="font-bold text-slate-700">Parent Category</label>
                {(() => {
                  const invalidParentIds = editingCategory.id
                    ? getCategoryDescendantIds(editingCategory.id, categories)
                    : new Set<string>();

                  return (
                    <select
                      value={editingCategory.parentId || "root"}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          parentId: e.target.value === "root" ? null : e.target.value,
                          parent_id: e.target.value === "root" ? null : e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-semibold bg-white"
                    >
                      <option value="root">None (Top-Level / Root Category)</option>
                      {flattenedCategories.map((item) => {
                        const isSelf = editingCategory.id && item.category.id === editingCategory.id;
                        const isDescendant = editingCategory.id && invalidParentIds.has(item.category.id);
                        const disabled = Boolean(isSelf || isDescendant);

                        return (
                          <option key={item.category.id} value={item.category.id} disabled={disabled}>
                            {item.prefix}{item.category.name} {disabled ? "(Circular Reference / Disabled)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  );
                })()}
                <p className="text-[10px] text-slate-400 mt-1">
                  Nest this category inside another parent category or keep it as a root category.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700">Sort Order</label>
                  <input
                    type="number"
                    value={editingCategory.sortOrder ?? editingCategory.sort_order ?? 0}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        sortOrder: Number(e.target.value),
                        sort_order: Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Icon / Emoji (Optional)</label>
                  <input
                    type="text"
                    value={editingCategory.icon || ""}
                    onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                    placeholder="e.g. 🎒 or bag"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Image URL</label>
                <input
                  type="text"
                  value={editingCategory.image || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Category banner description..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 mt-1"
                />
              </div>

              {/* Status & Visibility Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="catIsActive"
                    checked={editingCategory.isActive !== false && editingCategory.is_active !== false}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        isActive: e.target.checked,
                        is_active: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-[var(--primary)] rounded border-slate-300"
                  />
                  <div>
                    <label htmlFor="catIsActive" className="font-bold text-slate-800 text-xs block cursor-pointer">
                      Active Status
                    </label>
                    <span className="text-[10px] text-slate-500">Category is live and active</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="catIsVisible"
                    checked={editingCategory.isVisible !== false && editingCategory.is_visible !== false}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        isVisible: e.target.checked,
                        is_visible: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-[var(--primary)] rounded border-slate-300"
                  />
                  <div>
                    <label htmlFor="catIsVisible" className="font-bold text-slate-800 text-xs block cursor-pointer">
                      Menu Visible
                    </label>
                    <span className="text-[10px] text-slate-500">Show in public navigation</span>
                  </div>
                </div>
              </div>

              {/* SEO Settings */}
              <div className="space-y-2 pt-2 border-t border-slate-150">
                <p className="font-bold text-slate-900 text-xs">SEO Metadata (Optional)</p>
                <div>
                  <label className="font-bold text-slate-600 text-[11px]">Meta Title</label>
                  <input
                    type="text"
                    value={editingCategory.seoTitle || editingCategory.seo_title || ""}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        seoTitle: e.target.value,
                        seo_title: e.target.value,
                      })
                    }
                    placeholder="Custom Google title tag..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 text-[11px]">Meta Description</label>
                  <textarea
                    rows={2}
                    value={editingCategory.seoDescription || editingCategory.seo_description || ""}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        seoDescription: e.target.value,
                        seo_description: e.target.value,
                      })
                    }
                    placeholder="Custom search description snippet..."
                    className="w-full p-2 rounded-lg border border-slate-200 mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-black text-white hover:bg-black/90 font-bold uppercase tracking-wider cursor-pointer shadow-sm"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SAFE CATEGORY DELETE WITH REASSIGNMENT */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-left shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 border-b border-slate-150 pb-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <div>
                <h3 className="font-black text-base text-slate-900">Safe Delete Category</h3>
                <p className="text-xs text-slate-500">
                  Permanently remove <span className="font-bold text-slate-900">"{categoryToDelete.name}"</span>
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Dependency calculations */}
              {(() => {
                const childCount = categories.filter(
                  (c) => normalizeParentId(c.parentId ?? c.parent_id) === categoryToDelete.id
                ).length;

                const productCount = products.filter(
                  (p) => p.categorySlug === categoryToDelete.slug || p.categoryId === categoryToDelete.id
                ).length;

                return (
                  <>
                    {childCount > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2 text-amber-900">
                        <p className="font-bold flex items-center gap-1.5">
                          <FolderTree className="w-4 h-4 text-amber-600" />
                          This category contains {childCount} subcategories!
                        </p>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Move Subcategories To:</label>
                          <select
                            value={reassignChildrenTo}
                            onChange={(e) => setReassignChildrenTo(e.target.value)}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                          >
                            <option value="root">Top-Level / Root (No Parent)</option>
                            {categories
                              .filter((c) => c.id !== categoryToDelete.id)
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {productCount > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2 text-blue-900">
                        <p className="font-bold flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-blue-600" />
                          This category has {productCount} products assigned!
                        </p>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Reassign Products To:</label>
                          <select
                            value={reassignProductsTo}
                            onChange={(e) => setReassignProductsTo(e.target.value)}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                          >
                            {categories
                              .filter((c) => c.id !== categoryToDelete.id)
                              .map((c) => (
                                <option key={c.id} value={c.slug}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      <strong>Safe Deletion Policy:</strong> No products will be lost or deleted. They will be safely reassigned to the selected category.
                    </p>
                  </>
                );
              })()}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
                  disabled={isDeletingCategory}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSafeDelete}
                  disabled={isDeletingCategory}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider cursor-pointer shadow-sm flex items-center gap-2"
                >
                  {isDeletingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Confirm Safe Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LANDING PAGE EDIT/CREATE */}
      {isLpModalOpen && editingLp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">
                {editingLp.id ? "Edit Landing Page" : "Create Landing Page"}
              </h3>
              <button
                type="button"
                onClick={() => setIsLpModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLandingPage} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700">Page Title *</label>
                <input
                  type="text"
                  required
                  value={editingLp.title || ""}
                  onChange={(e) => setEditingLp({ ...editingLp, title: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Slug (URL identifier) *</label>
                <input
                  type="text"
                  required
                  value={editingLp.id || editingLp.slug || ""}
                  onChange={(e) => setEditingLp({ ...editingLp, id: e.target.value, slug: e.target.value })}
                  placeholder="e.g. exclusive-backpack"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Custom Domain (Optional)</label>
                <input
                  type="text"
                  value={editingLp.custom_domain || ""}
                  onChange={(e) => setEditingLp({ ...editingLp, custom_domain: e.target.value })}
                  placeholder="e.g. promo.canvasbagbd.com"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-mono"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLpModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-black text-white hover:bg-black/90 font-bold uppercase tracking-wider cursor-pointer shadow-sm"
                >
                  Save Landing Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
