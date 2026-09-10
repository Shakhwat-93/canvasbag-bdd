"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  supportCount?: number;
  pendingReviewsCount?: number;
  ordersCount?: number;
}

export function AdminDrawer({
  isOpen,
  onClose,
  supportCount = 0,
  pendingReviewsCount = 0,
  ordersCount = 0,
}: AdminDrawerProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true" aria-label="Navigation Drawer">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
        {/* Close Button Header */}
        <div className="absolute top-3 right-3 z-20">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 h-full overflow-hidden">
          <AdminSidebar
            supportCount={supportCount}
            pendingReviewsCount={pendingReviewsCount}
            ordersCount={ordersCount}
            onNavigate={onClose}
            isMobileDrawer={true}
            className="border-r-0"
          />
        </div>
      </div>
    </div>
  );
}
