import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { getCatalogProducts } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawSlug = searchParams.get("slug") || "";
  const excludeId = searchParams.get("excludeId") || "";

  const slug = rawSlug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  if (!slug) {
    return NextResponse.json({ available: false, error: "Invalid slug" });
  }

  try {
    const products = await getCatalogProducts();
    const existing = products.find(
      (p) => p.slug && p.slug.toLowerCase() === slug && p.id !== excludeId
    );

    if (!existing) {
      return NextResponse.json({ available: true, slug });
    }

    // Generate suggested unique slug
    let counter = 1;
    let suggested = `${slug}-${counter}`;
    while (products.some((p) => p.slug && p.slug.toLowerCase() === suggested && p.id !== excludeId)) {
      counter++;
      suggested = `${slug}-${counter}`;
    }

    return NextResponse.json({
      available: false,
      slug,
      suggestedSlug: suggested,
      message: "Slug is already taken by another product",
    });
  } catch (err: any) {
    console.error("[Slug Check Error]", err);
    return NextResponse.json({ available: true, slug });
  }
}
