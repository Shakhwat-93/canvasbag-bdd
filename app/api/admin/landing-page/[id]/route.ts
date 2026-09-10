import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { supabaseCatalogService } from "@/lib/supabase";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const success = await supabaseCatalogService.deleteLandingPage(id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete landing page" }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: "Landing page deleted" });
  } catch (error: any) {
    console.error("[Delete Landing Page API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete landing page" }, { status: 500 });
  }
}
