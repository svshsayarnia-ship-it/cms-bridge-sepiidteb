"use client";

import { trackEcommerceEvent } from "./analytics";

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
  trackEcommerceEvent("add_to_cart", [{ ...product, quantity: safeQuantity }]);
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
}

export function removeFromCart(target: CartTarget) {
  const items = readCart();
  const removed = items.filter((item) => sameCartItem(item, target));
  notify(items.filter((item) => !sameCartItem(item, target)));
  if (removed.length) trackEcommerceEvent("remove_from_cart", removed);
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
