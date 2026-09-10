"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import type { CartItem } from "@/lib/types";
import { toBanglaDigits } from "@/lib/format";
import { trackClientEvent } from "@/lib/analytics";
import { toast } from "sonner";

const STORAGE_KEY = "canvasbag-cart";

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  itemCount: number;
  subtotal: number;
  banglaItemCount: string;
  banglaSubtotal: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(
            parsed.map((item) => ({
              ...item,
              image: item.image && item.image !== "null" && item.image !== "undefined" ? item.image : "/brand/logo.webp",
            }))
          );
        }
      }
    } catch (e) {
      console.error("Failed to load cart from storage:", e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to write cart to storage:", e);
    }
  }, [items, isInitialized]);

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const qty = item.quantity || 1;
    const cleanImage = item.image && item.image !== "null" && item.image !== "undefined" ? item.image : "/brand/logo.webp";

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.min(updated[existingIndex].quantity + qty, 10);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          image: updated[existingIndex].image || cleanImage,
        };
        return updated;
      }

      return [
        ...prev,
        {
          productId: item.productId,
          slug: item.slug,
          name: item.name,
          db_product_name: item.db_product_name,
          price: item.price,
          compareAtPrice: item.compareAtPrice,
          variantId: item.variantId || "standard",
          variantName: item.variantName || "Standard",
          image: cleanImage,
          quantity: qty,
        },
      ];
    });

    trackClientEvent("add_to_cart", {
      value: item.price * qty,
      items: [
        {
          item_id: item.productId,
          item_name: item.name,
          item_brand: "CanvasBag",
          item_variant: item.variantName || "Standard",
          price: item.price,
          quantity: qty,
        },
      ],
    });

    toast.success("Added to Cart", {
      description: `${item.name} (${item.variantName || "Standard"}) added successfully.`,
    });
  }, []);

  const removeItem = useCallback((productId: string, variantId: string) => {
    setItems((prev) => {
      const removedItem = prev.find((i) => i.productId === productId && i.variantId === variantId);
      if (removedItem) {
        trackClientEvent("remove_from_cart", {
          value: removedItem.price * removedItem.quantity,
          items: [
            {
              item_id: removedItem.productId,
              item_name: removedItem.name,
              item_brand: "CanvasBag",
              item_variant: removedItem.variantName || "Standard",
              price: removedItem.price,
              quantity: removedItem.quantity,
            },
          ],
        });
        toast.info("Removed from Cart", {
          description: `${removedItem.name} removed.`,
        });
      }
      return prev.filter((i) => !(i.productId === productId && i.variantId === variantId));
    });
  }, []);

  const updateQuantity = useCallback((productId: string, variantId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId && i.variantId === variantId) {
          return {
            ...i,
            quantity: Math.min(Math.max(quantity, 1), 10),
          };
        }
        return i;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems((prev) => (prev.length === 0 ? prev : []));
  }, []);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const banglaItemCount = useMemo(() => toBanglaDigits(itemCount), [itemCount]);
  const banglaSubtotal = useMemo(() => toBanglaDigits(subtotal), [subtotal]);

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isCartOpen,
      setIsCartOpen,
      itemCount,
      subtotal,
      banglaItemCount,
      banglaSubtotal,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isCartOpen,
      itemCount,
      subtotal,
      banglaItemCount,
      banglaSubtotal,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}