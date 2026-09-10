import React, { Suspense } from "react";
import { getAllLocalOrders } from "@/lib/db";
import { OrdersManager } from "@/components/admin/orders-manager";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Orders Management | CanvasBag Admin",
};

export default async function AdminOrdersPage() {
  const orders = getAllLocalOrders();

  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Loading orders...
          </p>
        </div>
      }
    >
      <OrdersManager initialOrders={orders} />
    </Suspense>
  );
}
