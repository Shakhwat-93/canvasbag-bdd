import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronRight, Home, Layers } from "lucide-react";
import { supabaseCatalogService } from "@/lib/supabase";
import { getSortedProducts } from "@/lib/catalog";
import { getCategoryBreadcrumbs, normalizeParentId } from "@/lib/category-tree";
import { ProductCard } from "@/components/store/product-card";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await supabaseCatalogService.getCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return { title: "Category Not Found | CanvasBag" };
  }

  const title = category.seoTitle || category.seo_title || `${category.name} | CanvasBag Bangladesh`;
  const description =
    category.seoDescription ||
    category.seo_description ||
    category.description ||
    `Browse our ${category.name} collection at CanvasBag Bangladesh. Premium quality canvas & gear.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: category.image ? [{ url: category.image }] : undefined,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const [categories, products] = await Promise.all([
    supabaseCatalogService.getCategories(),
    getSortedProducts(slug),
  ]);

  const currentCategory = categories.find((c) => c.slug === slug);
  if (!currentCategory) {
    notFound();
  }

  // Build dynamic breadcrumb trail
  const breadcrumbTrail = getCategoryBreadcrumbs(slug, categories);
  const fullBreadcrumbs = [
    { name: "হোম", slug: "", href: "/" },
    ...breadcrumbTrail,
  ];

  // Find child categories for parent navigation pills
  const childCategories = categories.filter(
    (c) =>
      normalizeParentId(c.parentId ?? c.parent_id) === currentCategory.id &&
      c.isActive !== false &&
      c.is_active !== false
  );

  // Generate Google BreadcrumbList JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: fullBreadcrumbs.map((crumb, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: crumb.name,
      item: `https://canvasbagbd.com${crumb.href}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-[#fafaf9] min-h-screen pb-16">
        {/* Dynamic Breadcrumbs Nav */}
        <div className="border-b border-[#e5e7eb] bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <nav aria-label="Breadcrumb" className="flex items-center text-xs font-medium text-slate-500 overflow-x-auto no-scrollbar">
              {fullBreadcrumbs.map((crumb, idx) => {
                const isLast = idx === fullBreadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.href || idx}>
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-300 flex-shrink-0" />}
                    {isLast ? (
                      <span className="text-slate-900 font-bold truncate">{crumb.name}</span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="hover:text-[var(--primary)] transition-colors flex items-center gap-1 truncate"
                      >
                        {idx === 0 && <Home className="w-3.5 h-3.5 flex-shrink-0" />}
                        <span>{crumb.name}</span>
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>
        </div>

        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
          {/* Category Header Hero */}
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-[#e5e7eb] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--primary)]">
                  কালেকশন
                </span>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/80">
                  {products.length} টি পণ্য
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                {currentCategory.name}
              </h1>

              {currentCategory.description && (
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                  {currentCategory.description}
                </p>
              )}
            </div>

            {currentCategory.image && (
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                <Image
                  src={currentCategory.image}
                  alt={currentCategory.name}
                  fill
                  sizes="(max-width: 640px) 96px, 128px"
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>

          {/* Child Categories Pills (Subcategories Exploration) */}
          {childCategories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  সাব-ক্যাটাগরি বেছে নিন
                </h3>
              </div>
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {childCategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/category/${sub.slug}`}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#fff3ef] border border-[#e5e7eb] hover:border-[var(--primary)] rounded-2xl text-xs font-bold text-slate-800 hover:text-[var(--primary)] transition-all shadow-2xs flex-shrink-0 group"
                  >
                    {sub.image && (
                      <div className="relative w-5 h-5 rounded-md overflow-hidden bg-slate-100">
                        <Image src={sub.image} alt={sub.name} fill sizes="20px" className="object-cover" />
                      </div>
                    )}
                    <span>{sub.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[var(--primary)] transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-200">
              <p className="text-sm font-bold text-slate-400">এই ক্যাটাগরিতে বর্তমানে কোনো পণ্য নেই।</p>
              <Link
                href="/shop"
                className="mt-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                সকল পণ্য দেখুন
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 pt-2">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
