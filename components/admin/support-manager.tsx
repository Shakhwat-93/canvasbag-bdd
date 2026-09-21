"use client";

import React, { useState } from "react";
import { Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminAlert } from "@/components/admin/admin-alert-provider";
import type { SupportMessage } from "@/lib/types";

interface SupportManagerProps {
  initialSupportMessages: SupportMessage[];
}

export function SupportManager({ initialSupportMessages }: SupportManagerProps) {
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>(initialSupportMessages);
  const { confirmDelete, alert: showAlert } = useAdminAlert();

  const handleDeleteSupport = async (id: number | string, senderName?: string) => {
    const ok = await confirmDelete(
      senderName ? `message from ${senderName}` : "this support message",
      "Are you sure you want to remove this message from your support inbox?"
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/support?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSupportMessages((prev) => prev.filter((m) => m.id !== id));
        toast.success("Support message deleted");
      } else {
        await showAlert({
          title: "Delete Failed",
          description: data.error || "Failed to delete message",
          variant: "error",
        });
      }
    } catch {
      await showAlert({
        title: "Delete Failed",
        description: "Failed to connect to server.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-slate-150 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Support Messages</span>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
              {supportMessages.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Customer inquiries and queries submitted via the live store widget
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-150">
        {supportMessages.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-semibold">No messages in inbox.</div>
        ) : (
          supportMessages.map((m) => (
            <div key={m.id} className="py-4 flex items-start justify-between gap-4 text-left">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm text-slate-900">{m.name}</span>
                  <a
                    href={`tel:${m.phone}`}
                    className="text-xs font-mono font-bold text-[var(--primary)] flex items-center gap-1 hover:underline"
                  >
                    <Phone className="w-3 h-3" />
                    {m.phone}
                  </a>
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">{m.message}</p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {m.created_at ? new Date(m.created_at).toLocaleString() : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteSupport(m.id, m.name)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                title="Delete message"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
