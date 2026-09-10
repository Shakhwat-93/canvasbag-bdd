"use client";

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    fbTestCode?: string;
    userIp?: string;
  }
}

const lastFiredEvents: Record<string, number> = {};

export function trackClientEvent(name: string, payload: Record<string, any> = {}) {
  if (typeof window === "undefined") return;

  // 1. Deduplication Logic
  let dedupeKey = `${name}`;
  if (name === "purchase" && payload.order_id) {
    dedupeKey = `purchase_${payload.order_id}`;
  } else {
    const itemsKey = payload.items
      ? payload.items
          .map((i: any) => `${i.item_id || i.id || ""}_${i.item_name || i.name || ""}_${i.item_variant || i.variant || ""}`)
          .join("_")
      : "";
    dedupeKey = `${name}_${payload.value || 0}_${itemsKey}`;
  }

  const now = Date.now();
  const lastFiredTime = lastFiredEvents[dedupeKey];
  const timeLimit = name === "view_item" || name === "begin_checkout" ? 5000 : 1500;

  if (lastFiredTime && now - lastFiredTime < timeLimit) {
    console.warn(`[Analytics] Duplicate event blocked: ${name}`);
    return;
  }

  lastFiredEvents[dedupeKey] = now;

  // Extra persistent check for purchase event to prevent re-fires on reload
  if (name === "purchase" && payload.order_id) {
    const persistKey = `gtm_purchase_tracked_${payload.order_id}`;
    if (localStorage.getItem(persistKey)) {
      console.warn(`[Analytics] Purchase event already tracked persistently for GTM: ${payload.order_id}`);
      return;
    }
    localStorage.setItem(persistKey, "true");
  }

  // 2. Google Tag Manager (GTM) dataLayer
  window.dataLayer = window.dataLayer || [];

  const gtmPayload: Record<string, any> = {
    event: name,
    ip_address: window.userIp || "",
    ecommerce: {
      currency: "BDT",
      value: payload.value,
      items: payload.items || [],
    },
  };

  if (name === "purchase") {
    gtmPayload.customer_info = payload.customer_info;
    gtmPayload.user_data = payload.user_data;
    gtmPayload.ecommerce.transaction_id = payload.order_id;
    gtmPayload.ecommerce.shipping = payload.shipping_cost;
  } else if (name === "add_shipping_info") {
    gtmPayload.ecommerce.shipping_tier = payload.shipping_zone;
  }

  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push(gtmPayload);

  // 3. Google Analytics 4 (gtag.js) direct tracking
  if (typeof window.gtag === "function") {
    const gtagPayload: Record<string, any> = {
      currency: "BDT",
      value: payload.value,
      items: payload.items || [],
    };

    if (name === "purchase") {
      gtagPayload.transaction_id = payload.order_id;
      gtagPayload.shipping = payload.shipping_cost;
    } else if (name === "add_shipping_info") {
      gtagPayload.shipping_tier = payload.shipping_zone;
    }

    window.gtag("event", name, gtagPayload);
  }

  // 4. Meta Pixel (fbq) tracking
  const pixelNameMap: Record<string, string> = {
    view_item: "ViewContent",
    add_to_cart: "AddToCart",
    remove_from_cart: "Custom_RemoveFromCart",
    begin_checkout: "InitiateCheckout",
    add_shipping_info: "AddShippingInfo",
    purchase: "Purchase",
  };

  const pixelName = pixelNameMap[name];
  if (pixelName && typeof window.fbq === "function") {
    const pixelPayload: Record<string, any> = {
      value: payload.value,
      currency: "BDT",
    };

    if (payload.items && payload.items.length > 0) {
      pixelPayload.content_ids = payload.items.map((i: any) => i.item_id || i.id);
      pixelPayload.content_type = "product";
      pixelPayload.contents = payload.items.map((i: any) => ({
        id: i.item_id || i.id,
        quantity: i.quantity || 1,
        price: i.price,
      }));
    }

    if (name === "purchase" && payload.order_id) {
      pixelPayload.order_id = payload.order_id;
    }

    const eventOptions: Record<string, any> = {};
    if (name === "purchase" && payload.order_id) {
      eventOptions.eventID = `order_${payload.order_id}`;
    }
    if (window.fbTestCode && window.fbTestCode.trim() !== "") {
      eventOptions.test_event_code = window.fbTestCode.trim();
    }

    if (payload.user_data) {
      window.fbq("track", pixelName, pixelPayload, eventOptions);
    } else {
      window.fbq("track", pixelName, pixelPayload, eventOptions);
    }
  }
}