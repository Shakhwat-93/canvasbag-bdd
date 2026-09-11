"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { trackClientEvent } from "@/lib/analytics";
import type { LocalOrder } from "@/lib/types";

interface PurchaseTrackerProps {
  order: LocalOrder | null;
  orderId: string;
}

export function PurchaseTracker({ order: initialOrder, orderId }: PurchaseTrackerProps) {
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

    let order = initialOrder;

    // Fallback: If server couldn't retrieve order details (e.g. fresh lambda container), load from localStorage
    if ((!order || !order.total || !order.items || order.items.length === 0) && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("cb_pending_order");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.orderId === orderId || !parsed.orderId) {
            order = {
              id: orderId,
              customer_name: parsed.name || initialOrder?.customer_name || "Customer",
              phone: parsed.phone || initialOrder?.phone || "",
              city: parsed.shippingZone === "Outside Dhaka" ? "Outside Dhaka" : "Dhaka",
              area: "N/A",
              address: parsed.address || initialOrder?.address || "",
              note: parsed.note,
              status: "pending",
              payment_method: "cod",
              subtotal: Number(parsed.subtotal || parsed.total || 0),
              delivery_fee: Number(parsed.deliveryFee || 0),
              discount: Number(parsed.discount || 0),
              total: Number(parsed.total || 0),
              items: (parsed.items || []).map((i: any, idx: number) => ({
                id: `item-${idx}`,
                order_id: orderId,
                product_id: i.productId || i.id,
                product_name: i.name,
                variant_name: i.variantName || "Standard",
                quantity: Number(i.quantity || 1),
                unit_price: Number(i.price || 0),
                total: Number(i.price || 0) * Number(i.quantity || 1),
              })),
              created_at: new Date().toISOString(),
            };
          }
        }
      } catch (err) {
        console.warn("[PurchaseTracker] Error parsing cb_pending_order:", err);
      }
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
  }, [clearCart, initialOrder, orderId]);

  return null;
}
