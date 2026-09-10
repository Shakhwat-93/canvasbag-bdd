import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Check, Truck } from "lucide-react";
import { getLocalOrderById } from "@/lib/db";
import { formatBDT } from "@/lib/format";
import { PurchaseTracker } from "@/components/store/purchase-tracker";

interface OrderSuccessPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Order Confirmed | CanvasBag Bangladesh",
  description: "Your CanvasBag order has been successfully placed with Cash on Delivery.",
};

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { id: orderId } = await params;
  const order = getLocalOrderById(orderId);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center min-h-[60vh] flex flex-col justify-center items-center font-poppins">
      <PurchaseTracker order={order} orderId={orderId} />

      <div className="rounded-3xl border border-slate-200/60 bg-white p-6 sm:p-10 shadow-sm w-full space-y-6">
        {/* Checkmark icon with pulsing glowing rings */}
        <div className="flex justify-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 h-16 w-16 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
            <div className="absolute inset-0 h-16 w-16 rounded-full bg-emerald-500/10 animate-pulse" />
            <div className="relative z-10 grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-lg">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Title and Reference */}
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Order Reference ID: <span className="text-slate-800 font-mono font-black">{orderId}</span>
          </p>
        </div>

        {/* Order Details Recap */}
        {order ? (
          <div className="border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-100 text-left text-xs bg-slate-50/30">
            {/* Shipping Info */}
            <div className="p-4 space-y-2 bg-white">
              <p className="font-extrabold text-slate-900 text-sm">Shipping Information</p>
              <div className="text-slate-600 space-y-1 font-medium">
                <p>
                  Name: <span className="text-slate-900 font-bold">{order.customer_name}</span>
                </p>
                <p>
                  Phone: <span className="text-slate-900 font-bold">{order.phone}</span>
                </p>
                <p>
                  Address: <span className="text-slate-900 font-bold">{order.address}</span>
                </p>
              </div>
            </div>

            {/* Purchased Items */}
            {order.items && order.items.length > 0 && (
              <div className="p-4 space-y-2.5">
                <p className="font-extrabold text-slate-900 text-sm">Purchased Items</p>
                <div className="divide-y divide-slate-200/50">
                  {order.items.map((item, idx) => (
                    <div key={item.id || idx} className="flex justify-between items-center py-2 text-slate-700 font-medium">
                      <span>
                        {item.product_name}
                        {item.variant_name && item.variant_name !== "Standard" ? ` - ${item.variant_name}` : ""}{" "}
                        <span className="font-bold text-slate-900">× {item.quantity}</span>
                      </span>
                      <span className="text-slate-900 font-bold">{formatBDT(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Breakdown */}
            <div className="p-4 space-y-2 bg-white font-medium">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="text-slate-900 font-bold">{formatBDT(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Fee</span>
                <span className="text-slate-900 font-bold">
                  {order.delivery_fee === 0 ? "FREE" : formatBDT(order.delivery_fee)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Discount</span>
                  <span>-{formatBDT(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-black text-sm border-t border-slate-100 pt-2">
                <span>Total Amount (COD)</span>
                <span className="text-slate-950 font-black text-base">{formatBDT(order.total)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 text-xs text-slate-600 font-medium">
            আপনার অর্ডারটি সফলভাবে ডাটাবেজে রেকর্ড করা হয়েছে। ডেলিভারির পূর্বে আমাদের প্রতিনিধি আপনার নাম্বারে যোগাযোগ করবে।
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href={`/track?orderId=${encodeURIComponent(orderId)}${
              order?.phone ? `&phone=${encodeURIComponent(order.phone)}` : ""
            }`}
            className="inline-flex h-12 flex-1 items-center justify-center bg-[#ff6b35] hover:bg-[#e55520] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md gap-2 active:scale-95"
          >
            <Truck className="w-4 h-4" />
            <span>অর্ডার ট্র্যাক করুন</span>
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 flex-1 items-center justify-center bg-black hover:bg-black/90 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
