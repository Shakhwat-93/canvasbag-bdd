import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { supabaseCatalogService } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    let { id, title, custom_domain, gtm_id, ga4_id, pixel_id, template, custom_css, components } = body;

    id = String(id || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\-]/g, "-")
      .replace(/(^-|-$)+/g, "");

    if (!id) {
      return NextResponse.json({ error: "Slug cannot be empty" }, { status: 400 });
    }

    const data = {
      id,
      title: title ? String(title).trim() : "New Landing Page",
      custom_domain: custom_domain ? String(custom_domain).toLowerCase().trim() : null,
      gtm_id: gtm_id ? String(gtm_id).trim() : null,
      ga4_id: ga4_id ? String(ga4_id).trim() : null,
      pixel_id: pixel_id ? String(pixel_id).trim() : null,
      template: template || "default",
      custom_css: custom_css || "",
      components: Array.isArray(components) ? components : [],
    };

    const success = await supabaseCatalogService.upsertLandingPage(id, data);
    if (!success) {
      return NextResponse.json({ error: "Failed to save landing page to Supabase" }, { status: 500 });
    }

    return NextResponse.json({ success: true, landingPage: data });
  } catch (error: any) {
    console.error("[Landing Page API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to save landing page" }, { status: 500 });
  }
}
