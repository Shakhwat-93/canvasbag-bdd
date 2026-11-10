import { NextRequest, NextResponse } from "next/server";
import { getCatalogProducts, getCatalogCategories, getCatalogSettings } from "@/lib/supabase";
import { buildMetaCatalogFeed } from "@/lib/meta-catalog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const forceFresh = searchParams.get("fresh") === "1";
    const isDownload = searchParams.get("download") === "1";

    const queryOpts = forceFresh || isDownload ? { forceFresh: true } : undefined;

    const [products, categories, settings] = await Promise.all([
      getCatalogProducts(queryOpts),
      getCatalogCategories(queryOpts),
      getCatalogSettings(queryOpts),
    ]);

    const { xml, report } = buildMetaCatalogFeed({
      products,
      categories,
      settings,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "Access-Control-Allow-Origin": "*",
      "X-Catalog-Items": String(report.totalFeedItems),
      "X-Catalog-Valid": String(report.isValidXml),
      "Cache-Control":
        forceFresh || isDownload
          ? "no-store, no-cache, must-revalidate, max-age=0"
          : "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    };

    if (isDownload) {
      headers["Content-Disposition"] = 'attachment; filename="facebook-catalog.xml"';
    }

    return new NextResponse(xml, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("[Meta Catalog Feed Error]", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>\n<error>Unable to generate catalog feed</error>\n`,
      {
        status: 500,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
