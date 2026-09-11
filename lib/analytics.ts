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

function getFbTestCode(): string {
  if (typeof window !== "undefined" && window.fbTestCode && window.fbTestCode.trim() !== "") {
    return window.fbTestCode.trim();
  }
  return "TEST99138";
}

/**
 * Resilient fbq invoker that retries if fbevents.js has not finished initializing.
 */
function safeFbqTrack(
  pixelName: string,
  pixelPayload: Record<string, any>,
  eventOptions: Record<string, any>,
  retries = 10
) {
  if (typeof window === "undefined") return;

  if (typeof window.fbq === "function") {
    try {
      window.fbq("track", pixelName, pixelPayload, eventOptions);
      if (process.env.NODE_ENV !== "production" || eventOptions.test_event_code) {
        console.log(
          `%c[Meta Pixel] Tracked ${pixelName}`,
          "color: #1877F2; font-weight: bold;",
          pixelPayload,
          eventOptions
        );
      }
    } catch (err) {
      console.warn(`[Meta Pixel] Error firing ${pixelName}:`, err);
    }
    return;
  }

  if (retries > 0) {
    setTimeout(() => {
      safeFbqTrack(pixelName, pixelPayload, eventOptions, retries - 1);
    }, 250);
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
 * Track route change / PageView across GTM, GA4, and Meta Pixel + CAPI
 */
export function trackPageView(pagePath?: string) {
  if (typeof window === "undefined") return;

  const currentPath = pagePath || window.location.pathname || "/";
  const fullUrl = window.location.href;
  const pageTitle = typeof document !== "undefined" ? document.title : "";

  // Deduplication check: max once per 800ms for exact same path
  const now = Date.now();
  const dedupeKey = `page_view_${currentPath}`;
  if (lastFiredEvents[dedupeKey] && now - lastFiredEvents[dedupeKey] < 800) {
    return;
  }
  lastFiredEvents[dedupeKey] = now;

  const testCode = getFbTestCode();
  const eventId = `pv_${now}_${Math.random().toString(36).substring(2, 7)}`;

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

  // 3. Meta Pixel (fbq)
  const eventOptions: Record<string, any> = {
    eventID: eventId,
  };
  if (testCode) {
    eventOptions.test_event_code = testCode;
  }

  safeFbqTrack("PageView", {}, eventOptions);

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

  // 1. Deduplication Logic
  let dedupeKey = `${name}`;
  if (name === "purchase" && payload.order_id) {
    dedupeKey = `purchase_${payload.order_id}`;
  } else if (name === "add_shipping_info") {
    dedupeKey = `add_shipping_info_${payload.shipping_zone || ""}_${payload.value || 0}`;
  } else {
    const itemsKey = payload.items
      ? payload.items
          .map((i: any) => `${i.item_id || i.id || ""}_${i.item_variant || i.variant || ""}`)
          .join("_")
      : "";
    dedupeKey = `${name}_${payload.value || 0}_${itemsKey}`;
  }

  const now = Date.now();
  const lastFiredTime = lastFiredEvents[dedupeKey];
  const timeLimit = name === "view_item" || name === "begin_checkout" ? 3000 : 800;

  if (lastFiredTime && now - lastFiredTime < timeLimit) {
    return;
  }

  lastFiredEvents[dedupeKey] = now;

  // Extra persistent check for purchase event to prevent re-fires on page refresh
  if (name === "purchase" && payload.order_id) {
    const persistKey = `gtm_purchase_tracked_${payload.order_id}`;
    if (localStorage.getItem(persistKey)) {
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

    const testCode = getFbTestCode();

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

    if (testCode) {
      eventOptions.test_event_code = testCode;
      pixelPayload.test_event_code = testCode;
    }

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