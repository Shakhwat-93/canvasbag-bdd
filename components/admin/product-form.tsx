"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  Loader2,
  ExternalLink,
  Star,
  Check,
  Eye,
  ArrowUp,
  ArrowDown,
  Palette,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Layers,
  Tag,
  MessageSquare,
  RefreshCw,
  Smartphone,
  Monitor,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { Category, Product, ProductVariant, ProductReview } from "@/lib/types";
import { buildCategoryTree, flattenCategoryTree, slugifyCategory } from "@/lib/category-tree";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";

interface ProductFormProps {
  initialProduct?: Partial<Product>;
  initialReviews?: ProductReview[];
  categories: Category[];
  mode?: "create" | "edit";
}

const PRESET_COLORS = [
  { name: "Midnight Black", hex: "#18181b" },
  { name: "Vintage Olive", hex: "#4b5320" },
  { name: "Khaki Tan", hex: "#c2a68c" },
  { name: "Navy Blue", hex: "#1e3a5f" },
  { name: "Slate Grey", hex: "#475569" },
  { name: "Coffee Brown", hex: "#5c4033" },
  { name: "Burgundy Red", hex: "#800020" },
  { name: "Natural Ecru", hex: "#f5f2eb" },
];

const PRESET_SPECS = [
  { key: "Material", placeholder: "e.g. 16oz Heavy-Duty Duck Canvas" },
  { key: "Dimensions", placeholder: "e.g. 16\"H x 12\"W x 5\"D" },
  { key: "Weight", placeholder: "e.g. 480 grams" },
  { key: "Closure", placeholder: "e.g. Heavy brass YKK zipper" },
  { key: "Compartments", placeholder: "e.g. 1 main + 2 internal slip pockets" },
  { key: "Capacity", placeholder: "e.g. 18 Liters" },
  { key: "Strap Length", placeholder: "e.g. 11 inch shoulder drop" },
  { key: "Origin", placeholder: "e.g. Handcrafted in Bangladesh" },
];

