"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ChevronRight,
  FolderPlus,
  Eye,
  EyeOff,
  Search,
  AlertTriangle,
  CornerDownRight,
  X,
  Layers,
  Upload,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Category, Product } from "@/lib/types";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";
import {
  buildCategoryTree,
  flattenCategoryTree,
  getCategoryDescendantIds,
  normalizeParentId,
  slugifyCategory,
  type CategoryTreeNode,
} from "@/lib/category-tree";

interface CategoriesManagerProps {
  initialCategories: Category[];
  initialProducts: Product[];
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

export function CategoriesManager({ initialCategories, initialProducts }: CategoriesManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Category modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploadingCategoryImg, setUploadingCategoryImg] = useState(false);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);

  const handleCategoryFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadingCategoryImg(true);
    const toastId = toast.loading("Uploading category image to Cloudflare R2...");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setEditingCategory((prev) => (prev ? { ...prev, image: data.url } : null));
        toast.success("Category image uploaded successfully!", { id: toastId });
      } else {
        toast.error(data.error || "Upload failed", { id: toastId });
      }
    } catch (err: any) {
      toast.error("Upload error: " + (err?.message || "Network error"), { id: toastId });
    } finally {
      setUploadingCategoryImg(false);
      if (categoryFileInputRef.current) categoryFileInputRef.current.value = "";
    }
  };

  // Category Tree UI states
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<"all" | "active" | "inactive" | "visible" | "hidden">("all");
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignChildrenTo, setReassignChildrenTo] = useState<string>("root");
  const [reassignProductsTo, setReassignProductsTo] = useState<string>("");
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Memoized hierarchical tree and flattened list
  const categoryTree = useMemo(() => {
    return buildCategoryTree(categories, products);
  }, [categories, products]);

  const flattenedCategories = useMemo(() => {
    return flattenCategoryTree(categoryTree);
  }, [categoryTree]);

  // Filtered Tree based on search and status
  const filteredTree = useMemo(() => {
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

  const toggleExpandCategory = (id: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAllCategories = () => {
    const allIds = new Set<string>();
    function collect(nodes: CategoryTreeNode[]) {
      for (const n of nodes) {
        if (n.children.length > 0) {
          allIds.add(n.id);
          collect(n.children);
        }
      }
    }
    collect(categoryTree);
    setExpandedCategoryIds(allIds);
  };

  const collapseAllCategories = () => {
    setExpandedCategoryIds(new Set());
  };

  const handleToggleCategoryVisibility = async (cat: Category) => {
    const currentVis = cat.isVisible !== false && cat.is_visible !== false;
    const newVis = !currentVis;

    try {
      const res = await fetch("/api/admin/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cat,
          isVisible: newVis,
          is_visible: newVis,
        }),
      });
      const data = await res.json();
      if (data.success && data.category) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, isVisible: newVis, is_visible: newVis } : c))
        );
        toast.success(newVis ? `"${cat.name}" is now visible in menu` : `"${cat.name}" is now hidden from menu`);
      } else {
        toast.error(data.error || "Failed to update category");
      }
    } catch {
      toast.error("Failed to update category");
    }
  };

  const handleMoveCategory = async (cat: Category, direction: "up" | "down") => {
    const parentId = normalizeParentId(cat.parentId ?? cat.parent_id);
    const siblings = categories
      .filter((c) => normalizeParentId(c.parentId ?? c.parent_id) === parentId)
      .sort((a, b) => (a.sortOrder ?? a.sort_order ?? 0) - (b.sortOrder ?? b.sort_order ?? 0));

    const currentIndex = siblings.findIndex((c) => c.id === cat.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const targetSibling = siblings[targetIndex];
    const newCurrentOrder = targetSibling.sortOrder ?? targetSibling.sort_order ?? 0;
    const newTargetOrder = cat.sortOrder ?? cat.sort_order ?? 0;

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

  const handleOpenDeleteCategory = (cat: Category) => {
    setCategoryToDelete(cat);
    const pId = normalizeParentId(cat.parentId ?? cat.parent_id);
    setReassignChildrenTo(pId || "root");

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
      } else {
        toast.error(data.error || "Failed to save category");
      }
    } catch {
      toast.error("Failed to save category");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Categories Management</span>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
              {categories.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Organize parent &amp; child categories, navigation tree, visibility, and sorting
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
                sortOrder: categories.length,
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

      {/* MODAL: CATEGORY EDIT/CREATE */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  {editingCategory.id ? "Edit Category" : "Add New Category"}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Configure hierarchy, URL slug, and menu display settings
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={editingCategory.name || ""}
                    onChange={(e) => {
                      const name = e.target.value;
                      const updates: Partial<Category> = { name };
                      if (!editingCategory.id && !editingCategory.slug) {
                        updates.slug = slugifyCategory(name);
                      }
                      setEditingCategory({ ...editingCategory, ...updates });
                    }}
                    placeholder="e.g. Travel Totes"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={editingCategory.slug || ""}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: slugifyCategory(e.target.value) })}
                    placeholder="e.g. travel-totes"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-mono"
                  />
                </div>
              </div>

              {/* Parent Category Hierarchy Dropdown */}
              <div>
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Parent Category (Hierarchy)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Select Root to keep at top-level</span>
                </label>
                <select
                  value={editingCategory.parentId ?? editingCategory.parent_id ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingCategory({
                      ...editingCategory,
                      parentId: val ? val : null,
                      parent_id: val ? val : null,
                    });
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-medium bg-white"
                >
                  <option value="">📁 [None - Root Category]</option>
                  {(() => {
                    const disabledIds = editingCategory.id
                      ? getCategoryDescendantIds(editingCategory.id, categories)
                      : new Set<string>();

                    return flattenedCategories.map((item) => {
                      const isSelf = item.category.id === editingCategory.id;
                      const isDescendant = disabledIds.has(item.category.id);
                      const disabled = isSelf || isDescendant;

                      return (
                        <option
                          key={item.category.id}
                          value={item.category.id}
                          disabled={disabled}
                          className={disabled ? "text-slate-300" : "text-slate-800"}
                        >
                          {item.prefix}{item.category.name} {disabled ? "(invalid parent)" : ""}
                        </option>
                      );
                    });
                  })()}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Icon Emoji or Text</label>
                  <input
                    type="text"
                    value={editingCategory.icon || ""}
                    onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                    placeholder="e.g. 👜 or travel"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">Category Image</label>
                  <span className="text-[10px] font-semibold text-slate-400">Storefront &amp; Navigation banner</span>
                </div>

                {/* Hidden File Input for Direct Upload */}
                <input
                  ref={categoryFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCategoryFileUpload(e.target.files)}
                  className="hidden"
                  id="categoryImageFileInput"
                  disabled={uploadingCategoryImg}
                />

                {editingCategory.image ? (
                  /* Image Active Preview Card */
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3.5">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-2xs">
                      <Image
                        src={editingCategory.image}
                        alt={editingCategory.name || "Category Image"}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Image Connected
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-slate-500 truncate mt-1 select-all" title={editingCategory.image}>
                        {editingCategory.image}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setMediaPickerOpen(true)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <ImageIcon className="w-3 h-3 text-slate-600" />
                          <span>Change from Media</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => categoryFileInputRef.current?.click()}
                          disabled={uploadingCategoryImg}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          {uploadingCategoryImg ? (
                            <Loader2 className="w-3 h-3 animate-spin text-slate-600" />
                          ) : (
                            <Upload className="w-3 h-3 text-slate-600" />
                          )}
                          <span>Upload New</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingCategory({
                              ...editingCategory,
                              image: "",
                            })
                          }
                          className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                          title="Remove Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty state / Actions */
                  <div className="p-4 bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-2xl space-y-3 text-center">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                      {/* Select from Media Library */}
                      <button
                        type="button"
                        onClick={() => setMediaPickerOpen(true)}
                        className="w-full sm:w-auto h-10 px-4 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                      >
                        <ImageIcon className="w-4 h-4 text-white" />
                        <span>Choose from Media Library</span>
                      </button>

                      {/* Direct Upload Button */}
                      <label
                        htmlFor="categoryImageFileInput"
                        className={`w-full sm:w-auto h-10 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors ${
                          uploadingCategoryImg ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        {uploadingCategoryImg ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                        ) : (
                          <Upload className="w-4 h-4 text-slate-600" />
                        )}
                        <span>Upload from Computer</span>
                      </label>
                    </div>

                    {/* Manual Image URL Input fallback */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingCategory.image || ""}
                        onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })}
                        placeholder="Or paste image URL (https://...)"
                        className="w-full h-8 px-3 rounded-lg border border-slate-200 bg-white text-[11px] focus:outline-hidden focus:border-slate-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Category description for customer storefront..."
                  className="w-full p-3 rounded-xl border border-slate-200 mt-1"
                />
              </div>

              {/* Active & Visible Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
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
                    <span className="font-bold text-slate-800">Is Active</span>
                    <p className="text-[10px] text-slate-400">If inactive, category and its page are disabled</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
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
                    <span className="font-bold text-slate-800">Visible in Navigation</span>
                    <p className="text-[10px] text-slate-400">Shows in header navbar and category menus</p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/90 cursor-pointer shadow-md"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAFE DELETE MODAL */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-50 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">Delete Category</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Safely reassign subcategories and products to prevent orphaned data
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 space-y-2">
              <p>
                You are about to delete <span className="font-bold">{categoryToDelete.name}</span> (
                <code className="font-mono font-bold text-[11px]">{categoryToDelete.slug}</code>).
              </p>
              {(() => {
                const childCount = categories.filter(
                  (c) => normalizeParentId(c.parentId ?? c.parent_id) === categoryToDelete.id
                ).length;
                const prodCount = products.filter(
                  (p) => p.categorySlug === categoryToDelete.slug || p.categoryId === categoryToDelete.id
                ).length;

                return (
                  <ul className="list-disc pl-4 space-y-1 font-semibold">
                    <li>{childCount} direct subcategories will need reassignment.</li>
                    <li>{prodCount} assigned products will need reassignment.</li>
                  </ul>
                );
              })()}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Reassign Subcategories to:</label>
                <select
                  value={reassignChildrenTo}
                  onChange={(e) => setReassignChildrenTo(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-medium bg-white"
                >
                  <option value="root">📁 Promote to Root (No Parent)</option>
                  {categories
                    .filter((c) => c.id !== categoryToDelete.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.slug})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Reassign Affected Products to:</label>
                <select
                  value={reassignProductsTo}
                  onChange={(e) => setReassignProductsTo(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-medium bg-white"
                >
                  {categories
                    .filter((c) => c.id !== categoryToDelete.id)
                    .map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name} ({c.slug})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={handleConfirmSafeDelete}
                className="bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-700 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isDeletingCategory ? "Deleting..." : "Confirm & Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Image Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(urls) => {
          if (urls[0]) {
            setEditingCategory((prev) => (prev ? { ...prev, image: urls[0] } : null));
            toast.success("Category image selected from Media Library");
          }
        }}
        multiple={false}
        title="Select Category Image"
      />
    </div>
  );
}
