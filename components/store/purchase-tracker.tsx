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

    // 1. Prevent duplicate tracking in localStorage or window across reloads and component re-mounts
    const trackKey = `purchase_tracked_${orderId}`;
    if (typeof window !== "undefined") {
      if (localStorage.getItem(trackKey) || (window as any)[`__tracked_${orderId}`]) {
        return;
      }
      localStorage.setItem(trackKey, "true");
      (window as any)[`__tracked_${orderId}`] = true;
    }

    // 2. Clear cart once
    clearCart();

    let order = initialOrder;

    // Load pristine client checkout items from localStorage if available
    let clientPendingOrder: any = null;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("cb_pending_order");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.orderId === orderId || !parsed.orderId) {
            clientPendingOrder = parsed;
          }
        }
      } catch (err) {
        console.warn("[PurchaseTracker] Error parsing cb_pending_order:", err);
      }
    }

    if (clientPendingOrder && (!order || !order.items || order.items.length === 0 || !order.total)) {
      order = {
        id: orderId,
        customer_name: clientPendingOrder.name || initialOrder?.customer_name || "Customer",
        phone: clientPendingOrder.phone || initialOrder?.phone || "",
        city: clientPendingOrder.shippingZone === "Outside Dhaka" ? "Outside Dhaka" : "Dhaka",
        area: "N/A",
        address: clientPendingOrder.address || initialOrder?.address || "",
        note: clientPendingOrder.note,
        status: "pending",
        payment_method: "cod",
        subtotal: Number(clientPendingOrder.subtotal || clientPendingOrder.total || 0),
        delivery_fee: Number(clientPendingOrder.deliveryFee || 0),
        discount: Number(clientPendingOrder.discount || 0),
        total: Number(clientPendingOrder.total || initialOrder?.total || 0),
        items: (clientPendingOrder.items || []).map((i: any, idx: number) => ({
          id: `item-${idx}`,
          order_id: orderId,
          product_id: i.productId || i.id || `prod-${idx}`,
          product_name: i.name,
          variant_name: i.variantName || "Standard",
          quantity: Number(i.quantity || 1),
          unit_price: Number(i.price || 0),
          total: Number(i.price || 0) * Number(i.quantity || 1),
        })),
        created_at: new Date().toISOString(),
      };
    }

    // Format phone to E.164 for advanced matching
    let formattedPhone = order?.phone || clientPendingOrder?.phone || "";
    const cleanDigits = formattedPhone.replace(/\D/g, "");
    if (cleanDigits.startsWith("01") && cleanDigits.length === 11) {
      formattedPhone = `88${cleanDigits}`;
    } else if (cleanDigits.startsWith("8801") && cleanDigits.length === 13) {
      formattedPhone = cleanDigits;
    }

    // Prefer pristine cart items from clientPendingOrder to ensure content_ids match Server CAPI
    const itemsSource =
      clientPendingOrder?.items && clientPendingOrder.items.length > 0
        ? clientPendingOrder.items.map((i: any) => ({
            product_id: i.productId || i.id,
            product_name: i.name,
            variant_name: i.variantName || "Standard",
            unit_price: Number(i.price || 0),
            quantity: Number(i.quantity || 1),
          }))
        : order?.items || [];

    trackClientEvent("purchase", {
      order_id: orderId,
      value: order?.total || clientPendingOrder?.total || 0,
      shipping_cost: order?.delivery_fee || clientPendingOrder?.deliveryFee || 0,
      customer_info: {
        name: order?.customer_name || clientPendingOrder?.name || "",
        phone: order?.phone || clientPendingOrder?.phone || "",
        address: order?.address || clientPendingOrder?.address || "",
        city: order?.city || clientPendingOrder?.shippingZone || "",
        note: order?.note || clientPendingOrder?.note || "",
      },
      user_data: {
        phone_number: formattedPhone,
        address: {
          first_name: order?.customer_name || clientPendingOrder?.name || "",
          street: order?.address || clientPendingOrder?.address || "",
          city: order?.city || clientPendingOrder?.shippingZone || "",
          country: "BD",
        },
      },
      items: itemsSource.map((item: any) => ({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return null;
}
