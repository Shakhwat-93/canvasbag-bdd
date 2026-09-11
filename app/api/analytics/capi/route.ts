import { NextRequest, NextResponse } from "next/server";
import { sendMetaServerEvent } from "@/lib/meta-capi";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventName, eventId, eventSourceUrl, userData = {}, customData = {} } = body;

    if (!eventName || !eventId) {
      return NextResponse.json({ error: "Missing eventName or eventId" }, { status: 400 });
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
