import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { supabaseCatalogService, getLandingPages, getLandingPage } from "@/lib/supabase";
import type { LandingPage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const page = await getLandingPage(id, { forceFresh: true });
      if (!page) {
        return NextResponse.json({ error: "Landing page not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, landingPage: page });
    }

    const pages = await getLandingPages({ forceFresh: true });
    return NextResponse.json({ success: true, landingPages: pages });
  } catch (error: any) {
    console.error("[Landing Page GET Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch landing pages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Check if duplicate action requested
    if (body.action === "duplicate" && body.sourceId) {
      const source = await getLandingPage(body.sourceId, { forceFresh: true });
      if (!source) {
        return NextResponse.json({ error: "Source landing page not found" }, { status: 404 });
      }

      const newId = `${source.id || source.slug || "lp"}-copy-${Date.now().toString().slice(-4)}`;
      const duplicatedData: LandingPage = {
        ...source,
        id: newId,
        slug: newId,
        title: `${source.title} (Copy)`,
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const saved = await supabaseCatalogService.upsertLandingPage(newId, duplicatedData);
      await supabaseCatalogService.revalidateCatalog("landing-pages");
      return NextResponse.json({ success: true, landingPage: saved });
    }

    let {
      id,
      slug,
      title,
      status,
      product_id,
      template,
      custom_domain,
      subdomain,
      meta_title,
      meta_description,
      og_image,
      canonical_url,
      gtm_id,
      ga4_id,
      pixel_id,
      product_override,
      sections,
      components,
      custom_css,
    } = body;

    const rawSlug = id || slug || title || `page-${Date.now()}`;
    id = String(rawSlug)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)+/g, "");

    if (!id) {
      return NextResponse.json({ error: "Slug cannot be empty" }, { status: 400 });
    }

    const isNew = Boolean(body.isNew);
    const originalId = body.originalId ? String(body.originalId).toLowerCase().trim() : null;

    // Collision protection: If creating a new page, never overwrite an existing one!
    if (isNew) {
      const existing = await getLandingPage(id, { forceFresh: true });
      if (existing) {
        id = `${id}-${Date.now().toString().slice(-4)}`;
      }
    } else if (originalId && originalId !== id) {
      // Renamed existing landing page: delete old slug to prevent orphaned duplicate
      await supabaseCatalogService.deleteLandingPage(originalId);
    }

    const data: LandingPage = {
      id,
      slug: id,
      title: title ? String(title).trim() : "New Landing Page",
      status: status === "draft" ? "draft" : "published",
      product_id: product_id || undefined,
      template: template || "high_converting",
      custom_domain: custom_domain ? String(custom_domain).toLowerCase().trim() : null,
      subdomain: subdomain ? String(subdomain).toLowerCase().trim() : null,
      meta_title: meta_title ? String(meta_title).trim() : undefined,
      meta_description: meta_description ? String(meta_description).trim() : undefined,
      og_image: og_image || undefined,
      canonical_url: canonical_url ? String(canonical_url).trim() : `/lp/${id}`,
      gtm_id: gtm_id ? String(gtm_id).trim() : null,
      ga4_id: ga4_id ? String(ga4_id).trim() : null,
      pixel_id: pixel_id ? String(pixel_id).trim() : null,
      product_override: product_override || {},
      sections: Array.isArray(sections) ? sections : undefined,
      components: Array.isArray(components) ? components : [],
      custom_css: custom_css || "",
      created_at: body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const savedLp = await supabaseCatalogService.upsertLandingPage(id, data);
    if (!savedLp) {
      return NextResponse.json({ error: "Failed to save landing page to Supabase" }, { status: 500 });
    }

    await supabaseCatalogService.revalidateCatalog("landing-pages");

    return NextResponse.json(
      { success: true, landingPage: savedLp },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
      }
    );
  } catch (error: any) {
    console.error("[Landing Page API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to save landing page" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: "Landing page ID is required" }, { status: 400 });
    }

    const success = await supabaseCatalogService.deleteLandingPage(id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete landing page" }, { status: 500 });
    }

    await supabaseCatalogService.revalidateCatalog("landing-pages");

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error("[Landing Page DELETE Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete landing page" }, { status: 500 });
  }
}
