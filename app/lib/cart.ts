"use client";

import { trackEcommerceEvent, trackGaEvent } from "./analytics";

export type CartProduct = {
  slug: string;
  nameFa: string;
  nameEn?: string;
  brand?: string;
  image: string;
  volume?: string;
  priceToman?: number;
};

export type CartItem = CartProduct & { quantity: number };
export type CartTarget = string | Pick<CartItem, "slug" | "volume">;

// Keep the existing storage key so current visitors do not lose saved items
// while the public experience moves from cart/checkout to assisted commerce.
const CART_KEY = "sepiid-beauty-cart-v2";
const CART_EVENT = "sepiid-cart-updated";

export function cartItemKey(item: Pick<CartItem, "slug" | "volume">) {
  return `${item.slug}::${item.volume ?? "default"}`;
}

function sameCartItem(item: CartItem, target: CartTarget) {
  if (typeof target === "string") {
    return cartItemKey(item) === target || item.slug === target;
  }
  return cartItemKey(item) === cartItemKey(target);
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];

    return value
      .filter((item) => item && typeof item.slug === "string" && Number(item.quantity) > 0)
      .map((item) => ({
        ...item,
        quantity: Math.min(99, Math.max(1, Math.trunc(Number(item.quantity)))),
        priceToman: Number(item.priceToman) > 0 ? Number(item.priceToman) : undefined,
      }));
  } catch {
    return [];
  }
}

function notify(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function addToCart(product: CartProduct, quantity = 1) {
  const safeQuantity = Math.max(1, quantity);
  const items = readCart();
  const existing = items.find((item) => cartItemKey(item) === cartItemKey(product));
  if (existing) existing.quantity = Math.min(99, existing.quantity + safeQuantity);
  else items.push({ ...product, quantity: safeQuantity });
  notify(items);

  // Preserve the legacy GA ecommerce event during the migration so existing
  // reports remain comparable, and add the product-specific inquiry event that
  // becomes the primary funnel signal for Assisted Commerce.
  trackEcommerceEvent("add_to_cart", [{ ...product, quantity: safeQuantity }]);
  trackGaEvent("inquiry_add", {
    item_id: product.slug,
    item_name: product.nameFa,
    item_brand: product.brand,
    item_variant: product.volume,
    quantity: safeQuantity,
  });
}

export function updateCartQuantity(target: CartTarget, quantity: number) {
  const before = readCart();
  const existing = before.find((item) => sameCartItem(item, target));
  const safeQuantity = Math.min(99, Math.max(0, Math.trunc(Number(quantity))));
  const next = before
    .map((item) => sameCartItem(item, target) ? { ...item, quantity: safeQuantity } : item)
    .filter((item) => item.quantity > 0);

  notify(next);

  if (!existing) return;
  const delta = safeQuantity - existing.quantity;
  if (delta > 0) {
    trackEcommerceEvent("add_to_cart", [{ ...existing, quantity: delta }]);
  } else if (delta < 0) {
    trackEcommerceEvent("remove_from_cart", [{ ...existing, quantity: Math.abs(delta) }]);
  }

  trackGaEvent("inquiry_quantity_change", {
    item_id: existing.slug,
    item_name: existing.nameFa,
    item_variant: existing.volume,
    previous_quantity: existing.quantity,
    quantity: safeQuantity,
  });
}

export function removeFromCart(target: CartTarget) {
  const items = readCart();
  const removed = items.filter((item) => sameCartItem(item, target));
  notify(items.filter((item) => !sameCartItem(item, target)));
  if (removed.length) {
    trackEcommerceEvent("remove_from_cart", removed);
    removed.forEach((item) => {
      trackGaEvent("inquiry_remove", {
        item_id: item.slug,
        item_name: item.nameFa,
        item_variant: item.volume,
        quantity: item.quantity,
      });
    });
  }
}

export function cartCount(items = readCart()) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function cartSubtotal(items = readCart()) {
  return items.reduce((total, item) => total + (item.priceToman ?? 0) * item.quantity, 0);
}

export function cartHasUnknownPrice(items = readCart()) {
  return items.some((item) => !item.priceToman || item.priceToman <= 0);
}

export function onCartUpdated(callback: () => void) {
  window.addEventListener(CART_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CART_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
