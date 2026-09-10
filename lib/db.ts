import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { LocalOrder, LocalOrderItem, ProductReview, SupportMessage } from "@/lib/types";

let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
  if (!dbInstance) {
    let dbPath = path.resolve(process.cwd(), "database/database.sqlite");

    // In Vercel serverless environment, copy to /tmp to avoid read-only filesystem restrictions
    if (process.env.VERCEL) {
      try {
        const tmpDbPath = "/tmp/database.sqlite";
        if (!fs.existsSync(tmpDbPath) && fs.existsSync(dbPath)) {
          fs.copyFileSync(dbPath, tmpDbPath);
        }
        if (fs.existsSync(tmpDbPath)) {
          dbPath = tmpDbPath;
        }
      } catch (e) {
        console.warn("[Local DB] Could not copy database to /tmp on Vercel:", e);
      }
    }

    try {
      dbInstance = new Database(dbPath);
      if (!process.env.VERCEL) {
        dbInstance.pragma("journal_mode = WAL");
      }
    } catch (err) {
      console.warn("[Local DB] Failed to open in readwrite mode, attempting readonly:", err);
      try {
        dbInstance = new Database(dbPath, { readonly: true });
      } catch (e2) {
        console.error("[Local DB] Critical: Could not open database:", e2);
        throw e2;
      }
    }
  }
  return dbInstance;
}

/* ──────────────────────────────────────────────────────────
   ORDERS & ORDER ITEMS
   ────────────────────────────────────────────────────────── */

