"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { trackClientEvent } from "@/lib/analytics";
import type { LocalOrder } from "@/lib/types";

interface PurchaseTrackerProps {
  order: LocalOrder | null;
  orderId: string;
}

export function PurchaseTracker({ order, orderId }: PurchaseTrackerProps) {
  const { clearCart } = useCart();
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple executions on re-renders
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    // 1. Clear cart once
    clearCart();

    // 2. Prevent duplicate tracking in localStorage across reloads
    const trackKey = `purchase_tracked_${orderId}`;
    if (typeof window !== "undefined" && localStorage.getItem(trackKey)) {
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(trackKey, "true");
    }

    // Format phone to E.164 for advanced matching
    let formattedPhone = order?.phone || "";
    const cleanDigits = formattedPhone.replace(/\D/g, "");
    if (cleanDigits.startsWith("01") && cleanDigits.length === 11) {
      formattedPhone = `+88${cleanDigits}`;
    } else if (cleanDigits.startsWith("8801") && cleanDigits.length === 13) {
      formattedPhone = `+${cleanDigits}`;
    }

    trackClientEvent("purchase", {
      order_id: orderId,
      value: order?.total || 0,
      shipping_cost: order?.delivery_fee || 0,
      customer_info: {
        name: order?.customer_name || "",
        phone: order?.phone || "",
        address: order?.address || "",
        city: order?.city || "",
        note: order?.note || "",
      },
      user_data: {
        phone_number: formattedPhone,
        address: {
          first_name: order?.customer_name || "",
          street: order?.address || "",
          city: order?.city || "",
          country: "BD",
        },
      },
      items: (order?.items || []).map((item) => ({
        item_id: item.product_id,
        item_name: item.product_name,
        item_brand: "CanvasBag",
        item_variant: item.variant_name || "Standard",
        price: item.unit_price,
        quantity: item.quantity,
      })),
    });

    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("cb_pending_order");
      }
    } catch {}
  }, [clearCart, order, orderId]);

  return null;
}
