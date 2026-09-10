import React, { Suspense } from "react";
import type { Metadata } from "next";
import { OrderTracking } from "@/components/store/order-tracking";
import { getCatalogSettings } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "অর্ডার ট্র্যাকিং | CanvasBag Bangladesh",
  description: "Track your CanvasBag order status in real time with our live order timeline.",
};

interface TrackPageProps {
  searchParams: Promise<{
    orderId?: string;
    id?: string;
    phone?: string;
    mobile?: string;
  }>;
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const params = await searchParams;
  const orderId = params.orderId || params.id || "";
  const phone = params.phone || params.mobile || "";
  const settings = await getCatalogSettings();

  return (
    <div className="bg-[#fafaf9] min-h-[75vh] py-6 sm:py-10">
      <Suspense fallback={<div className="p-12 text-center text-slate-400 font-bold">লোড হচ্ছে...</div>}>
        <OrderTracking
          initialOrderId={orderId}
          initialPhone={phone}
          supportPhone={settings.phone || "01942212267"}
          whatsappNumber={settings.whatsappNumber || "01942212267"}
        />
      </Suspense>
    </div>
  );
}