export function ProductForm({
  initialProduct,
  initialReviews = [],
  categories,
  mode = "create",
}: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"gallery" | "variant">("gallery");

  // Form State
  const [product, setProduct] = useState<Partial<Product>>({
    id: initialProduct?.id || "",
    name: initialProduct?.name || "",
    db_product_name: initialProduct?.db_product_name || "",
    slug: initialProduct?.slug || "",
    price: initialProduct?.price || 0,
    compareAtPrice: initialProduct?.compareAtPrice || 0,
    badge: initialProduct?.badge || "",
    categorySlug: initialProduct?.categorySlug || categories[0]?.slug || "everyday-totes",
    categoryName: initialProduct?.categoryName || categories[0]?.name || "Everyday Totes",
    categoryId: initialProduct?.categoryId || categories[0]?.id || "",
    status: initialProduct?.status || "active",
    isFeatured: Boolean(initialProduct?.isFeatured || initialProduct?.is_featured),
    story: initialProduct?.story || "",
    benefits: initialProduct?.benefits || [],
    specs: initialProduct?.specs || [],
    images: initialProduct?.images || [],
    variants: initialProduct?.variants || [],
    created_at: initialProduct?.created_at || new Date().toISOString(),
  });

  // Reviews State
  const [reviews, setReviews] = useState<ProductReview[]>(
    initialReviews.length > 0 ? initialReviews : (initialProduct?.reviews || [])
  );
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    customer_name: "",
    rating: 5,
    comment: "",
    status: "approved" as "approved" | "pending",
  });

  // Slug Availability State
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{
    available: boolean;
    message?: string;
    suggestedSlug?: string;
  } | null>(null);
  const slugDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Mark dirty on changes
  const updateProduct = (updates: Partial<Product>) => {
    setProduct((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  // Category Tree
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const flattenedCategories = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);

  // Real-time Slug Validation
  const checkSlugAvailability = (slugToCheck: string) => {
    if (!slugToCheck.trim()) {
      setSlugStatus(null);
      return;
    }
    setSlugChecking(true);
    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current);

    slugDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/slug-check?slug=${encodeURIComponent(slugToCheck)}&excludeId=${encodeURIComponent(
            product.id || ""
          )}`
        );
        const data = await res.json();
        setSlugStatus({
          available: Boolean(data.available),
          message: data.message,
          suggestedSlug: data.suggestedSlug,
        });
      } catch {
        setSlugStatus(null);
      } finally {
        setSlugChecking(false);
      }
    }, 400);
  };

  // Auto-generate slug from name if creating or slug is empty
  const handleNameChange = (name: string) => {
    const generatedSlug = slugifyCategory(name);
    if (mode === "create" && (!product.slug || product.slug === slugifyCategory(product.name || ""))) {
      updateProduct({ name, slug: generatedSlug });
      checkSlugAvailability(generatedSlug);
    } else {
      updateProduct({ name });
    }
  };

  const handleSlugChange = (rawSlug: string) => {
    const sanitized = rawSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    updateProduct({ slug: sanitized });
    checkSlugAvailability(sanitized);
  };

  // Discount percentage calculation
  const discountPercent = useMemo(() => {
    const p = Number(product.price) || 0;
    const cp = Number(product.compareAtPrice) || 0;
    if (cp > p && cp > 0) {
      return Math.round(((cp - p) / cp) * 100);
    }
    return 0;
  }, [product.price, product.compareAtPrice]);

  // Image Management
  const [imageUrlInput, setImageUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const url = imageUrlInput.trim();
    updateProduct({
      images: [...(product.images || []), url],
    });
    setImageUrlInput("");
    toast.success("Image URL added");
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    const toastId = toast.loading(`Uploading & optimizing ${files.length} image(s)...`);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          uploadedUrls.push(data.url);
        } else {
          toast.error(data.error || `Failed to upload ${files[i].name}`, { id: toastId });
        }
      }

      if (uploadedUrls.length > 0) {
        updateProduct({
          images: [...(product.images || []), ...uploadedUrls],
        });
        toast.success(`Successfully uploaded ${uploadedUrls.length} image(s) to R2!`, { id: toastId });
      }
    } catch (err: any) {
      toast.error("Image upload failed: " + (err?.message || "Network error"), { id: toastId });
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (multiFileInputRef.current) multiFileInputRef.current.value = "";
    }
  };

  const handleMediaPickerSelect = (selectedUrls: string[]) => {
    if (mediaPickerTarget === "gallery") {
      const existing = (product.images || []).map((img) =>
        typeof img === "string" ? img : img.url
      );
      const toAdd = selectedUrls.filter((u) => !existing.includes(u));
      const updated = [...(product.images || []), ...toAdd];
      const firstUrl = typeof updated[0] === "string" ? updated[0] : updated[0]?.url || "";
      updateProduct({
        images: updated,
        image: product.image || firstUrl,
        imageUrl: product.imageUrl || firstUrl,
      });
      toast.success(`Added ${toAdd.length} image(s) from Media Library`);
    } else if (mediaPickerTarget === "variant") {
      if (selectedUrls[0]) {
        setNewVariant((prev) => ({ ...prev, image: selectedUrls[0] }));
        toast.success("Variant image selected from Media Library");
      }
    }
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    const currentImages = [...(product.images || [])];
    const [selected] = currentImages.splice(index, 1);
    currentImages.unshift(selected);
    updateProduct({ images: currentImages });
    toast.success("Primary image updated");
  };

  const handleMoveImage = (index: number, direction: "up" | "down") => {
    const currentImages = [...(product.images || [])];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentImages.length) return;
    const temp = currentImages[index];
    currentImages[index] = currentImages[targetIndex];
    currentImages[targetIndex] = temp;
    updateProduct({ images: currentImages });
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = [...(product.images || [])];
    currentImages.splice(index, 1);
    updateProduct({ images: currentImages });
    toast.success("Image removed");
  };

  // Variants Management
  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({
    name: "",
    colorCode: "#18181b",
    image: "",
    price: undefined,
    compareAtPrice: undefined,
    inStock: true,
  });
  const [showAddVariant, setShowAddVariant] = useState(false);
  const variantFileRef = useRef<HTMLInputElement>(null);

  const handleAddVariant = () => {
    if (!newVariant.name?.trim()) {
      toast.error("Variant name is required (e.g. Midnight Black)");
      return;
    }
    const variantItem: ProductVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newVariant.name.trim(),
      colorCode: newVariant.colorCode || "#18181b",
      image: newVariant.image || (product.images?.[0] ? (typeof product.images[0] === "string" ? product.images[0] : (product.images[0] as any).url) : ""),
      price: newVariant.price ? Number(newVariant.price) : undefined,
      compareAtPrice: newVariant.compareAtPrice ? Number(newVariant.compareAtPrice) : undefined,
      inStock: newVariant.inStock ?? true,
    };

    updateProduct({
      variants: [...(product.variants || []), variantItem],
    });
    setNewVariant({
      name: "",
      colorCode: "#18181b",
      image: "",
      price: undefined,
      compareAtPrice: undefined,
      inStock: true,
    });
    setShowAddVariant(false);
    toast.success("Color variant added");
  };

  const handleRemoveVariant = (id: string) => {
    updateProduct({
      variants: (product.variants || []).filter((v) => v.id !== id),
    });
    toast.success("Variant removed");
  };

  const handleToggleVariantStock = (id: string) => {
    updateProduct({
      variants: (product.variants || []).map((v) =>
        v.id === id ? { ...v, inStock: !v.inStock } : v
      ),
    });
  };

  const handleUploadVariantImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      toast.loading("Uploading variant image to R2...", { id: "var-img" });
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setNewVariant((prev) => ({ ...prev, image: data.url }));
        toast.success("Variant image uploaded", { id: "var-img" });
      } else {
        toast.error(data.error || "Upload failed", { id: "var-img" });
      }
    } catch {
      toast.error("Upload failed", { id: "var-img" });
    }
  };

  // Benefits / Highlights Management
  const [benefitInput, setBenefitInput] = useState("");
  const handleAddBenefit = () => {
    if (!benefitInput.trim()) return;
    updateProduct({
      benefits: [...(product.benefits || []), benefitInput.trim()],
    });
    setBenefitInput("");
  };

  const handleMoveBenefit = (index: number, direction: "up" | "down") => {
    const list = [...(product.benefits || [])];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    updateProduct({ benefits: list });
  };

  const handleRemoveBenefit = (index: number) => {
    updateProduct({
      benefits: (product.benefits || []).filter((_, i) => i !== index),
    });
  };

  // Specs Management
  const [specKey, setSpecKey] = useState("");
  const [specVal, setSpecVal] = useState("");
  const handleAddSpec = () => {
    if (!specKey.trim() || !specVal.trim()) {
      toast.error("Both specification label and value are required");
      return;
    }
    updateProduct({
      specs: [...(product.specs || []), { key: specKey.trim(), value: specVal.trim() }],
    });
    setSpecKey("");
    setSpecVal("");
  };

  const handleApplyPresetSpec = (presetKey: string) => {
    setSpecKey(presetKey);
  };

  const handleMoveSpec = (index: number, direction: "up" | "down") => {
    const list = [...(product.specs || [])];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    updateProduct({ specs: list });
  };

  const handleRemoveSpec = (index: number) => {
    updateProduct({
      specs: (product.specs || []).filter((_, i) => i !== index),
    });
  };

  // Reviews Management
  const approvedReviews = useMemo(() => reviews.filter((r) => r.status === "approved"), [reviews]);
  const averageRating = useMemo(() => {
    if (approvedReviews.length === 0) return 5.0;
    const total = approvedReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    return Math.round((total / approvedReviews.length) * 10) / 10;
  }, [approvedReviews]);

  const handleAddReview = () => {
    if (!newReview.customer_name.trim() || !newReview.comment.trim()) {
      toast.error("Customer name and review comment are required");
      return;
    }
    const createdReview: ProductReview = {
      id: `rev-${Date.now()}`,
      product_id: product.id || "",
      product_name: product.name || "",
      customer_name: newReview.customer_name.trim(),
      name: newReview.customer_name.trim(),
      rating: newReview.rating,
      comment: newReview.comment.trim(),
      quote: newReview.comment.trim(),
      status: newReview.status,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      created_at: new Date().toISOString(),
    };

    setReviews([createdReview, ...reviews]);
    setNewReview({ customer_name: "", rating: 5, comment: "", status: "approved" });
    setShowAddReviewModal(false);
    setIsDirty(true);
    toast.success("Customer review added");
  };

  const handleToggleReviewStatus = (id: string | number | undefined) => {
    if (!id) return;
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === "approved" ? "pending" : "approved" } : r
      )
    );
    setIsDirty(true);
  };

  const handleDeleteReview = (id: string | number | undefined) => {
    if (!id) return;
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setIsDirty(true);
    toast.success("Review deleted");
  };

  // Navigation Guard for Unsaved Changes
  const handleBack = () => {
    if (isDirty) {
      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
        router.push("/admin/products");
      }
    } else {
      router.push("/admin/products");
    }
  };

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!product.name || !product.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (!product.price || Number(product.price) <= 0) {
      toast.error("Please enter a valid selling price greater than 0");
      return;
    }

    if (slugStatus && !slugStatus.available) {
      toast.error(slugStatus.message || "Please fix the product slug before saving");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Saving product to catalog...");

    try {
      const payload = {
        ...product,
        reviews,
      };

      const res = await fetch("/api/admin/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsDirty(false);
        toast.success(
          mode === "edit" ? "Product updated successfully!" : "Product published successfully!",
          { id: toastId }
        );
        router.push("/admin/products");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to save product", { id: toastId });
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Save product error:", err);
      toast.error("Network error while saving product", { id: toastId });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-left pb-20 max-w-6xl mx-auto">
      {/* ────────────────────────────────────────────────────────
          TOP APP BAR / ACTIONS
         ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 -mx-4 px-4 sm:-mx-6 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors"
            title="Go back to products"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                {mode === "edit" ? `Edit Product: ${product.name || "Untitled"}` : "Add New Product"}
              </h1>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  product.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : product.status === "inactive"
                    ? "bg-slate-100 text-slate-600 border border-slate-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {product.status || "active"}
              </span>
              {isDirty && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Enterprise catalog management with Cloudflare R2 storage &amp; instant cache invalidation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {mode === "edit" && product.slug && (
            <Link
              href={`/product/${product.slug}`}
              target="_blank"
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <span>View Live</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-3.5 py-2 border border-slate-200 hover:border-slate-300 bg-white rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Storefront Preview</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading}
            className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{mode === "edit" ? "Update Product" : "Publish Product"}</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          MAIN FORM SECTIONS
         ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-xs">
        {/* LEFT COLUMN: Core Details (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-8">
          {/* SECTION 1: Basic Information */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-1.5 h-5 bg-[#ff6b35] rounded-full" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                1. Product Basic Information
              </h2>
            </div>

            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span>Product Title / Name *</span>
                  <span className="text-[11px] text-slate-400 font-normal">Visible across storefront &amp; SEO</span>
                </label>
                <input
                  type="text"
                  required
                  value={product.name || ""}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Classic Premium Canvas Everyday Tote"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 outline-hidden bg-white mt-1.5 font-bold text-sm text-slate-900 shadow-2xs"
                />
              </div>

              {/* DB Insert Product Name / SKU Code */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-2">
                    <span>DB Insert Product Name / SKU Code</span>
                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      অর্ডারের সময় DB-তে যাবে
                    </span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-normal">
                    ঐচ্ছিক (ফাঁকা রাখলে টাইটেল যাবে)
                  </span>
                </div>
                <input
                  type="text"
                  value={product.db_product_name || ""}
                  onChange={(e) => updateProduct({ db_product_name: e.target.value })}
                  placeholder="যেমন: LTB-2 অথবা CanvasBag-01 (কল সেন্টার / CRM কোড)"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden bg-white mt-1.5 font-mono text-xs font-bold text-slate-900 shadow-2xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 গ্রাহক যখন এই প্রোডাক্ট অর্ডার করবেন, তখন ডাটাবেজে (Supabase &amp; SQLite) <code>product_name</code> হিসেবে সাধারণ বড় টাইটেলটির বদলে এখানে দেওয়া কোড বা নাম সেভ হবে। ফাঁকা রাখলে স্বয়ংক্রিয়ভাবে উপরের মূল টাইটেলটি ব্যবহৃত হবে।
                </p>
              </div>

              {/* Slug with Live Validation */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs">URL Slug *</label>
                  <div className="flex items-center gap-1.5">
                    {slugChecking && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> checking...
                      </span>
                    )}
                    {slugStatus && !slugChecking && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          slugStatus.available
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-600 border border-red-200"
                        }`}
                      >
                        {slugStatus.available ? (
                          <>
                            <Check className="w-2.5 h-2.5" /> Available
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-2.5 h-2.5" /> Taken
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-1.5 flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50 focus-within:border-slate-400 shadow-2xs">
                  <span className="px-3 flex items-center text-slate-400 text-xs font-mono select-none">
                    /product/
                  </span>
                  <input
                    type="text"
                    required
                    value={product.slug || ""}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="classic-premium-canvas-everyday-tote"
                    className="flex-1 h-10 px-2 bg-white outline-hidden font-mono text-xs text-slate-800 font-semibold"
                  />
                </div>
                {slugStatus && !slugStatus.available && slugStatus.suggestedSlug && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1.5">
                    <span>Slug is already in use.</span>
                    <button
                      type="button"
                      onClick={() => handleSlugChange(slugStatus.suggestedSlug!)}
                      className="text-slate-900 font-bold underline hover:text-[#ff6b35] cursor-pointer"
                    >
                      Use suggested: &ldquo;{slugStatus.suggestedSlug}&rdquo;
                    </button>
                  </p>
                )}
              </div>

              {/* Pricing & Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="font-bold text-slate-800 text-xs">Selling Price (Tk) *</label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={product.price || ""}
                      onChange={(e) => updateProduct({ price: Number(e.target.value) })}
                      placeholder="1450"
                      className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 bg-white font-black text-sm text-slate-900 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs">Compare Price (Tk)</label>
                    {discountPercent > 0 && (
                      <span className="text-[10px] font-extrabold bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                    <input
                      type="number"
                      min={0}
                      value={product.compareAtPrice || ""}
                      onChange={(e) => updateProduct({ compareAtPrice: Number(e.target.value) })}
                      placeholder="1850"
                      className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 text-xs">Promo Badge</label>
                  <input
                    type="text"
                    value={product.badge || ""}
                    onChange={(e) => updateProduct({ badge: e.target.value })}
                    placeholder="e.g. HOT / 30% OFF / NEW"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white mt-1.5 font-bold text-slate-800 shadow-2xs uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Marketing Story Description */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#ff6b35] rounded-full" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  2. Marketing Story &amp; Description
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Supports multi-paragraph narrative
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Describe the craftsmanship, fabric details, lifestyle utility, and story behind this bag.
              Line breaks will automatically render as paragraphs on the storefront.
            </p>

            <textarea
              rows={6}
              value={product.story || ""}
              onChange={(e) => updateProduct({ story: e.target.value })}
              placeholder="আমাদের এই প্রিমিয়াম ক্যানভাস টোট ব্যাগটি তৈরি করা হয়েছে শতভাগ খাঁটি এবং টেকসই হেভি-ডিউটি ক্যানভাস ফেব্রিক দিয়ে..."
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 outline-hidden bg-white font-normal text-slate-800 text-xs leading-relaxed shadow-2xs"
            />
          </div>

          {/* SECTION 3: Showcase Images (Cloudflare R2) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#ff6b35] rounded-full" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  3. Showcase Images (Cloudflare R2)
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                {product.images?.length || 0} Images
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Upload multi-angle photography. Uploads are automatically optimized to high-clarity WebP
              (quality: 90) and stored in Cloudflare R2 bucket <code>images-for-canvas</code>. The first image
              is your <strong>Primary Showcase Image</strong>.
            </p>

            {/* Upload & Media Library Controls */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Choose from Media Library (Prominent High-Contrast Card) */}
                <button
                  type="button"
                  onClick={() => {
                    setMediaPickerTarget("gallery");
                    setMediaPickerOpen(true);
                  }}
                  className="group relative flex items-center gap-3.5 p-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl cursor-pointer shadow-md hover:shadow-lg transition-all text-left overflow-hidden border border-slate-800 active:scale-[0.99]"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-[#ff6b35] transition-colors">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-white">Choose from Media Library</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-[#ff6b35] text-white px-1.5 py-0.2 rounded-sm">
                        R2 Bucket
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                      Select existing product &amp; banner photos
                    </p>
                  </div>
                </button>

                {/* Upload New Photos directly */}
                <div className="flex items-center gap-2">
                  <input
                    ref={multiFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="multiImageUpload"
                    disabled={uploadingImages}
                  />
                  <label
                    htmlFor="multiImageUpload"
                    className={`flex-1 h-full min-h-[58px] px-3.5 bg-white border border-slate-300 hover:border-slate-500 hover:bg-slate-50 text-slate-800 rounded-2xl flex items-center gap-3 cursor-pointer shadow-2xs transition-all ${
                      uploadingImages ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      {uploadingImages ? (
                        <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
                      ) : (
                        <Upload className="w-5 h-5 text-slate-700" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-extrabold text-xs text-slate-900 block truncate">
                        Upload from Device
                      </span>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                        Multi-file, auto-WebP 90%
                      </p>
                    </div>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="singleImageUpload"
                    disabled={uploadingImages}
                  />
                  <label
                    htmlFor="singleImageUpload"
                    className={`h-full min-h-[58px] px-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center cursor-pointer shadow-2xs transition-all ${
                      uploadingImages ? "opacity-50 pointer-events-none" : ""
                    }`}
                    title="Upload single image"
                  >
                    <Plus className="w-4 h-4 text-slate-600" />
                  </label>
                </div>
              </div>
            </div>

            {/* Add by URL */}
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Or paste external / Cloudflare image URL (https://...)"
                className="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-4 h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                Add URL
              </button>
            </div>

            {/* Images Grid */}
            {(product.images || []).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                {(product.images || []).map((img, idx) => {
                  const url = typeof img === "object" && img !== null ? (img as any).url : img;
                  const isPrimary = idx === 0;

                  return (
                    <div
                      key={idx}
                      className={`relative group rounded-xl overflow-hidden border transition-all bg-white shadow-2xs ${
                        isPrimary ? "border-[#ff6b35] ring-2 ring-[#ff6b35]/20" : "border-slate-200"
                      }`}
                    >
                      <div className="relative aspect-square w-full">
                        <Image
                          src={url}
                          alt=""
                          fill
                          sizes="180px"
                          className="object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Primary Badge */}
                      {isPrimary && (
                        <span className="absolute top-2 left-2 bg-[#ff6b35] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-white" /> Primary
                        </span>
                      )}

                      {/* Hover Overlay Controls */}
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex items-center justify-between">
                          {!isPrimary ? (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className="px-2 py-1 bg-white hover:bg-[#ff6b35] text-slate-900 hover:text-white rounded-md text-[10px] font-bold shadow-xs cursor-pointer transition-colors"
                            >
                              Set Primary
                            </button>
                          ) : (
                            <span />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer shadow-xs transition-colors"
                            title="Delete Image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, "up")}
                            className="p-1 bg-white/90 text-slate-800 rounded hover:bg-white disabled:opacity-30 cursor-pointer"
                            title="Move Left"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-white text-[10px] font-bold font-mono">
                            #{idx + 1}
                          </span>
                          <button
                            type="button"
                            disabled={idx === (product.images?.length || 1) - 1}
                            onClick={() => handleMoveImage(idx, "down")}
                            className="p-1 bg-white/90 text-slate-800 rounded hover:bg-white disabled:opacity-30 cursor-pointer"
                            title="Move Right"
                          >
                            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 px-4 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/70 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs mx-auto flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">No Showcase Images Added Yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Select existing photos from your Cloudflare R2 Media Library or upload new ones from your computer.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaPickerTarget("gallery");
                      setMediaPickerOpen(true);
                    }}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <ImageIcon className="w-4 h-4 text-[#ff6b35]" />
                    <span>Choose from Media Library</span>
                  </button>
                  <label
                    htmlFor="multiImageUpload"
                    className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95 transition-all"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Upload from Computer</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: Color Variants */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#ff6b35] rounded-full" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  4. Color Variants &amp; Swatches
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVariant(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Configure color variants with interactive swatches, variant-specific images, price overrides,
              and in-stock status.
            </p>

            {/* Add Variant Form Drawer */}
            {showAddVariant && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-extrabold text-slate-900 text-xs">New Color Variant</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddVariant(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Color Name *</label>
                    <input
                      type="text"
                      value={newVariant.name || ""}
                      onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                      placeholder="e.g. Midnight Black"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white mt-1 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Hex Color Code</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={newVariant.colorCode || "#18181b"}
                        onChange={(e) => setNewVariant({ ...newVariant, colorCode: e.target.value })}
                        className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={newVariant.colorCode || "#18181b"}
                        onChange={(e) => setNewVariant({ ...newVariant, colorCode: e.target.value })}
                        placeholder="#18181b"
                        className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Palettes */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quick Color Palette:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setNewVariant({ ...newVariant, name: c.name, colorCode: c.hex })}
                        className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md text-[11px] hover:border-slate-400 cursor-pointer"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/10"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variant Image & Price Override */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Variant Image</label>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMediaPickerTarget("variant");
                          setMediaPickerOpen(true);
                        }}
                        className="h-9 px-3 bg-slate-900 hover:bg-black text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-[11px] shadow-2xs transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-[#ff6b35]" />
                        <span>From Media Library</span>
                      </button>
                      <input
                        ref={variantFileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUploadVariantImage}
                        className="hidden"
                        id="varImgInput"
                      />
                      <label
                        htmlFor="varImgInput"
                        className="h-9 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer text-[11px] shadow-2xs transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        <span>Upload File</span>
                      </label>
                      {newVariant.image && (
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-300 shadow-2xs shrink-0">
                          <Image src={newVariant.image} alt="" fill className="object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Price Override (Optional)</label>
                    <input
                      type="number"
                      value={newVariant.price || ""}
                      onChange={(e) =>
                        setNewVariant({
                          ...newVariant,
                          price: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder={`Default: ৳${product.price || 0}`}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">In Stock</label>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newVariant.inStock ?? true}
                        onChange={(e) => setNewVariant({ ...newVariant, inStock: e.target.checked })}
                        className="w-4 h-4 rounded text-[#ff6b35] focus:ring-[#ff6b35]"
                        id="newVarInStock"
                      />
                      <label htmlFor="newVarInStock" className="font-semibold text-slate-800">
                        Available for sale
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowAddVariant(false)}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-4 py-1.5 bg-[#ff6b35] hover:bg-[#e55520] text-white rounded-lg font-bold cursor-pointer"
                  >
                    Save Variant
                  </button>
                </div>
              </div>
            )}

            {/* Variant List */}
            {(product.variants || []).length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {(product.variants || []).map((v) => (
                  <div key={v.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      {v.image ? (
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                          <Image src={v.image} alt={v.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <span
                          className="w-6 h-6 rounded-full border border-black/10 shadow-2xs shrink-0"
                          style={{ backgroundColor: v.colorCode || "#18181b" }}
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{v.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">{v.colorCode}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span>Price: ৳{v.price || product.price}</span>
                          <span>•</span>
                          <span className={v.inStock ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
                            {v.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleVariantStock(v.id)}
                        className="px-2.5 py-1 text-[11px] font-bold border border-slate-200 rounded-md hover:bg-white cursor-pointer"
                      >
                        {v.inStock ? "Mark Out of Stock" : "Mark In Stock"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(v.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md cursor-pointer"
                        title="Delete Variant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No color variants added (product will sell as single standard).</p>
            )}
          </div>

          {/* SECTION 5: Key Highlights & Benefits */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#ff6b35] rounded-full" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  5. Key Features &amp; Benefits
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Rendered with checkmarks</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddBenefit();
                  }
                }}
                placeholder="e.g. ওয়াটারপ্রুফ ইনার লাইনিং যা বৃষ্টির পানি থেকে সুরক্ষা দেয়"
                className="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 bg-white"
              />
              <button
                type="button"
                onClick={handleAddBenefit}
                className="px-4 h-10 bg-slate-900 hover:bg-black text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {(product.benefits || []).map((b, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50/70 border border-slate-200 rounded-xl"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#ff6b35] shrink-0" />
                    <span className="font-medium text-slate-800 text-xs">{b}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveBenefit(idx, "up")}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (product.benefits?.length || 1) - 1}
                      onClick={() => handleMoveBenefit(idx, "down")}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 6: Technical Specifications */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#ff6b35] rounded-full" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  6. Technical Specifications
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Structured Key-Value table</span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Quick Presets:</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SPECS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handleApplyPresetSpec(p.key)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    + {p.key}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <input
                type="text"
                value={specKey}
                onChange={(e) => setSpecKey(e.target.value)}
                placeholder="Spec Label (e.g. Material)"
                className="w-full sm:w-1/3 h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-bold"
              />
              <input
                type="text"
                value={specVal}
                onChange={(e) => setSpecVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSpec();
                  }
                }}
                placeholder="Value (e.g. 16oz Heavy Cotton Duck Canvas)"
                className="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-medium"
              />
              <button
                type="button"
                onClick={handleAddSpec}
                className="px-4 h-10 bg-slate-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Spec</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {(product.specs || []).map((s, idx) => {
                const isObj = typeof s === "object" && s !== null;
                const k = isObj ? (s as any).key : String(s).split(":")[0] || s;
                const v = isObj ? (s as any).value : String(s).split(":").slice(1).join(":") || "";

                return (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                    <span className="font-extrabold uppercase tracking-wider text-slate-500 text-[11px] w-32 shrink-0">
                      {k}
                    </span>
                    <span className="text-slate-800 font-semibold flex-1">{v}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveSpec(idx, "up")}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === (product.specs?.length || 1) - 1}
                        onClick={() => handleMoveSpec(idx, "down")}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 7: Customer Reviews Management */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#ff6b35] rounded-full" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  7. Customer Reviews &amp; Ratings Management
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddReviewModal(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Review</span>
              </button>
            </div>

            {/* Dynamic Rating Summary Pill */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-[#ff6b35] text-white px-3 py-1.5 rounded-lg font-black text-sm shadow-2xs">
                  <Star className="w-4 h-4 fill-white" />
                  <span>{averageRating.toFixed(1)}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs">Dynamic Rating Average</span>
                  <p className="text-[11px] text-slate-500">
                    Automatically calculated from {approvedReviews.length} approved review(s)
                  </p>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                Total Reviews in DB: {reviews.length}
              </span>
            </div>

            {/* Add Review Drawer/Modal */}
            {showAddReviewModal && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-extrabold text-slate-900 text-xs">Add Verified Review</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddReviewModal(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Customer Name *</label>
                    <input
                      type="text"
                      value={newReview.customer_name}
                      onChange={(e) => setNewReview({ ...newReview, customer_name: e.target.value })}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white mt-1 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Rating (1 to 5 Stars)</label>
                    <div className="flex items-center gap-1 mt-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="p-1 cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= newReview.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 font-bold text-slate-700">{newReview.rating} Stars</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Review Feedback / Comment *</label>
                  <textarea
                    rows={3}
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="ব্যাগটির কোয়ালিটি অনেক চমৎকার, কাপড়টি সত্যিই অনেক টেকসই..."
                    className="w-full p-3 rounded-lg border border-slate-200 bg-white mt-1 text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newReview.status === "approved"}
                      onChange={(e) =>
                        setNewReview({
                          ...newReview,
                          status: e.target.checked ? "approved" : "pending",
                        })
                      }
                      className="rounded text-[#ff6b35]"
                    />
                    <span className="font-semibold text-slate-800 text-xs">Publish as Approved</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddReviewModal(false)}
                      className="px-3 py-1.5 text-slate-600 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddReview}
                      className="px-4 py-1.5 bg-[#ff6b35] hover:bg-[#e55520] text-white rounded-lg font-bold cursor-pointer"
                    >
                      Save Review
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews List Table */}
            {reviews.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {reviews.map((rev) => {
                  const isApproved = rev.status === "approved";
                  return (
                    <div key={rev.id} className="p-3.5 space-y-1.5 hover:bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {rev.customer_name || rev.name || "Anonymous"}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= (rev.rating || 5)
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isApproved
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {isApproved ? "Approved" : "Pending Moderation"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleReviewStatus(rev.id)}
                            className="px-2 py-0.5 text-[11px] font-bold border border-slate-200 rounded hover:bg-white cursor-pointer"
                          >
                            {isApproved ? "Hide" : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                            title="Delete review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        &ldquo;{rev.comment || rev.quote}&rdquo;
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 italic">No reviews yet for this product.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Taxonomy, Organization, & Flags (1 col on lg) */}
        <div className="space-y-6">
          {/* Category Hierarchy */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-1.5 h-5 bg-[#ff6b35] rounded-full" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                Category Tree
              </h2>
            </div>

            <div>
              <label className="font-bold text-slate-800 text-xs block mb-1.5">
                Primary Category (Hierarchical) *
              </label>
              <select
                value={product.categoryId || ""}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const found = categories.find((c) => c.id === selectedId);
                  if (found) {
                    updateProduct({
                      categoryId: found.id,
                      categorySlug: found.slug,
                      categoryName: found.name,
                    });
                  }
                }}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 shadow-2xs cursor-pointer"
              >
                {flattenedCategories.map((item) => (
                  <option key={item.category.id} value={item.category.id}>
                    {item.prefix}
                    {item.category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Category Hierarchy Trail */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-700 block">Current Assignment:</span>
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#ff6b35]" />
                <span>{product.categoryName}</span>
                <span className="font-mono text-slate-400">({product.categorySlug})</span>
              </div>
            </div>
          </div>

          {/* Visibility & Catalog Status */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-1.5 h-5 bg-[#ff6b35] rounded-full" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                Visibility &amp; Status
              </h2>
            </div>

            <div>
              <label className="font-bold text-slate-800 text-xs block mb-1.5">Catalog Status</label>
              <select
                value={product.status || "active"}
                onChange={(e) => updateProduct({ status: e.target.value as any })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 shadow-2xs capitalize cursor-pointer"
              >
                <option value="active">Active (Visible in Store)</option>
                <option value="inactive">Inactive (Hidden from Customers)</option>
                <option value="draft">Draft (Unpublished)</option>
              </select>
            </div>

            {/* Featured Product Toggle */}
            <div className="pt-3 border-t border-slate-100">
              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(product.isFeatured)}
                  onChange={(e) => updateProduct({ isFeatured: e.target.checked })}
                  className="mt-0.5 h-4 w-4 text-[#ff6b35] rounded border-slate-300 focus:ring-[#ff6b35]"
                />
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Featured Product</span>
                  <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                    Feature this product on the homepage showcase slider.
                  </p>
                </div>
              </label>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-[11px] text-amber-800">
              💡 <strong>Top Selling note:</strong> Top selling badges are dynamically derived from actual customer orders and sales analytics.
            </div>
          </div>

          {/* Quick Publish Action Box */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff6b35]" />
              Publish Actions
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Saving will immediately invalidate storefront cache across homepage, shop, category, and
              product pages.
            </p>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#ff804e] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#e55520] text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{mode === "edit" ? "Update Product" : "Publish Product"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          STOREFRONT LIVE PREVIEW MODAL
         ──────────────────────────────────────────────────────── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-black text-slate-900 text-sm">Storefront Live Preview</h3>
                <span className="text-xs text-slate-400 font-mono">/product/{product.slug || "preview"}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer ${
                      previewDevice === "desktop" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer ${
                      previewDevice === "mobile" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content / Storefront Rendering Simulation */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#fafafa]">
              <div
                className={`mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-xs transition-all ${
                  previewDevice === "mobile" ? "max-w-md" : "max-w-4xl"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Gallery Column */}
                  <div className="space-y-3">
                    <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={
                            typeof product.images[0] === "string"
                              ? product.images[0]
                              : (product.images[0] as any).url
                          }
                          alt={product.name || "Preview"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          No Image Uploaded
                        </div>
                      )}
                      {product.badge && (
                        <span className="absolute top-3 left-3 bg-[#ff6b35] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md shadow-xs">
                          {product.badge}
                        </span>
                      )}
                    </div>

                    {/* Thumbnails */}
                    {(product.images || []).length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {product.images?.map((img, idx) => {
                          const url = typeof img === "string" ? img : (img as any).url;
                          return (
                            <div
                              key={idx}
                              className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0"
                            >
                              <Image src={url} alt="" fill className="object-cover" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Info Column */}
                  <div className="space-y-4 text-left">
                    <span className="text-xs font-bold text-[#ff6b35] uppercase tracking-wider">
                      {product.categoryName || "Category"}
                    </span>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                      {product.name || "Product Name"}
                    </h1>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= Math.round(averageRating)
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {averageRating.toFixed(1)} ({approvedReviews.length} reviews)
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl md:text-3xl font-black text-[#ff6b35]">
                        ৳{product.price || 0}
                      </span>
                      {Number(product.compareAtPrice) > Number(product.price) && (
                        <>
                          <span className="text-base text-slate-400 line-through font-semibold">
                            ৳{product.compareAtPrice}
                          </span>
                          <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded">
                            {discountPercent}% OFF
                          </span>
                        </>
                      )}
                    </div>

                    {/* Variants */}
                    {(product.variants || []).length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-700 block">Select Color:</span>
                        <div className="flex flex-wrap gap-2">
                          {product.variants?.map((v) => (
                            <div
                              key={v.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white"
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-black/10"
                                style={{ backgroundColor: v.colorCode }}
                              />
                              <span>{v.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Simulated CTAs */}
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <button
                        type="button"
                        className="h-11 border border-slate-300 font-bold text-slate-800 rounded-xl text-xs"
                      >
                        Add to Cart
                      </button>
                      <button
                        type="button"
                        className="h-11 bg-[#ff6b35] font-bold text-white rounded-xl text-xs shadow-sm"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabs Preview */}
                <div className="mt-8 pt-6 border-t border-slate-200 space-y-6 text-left">
                  {product.story && (
                    <div>
                      <h4 className="font-black text-slate-900 text-sm mb-2">Description &amp; Story</h4>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {product.story}
                      </p>
                    </div>
                  )}

                  {product.benefits && product.benefits.length > 0 && (
                    <div>
                      <h4 className="font-black text-slate-900 text-sm mb-2">Key Features</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {product.benefits.map((b, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                            <Check className="w-3.5 h-3.5 text-[#ff6b35]" />
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.specs && product.specs.length > 0 && (
                    <div>
                      <h4 className="font-black text-slate-900 text-sm mb-2">Specifications</h4>
                      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-w-lg">
                        {product.specs.map((s, idx) => {
                          const isObj = typeof s === "object" && s !== null;
                          const k = isObj ? (s as any).key : String(s).split(":")[0] || s;
                          const v = isObj ? (s as any).value : String(s).split(":").slice(1).join(":") || "";
                          return (
                            <div key={idx} className="flex justify-between p-2.5 text-xs">
                              <span className="font-bold text-slate-400 uppercase text-[10px]">{k}</span>
                              <span className="font-semibold text-slate-800">{v}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaPickerSelect}
        multiple={mediaPickerTarget === "gallery"}
        title={mediaPickerTarget === "gallery" ? "Add to Product Gallery" : "Choose Variant Image"}
      />

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3.5 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex items-center justify-between shadow-lg">
        <div className="min-w-0 pr-3">
          <div className="text-xs font-bold text-slate-900 truncate">
            {product.name || "New Product"}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">
            {mode === "edit" ? "Editing existing product" : "Drafting new product"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={loading}
          className="bg-slate-950 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{mode === "edit" ? "Update" : "Publish"}</span>
        </button>
      </div>
    </div>
  );
}
