import crypto from "crypto";
import { getCatalogSettings } from "@/lib/supabase";

const DEFAULT_TIKTOK_PIXEL_ID = "DBVJMJJC77U7CBT6B0U0";
const DEFAULT_TIKTOK_ACCESS_TOKEN = "f9f0781c2ea110e9badf4e92d34cbc3e800641b6";
const DEFAULT_TIKTOK_TEST_CODE = "TEST50481";

function sha256(val?: string | null): string | null {
  if (!val || !val.trim()) return null;
  return crypto.createHash("sha256").update(val.trim().toLowerCase()).digest("hex");
}

export function formatPhoneE164(phone?: string | null): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits || digits.length < 10) return null;
  if (digits.length === 11 && digits.startsWith("01")) {
    return `+88${digits}`;
  }
  if (digits.length === 13 && digits.startsWith("8801")) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

const META_TO_TIKTOK_EVENT: Record<string, string> = {
  PageView: "Pageview",
  ViewContent: "ViewContent",
  AddToCart: "AddToCart",
  InitiateCheckout: "InitiateCheckout",
  Purchase: "CompletePayment",
  CompletePayment: "CompletePayment",
};

export interface TikTokServerEventParams {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  testCode?: string;
  userData?: {
    phone?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    ttp?: string;
    ttclid?: string;
    externalId?: string;
  };
  customData?: Record<string, any>;
}

/**
 * Dispatch server-side event to TikTok Events API v1.3 with shared event_id for browser deduplication.
 */
export async function sendTikTokServerEvent(params: TikTokServerEventParams): Promise<boolean> {
  try {
    const ttEventName = META_TO_TIKTOK_EVENT[params.eventName];
    if (!ttEventName) {
      return false;
    }

    const settings = await getCatalogSettings();
    const pixelId = (
      settings.tiktokPixelId !== undefined
        ? settings.tiktokPixelId
        : process.env.TIKTOK_PIXEL_ID || DEFAULT_TIKTOK_PIXEL_ID
    ).trim();
    const accessToken = (
      settings.tiktokAccessToken !== undefined
        ? settings.tiktokAccessToken
        : process.env.TIKTOK_ACCESS_TOKEN || DEFAULT_TIKTOK_ACCESS_TOKEN
    ).trim();
    const testCode = (
      params.testCode !== undefined
        ? params.testCode
        : settings.tiktokTestCode !== undefined
        ? settings.tiktokTestCode
        : process.env.TIKTOK_TEST_EVENT_CODE || DEFAULT_TIKTOK_TEST_CODE
    ).trim();

    if (!pixelId || !accessToken) {
      return false;
    }

    const u = params.userData || {};
    const phoneE164 = formatPhoneE164(u.phone);
    const hashedPhone = sha256(phoneE164);
    const hashedEmail = sha256(u.email);
    const hashedExternalId = sha256(u.externalId || phoneE164);

    const userObj: Record<string, any> = {};
    if (u.ttp) userObj.ttp = u.ttp;
    if (u.ttclid) userObj.ttclid = u.ttclid;
    if (hashedPhone) userObj.phone = hashedPhone;
    if (hashedEmail) userObj.email = hashedEmail;
    if (hashedExternalId) userObj.external_id = hashedExternalId;
    if (
      u.ip &&
      u.ip !== "127.0.0.1" &&
      u.ip !== "::1" &&
      !u.ip.startsWith("192.168.") &&
      !u.ip.startsWith("10.") &&
      !u.ip.startsWith("172.")
    ) {
      userObj.ip = u.ip;
    }
    if (u.userAgent) userObj.user_agent = u.userAgent;

    const rawContents = Array.isArray(params.customData?.contents)
      ? params.customData!.contents
      : [];
    const ttContents = rawContents.map((item: any) => ({
      content_id: String(item.content_id || item.id || ""),
      content_type: "product",
      ...(item.content_name ? { content_name: String(item.content_name) } : {}),
      quantity: Number(item.quantity || 1),
      price: Number(item.price ?? item.item_price ?? 0),
    }));

    const properties: Record<string, any> = {};
    if (params.customData?.value !== undefined) {
      properties.value = Number(params.customData.value || 0);
      properties.currency = params.customData.currency || "BDT";
    }
    if (ttContents.length > 0) {
      properties.contents = ttContents;
      properties.content_type = "product";
    }
    if (params.customData?.content_name) {
      properties.description = String(params.customData.content_name);
    }
    if (params.customData?.order_id) {
      properties.order_id = String(params.customData.order_id);
    }

    const eventEntry: Record<string, any> = {
      event: ttEventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: params.eventId,
      user: userObj,
      page: {
        url: params.eventSourceUrl || "https://canvasbagbd.com",
      },
    };

    if (Object.keys(properties).length > 0) {
      eventEntry.properties = properties;
    }

    const payload: Record<string, any> = {
      event_source: "web",
      event_source_id: pixelId,
      data: [eventEntry],
    };

    if (testCode) {
      payload.test_event_code = testCode;
    }

    const endpoint = "https://business-api.tiktok.com/open_api/v1.3/event/track/";
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 400));
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(6000),
        });

        const resJson = await res.json().catch(() => ({}));
        if (res.ok && (resJson.code === 0 || resJson.code === undefined)) {
          console.log(
            `[TikTok Events API] ${ttEventName} sent successfully (ID: ${params.eventId})${
              testCode ? ` [TestCode: ${testCode}]` : ""
            }`
          );
          return true;
        }

        lastError = resJson;
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          console.warn(`[TikTok Events API] Rejected (${res.status}) on ${ttEventName}:`, resJson);
          return false;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    console.warn(`[TikTok Events API] Failed to send ${ttEventName} after retries:`, lastError);
    return false;
  } catch (err: any) {
    console.error(`[TikTok Events API Error] ${err.message}`);
    return false;
  }
}

export async function sendTikTokPurchaseEvent(
  order: {
    id: string;
    phone: string;
    total: number;
    fullUrl?: string;
  },
  items: Array<{ productId?: string; id?: string; price: number; quantity?: number; name?: string }>,
  reqInfo: {
    ip?: string;
    userAgent?: string;
    ttp?: string;
    ttclid?: string;
    testCode?: string;
  }
): Promise<boolean> {
  const contents = items.map((item) => ({
    content_id: String(item.productId || item.id || ""),
    content_type: "product",
    ...(item.name ? { content_name: item.name } : {}),
    quantity: Number(item.quantity || 1),
    price: Number(item.price || 0),
  }));

  return sendTikTokServerEvent({
    eventName: "CompletePayment",
    eventId: `order_${order.id}`,
    eventSourceUrl: order.fullUrl || "https://canvasbagbd.com/checkout",
    testCode: reqInfo.testCode,
    userData: {
      phone: order.phone,
      ip: reqInfo.ip,
      userAgent: reqInfo.userAgent,
      ttp: reqInfo.ttp,
      ttclid: reqInfo.ttclid,
      externalId: formatPhoneE164(order.phone) || order.id,
    },
    customData: {
      currency: "BDT",
      value: Number(order.total || 0),
      order_id: String(order.id),
      content_type: "product",
      contents,
    },
  });
}
