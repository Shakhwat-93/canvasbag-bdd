import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { supabaseOrdersService } from "@/lib/supabase";
import { updateLocalOrderStatus, deleteLocalOrder } from "@/lib/db";

export async function PUT(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 });
    }

    // 1. Update in remote Supabase
    await supabaseOrdersService.updateOrderStatus(id, status);

    // 2. Update in local SQLite
    updateLocalOrderStatus(id, status);

    return NextResponse.json({ success: true, message: "Order status updated" });
  } catch (error: any) {
    console.error("[Order Status API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update status" }, { status: 500 });
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
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // 1. Delete from remote Supabase
    await supabaseOrdersService.deleteOrder(id);

    // 2. Delete from local SQLite
    deleteLocalOrder(id);

    return NextResponse.json({ success: true, message: "Order deleted" });
  } catch (error: any) {
    console.error("[Delete Order API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete order" }, { status: 500 });
  }
}
