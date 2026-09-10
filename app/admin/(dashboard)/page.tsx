import React, { Suspense } from "react";
import { getCatalogProducts, getCatalogCategories } from "@/lib/supabase";
import { getAllLocalOrders, getAllReviews, getAllSupportMessages } from "@/lib/db";
import { listR2Objects, isR2Configured } from "@/lib/r2";
import { AdminDashboardOverview } from "@/components/admin/admin-dashboard-overview";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Overview | CanvasBag Admin",
};

export default async function AdminDashboardPage() {
  const [products, categories, orders, reviews, supportMessages] = await Promise.all([
    getCatalogProducts(),
    getCatalogCategories(),
    Promise.resolve(getAllLocalOrders()),
    Promise.resolve(getAllReviews()),
    Promise.resolve(getAllSupportMessages()),
  ]);

  let mediaCount = 0;
  if (isR2Configured()) {
    try {
      const r2Res = await listR2Objects({ maxKeys: 200 });
      mediaCount = r2Res.objects.length;
    } catch (e) {
      console.error("[Dashboard R2 Media Count Error]", e);
    }
  }

  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Loading dashboard metrics...
          </p>
        </div>
      }
    >
      <AdminDashboardOverview
        products={products}
        categories={categories}
        orders={orders}
        reviews={reviews}
        supportMessages={supportMessages}
        mediaCount={mediaCount}
      />
    </Suspense>
  );
}
