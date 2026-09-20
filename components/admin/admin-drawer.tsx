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
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);

  const handleClose = React.useCallback(() => {
    if (
      previousActiveElementRef.current &&
      document.body.contains(previousActiveElementRef.current) &&
      typeof previousActiveElementRef.current.focus === "function"
    ) {
      previousActiveElementRef.current.focus();
    }
    onClose();
  }, [onClose]);

  // Lock body scroll and manage focus when drawer opens
  useEffect(() => {
    if (isOpen) {
      if (document.activeElement instanceof HTMLElement) {
        previousActiveElementRef.current = document.activeElement;
      }
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);

      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true" aria-label="Navigation Drawer">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
        {/* Close Button Header */}
        <div className="absolute top-3 right-3 z-20">
          <button
            ref={closeBtnRef}
            type="button"
            onClick={handleClose}
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
