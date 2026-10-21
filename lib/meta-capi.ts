import crypto from "crypto";
import { getCatalogSettings } from "@/lib/supabase";

function sha256(val?: string | null): string | null {
  if (!val || !val.trim()) return null;
  return crypto.createHash("sha256").update(val.trim().toLowerCase()).digest("hex");
}

export interface MetaServerEventParams {
  eventName:
    | "PageView"
    | "ViewContent"
    | "AddToCart"
    | "InitiateCheckout"
    | "AddShippingInfo"
    | "Purchase"
    | string;
  eventId: string;
  eventSourceUrl?: string;
  testCode?: string;
  userData?: {
    phone?: string;
    email?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    country?: string;
    ip?: string;
    userAgent?: string;
    fbp?: string;
    fbc?: string;
    externalId?: string;
  };
  customData?: Record<string, any>;
}

export async function sendMetaServerEvent(params: MetaServerEventParams): Promise<boolean> {
  try {
    const settings = await getCatalogSettings();
    const pixelId = (settings.pixelId || process.env.FACEBOOK_PIXEL_ID || "1614327189772228").trim();
    const accessToken = (settings.fbAccessToken || process.env.FACEBOOK_ACCESS_TOKEN || "EAA9aZA7khMiYBSZAjid32RiNRFJrtCJa3XhQDXpfzVVYLWNrFZCOS7cxslQlhCNHgepBkvcrr85ZBnKQdyoqaupbVLqZBmuK0ZBqIyN5XasKrvII2kZBdoCuwXvDYfFE1PNuUdaI6wj2tyKcKaIgqLdp1ZAZB6Op8vSTrUjwxXSnqGEecXH7a5lMpEY7kTgm95gZDZD").trim();
    const testCode = (params.testCode || settings.fbTestCode || process.env.FACEBOOK_TEST_EVENT_CODE || "").trim();

    if (!pixelId || !accessToken) {
      console.warn("[Meta CAPI] Missing pixelId or accessToken");
      return false;
    }

    const u = params.userData || {};

    // Phone format: Meta CAPI requires country code without + or leading zeros (e.g. 88017XXXXXXXX)
    const rawPhone = (u.phone || "").replace(/\D/g, "");
    let phoneFormatted = rawPhone;
    if (rawPhone.length === 11 && rawPhone.startsWith("01")) {
      phoneFormatted = `88${rawPhone}`;
    } else if (rawPhone.length === 13 && rawPhone.startsWith("8801")) {
      phoneFormatted = rawPhone;
    }

    // Name format
    let firstName = u.firstName || "";
    let lastName = u.lastName || "";
    if (!firstName && u.name) {
      const parts = u.name.trim().split(/\s+/);
      firstName = parts[0] || "";
      if (parts.length > 1) lastName = parts[parts.length - 1] || "";
    }

    const formattedUserData: Record<string, any> = {};
    if (phoneFormatted) formattedUserData.ph = [sha256(phoneFormatted)];
    if (u.email) formattedUserData.em = [sha256(u.email)];
    if (firstName) formattedUserData.fn = [sha256(firstName)];
    if (lastName) formattedUserData.ln = [sha256(lastName)];
    if (u.city) formattedUserData.ct = [sha256(u.city.toLowerCase().trim())];
    formattedUserData.country = [sha256((u.country || "bd").toLowerCase().trim())];

    if (u.externalId) {
      formattedUserData.external_id = [sha256(u.externalId)];
    } else if (phoneFormatted) {
      formattedUserData.external_id = [sha256(phoneFormatted)];
    }

    if (u.ip) formattedUserData.client_ip_address = u.ip;
    if (u.userAgent) formattedUserData.client_user_agent = u.userAgent;
    if (u.fbp) formattedUserData.fbp = u.fbp;
    if (u.fbc) formattedUserData.fbc = u.fbc;

    const eventData: Record<string, any> = {
      event_name: params.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: params.eventId,
      event_source_url: params.eventSourceUrl || "https://canvasbagbd.com",
      action_source: "website",
      user_data: formattedUserData,
    };

    if (params.customData && Object.keys(params.customData).length > 0) {
      eventData.custom_data = params.customData;
    }

    const payload: Record<string, any> = {
      data: [eventData],
    };

    if (testCode) {
      payload.test_event_code = testCode;
    }

    const url = `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`;
    
    // Bounded retry handling for transient errors (5xx, 429, network) with identical event_id
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 400));
        }

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const resJson = await res.json().catch(() => ({}));
          console.log(
            `[Meta CAPI] ${params.eventName} sent successfully (ID: ${params.eventId})${
              testCode ? ` [TestCode: ${testCode}]` : ""
            }`
          );
          if (resJson.messages && resJson.messages.length > 0) {
            console.log(`[Meta CAPI Diagnostics]`, resJson.messages);
          }
          return true;
        }

        const errJson = await res.json().catch(() => ({}));
        lastError = errJson;

        // If client error (4xx) other than rate limit (429), don't retry
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          console.warn(`[Meta CAPI] Request rejected (${res.status}) on ${params.eventName}:`, errJson);
          return false;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    console.warn(`[Meta CAPI] Failed to send ${params.eventName} after retries:`, lastError);
    return false;
  } catch (err: any) {
    console.error(`[Meta CAPI Error] ${err.message}`);
    return false;
  }
}

export async function sendMetaPurchaseEvent(
  order: {
    id: string;
    phone: string;
    name?: string;
    city?: string;
    total: number;
    fullUrl?: string;
  },
  items: Array<{ productId?: string; id?: string; price: number; quantity?: number; name?: string }>,
  reqInfo: {
    ip?: string;
    userAgent?: string;
    fbp?: string;
    fbc?: string;
    pixelIdOverride?: string;
    testCode?: string;
  }
): Promise<boolean> {
  const contents = items.map((item) => ({
    id: String(item.productId || item.id || ""),
    quantity: Number(item.quantity || 1),
    item_price: Number(item.price || 0),
  }));

  const totalQuantity = items.reduce((acc, item) => acc + Number(item.quantity || 1), 0);
  const contentIds = items.map((item) => String(item.productId || item.id || "")).filter(Boolean);

  const customData: Record<string, any> = {
    currency: "BDT",
    value: Number(order.total || 0),
    order_id: String(order.id),
    content_type: "product",
    contents,
  };

  if (contentIds.length > 0) {
    customData.content_ids = contentIds;
  }
  if (totalQuantity > 0) {
    customData.num_items = totalQuantity;
  }

  const cleanDigits = (order.phone || "").replace(/\D/g, "");
  const externalId = cleanDigits.length >= 10 ? (cleanDigits.startsWith("01") ? `88${cleanDigits}` : cleanDigits) : order.id;

  return sendMetaServerEvent({
    eventName: "Purchase",
    eventId: `order_${order.id}`,
    eventSourceUrl: order.fullUrl || "https://canvasbagbd.com/checkout",
    testCode: reqInfo.testCode,
    userData: {
      phone: order.phone,
      name: order.name,
      city: order.city || "dhaka",
      country: "bd",
      ip: reqInfo.ip,
      userAgent: reqInfo.userAgent,
      fbp: reqInfo.fbp,
      fbc: reqInfo.fbc,
      externalId,
    },
    customData,
  });
}