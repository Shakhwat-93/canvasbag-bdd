import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { isUserAdmin } from "@/lib/admin-auth";
import { supabaseCatalogService } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await supabaseCatalogService.getSettings({ forceFresh: true });
  return NextResponse.json({ success: true, settings }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
  });
}

export async function POST(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const settings = body.settings && typeof body.settings === "object" ? body.settings : body;
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
    }

    // Sanitize tracking IDs
    if (settings.gtmId) {
      const match = String(settings.gtmId).match(/GTM-[A-Z0-9]+/i);
      settings.gtmId = match ? match[0].toUpperCase() : String(settings.gtmId).trim().toUpperCase();
    }
    if (settings.ga4Id) {
      const match = String(settings.ga4Id).match(/G-[A-Z0-9]+/i);
      settings.ga4Id = match ? match[0].toUpperCase() : String(settings.ga4Id).trim().toUpperCase();
    }
    if (settings.pixelId) {
      const match = String(settings.pixelId).match(/\d{10,25}/);
      settings.pixelId = match ? match[0] : String(settings.pixelId).trim();
    }

    const current = await supabaseCatalogService.getSettings({ forceFresh: true });
    const merged = { ...current, ...settings };

    const savedSettings = await supabaseCatalogService.updateSettings(merged);
    if (!savedSettings) {
      return NextResponse.json({ error: "Failed to update settings in Supabase" }, { status: 500 });
    }

    await supabaseCatalogService.revalidateCatalog("settings");

    return NextResponse.json({ success: true, settings: savedSettings }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
  } catch (error: any) {
    console.error("[Settings API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
