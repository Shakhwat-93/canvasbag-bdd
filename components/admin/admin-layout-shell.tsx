"use client";

import React, { useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { AdminAlertProvider } from "@/components/admin/admin-alert-provider";

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
    <AdminAlertProvider>
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans text-stone-900 antialiased selection:bg-[#D45266]/15 selection:text-[#D45266]">
        {/* Mobile Slide-over Navigation Drawer */}
        <AdminDrawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          supportCount={supportCount}
          pendingReviewsCount={pendingReviewsCount}
          ordersCount={ordersCount}
        />

        {/* Desktop Permanently Fixed Left Sidebar */}
        <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30 bg-white border-r border-[#EFECE6] shadow-xs">
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
            pendingAlertsCount={ordersCount + pendingReviewsCount + supportCount}
          />

          {/* Dynamic Admin Page View Container */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminAlertProvider>
  );
}
