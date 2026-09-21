"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Trash2,
  HelpCircle,
  Loader2,
  X,
} from "lucide-react";

export type AlertVariant =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "confirm"
  | "danger"
  | "unsaved";

export interface AlertOptions {
  title: string;
  description?: string | ReactNode;
  variant?: AlertVariant;
  confirmText?: string;
  cancelText?: string;
  /** Optional custom icon */
  icon?: React.ComponentType<{ className?: string }>;
  /** If true, user cannot dismiss by clicking outside or pressing Escape */
  persistent?: boolean;
  /** Async function to run on confirm; keeps button in loading state until resolved */
  onConfirm?: () => Promise<void> | void;
}

export interface AdminAlertContextValue {
  /**
   * Shows a confirmation modal returning a promise that resolves to true (confirmed) or false (cancelled)
   */
  confirm: (options: AlertOptions) => Promise<boolean>;
  /**
   * Shows an informational or status alert modal returning a promise that resolves when dismissed
   */
  alert: (options: AlertOptions) => Promise<void>;
  /**
   * Specialized helper for delete confirmation with high-visibility destructive styling
   */
  confirmDelete: (itemName: string, customDesc?: string) => Promise<boolean>;
  /**
   * Specialized helper for unsaved changes warning
   */
  confirmUnsaved: (message?: string) => Promise<boolean>;
  /**
   * Closes the active alert immediately
   */
  close: () => void;
}

const AdminAlertContext = createContext<AdminAlertContextValue | null>(null);

interface ModalState extends AlertOptions {
  isOpen: boolean;
  isConfirm: boolean;
  resolve?: (value: boolean) => void;
  isLoading?: boolean;
}

