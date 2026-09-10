"use client";

import React, { useState } from "react";
import { Star, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ProductReview } from "@/lib/types";

interface ReviewsManagerProps {
  initialReviews: ProductReview[];
}

export function ReviewsManager({ initialReviews }: ReviewsManagerProps) {
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);

  const handleApproveReview = async (id: number | string) => {
    try {
      const res = await fetch("/api/admin/review", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
        );
        toast.success("Review approved successfully");
      } else {
        toast.error(data.error || "Failed to approve review");
      }
    } catch {
      toast.error("Failed to approve review");
    }
  };

  const handleDeleteReview = async (id: number | string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await fetch(`/api/admin/review?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        toast.success("Review deleted");
      } else {
        toast.error(data.error || "Failed to delete review");
      }
    } catch {
      toast.error("Failed to delete review");
    }
  };

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-slate-150 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Reviews Moderation</span>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
              {reviews.length} Total
            </span>
            {pendingCount > 0 && (
              <span className="text-xs bg-amber-500 text-white font-bold px-2.5 py-0.5 rounded-full">
                {pendingCount} Pending
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Approve or delete customer testimonials and star ratings
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-150">
        {reviews.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-semibold">No reviews submitted yet.</div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="py-4 flex items-start justify-between gap-4 text-left">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-900">{r.customer_name}</span>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      r.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {r.status || "pending"}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">{r.product_name || r.product_id}</span>
                </div>

                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < (r.rating || 5) ? "fill-current text-amber-400" : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs text-slate-700 font-medium leading-relaxed">{r.comment}</p>
              </div>

              <div className="flex items-center gap-2">
                {r.status !== "approved" && (
                  <button
                    type="button"
                    onClick={() => r.id && handleApproveReview(r.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase rounded-lg cursor-pointer flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => r.id && handleDeleteReview(r.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                  title="Delete review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
