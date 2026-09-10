"use client";

import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  Search,
  X,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Trash2,
  Eye,
  Loader2,
  ChevronDown,
  Filter,
  DollarSign,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { formatBDT } from "@/lib/format";
import type { LocalOrder } from "@/lib/types";

interface OrdersManagerProps {
  initialOrders: LocalOrder[];
}

type OrderStatus = "all" | "pending" | "confirmed" | "dispatched" | "delivered" | "cancelled";

export function OrdersManager({ initialOrders }: OrdersManagerProps) {
  const [orders, setOrders] = useState<LocalOrder[]>(initialOrders);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<LocalOrder | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (selectedStatus !== "all") {
        const normStatus = (order.status || "pending").toLowerCase();
        if (selectedStatus === "pending") {
          if (normStatus !== "pending" && normStatus !== "new") return false;
        } else if (normStatus !== selectedStatus) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesId = order.id.toLowerCase().includes(term);
        const matchesName = order.customer_name?.toLowerCase().includes(term);
        const matchesPhone = order.phone?.includes(term);
        const matchesCity = order.city?.toLowerCase().includes(term);
        if (!matchesId && !matchesName && !matchesPhone && !matchesCity) return false;
      }

      return true;
    });
  }, [orders, selectedStatus, searchTerm]);

  // Status metrics
  const pendingCount = orders.filter((o) => (o.status || "pending").toLowerCase() === "pending" || (o.status || "").toLowerCase() === "new").length;
  const confirmedCount = orders.filter((o) => (o.status || "").toLowerCase() === "confirmed").length;
  const deliveredCount = orders.filter((o) => (o.status || "").toLowerCase() === "delivered").length;
  const totalRevenue = orders
    .filter((o) => (o.status || "").toLowerCase() !== "cancelled")
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/admin/order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        toast.success(`Order status changed to ${newStatus}`);
      } else {
        toast.error(data.error || "Failed to update order status");
      }
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(`Are you sure you want to delete order #${orderId.slice(0, 8)}? This action cannot be undone.`)) {
      return;
    }

    setDeletingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/order?id=${orderId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null);
        }
        toast.success("Order deleted successfully");
      } else {
        toast.error(data.error || "Failed to delete order");
      }
    } catch {
      toast.error("Failed to delete order");
    } finally {
      setDeletingOrderId(null);
    }
  };

  const statusBadge = (status: string) => {
    const s = (status || "pending").toLowerCase();
    switch (s) {
      case "confirmed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "processing":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "dispatched":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Orders Management</span>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
              {orders.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            View customer details, ordered products, delivery zones, and manage fulfillment status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
            Total Revenue: <strong className="text-slate-900">{formatBDT(totalRevenue)}</strong>
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all" as const, label: "All", count: orders.length },
            { id: "pending" as const, label: "Pending", count: pendingCount },
            { id: "confirmed" as const, label: "Confirmed", count: confirmedCount },
            { id: "delivered" as const, label: "Delivered", count: deliveredCount },
            { id: "cancelled" as const, label: "Cancelled", count: orders.filter(o => (o.status || "").toLowerCase() === "cancelled").length },
          ].map((tab) => {
            const active = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id as OrderStatus)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? "bg-slate-950 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`ml-1.5 text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      active ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer, phone, ID..."
            className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-900"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Orders Table (Desktop) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider">
              <th className="pb-3 w-28">Order ID</th>
              <th className="pb-3">Date</th>
              <th className="pb-3">Customer</th>
              <th className="pb-3">Delivery Destination</th>
              <th className="pb-3">Items</th>
              <th className="pb-3">Total</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400 font-semibold">
                  No orders match your filter.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const dateStr = order.created_at
                  ? new Date(order.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Recent";

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-slate-900">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                      {dateStr}
                    </td>
                    <td className="py-3.5">
                      <div className="font-bold text-slate-900">{order.customer_name}</div>
                      <a
                        href={`tel:${order.phone}`}
                        className="text-[11px] text-slate-500 hover:text-slate-900 font-mono flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{order.phone}</span>
                      </a>
                    </td>
                    <td className="py-3.5">
                      <div className="text-slate-900 font-semibold">{order.city}</div>
                      <div className="text-slate-400 text-[11px] truncate max-w-[200px]">
                        {order.address}
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-600">
                      <span className="font-bold">{order.items?.length || 1}</span> item(s)
                    </td>
                    <td className="py-3.5 font-black text-slate-900 whitespace-nowrap">
                      {formatBDT(order.total)}
                    </td>
                    <td className="py-3.5">
                      <select
                        value={(order.status || "pending").toLowerCase()}
                        disabled={updatingOrderId === order.id}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className={`h-7 px-2 rounded-lg text-[11px] font-black uppercase tracking-wider border cursor-pointer ${statusBadge(
                          order.status || "pending"
                        )}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                          title="View order details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(order.id)}
                          disabled={deletingOrderId === order.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete order"
                        >
                          {deletingOrderId === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Orders Cards (Mobile & Tablet) */}
      <div className="lg:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No orders match your filter.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    #{order.id.slice(0, 8)}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    {order.customer_name}
                  </h3>
                  <a
                    href={`tel:${order.phone}`}
                    className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{order.phone}</span>
                  </a>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-slate-900">{formatBDT(order.total)}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {order.items?.length || 1} item(s)
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="truncate">
                  {order.city} {order.area ? `(${order.area})` : ""} - {order.address}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <select
                  value={(order.status || "pending").toLowerCase()}
                  disabled={updatingOrderId === order.id}
                  onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                  className={`h-7 px-2 rounded-lg text-[11px] font-black uppercase tracking-wider border cursor-pointer ${statusBadge(
                    order.status || "pending"
                  )}`}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(order.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Order Details
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  #{selectedOrder.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-200/80 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{selectedOrder.customer_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">Phone:</span>
                <a
                  href={`tel:${selectedOrder.phone}`}
                  className="font-mono font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>{selectedOrder.phone}</span>
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">City / Zone:</span>
                <span className="font-semibold text-slate-900">{selectedOrder.city}</span>
              </div>
              {selectedOrder.area && (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500">Area:</span>
                  <span className="font-semibold text-slate-900">{selectedOrder.area}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200/80">
                <span className="font-bold text-slate-500 block mb-0.5">Delivery Address:</span>
                <p className="text-slate-800 font-medium leading-relaxed">{selectedOrder.address}</p>
              </div>
              {selectedOrder.note && (
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="font-bold text-slate-500 block mb-0.5">Order Note:</span>
                  <p className="text-slate-700 italic">{selectedOrder.note}</p>
                </div>
              )}
            </div>

            {/* Ordered Items Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Ordered Items
              </span>
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between bg-white">
                    <div>
                      <div className="font-bold text-slate-900">{item.product_name}</div>
                      {item.variant_name && item.variant_name !== "Standard" && (
                        <div className="text-[11px] text-slate-400">Variant: {item.variant_name}</div>
                      )}
                      <div className="text-[11px] text-slate-500">
                        {formatBDT(item.unit_price)} × {item.quantity}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">{formatBDT(item.total)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatBDT(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee:</span>
                <span className="font-semibold">{formatBDT(selectedOrder.delivery_fee)}</span>
              </div>
              {Number(selectedOrder.discount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-semibold">-{formatBDT(selectedOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount (COD):</span>
                <span>{formatBDT(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Status Selector & Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Status:</span>
                <select
                  value={(selectedOrder.status || "pending").toLowerCase()}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                  className={`h-8 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer ${statusBadge(
                    selectedOrder.status || "pending"
                  )}`}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
