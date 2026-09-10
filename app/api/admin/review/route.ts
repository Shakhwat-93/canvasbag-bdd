import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { approveReview, deleteReview } from "@/lib/db";

export async function PUT(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const success = approveReview(id);
    if (!success) {
      return NextResponse.json({ error: "Failed to approve review" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Review approved successfully" });
  } catch (error: any) {
    console.error("[Review Admin API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to approve review" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const success = deleteReview(id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (error: any) {
    console.error("[Review Admin API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete review" }, { status: 500 });
  }
}
