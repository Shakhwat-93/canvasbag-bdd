"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Save,
  ExternalLink,
  Search,
  X,
  Loader2,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  ChevronDown,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminAlert } from "@/components/admin/admin-alert-provider";
import type { Category, Product } from "@/lib/types";
import { formatBDT } from "@/lib/format";

interface ProductsManagerProps {
  initialCategories: Category[];
  initialProducts: Product[];
}

export function ProductsManager({ initialCategories, initialProducts }: ProductsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // URL-driven query states
  const initialCatFilter = searchParams.get("category") || "all";
  const initialSearch = searchParams.get("search") || "";
  const initialStatusFilter = searchParams.get("status") || "all";
  const initialSort = searchParams.get("sort") || "order";

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>(initialCatFilter);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [sortBy, setSortBy] = useState<string>(initialSort);

  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { confirmDelete, alert } = useAdminAlert();

  // Duplicate state
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Status toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filtered & Sorted products
  const displayedProducts = useMemo(() => {
    let list = products.filter((p) => {
      // Category filter
      if (selectedCategoryFilter !== "all") {
        const matchesCategory =
          p.categorySlug === selectedCategoryFilter ||
          (p as any).category_slug === selectedCategoryFilter ||
          p.categoryId === selectedCategoryFilter;
        if (!matchesCategory) return false;
      }

      // Status filter
      if (statusFilter === "active") {
        if (p.status === "inactive" || p.status === "draft") return false;
      } else if (statusFilter === "inactive") {
        if (p.status !== "inactive" && p.status !== "draft") return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch =
          p.name.toLowerCase().includes(term) ||
          p.slug.toLowerCase().includes(term) ||
          (p.badge && p.badge.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [products, selectedCategoryFilter, statusFilter, searchTerm, sortBy]);

  // Update query params without full page reload
  const updateQueryParams = (cat: string, search: string, status: string, sort: string) => {
    const params = new URLSearchParams();
    if (cat && cat !== "all") params.set("category", cat);
    if (search.trim()) params.set("search", search.trim());
    if (status && status !== "all") params.set("status", status);
    if (sort && sort !== "order") params.set("sort", sort);
    const queryString = params.toString();
    const newPath = queryString ? `/admin/products?${queryString}` : "/admin/products";
    router.replace(newPath);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategoryFilter(cat);
    updateQueryParams(cat, searchTerm, statusFilter, sortBy);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    updateQueryParams(selectedCategoryFilter, term, statusFilter, sortBy);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    updateQueryParams(selectedCategoryFilter, searchTerm, status, sortBy);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateQueryParams(selectedCategoryFilter, searchTerm, statusFilter, sort);
  };

  // Reordering controls
  const handleMoveProduct = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= displayedProducts.length) return;

    const currentItem = displayedProducts[index];
    const targetItem = displayedProducts[targetIndex];

    setProducts((prev) => {
      const next = [...prev];
      const i1 = next.findIndex((p) => p.id === currentItem.id);
      const i2 = next.findIndex((p) => p.id === targetItem.id);
      if (i1 !== -1 && i2 !== -1) {
        const temp = next[i1];
        next[i1] = next[i2];
        next[i2] = temp;
      }
      return next;
    });
  };

  const handleSaveProductOrder = async () => {
    setIsSavingOrder(true);
    try {
      const payload = displayedProducts.map((p, idx) => ({
        id: p.id,
        sortOrder: idx + 1,
      }));

      const res = await fetch("/api/admin/product/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_slug: selectedCategoryFilter || "all",
          ordered_ids: displayedProducts.map((p) => p.id),
          items: payload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Product order saved successfully!");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to save order");
      }
    } catch {
      toast.error("Failed to save product order");
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Delete product with unified sweet alert
  const handleDeleteProduct = async (p: Product) => {
    const confirmed = await confirmDelete(
      p.name,
      `Are you sure you want to permanently delete "${p.name}" (${formatBDT(p.price)})? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/product/${p.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((item) => item.id !== p.id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(p.id);
          return next;
        });
        toast.success("Product deleted successfully");
        router.refresh();
      } else {
        await alert({
          title: "Delete Failed",
          description: data.error || "Failed to delete product.",
          variant: "error",
        });
      }
    } catch {
      await alert({
        title: "Network Error",
        description: "An unexpected error occurred while deleting the product.",
        variant: "error",
      });
    }
  };

  // Duplicate product
  const handleDuplicateProduct = async (p: Product) => {
    setDuplicatingId(p.id);
    const newSlug = `${p.slug}-copy-${Date.now().toString().slice(-4)}`;
    const duplicatedProduct: Partial<Product> = {
      ...p,
      id: `prod-${Date.now()}`,
      name: `${p.name} (Copy)`,
      slug: newSlug,
      status: "draft",
      created_at: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/admin/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: duplicatedProduct }),
      });

      const data = await res.json();
      if (data.success) {
        setProducts((prev) => [data.product || (duplicatedProduct as Product), ...prev]);
        toast.success(`Duplicated "${p.name}" as draft`);
        router.refresh();
      } else {
        toast.error(data.error || "Failed to duplicate product");
      }
    } catch {
      toast.error("Failed to duplicate product");
    } finally {
      setDuplicatingId(null);
    }
  };

  // Bulk selection
  const toggleSelectAll = () => {
    if (selectedIds.size === displayedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedProducts.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleProductStatus = async (productToToggle: Product) => {
    const isCurrentlyActive =
      productToToggle.status !== "inactive" && productToToggle.status !== "draft";
    const nextStatus: "active" | "inactive" = isCurrentlyActive ? "inactive" : "active";

    setTogglingId(productToToggle.id);

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === productToToggle.id ? { ...p, status: nextStatus } : p))
    );

    try {
      const res = await fetch("/api/admin/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productToToggle.id, status: nextStatus }),
      });

      const data = await res.json();
      if (data.success) {
        if (nextStatus === "active") {
          toast.success(`"${productToToggle.name}" এখন ওয়েবসাইটে সক্রিয় (Active / অন)`, {
            description: "প্রোডাক্টটি স্টোরফ্রন্ট, শপ ও ক্যাটাগরি পেজে লাইভ দেখাচ্ছে।",
          });
        } else {
          toast.info(`"${productToToggle.name}" ওয়েবসাইট থেকে লুকানো হয়েছে (Inactive / অফ)`, {
            description: "গ্রাহকরা এই প্রোডাক্ট ওয়েবসাইটে দেখতে পাবেন না।",
          });
        }
      } else {
        // Rollback on error
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productToToggle.id ? { ...p, status: productToToggle.status } : p
          )
        );
        toast.error(data.error || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে");
      }
    } catch {
      // Rollback on error
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productToToggle.id ? { ...p, status: productToToggle.status } : p
        )
      );
      toast.error("নেটওয়ার্ক সমস্যার কারণে স্ট্যাটাস পরিবর্তন করা যায়নি");
    } finally {
      setTogglingId(null);
    }
  };

  const handleBulkStatus = async (status: "active" | "inactive") => {
    if (selectedIds.size === 0) return;
    const toastId = toast.loading(
      `${selectedIds.size}টি প্রোডাক্ট ${status === "active" ? "অন (Active)" : "অফ (Inactive)"} করা হচ্ছে...`
    );

    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch("/api/admin/product", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        })
      );

      await Promise.all(promises);
      setProducts((prev) =>
        prev.map((p) => (selectedIds.has(p.id) ? { ...p, status } : p))
      );
      toast.success(
        `${selectedIds.size}টি প্রোডাক্ট সফলভাবে ${status === "active" ? "অন (Active)" : "অফ (Inactive)"} করা হয়েছে`,
        { id: toastId }
      );
      setSelectedIds(new Set());
    } catch {
      toast.error("বাল্ক স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে", { id: toastId });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EFECE6] p-5 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFECE6] pb-5">
        <div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <span>Products Manager</span>
            <span className="text-xs bg-[#FAF8F5] text-stone-600 font-bold px-2.5 py-0.5 rounded-full border border-[#EFECE6]">
              {products.length} Total
            </span>
          </h2>
          <p className="text-xs text-stone-400 font-medium mt-0.5">
            Manage product catalog, prices, stock, search, and manual reorder sorting
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="bg-[#D45266] hover:bg-[#BF4357] text-white px-4 py-2 rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Add Product</span>
        </Link>
      </div>

      {/* Filter / Search & Sort Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EFECE6]">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search products..."
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-[#EFECE6] bg-white text-xs font-medium text-stone-800 focus:outline-none focus:border-[#D45266]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id || c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive / Draft</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer"
          >
            <option value="order">Custom Sort Order</option>
            <option value="name">Name (A-Z)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
          </select>
        </div>

        {/* Save Order Action */}
        <button
          type="button"
          onClick={handleSaveProductOrder}
          disabled={isSavingOrder}
          className="bg-slate-950 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-all shrink-0"
        >
          {isSavingOrder ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Save Order</span>
        </button>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-16 z-20 bg-slate-950 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2 py-0.5 bg-slate-800 rounded-lg text-white font-mono">
              {selectedIds.size}
            </span>
            <span>selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkStatus("active")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Activate
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatus("inactive")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Deactivate
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Desktop Products Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider">
              <th className="pb-3 w-8">
                <input
                  type="checkbox"
                  checked={
                    displayedProducts.length > 0 &&
                    selectedIds.size === displayedProducts.length
                  }
                  onChange={toggleSelectAll}
                  className="rounded text-slate-900 cursor-pointer"
                  title="Select all"
                />
              </th>
              <th className="pb-3 w-14">Order</th>
              <th className="pb-3 w-16">Image</th>
              <th className="pb-3">Product Name</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Price</th>
              <th className="pb-3 text-center">Status / অন-অফ</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {displayedProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400 font-semibold">
                  No products found.
                </td>
              </tr>
            ) : (
              displayedProducts.map((p, index) => {
                const imgUrl =
                  p.image ||
                  p.imageUrl ||
                  (p.images?.[0]
                    ? typeof p.images[0] === "string"
                      ? p.images[0]
                      : p.images[0].url
                    : "/brand/logo.webp");

                const isSelected = selectedIds.has(p.id);
                const isActive = p.status !== "inactive" && p.status !== "draft";

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? "bg-slate-50/90" : ""
                    }`}
                  >
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded text-slate-900 cursor-pointer"
                      />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveProduct(index, "up")}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveProduct(index, "down")}
                          disabled={index === displayedProducts.length - 1}
                          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <Image
                          src={imgUrl}
                          alt={p.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="hover:underline hover:text-slate-950 transition-colors"
                        >
                          {p.name}
                        </Link>
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-700"
                          title="Open on live storefront"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                        <span>/{p.slug}</span>
                        {p.badge && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded text-[9px] font-bold">
                            {p.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-[11px]">
                        {p.categoryName || p.categorySlug}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-slate-900 whitespace-nowrap">
                      <span>{formatBDT(p.price)}</span>
                      {Boolean(p.compareAtPrice && p.compareAtPrice > p.price) && (
                        <span className="text-[11px] text-slate-400 line-through font-normal ml-1.5">
                          {formatBDT(p.compareAtPrice!)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleProductStatus(p)}
                        disabled={togglingId === p.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border select-none disabled:opacity-50 ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                        }`}
                        title={isActive ? "ক্লিক করে অফ (হাইড) করুন" : "ক্লিক করে অন (লাইভ) করুন"}
                      >
                        {togglingId === p.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                        ) : (
                          <span
                            className={`w-2 h-2 rounded-full transition-transform ${
                              isActive ? "bg-emerald-600 ring-2 ring-emerald-300/60" : "bg-slate-400"
                            }`}
                          />
                        )}
                        <span>{isActive ? "অন (Active)" : "অফ (Hidden)"}</span>
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDuplicateProduct(p)}
                          disabled={duplicatingId === p.id}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Duplicate product"
                        >
                          {duplicatingId === p.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards */}
      <div className="md:hidden space-y-3">
        {displayedProducts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No products found.
          </div>
        ) : (
          displayedProducts.map((p, index) => {
            const imgUrl =
              p.image ||
              p.imageUrl ||
              (p.images?.[0]
                ? typeof p.images[0] === "string"
                  ? p.images[0]
                  : p.images[0].url
                : "/brand/logo.webp");

            const isActive = p.status !== "inactive" && p.status !== "draft";

            return (
              <div
                key={p.id}
                className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <Image src={imgUrl} alt={p.name} fill sizes="56px" className="object-cover" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{p.name}</h3>
                      <button
                        type="button"
                        onClick={() => handleToggleProductStatus(p)}
                        disabled={togglingId === p.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer shrink-0 select-none disabled:opacity-50 ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                        }`}
                        title={isActive ? "ক্লিক করে অফ করুন" : "ক্লিক করে অন করুন"}
                      >
                        {togglingId === p.id ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-500" />
                        ) : (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-600 ring-2 ring-emerald-300/60" : "bg-slate-400"
                            }`}
                          />
                        )}
                        <span>{isActive ? "অন" : "অফ"}</span>
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                      /{p.slug}
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-black text-slate-900 text-xs">{formatBDT(p.price)}</span>
                      {Boolean(p.compareAtPrice && p.compareAtPrice > p.price) && (
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatBDT(p.compareAtPrice!)}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md ml-auto">
                        {p.categoryName || p.categorySlug}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveProduct(index, "up")}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveProduct(index, "down")}
                      disabled={index === displayedProducts.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/product/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-slate-700"
                      title="Storefront"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
