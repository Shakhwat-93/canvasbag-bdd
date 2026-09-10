import crypto from "crypto";
import { getCatalogSettings } from "@/lib/supabase";

function sha256(val?: string | null): string | null {
  if (!val || !val.trim()) return null;
  return crypto.createHash("sha256").update(val.trim().toLowerCase()).digest("hex");
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
  items: Array<{ productId?: string; id?: string; price: number; quantity?: number }>,
  reqInfo: {
    ip?: string;
    userAgent?: string;
    fbp?: string;
    fbc?: string;
    pixelIdOverride?: string;
  }
): Promise<boolean> {
  try {
    const settings = await getCatalogSettings();
    const pixelId = reqInfo.pixelIdOverride || settings.pixelId || process.env.FACEBOOK_PIXEL_ID || "";
    const accessToken = settings.fbAccessToken || process.env.FACEBOOK_ACCESS_TOKEN || "";
    const testCode = settings.fbTestCode || process.env.FACEBOOK_TEST_EVENT_CODE || "";

    if (!pixelId || !accessToken) {
      return false;
    }

    // Format customer phone
    const rawPhone = (order.phone || "").replace(/\D/g, "");
    const phoneFormatted = rawPhone.length === 11 && rawPhone.startsWith("01") ? `88${rawPhone}` : rawPhone;

    // Customer Name parsing
    const rawName = (order.name || "").trim();
    const nameParts = rawName.split(/\s+/);
    const firstName = nameParts[0]?.toLowerCase() || "";
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1]?.toLowerCase() : "";

    const userData: Record<string, any> = {};
    if (phoneFormatted) userData.ph = [sha256(phoneFormatted)];
    if (firstName) userData.fn = [sha256(firstName)];
    if (lastName) userData.ln = [sha256(lastName)];
    userData.ct = [sha256((order.city || "dhaka").toLowerCase())];
    userData.country = [sha256("bd")];

    if (reqInfo.ip) userData.client_ip_address = reqInfo.ip;
    if (reqInfo.userAgent) userData.client_user_agent = reqInfo.userAgent;
    if (reqInfo.fbp) userData.fbp = reqInfo.fbp;
    if (reqInfo.fbc) userData.fbc = reqInfo.fbc;

    const contents = items.map((item) => ({
      id: String(item.productId || item.id || ""),
      quantity: Number(item.quantity || 1),
      item_price: Number(item.price || 0),
    }));

    const customData = {
      currency: "BDT",
      value: Number(order.total || 0),
      order_id: String(order.id),
      content_type: "product",
      contents,
    };

    const eventData: Record<string, any> = {
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: `order_${order.id}`,
      event_source_url: order.fullUrl || "https://canvasbag.store",
      action_source: "website",
      user_data: userData,
      custom_data: customData,
    };

    const payload: Record<string, any> = {
      data: [eventData],
    };

    if (testCode && testCode.trim()) {
      payload.test_event_code = testCode.trim();
    }

    const url = `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log(`[Meta CAPI] Purchase event sent for Order #${order.id}`);
      return true;
    } else {
      const errJson = await res.json();
      console.warn(`[Meta CAPI] Failed to send Purchase for Order #${order.id}`, errJson);
      return false;
    }
  } catch (e: any) {
    console.error(`[Meta CAPI Error] ${e.message}`);
    return false;
  }
}