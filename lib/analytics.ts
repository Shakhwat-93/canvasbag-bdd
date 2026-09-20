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

// In-memory deduplication registry
const lastFiredEvents: Record<string, number> = {};
const firedFbqEventIds = new Set<string>();
const firedCapiEventIds = new Set<string>();

const META_STANDARD_EVENTS = new Set([
  "AddPaymentInfo",
  "AddToCart",
  "AddToWishlist",
  "CompleteRegistration",
  "Contact",
  "CustomizeProduct",
  "Donate",
  "FindLocation",
  "InitiateCheckout",
  "Lead",
  "PageView",
  "Purchase",
  "Schedule",
  "Search",
  "StartTrial",
  "SubmitApplication",
  "Subscribe",
  "ViewContent",
]);

/**
 * Safe fbq invoker that prevents duplicate firing by eventID
 * and accurately routes standard vs custom events.
 */
function safeFbqTrack(
  pixelName: string,
  pixelPayload: Record<string, any> = {},
  eventOptions?: Record<string, any>
) {
  if (typeof window === "undefined") return;

  const eventId = eventOptions?.eventID;
  if (eventId) {
    if (firedFbqEventIds.has(eventId)) {
      console.log(`[Meta Pixel Browser] Skipped duplicate eventID: ${eventId}`);
      return;
    }
    firedFbqEventIds.add(eventId);
  }

  const isStandard = META_STANDARD_EVENTS.has(pixelName);
  const trackMethod = isStandard ? "track" : "trackCustom";

  const executeTrack = () => {
    if (typeof window.fbq === "function") {
      try {
        if (eventId) {
          window.fbq(trackMethod, pixelName, pixelPayload, { eventID: eventId });
        } else if (Object.keys(pixelPayload).length > 0) {
          window.fbq(trackMethod, pixelName, pixelPayload);
        } else {
          window.fbq(trackMethod, pixelName);
        }
        console.log(
          `%c[Meta Pixel Browser] Tracked (${trackMethod}) ${pixelName}`,
          "color: #1877F2; font-weight: bold;",
          pixelPayload,
          eventOptions
        );
      } catch (err) {
        console.warn(`[Meta Pixel Browser] Error firing ${pixelName}:`, err);
      }
    }
  };

  if (typeof window.fbq === "function") {
    executeTrack();
  } else {
    // Retry once after 200ms if script is still parsing
    setTimeout(executeTrack, 200);
  }
}

/**
 * Dispatch event to internal server-side Conversions API proxy
 */
async function dispatchServerEvent(params: {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  userData?: Record<string, any>;
  customData?: Record<string, any>;
}) {
  if (typeof window === "undefined") return;

  if (params.eventId) {
    if (firedCapiEventIds.has(params.eventId)) {
      return;
    }
    firedCapiEventIds.add(params.eventId);
  }

  try {
    fetch("/api/analytics/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      keepalive: true,
    }).catch((err) => {
      console.warn("[Analytics] CAPI background dispatch failed:", err);
    });
  } catch {}
}

/**
 * Track route change / PageView across GTM, GA4, and Meta Pixel + CAPI.
 * Fires strictly once per page navigation.
 */
export function trackPageView(pagePath?: string) {
  if (typeof window === "undefined") return;

  const currentPath = pagePath || window.location.pathname || "/";
  const fullUrl = window.location.href;
  const pageTitle = typeof document !== "undefined" ? document.title : "";

  // Deduplication check: max once per 1500ms for exact same path
  const now = Date.now();
  const dedupeKey = `page_view_${currentPath}`;
  if (lastFiredEvents[dedupeKey] && now - lastFiredEvents[dedupeKey] < 1500) {
    return;
  }
  lastFiredEvents[dedupeKey] = now;

  // 1. Google Tag Manager (GTM)
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "page_view",
    page_path: currentPath,
    page_location: fullUrl,
    page_title: pageTitle,
  });

  // 2. Google Analytics 4 (GA4)
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_path: currentPath,
      page_location: fullUrl,
      page_title: pageTitle,
    });
  }

  // 3. Meta Pixel (fbq) & Server CAPI with single matching eventId
  const eventId = `pv_${now}_${Math.random().toString(36).substring(2, 7)}`;
  safeFbqTrack("PageView", {}, { eventID: eventId });

  // 4. Meta Conversions API (Server-Side)
  dispatchServerEvent({
    eventName: "PageView",
    eventId,
    eventSourceUrl: fullUrl,
    customData: {},
  });
}

/**
 * Main e-commerce event dispatcher
 */
