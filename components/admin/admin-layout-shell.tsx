"use client";

import React, { useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminDrawer } from "@/components/admin/admin-drawer";

interface AdminLayoutShellProps {
  adminEmail: string;
  supportCount: number;
  pendingReviewsCount: number;
  ordersCount: number;
  children: React.ReactNode;
}

export function AdminLayoutShell({
  adminEmail,
  supportCount,
  pendingReviewsCount,
  ordersCount,
  children,
}: AdminLayoutShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-poppins">
      {/* Mobile Slide-over Navigation Drawer */}
      <AdminDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        supportCount={supportCount}
        pendingReviewsCount={pendingReviewsCount}
        ordersCount={ordersCount}
      />

      {/* Desktop Permanently Fixed Left Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30 bg-white border-r border-slate-200/80 shadow-xs">
        <AdminSidebar
          supportCount={supportCount}
          pendingReviewsCount={pendingReviewsCount}
          ordersCount={ordersCount}
          className="h-full border-r-0"
        />
      </div>

      {/* Main Content Area (offset by 256px sidebar on desktop) */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Sticky Top Header */}
        <AdminHeader
          adminEmail={adminEmail}
          onOpenMobileMenu={() => setMobileDrawerOpen(true)}
        />

        {/* Dynamic Admin Page View Container */}
        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xs min-h-[calc(100vh-8rem)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