export function AdminAlertProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    isConfirm: false,
    title: "",
    variant: "info",
  });

  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const closeWithResult = useCallback((result: boolean) => {
    setModalState((prev) => {
      if (prev.resolve) {
        prev.resolve(result);
      }
      return { ...prev, isOpen: false, isLoading: false };
    });

    // Restore previous focus
    if (previousActiveElement.current && typeof previousActiveElement.current.focus === "function") {
      previousActiveElement.current.focus();
    }
  }, []);

  const confirm = useCallback(
    (options: AlertOptions): Promise<boolean> => {
      if (document.activeElement instanceof HTMLElement) {
        previousActiveElement.current = document.activeElement;
      }

      return new Promise<boolean>((resolve) => {
        setModalState({
          ...options,
          isOpen: true,
          isConfirm: true,
          variant: options.variant || "confirm",
          resolve,
          isLoading: false,
        });
      });
    },
    []
  );

  const alert = useCallback(
    (options: AlertOptions): Promise<void> => {
      if (document.activeElement instanceof HTMLElement) {
        previousActiveElement.current = document.activeElement;
      }

      return new Promise<void>((resolve) => {
        setModalState({
          ...options,
          isOpen: true,
          isConfirm: false,
          variant: options.variant || "info",
          resolve: () => resolve(),
          isLoading: false,
        });
      });
    },
    []
  );

  const confirmDelete = useCallback(
    (itemName: string, customDesc?: string): Promise<boolean> => {
      return confirm({
        title: `Delete ${itemName}?`,
        description:
          customDesc ||
          `Are you sure you want to permanently remove "${itemName}"? This action cannot be reversed.`,
        variant: "danger",
        confirmText: "Yes, Delete",
        cancelText: "Cancel",
      });
    },
    [confirm]
  );

  const confirmUnsaved = useCallback(
    (message?: string): Promise<boolean> => {
      return confirm({
        title: "Unsaved Changes",
        description:
          message ||
          "You have unsaved changes that will be lost if you leave this page. Do you want to discard them?",
        variant: "unsaved",
        confirmText: "Discard & Leave",
        cancelText: "Keep Editing",
      });
    },
    [confirm]
  );

  const close = useCallback(() => {
    closeWithResult(false);
  }, [closeWithResult]);

  // Focus primary button when modal opens
  useEffect(() => {
    if (modalState.isOpen) {
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [modalState.isOpen]);

  // Keyboard navigation: Escape to cancel, Enter to confirm
  useEffect(() => {
    if (!modalState.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !modalState.persistent && !modalState.isLoading) {
        e.preventDefault();
        closeWithResult(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalState.isOpen, modalState.persistent, modalState.isLoading, closeWithResult]);

  const handleConfirmClick = async () => {
    if (modalState.isLoading) return;

    if (modalState.onConfirm) {
      setModalState((prev) => ({ ...prev, isLoading: true }));
      try {
        await modalState.onConfirm();
        closeWithResult(true);
      } catch (e) {
        setModalState((prev) => ({ ...prev, isLoading: false }));
        console.error("[AdminAlert] onConfirm error:", e);
      }
    } else {
      closeWithResult(true);
    }
  };

  const handleCancelClick = () => {
    if (modalState.isLoading) return;
    closeWithResult(false);
  };

  // Determine icon & styling based on variant
  const renderIcon = () => {
    if (modalState.icon) {
      const CustomIcon = modalState.icon;
      return <CustomIcon className="w-5 h-5" />;
    }

    switch (modalState.variant) {
      case "success":
        return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
      case "error":
        return <XCircle className="w-6 h-6 text-[#D45266]" />;
      case "danger":
        return <Trash2 className="w-5 h-5 text-[#D45266]" />;
      case "warning":
      case "unsaved":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "info":
        return <Info className="w-5 h-5 text-stone-700" />;
      case "confirm":
      default:
        return <HelpCircle className="w-5 h-5 text-[#D45266]" />;
    }
  };

  const getIconWrapperClasses = () => {
    switch (modalState.variant) {
      case "success":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100 ring-4 ring-emerald-50/60";
      case "error":
      case "danger":
        return "bg-rose-50 text-[#D45266] border border-rose-100 ring-4 ring-rose-50/60";
      case "warning":
      case "unsaved":
        return "bg-amber-50 text-amber-600 border border-amber-100 ring-4 ring-amber-50/60";
      case "info":
        return "bg-stone-50 text-stone-700 border border-stone-200 ring-4 ring-stone-50/60";
      case "confirm":
      default:
        return "bg-[#FDF2F4] text-[#D45266] border border-[#F4C7CF] ring-4 ring-[#FDF2F4]/60";
    }
  };

  const getConfirmButtonClasses = () => {
    switch (modalState.variant) {
      case "danger":
        return "bg-[#D45266] hover:bg-[#BF4357] active:bg-[#A8384B] text-white shadow-xs hover:shadow-sm";
      case "warning":
      case "unsaved":
        return "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs hover:shadow-sm";
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs hover:shadow-sm";
      case "confirm":
      default:
        return "bg-[#D45266] hover:bg-[#BF4357] active:bg-[#A8384B] text-white shadow-xs hover:shadow-sm";
    }
  };

  const defaultConfirmText = () => {
    if (modalState.confirmText) return modalState.confirmText;
    if (modalState.variant === "danger") return "Delete";
    if (modalState.variant === "unsaved") return "Leave";
    return "Confirm";
  };

  const defaultCancelText = () => {
    if (modalState.cancelText) return modalState.cancelText;
    if (modalState.variant === "unsaved") return "Stay";
    return "Cancel";
  };

  return (
    <AdminAlertContext.Provider
      value={{
        confirm,
        alert,
        confirmDelete,
        confirmUnsaved,
        close,
      }}
    >
      {children}

      {/* Global Sweet Alert Modal */}
      {modalState.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-alert-title"
          aria-describedby="admin-alert-description"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          {/* Subtle blurred backdrop */}
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
            onClick={!modalState.persistent && !modalState.isLoading ? handleCancelClick : undefined}
          />

          {/* Modal Container */}
          <div
            className="relative w-full max-w-[390px] bg-white rounded-3xl border border-[#EFECE6] p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.12)] transition-all duration-200 animate-in zoom-in-95 fade-in slide-in-from-bottom-2 z-10 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button (only if not persistent) */}
            {!modalState.persistent && !modalState.isLoading && (
              <button
                type="button"
                onClick={handleCancelClick}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-stone-50 hover:bg-stone-100 text-stone-400 hover:text-stone-700 grid place-items-center transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Icon + Title Header */}
            <div className="flex items-start gap-3.5 pr-6">
              <div
                className={`w-10 h-10 rounded-2xl grid place-items-center shrink-0 transition-transform ${getIconWrapperClasses()}`}
              >
                {renderIcon()}
              </div>

              <div className="space-y-1 min-w-0 flex-1 pt-0.5">
                <h3
                  id="admin-alert-title"
                  className="font-bold text-sm sm:text-base text-stone-900 leading-tight"
                >
                  {modalState.title}
                </h3>
                {modalState.description && (
                  <div
                    id="admin-alert-description"
                    className="text-xs text-stone-500 leading-relaxed break-words"
                  >
                    {modalState.description}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              {modalState.isConfirm && (
                <button
                  type="button"
                  onClick={handleCancelClick}
                  disabled={modalState.isLoading}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200/80 active:bg-stone-200 text-stone-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer text-center min-h-[42px]"
                >
                  {defaultCancelText()}
                </button>
              )}

              <button
                ref={confirmBtnRef}
                type="button"
                onClick={handleConfirmClick}
                disabled={modalState.isLoading}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all disabled:opacity-60 cursor-pointer min-h-[42px] ${getConfirmButtonClasses()}`}
              >
                {modalState.isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[2.5]" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{defaultConfirmText()}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminAlertContext.Provider>
  );
}

export function useAdminAlert() {
  const context = useContext(AdminAlertContext);
  if (!context) {
    throw new Error("useAdminAlert must be used within an AdminAlertProvider");
  }
  return context;
}
