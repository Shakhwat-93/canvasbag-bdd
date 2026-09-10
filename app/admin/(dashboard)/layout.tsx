import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isUserAdmin } from "@/lib/admin-auth";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { getAllSupportMessages, getAllReviews, getAllLocalOrders } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await isUserAdmin();
  if (!isAdmin) {
    redirect("/admin/login");
  }

  const cookieStore = await cookies();
  const adminEmail = cookieStore.get("admin_email")?.value || "admin@canvasbagbd.com";

  let supportCount = 0;
  let pendingReviewsCount = 0;
  let pendingOrdersCount = 0;

  try {
    const supportMessages = getAllSupportMessages();
    supportCount = supportMessages.length;

    const reviews = getAllReviews();
    pendingReviewsCount = reviews.filter((r) => r.status === "pending").length;

    const orders = getAllLocalOrders();
    pendingOrdersCount = orders.filter(
      (o) => o.status === "pending" || o.status === "new" || !o.status
    ).length;
  } catch (e) {
    console.error("[Admin Dashboard Layout DB Error]", e);
  }

  return (
    <AdminLayoutShell
      adminEmail={adminEmail}
      supportCount={supportCount}
      pendingReviewsCount={pendingReviewsCount}
      ordersCount={pendingOrdersCount}
    >
      {children}
    </AdminLayoutShell>
  );
}
