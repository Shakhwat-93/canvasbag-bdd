// Analytics tracking engine with built-in deduplication to prevent double-firing
const lastFiredEvents = {};

function trackEvent(name, payload = {}) {
  // 1. Deduplication logic: construct a unique stable signature for the event
  let dedupeKey = `${name}`;
  if (name === "purchase" && payload.order_id) {
    dedupeKey = `purchase_${payload.order_id}`;
  } else {
    const itemsKey = payload.items ? payload.items.map(i => `${i.item_id || i.id || ''}_${i.item_name || i.name || ''}_${i.item_variant || i.variant || ''}`).join("_") : "";
    dedupeKey = `${name}_${payload.value || 0}_${itemsKey}`;
  }

  const now = Date.now();
  const lastFiredTime = lastFiredEvents[dedupeKey];
  const timeLimit = (name === "view_item" || name === "begin_checkout") ? 5000 : 1500;

  if (lastFiredTime && (now - lastFiredTime < timeLimit)) {
    console.warn(`[Analytics] Duplicate event blocked: ${name}`);
    return;
  }

  // Update last fired timestamp
  lastFiredEvents[dedupeKey] = now;

  // Extra persistent check for purchase event to prevent re-fires on page reloads/refreshes
  if (name === "purchase" && payload.order_id) {
    const persistKey = `gtm_purchase_tracked_${payload.order_id}`;
    if (localStorage.getItem(persistKey)) {
      console.warn(`[Analytics] Purchase event already tracked persistently for GTM: ${payload.order_id}`);
      return;
    }
    localStorage.setItem(persistKey, "true");
  }

  // Fetch IP if not loaded yet
  if (!window.userIp) {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(json => {
        if (json.ip) window.userIp = json.ip;
      })
      .catch(err => console.error("IP check failed:", err));
  }

  // 2. Push event to Google Tag Manager (GTM) dataLayer
  window.dataLayer = window.dataLayer || [];

  const gtmPayload = {
    event: name,
    ip_address: window.userIp || "",
    ecommerce: {
      currency: "BDT",
      value: payload.value,
      items: payload.items || [],
    }
  };

  if (name === "purchase") {
    gtmPayload.customer_info = payload.customer_info;
    gtmPayload.user_data = payload.user_data;
    gtmPayload.ecommerce.transaction_id = payload.order_id;
    gtmPayload.ecommerce.shipping = payload.shipping_cost;
  } else if (name === "add_shipping_info") {
    gtmPayload.ecommerce.shipping_tier = payload.shipping_zone;
  }

  // Clear the previous ecommerce object to prevent it from bleeding into the next event
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push(gtmPayload);

  // 3. Google Analytics 4 (gtag.js) direct tracking
  if (typeof window.gtag === "function") {
    const gtagPayload = {
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
  const pixelNameMap = {
    view_item: "ViewContent",
    add_to_cart: "AddToCart",
    remove_from_cart: "Custom_RemoveFromCart",
    begin_checkout: "InitiateCheckout",
    add_shipping_info: "AddShippingInfo",
    purchase: "Purchase",
  };

  const pixelName = pixelNameMap[name];
  if (pixelName && window.fbq) {
    const pixelPayload = {
      value: payload.value,
      currency: "BDT",
    };

    if (payload.items && payload.items.length > 0) {
      pixelPayload.content_ids = payload.items.map(i => i.item_id);
      pixelPayload.content_type = "product";
      pixelPayload.contents = payload.items.map(i => ({
        id: i.item_id,
        quantity: i.quantity || 1,
        price: i.price,
      }));
    }

    if (name === "purchase" && payload.order_id) {
      pixelPayload.order_id = payload.order_id;
    }

    const eventOptions = {};
    if (name === "purchase" && payload.order_id) {
      eventOptions.eventID = "order_" + payload.order_id;
    }
    if (window.fbTestCode && window.fbTestCode.trim() !== "") {
      eventOptions.test_event_code = window.fbTestCode.trim();
    }

    // Pass user details for advanced matching if available
    if (payload.user_data) {
      const advancedMatching = {
        ph: payload.user_data.phone_number?.replace(/\D/g, ""),
        fn: payload.user_data.address?.first_name?.trim().split(/\s+/)[0],
        ct: payload.user_data.address?.city?.toLowerCase(),
        co: "bd",
      };
      window.fbq("track", pixelName, pixelPayload, eventOptions);
    } else {
      window.fbq("track", pixelName, pixelPayload, eventOptions);
    }
  }
}

// Global IP Fetching on load
window.addEventListener('DOMContentLoaded', () => {
  fetch("https://api.ipify.org?format=json")
    .then(res => res.json())
    .then(json => {
      if (json.ip) window.userIp = json.ip;
    })
    .catch(err => console.error("IP check failed:", err));
});
