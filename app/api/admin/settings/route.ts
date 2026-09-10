import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { supabaseCatalogService } from "@/lib/supabase";

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

    const current = await supabaseCatalogService.getSettings();
    const merged = { ...current, ...settings };

    const success = await supabaseCatalogService.updateSettings(merged);
    if (!success) {
      return NextResponse.json({ error: "Failed to update settings in Supabase" }, { status: 500 });
    }

    try {
      const { revalidateTag, revalidatePath } = await import("next/cache");
      revalidateTag("cb-settings", { expire: 0 });
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath("/cart");
      revalidatePath("/checkout");
    } catch {
      // Non-fatal
    }

    return NextResponse.json({ success: true, settings: merged });
  } catch (error: any) {
    console.error("[Settings API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
