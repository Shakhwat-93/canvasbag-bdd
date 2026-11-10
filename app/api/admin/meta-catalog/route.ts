import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { getCatalogProducts, getCatalogCategories, getCatalogSettings, supabaseCatalogService } from "@/lib/supabase";
import { buildMetaCatalogFeed } from "@/lib/meta-catalog";

export async function GET(_req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [products, categories, settings] = await Promise.all([
      getCatalogProducts({ forceFresh: true }),
      getCatalogCategories({ forceFresh: true }),
      getCatalogSettings({ forceFresh: true }),
    ]);

    const { report, items } = buildMetaCatalogFeed({
      products,
      categories,
      settings,
    });

    return NextResponse.json(
      {
        success: true,
        report,
        items,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("[Admin Meta Catalog GET Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to load Meta catalog report" },
      { status: 500 }
    );
  }
}

export async function POST(_req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await supabaseCatalogService.revalidateCatalog("all");

    const [products, categories, settings] = await Promise.all([
      getCatalogProducts({ forceFresh: true }),
      getCatalogCategories({ forceFresh: true }),
      getCatalogSettings({ forceFresh: true }),
    ]);

    const { report, items } = buildMetaCatalogFeed({
      products,
      categories,
      settings,
    });

    return NextResponse.json(
      {
        success: true,
        report,
        items,
        revalidatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("[Admin Meta Catalog POST Sync Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync and validate Meta catalog feed" },
      { status: 500 }
    );
  }
}
