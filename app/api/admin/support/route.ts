import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { deleteSupportMessage } from "@/lib/db";

export async function DELETE(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Support message ID is required" }, { status: 400 });
    }

    const success = deleteSupportMessage(id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete support message" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Support message deleted successfully" });
  } catch (error: any) {
    console.error("[Support Admin API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete message" }, { status: 500 });
  }
}
