"use client";

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
const CART_KEY = "sepiid-beauty-cart-v2";
const CART_EVENT = "sepiid-cart-updated";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item) => item && typeof item.slug === "string" && item.quantity > 0)
      : [];
  } catch {
    return [];
  }
}

function notify(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function addToCart(product: CartProduct, quantity = 1) {
  const items = readCart();
  const existing = items.find((item) => item.slug === product.slug && item.volume === product.volume);
  if (existing) existing.quantity += quantity;
  else items.push({ ...product, quantity });
  notify(items);
}

export function updateCartQuantity(slug: string, quantity: number) {
  notify(readCart().map((item) => item.slug === slug ? { ...item, quantity } : item).filter((item) => item.quantity > 0));
}

export function removeFromCart(slug: string) {
  notify(readCart().filter((item) => item.slug !== slug));
}

export function cartCount(items = readCart()) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function onCartUpdated(callback: () => void) {
  window.addEventListener(CART_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CART_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