export function trackClientEvent(name: string, payload: Record<string, any> = {}) {
  if (typeof window === "undefined") return;

  // 1. Stable Deduplication Logic
  let dedupeKey = name;
  let timeLimit = 1000;

  if (name === "purchase" && payload.order_id) {
    dedupeKey = `purchase_${payload.order_id}`;
    timeLimit = 86400000; // 24 hours lock
  } else if (name === "begin_checkout") {
    // Key by item IDs only, independent of calculated subtotal/fees
    const itemIds = (payload.items || [])
      .map((i: any) => String(i.item_id || i.id || ""))
      .sort()
      .join("_");
    dedupeKey = `begin_checkout_${itemIds || "cart"}`;
    timeLimit = 10000; // 10s cooldown for checkout session
  } else if (name === "add_to_cart") {
    const primaryItem = (payload.items && payload.items[0]) || {};
    const itemId = String(primaryItem.item_id || primaryItem.id || "");
    const itemVariant = String(primaryItem.item_variant || primaryItem.variant || "");
    dedupeKey = `add_to_cart_${itemId}_${itemVariant}`;
    timeLimit = 1200; // Cooldown to block double clicks
  } else if (name === "view_item") {
    const primaryItem = (payload.items && payload.items[0]) || {};
    const itemId = String(primaryItem.item_id || primaryItem.id || "");
    dedupeKey = `view_item_${itemId}`;
    timeLimit = 5000; // 5s cooldown per product view
  } else if (name === "add_shipping_info") {
    dedupeKey = `add_shipping_info_${payload.shipping_zone || ""}`;
    timeLimit = 2000;
  } else {
    const itemsKey = (payload.items || [])
      .map((i: any) => `${i.item_id || i.id || ""}_${i.item_variant || i.variant || ""}`)
      .join("_");
    dedupeKey = `${name}_${itemsKey}`;
    timeLimit = 1500;
  }

  const now = Date.now();
  const lastFiredTime = lastFiredEvents[dedupeKey];
  if (lastFiredTime && now - lastFiredTime < timeLimit) {
    console.log(`[Analytics] Blocked duplicate ${name} (${dedupeKey})`);
    return;
  }
  lastFiredEvents[dedupeKey] = now;

  // Extra persistent check for purchase event to prevent re-fires on page refresh
  if (name === "purchase" && payload.order_id) {
    const persistKey = `meta_purchase_tracked_${payload.order_id}`;
    if (localStorage.getItem(persistKey)) {
      console.log(`[Analytics] Purchase already tracked: ${payload.order_id}`);
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

  // 4. Meta Pixel (fbq) & Server-Side CAPI tracking with full standard parameters
  const pixelNameMap: Record<string, string> = {
    view_item: "ViewContent",
    add_to_cart: "AddToCart",
    remove_from_cart: "Custom_RemoveFromCart",
    begin_checkout: "InitiateCheckout",
    add_shipping_info: "AddShippingInfo",
    purchase: "Purchase",
  };

  const pixelName = pixelNameMap[name];
  if (pixelName) {
    const rawItems = payload.items || [];
    const contentIds = rawItems.map((i: any) => String(i.item_id || i.id || "")).filter(Boolean);
    const contents = rawItems.map((i: any) => ({
      id: String(i.item_id || i.id || ""),
      quantity: Number(i.quantity || 1),
      item_price: Number(i.price || 0),
      price: Number(i.price || 0),
    }));
    const totalQuantity = rawItems.reduce((acc: number, i: any) => acc + Number(i.quantity || 1), 0);
    const primaryItem = rawItems[0] || {};
    const contentName =
      primaryItem.item_name || primaryItem.name || payload.content_name || undefined;
    const contentCategory =
      primaryItem.item_category || payload.content_category || "Canvas Bags";

    const pixelPayload: Record<string, any> = {
      value: Number(payload.value || 0),
      currency: "BDT",
      content_type: "product",
    };

    if (contentName) {
      pixelPayload.content_name = contentName;
    }
    if (contentCategory) {
      pixelPayload.content_category = contentCategory;
    }
    if (contentIds.length > 0) {
      pixelPayload.content_ids = contentIds;
    }
    if (contents.length > 0) {
      pixelPayload.contents = contents;
    }
    if (totalQuantity > 0) {
      pixelPayload.num_items = totalQuantity;
    }

    if (name === "purchase" && payload.order_id) {
      pixelPayload.order_id = String(payload.order_id);
    } else if (name === "add_shipping_info" && payload.shipping_zone) {
      pixelPayload.shipping_tier = payload.shipping_zone;
    }

    // Generate shared eventId for browser/server deduplication
    let eventId: string;
    if (name === "purchase" && payload.order_id) {
      eventId = `order_${payload.order_id}`;
    } else if (name === "view_item") {
      eventId = `vc_${contentIds[0] || "item"}_${now}_${Math.random().toString(36).substring(2, 6)}`;
    } else if (name === "add_to_cart") {
      eventId = `atc_${contentIds[0] || "item"}_${now}_${Math.random().toString(36).substring(2, 6)}`;
    } else if (name === "begin_checkout") {
      eventId = `ic_${now}_${Math.random().toString(36).substring(2, 6)}`;
    } else if (name === "add_shipping_info") {
      eventId = `asi_${now}_${Math.random().toString(36).substring(2, 6)}`;
    } else {
      eventId = `ev_${now}_${Math.random().toString(36).substring(2, 6)}`;
    }

    const eventOptions: Record<string, any> = {
      eventID: eventId,
    };

    // Advanced Matching user properties
    if (payload.user_data && typeof window.fbq === "function") {
      try {
        const ph = payload.user_data.phone_number?.replace(/\D/g, "");
        const fn = payload.user_data.address?.first_name?.trim();
        const ct = payload.user_data.address?.city?.trim();
        window.fbq("setUserProperties", {
          ...(ph ? { ph } : {}),
          ...(fn ? { fn } : {}),
          ...(ct ? { ct } : {}),
          country: "bd",
        });
      } catch {}
    }

    // 1. Fire Client Browser Pixel
    safeFbqTrack(pixelName, pixelPayload, eventOptions);

    // 2. Fire Server-Side Conversions API (CAPI) for non-purchase events
    // (Purchase CAPI is directly handled on the backend during order creation in /api/checkout)
    if (name !== "purchase") {
      dispatchServerEvent({
        eventName: pixelName,
        eventId,
        eventSourceUrl: window.location.href,
        customData: pixelPayload,
        userData: payload.user_data
          ? {
              phone: payload.user_data.phone_number,
              name: payload.customer_info?.name || payload.user_data.address?.first_name,
              city: payload.customer_info?.city || payload.user_data.address?.city,
            }
          : undefined,
      });
    }
  }
}