export function createLocalOrder(
  order: Omit<LocalOrder, "items">,
  items: Array<{
    productId?: string;
    variantId?: string;
    name: string;
    variantName?: string;
    price: number;
    quantity: number;
  }>
): boolean {
  const db = getDb();
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, customer_name, phone, city, area, address, note,
      status, payment_method, subtotal, delivery_fee, discount,
      total, attribution, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  const insertItem = db.prepare(`
    INSERT INTO order_items (
      order_id, product_id, variant_id, product_name, variant_name,
      unit_price, quantity, total
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  const transaction = db.transaction(() => {
    insertOrder.run(
      order.id,
      order.customer_name,
      order.phone,
      order.city,
      order.area,
      order.address,
      order.note || null,
      order.status || "pending",
      order.payment_method || "cod",
      order.subtotal,
      order.delivery_fee || 0,
      order.discount || 0,
      order.total,
      order.attribution ? JSON.stringify(order.attribution) : null,
      order.created_at || new Date().toISOString()
    );

    for (const item of items) {
      insertItem.run(
        order.id,
        item.productId || "",
        item.variantId || "standard",
        item.name,
        item.variantName || "Standard",
        Number(item.price),
        Number(item.quantity || 1),
        Number(item.price) * Number(item.quantity || 1)
      );
    }
  });

  try {
    transaction();
    return true;
  } catch (e) {
    console.error("[Local DB] Failed to insert order:", e);
    return false;
  }
}

export const insertLocalOrder = createLocalOrder;

export function getLocalOrderById(orderId: string): LocalOrder | null {
  const db = getDb();
  try {
    const orderRow = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as any;
    if (!orderRow) return null;

    const itemRows = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId) as LocalOrderItem[];

    return {
      id: orderRow.id,
      customer_name: orderRow.customer_name,
      phone: orderRow.phone,
      city: orderRow.city,
      area: orderRow.area,
      address: orderRow.address,
      note: orderRow.note,
      status: orderRow.status,
      payment_method: orderRow.payment_method,
      subtotal: Number(orderRow.subtotal),
      delivery_fee: Number(orderRow.delivery_fee),
      discount: Number(orderRow.discount),
      total: Number(orderRow.total),
      attribution: orderRow.attribution ? JSON.parse(orderRow.attribution) : undefined,
      created_at: orderRow.created_at,
      items: itemRows,
    };
  } catch (e) {
    console.error(`[Local DB] Error getting order ${orderId}:`, e);
    return null;
  }
}

export function getLocalOrdersByPhone(phone: string): LocalOrder[] {
  const db = getDb();
  try {
    const digits = phone.replace(/\D/g, "");
    if (!digits || digits.length < 4) return [];

    const last11 = digits.length >= 11 ? digits.slice(-11) : digits;
    const orderRows = db
      .prepare(
        "SELECT * FROM orders WHERE phone LIKE ? OR phone LIKE ? ORDER BY created_at DESC"
      )
      .all(`%${last11}`, `%${digits}`) as any[];

    return orderRows.map((orderRow) => {
      const itemRows = db
        .prepare("SELECT * FROM order_items WHERE order_id = ?")
        .all(orderRow.id) as LocalOrderItem[];

      return {
        id: orderRow.id,
        customer_name: orderRow.customer_name,
        phone: orderRow.phone,
        city: orderRow.city,
        area: orderRow.area,
        address: orderRow.address,
        note: orderRow.note,
        status: orderRow.status,
        payment_method: orderRow.payment_method,
        subtotal: Number(orderRow.subtotal),
        delivery_fee: Number(orderRow.delivery_fee),
        discount: Number(orderRow.discount),
        total: Number(orderRow.total),
        attribution: orderRow.attribution ? JSON.parse(orderRow.attribution) : undefined,
        created_at: orderRow.created_at,
        items: itemRows,
      };
    });
  } catch (e) {
    console.error("[Local DB] Error getting orders by phone:", e);
    return [];
  }
}

export function getAllLocalOrders(): LocalOrder[] {
  const db = getDb();
  try {
    const orderRows = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all() as any[];
    return orderRows.map((row) => {
      const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(row.id) as LocalOrderItem[];
      return {
        id: row.id,
        customer_name: row.customer_name,
        phone: row.phone,
        city: row.city,
        area: row.area,
        address: row.address,
        note: row.note,
        status: row.status,
        payment_method: row.payment_method,
        subtotal: Number(row.subtotal),
        delivery_fee: Number(row.delivery_fee),
        discount: Number(row.discount),
        total: Number(row.total),
        attribution: row.attribution ? JSON.parse(row.attribution) : undefined,
        created_at: row.created_at,
        items,
      };
    });
  } catch (e) {
    console.error("[Local DB] Error getting all orders:", e);
    return [];
  }
}

export function updateLocalOrderStatus(orderId: string, status: string): boolean {
  const db = getDb();
  try {
    const localStatusMap: Record<string, string> = {
      new: "pending",
      pending: "pending",
      confirmed: "confirmed",
      dispatched: "dispatched",
      delivered: "delivered",
      cancelled: "cancelled",
    };
    const mapped = localStatusMap[status.toLowerCase()] || "pending";
    const res = db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(mapped, orderId);
    return res.changes > 0;
  } catch (e) {
    console.error(`[Local DB] Error updating order status ${orderId}:`, e);
    return false;
  }
}

export function deleteLocalOrder(orderId: string): boolean {
  const db = getDb();
  try {
    db.prepare("DELETE FROM order_items WHERE order_id = ?").run(orderId);
    const res = db.prepare("DELETE FROM orders WHERE id = ?").run(orderId);
    return res.changes > 0;
  } catch (e) {
    console.error(`[Local DB] Error deleting order ${orderId}:`, e);
    return false;
  }
}

/* ──────────────────────────────────────────────────────────
   REVIEWS
   ────────────────────────────────────────────────────────── */

export function getApprovedReviews(productId: string): ProductReview[] {
  const db = getDb();
  try {
    const rows = db
      .prepare("SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC")
      .all(productId) as any[];

    return rows.map((r) => ({
      id: r.id,
      product_id: r.product_id,
      product_name: r.product_name,
      name: r.customer_name,
      customer_name: r.customer_name,
      rating: Number(r.rating),
      comment: r.comment,
      quote: r.comment,
      status: r.status,
      date: r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
      created_at: r.created_at,
    }));
  } catch (e) {
    console.error("[Local DB] Error getting approved reviews:", e);
    return [];
  }
}

export function getAllReviews(): ProductReview[] {
  const db = getDb();
  try {
    const rows = db.prepare("SELECT * FROM reviews ORDER BY created_at DESC").all() as any[];
    return rows.map((r) => ({
      id: r.id,
      product_id: r.product_id,
      product_name: r.product_name,
      customer_name: r.customer_name,
      name: r.customer_name,
      rating: Number(r.rating),
      comment: r.comment,
      status: r.status,
      created_at: r.created_at,
    }));
  } catch (e) {
    console.error("[Local DB] Error getting all reviews:", e);
    return [];
  }
}

export function createReview(data: {
  product_id: string;
  product_name: string;
  customer_name: string;
  rating: number;
  comment: string;
}): boolean {
  const db = getDb();
  try {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO reviews (product_id, product_name, customer_name, rating, comment, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(data.product_id, data.product_name, data.customer_name, data.rating, data.comment, now, now);
    return true;
  } catch (e) {
    console.error("[Local DB] Error creating review:", e);
    return false;
  }
}

export function approveReview(id: number | string): boolean {
  const db = getDb();
  try {
    const now = new Date().toISOString();
    const res = db.prepare("UPDATE reviews SET status = 'approved', updated_at = ? WHERE id = ?").run(now, id);
    return res.changes > 0;
  } catch (e) {
    console.error(`[Local DB] Error approving review ${id}:`, e);
    return false;
  }
}

export function deleteReview(id: number | string): boolean {
  const db = getDb();
  try {
    const res = db.prepare("DELETE FROM reviews WHERE id = ?").run(id);
    return res.changes > 0;
  } catch (e) {
    console.error(`[Local DB] Error deleting review ${id}:`, e);
    return false;
  }
}

export function getProductAllReviews(productId: string): ProductReview[] {
  const db = getDb();
  try {
    const rows = db
      .prepare("SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC")
      .all(productId) as any[];

    return rows.map((r) => ({
      id: r.id,
      product_id: r.product_id,
      product_name: r.product_name,
      name: r.customer_name,
      customer_name: r.customer_name,
      rating: Number(r.rating),
      comment: r.comment,
      quote: r.comment,
      status: r.status,
      date: r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
      created_at: r.created_at,
    }));
  } catch (e) {
    console.error("[Local DB] Error getting product all reviews:", e);
    return [];
  }
}

export function calculateProductRatingStats(productId: string): { rating: number; reviewCount: number } {
  const db = getDb();
  try {
    const row = db.prepare(`
      SELECT AVG(rating) as avgRating, COUNT(*) as totalCount
      FROM reviews
      WHERE product_id = ? AND status = 'approved'
    `).get(productId) as { avgRating: number | null; totalCount: number } | undefined;

    const count = row?.totalCount || 0;
    const avg = row?.avgRating ? Math.round(row.avgRating * 10) / 10 : 5.0;

    return {
      rating: count > 0 ? avg : 5.0,
      reviewCount: count,
    };
  } catch (e) {
    console.error(`[Local DB] Error calculating rating stats for ${productId}:`, e);
    return { rating: 5.0, reviewCount: 0 };
  }
}

export function syncProductReviews(
  productId: string,
  productName: string,
  reviews: Array<{
    id?: number | string;
    customer_name?: string;
    name?: string;
    rating: number;
    comment?: string;
    status?: "pending" | "approved";
    created_at?: string;
  }>
): { rating: number; reviewCount: number } {
  const db = getDb();
  const now = new Date().toISOString();

  const syncTx = db.transaction(() => {
    // 1. Fetch current DB reviews for this product
    const existing = db.prepare("SELECT id FROM reviews WHERE product_id = ?").all(productId) as { id: number }[];
    const existingIds = new Set(existing.map((r) => r.id));

    // Keep track of IDs that remain
    const keptIds = new Set<number>();

    const insertStmt = db.prepare(`
      INSERT INTO reviews (product_id, product_name, customer_name, rating, comment, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStmt = db.prepare(`
      UPDATE reviews
      SET product_name = ?, customer_name = ?, rating = ?, comment = ?, status = ?, updated_at = ?
      WHERE id = ?
    `);

    for (const r of reviews) {
      const custName = (r.customer_name || r.name || "Verified Customer").trim();
      const ratingVal = Math.min(5, Math.max(1, Number(r.rating) || 5));
      const commentVal = (r.comment || "").trim();
      const statusVal = r.status === "pending" ? "pending" : "approved";
      const createdAtVal = r.created_at || now;

      const numId = typeof r.id === "number" ? r.id : Number(r.id);

      if (!isNaN(numId) && numId > 0 && existingIds.has(numId)) {
        updateStmt.run(productName, custName, ratingVal, commentVal, statusVal, now, numId);
        keptIds.add(numId);
      } else {
        const res = insertStmt.run(productId, productName, custName, ratingVal, commentVal, statusVal, createdAtVal, now);
        if (typeof res.lastInsertRowid === "number") {
          keptIds.add(Number(res.lastInsertRowid));
        }
      }
    }

    // Delete reviews removed by admin
    for (const oldId of existingIds) {
      if (!keptIds.has(oldId)) {
        db.prepare("DELETE FROM reviews WHERE id = ?").run(oldId);
      }
    }
  });

  try {
    syncTx();
  } catch (err) {
    console.error(`[Local DB] Error syncing product reviews for ${productId}:`, err);
  }

  return calculateProductRatingStats(productId);
}

/* ──────────────────────────────────────────────────────────
   SUPPORT MESSAGES
   ────────────────────────────────────────────────────────── */

export function getAllSupportMessages(): SupportMessage[] {
  const db = getDb();
  try {
    return db.prepare("SELECT * FROM support_messages ORDER BY created_at DESC").all() as SupportMessage[];
  } catch (e) {
    console.error("[Local DB] Error getting support messages:", e);
    return [];
  }
}

export function createSupportMessage(data: { name: string; phone: string; message: string }): boolean {
  const db = getDb();
  try {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO support_messages (name, phone, message, status, created_at, updated_at)
      VALUES (?, ?, ?, 'new', ?, ?)
    `).run(data.name, data.phone, data.message, now, now);
    return true;
  } catch (e) {
    console.error("[Local DB] Error creating support message:", e);
    return false;
  }
}

export function deleteSupportMessage(id: number | string): boolean {
  const db = getDb();
  try {
    const res = db.prepare("DELETE FROM support_messages WHERE id = ?").run(id);
    return res.changes > 0;
  } catch (e) {
    console.error(`[Local DB] Error deleting support message ${id}:`, e);
    return false;
  }
}