"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Edit2, ExternalLink, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { LandingPage, Product } from "@/lib/types";

interface LandingPagesManagerProps {
  initialLandingPages: LandingPage[];
  initialProducts: Product[];
}

export function LandingPagesManager({
  initialLandingPages,
}: LandingPagesManagerProps) {
  const [landingPages, setLandingPages] = useState<LandingPage[]>(initialLandingPages);
  const [isLpModalOpen, setIsLpModalOpen] = useState(false);
  const [editingLp, setEditingLp] = useState<Partial<LandingPage> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSaveLandingPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLp?.id && !editingLp?.title) {
      toast.error("Slug and title are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingLp),
      });
      const data = await res.json();
      if (data.success && data.landingPage) {
        setLandingPages((prev) => {
          const idx = prev.findIndex((lp) => lp.id === data.landingPage.id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = data.landingPage;
            return updated;
          }
          return [data.landingPage, ...prev];
        });
        toast.success("Landing page saved successfully");
        setIsLpModalOpen(false);
      } else {
        toast.error(data.error || "Failed to save landing page");
      }
    } catch {
      toast.error("Failed to save landing page");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLandingPage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this landing page?")) return;
    try {
      const res = await fetch(`/api/admin/landing-page?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setLandingPages((prev) => prev.filter((lp) => lp.id !== id && lp.slug !== id));
        toast.success("Landing page deleted");
      } else {
        toast.error(data.error || "Failed to delete landing page");
      }
    } catch {
      toast.error("Failed to delete landing page");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Landing Pages</span>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
              {landingPages.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Promotional landing pages and custom domain bindings
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingLp({ id: "", title: "", custom_domain: "", components: [] });
            setIsLpModalOpen(true);
          }}
          className="bg-primary-gradient text-[var(--primary-foreground)] hover:opacity-90 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Landing Page
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider">
              <th className="pb-3">Title</th>
              <th className="pb-3">URL Path</th>
              <th className="pb-3">Custom Domain</th>
              <th className="pb-3">Components</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {landingPages.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                  No landing pages created yet.
                </td>
              </tr>
            ) : (
              landingPages.map((lp) => (
                <tr key={lp.id || lp.slug} className="hover:bg-slate-50/50">
                  <td className="py-3 font-bold text-slate-900">{lp.title}</td>
                  <td className="py-3">
                    <Link
                      href={`/lp/${lp.slug || lp.id}`}
                      target="_blank"
                      className="text-[var(--primary)] hover:underline font-mono flex items-center gap-1"
                    >
                      /lp/{lp.slug || lp.id}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="py-3 font-semibold text-slate-600">{lp.custom_domain || "—"}</td>
                  <td className="py-3 font-semibold text-slate-500">{lp.components?.length || 0} sections</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLp(lp);
                          setIsLpModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Edit landing page"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLandingPage(lp.id || lp.slug || "")}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Delete landing page"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isLpModalOpen && editingLp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-900">
                {editingLp.id ? "Edit Landing Page" : "Add Landing Page"}
              </h3>
              <button
                type="button"
                onClick={() => setIsLpModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLandingPage} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700">Title *</label>
                <input
                  type="text"
                  required
                  value={editingLp.title || ""}
                  onChange={(e) => setEditingLp({ ...editingLp, title: e.target.value })}
                  placeholder="e.g. Travel Bag Special Offer"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Slug (URL Path)</label>
                <input
                  type="text"
                  value={editingLp.slug || editingLp.id || ""}
                  onChange={(e) => setEditingLp({ ...editingLp, slug: e.target.value, id: e.target.value })}
                  placeholder="e.g. travel-bag-offer"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Custom Domain</label>
                <input
                  type="text"
                  value={editingLp.custom_domain || ""}
                  onChange={(e) => setEditingLp({ ...editingLp, custom_domain: e.target.value })}
                  placeholder="e.g. travel.canvasbagbd.com"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLpModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-black text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/90 cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Landing Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
