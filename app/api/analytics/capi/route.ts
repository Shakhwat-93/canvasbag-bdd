import { NextRequest, NextResponse } from "next/server";
import { sendMetaServerEvent } from "@/lib/meta-capi";

// Server-side memory cache for duplicate CAPI request suppression (TTL: 60s)
const processedServerEvents = new Map<string, number>();

function isDuplicateServerEvent(key: string, ttlMs = 15000): boolean {
  const now = Date.now();
  if (processedServerEvents.size > 2000) {
    for (const [k, timestamp] of processedServerEvents.entries()) {
      if (now - timestamp > 60000) {
        processedServerEvents.delete(k);
      }
    }
  }

  const lastSeen = processedServerEvents.get(key);
  if (lastSeen && now - lastSeen < ttlMs) {
    return true;
  }
  processedServerEvents.set(key, now);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventName, eventId, eventSourceUrl, userData = {}, customData = {} } = body;
    const testCode =
      body.test_event_code ||
      body.testCode ||
      req.cookies.get("fb_test_code")?.value ||
      req.headers.get("x-fb-test-code") ||
      undefined;

    if (!eventName || !eventId) {
      return NextResponse.json({ error: "Missing eventName or eventId" }, { status: 400 });
    }

    // 1. Idempotency Check: Suppress repeated requests with the exact same eventId
    if (isDuplicateServerEvent(`id_${eventId}`, 30000)) {
      console.log(`[CAPI Server] Suppressed duplicate eventId: ${eventId}`);
      return NextResponse.json({ success: true, deduplicated: true, eventId });
    }

    // Extract request headers and cookies for high-match-quality CAPI attribution
    const forwardedFor = req.headers.get("x-forwarded-for");
    let ip = forwardedFor ? forwardedFor.split(",")[0].trim() : req.headers.get("x-real-ip") || undefined;
    if (ip === "::1" || ip === "127.0.0.1") ip = undefined;

    const userAgent = req.headers.get("user-agent") || undefined;
    let fbp = req.cookies.get("_fbp")?.value || userData.fbp;
    let shouldSetFbpCookie = false;
    if (!fbp) {
      fbp = `fb.1.${Date.now()}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      shouldSetFbpCookie = true;
    }
    const fbc = req.cookies.get("_fbc")?.value || userData.fbc;

    // 2. High-frequency PageView burst suppression (e.g. from rapid reloads, concurrent tabs, or hydration double-fires)
    if (eventName === "PageView") {
      const clientIdentifier = fbp || ip || "anon";
      const normalizedPath = (eventSourceUrl || "").split("?")[0].replace(/\/+$/, "") || "/";
      const pvKey = `pv_${clientIdentifier}_${normalizedPath}`;
      if (isDuplicateServerEvent(pvKey, 3000)) {
        console.log(`[CAPI Server] Suppressed duplicate PageView burst for ${clientIdentifier} on ${normalizedPath}`);
        return NextResponse.json({ success: true, deduplicated: true, eventId });
      }
    }

    const mergedUserData = {
      country: "bd",
      ...userData,
      ip: userData.ip || ip,
      userAgent: userData.userAgent || userAgent,
      fbp,
      fbc,
    };

    const success = await sendMetaServerEvent({
      eventName,
      eventId,
      eventSourceUrl: eventSourceUrl || req.headers.get("referer") || "https://canvasbagbd.com",
      testCode,
      userData: mergedUserData,
      customData,
    });

    const response = NextResponse.json({ success });
    if (shouldSetFbpCookie) {
      response.cookies.set("_fbp", fbp, {
        maxAge: 90 * 24 * 60 * 60,
        path: "/",
        sameSite: "lax",
      });
    }

    return response;
  } catch (err: any) {
    console.error("[CAPI Route Error]", err);
    return NextResponse.json({ error: err.message || "Failed to dispatch CAPI event" }, { status: 500 });
  }
}
