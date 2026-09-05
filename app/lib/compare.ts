"use client";

import type { PublicProduct } from "./public-product";
import { trackGaEvent } from "./analytics";

export type CompareProduct = Pick<
  PublicProduct,
  | "slug"
  | "nameFa"
  | "nameEn"
  | "brand"
  | "category"
  | "categoryTitle"
  | "image"
  | "imageAlt"
  | "volume"
  | "priceToman"
  | "price"
  | "regularPrice"
  | "salePrice"
  | "priceNote"
  | "sku"
  | "stockStatus"
  | "stockQuantity"
  | "manageStock"
  | "specs"
  | "features"
  | "audience"
  | "variantVolumes"
>;

const COMPARE_KEY = "sepiid-beauty-compare-v1";
const COMPARE_EVENT = "sepiid-compare-updated";
export const MAX_COMPARE_ITEMS = 4;

function sanitizeProduct(product: CompareProduct): CompareProduct {
  return {
    slug: product.slug,
    nameFa: product.nameFa,
    nameEn: product.nameEn,
    brand: product.brand,
    category: product.category,
    categoryTitle: product.categoryTitle,
    image: product.image,
    imageAlt: product.imageAlt,
    volume: product.volume,
    priceToman: product.priceToman,
    price: product.price,
    regularPrice: product.regularPrice,
    salePrice: product.salePrice,
    priceNote: product.priceNote,
    sku: product.sku,
    stockStatus: product.stockStatus,
    stockQuantity: product.stockQuantity,
    manageStock: product.manageStock,
    specs: product.specs,
    features: product.features,
    audience: product.audience,
    variantVolumes: product.variantVolumes,
  };
}

export function readCompare(): CompareProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(COMPARE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.slug === "string" && item.slug)
      .slice(0, MAX_COMPARE_ITEMS) as CompareProduct[];
  } catch {
    return [];
  }
}

function writeCompare(items: CompareProduct[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COMPARE_KEY, JSON.stringify(items.slice(0, MAX_COMPARE_ITEMS)));
  window.dispatchEvent(new CustomEvent(COMPARE_EVENT));
}

export function isCompared(slug: string, items = readCompare()) {
  return items.some((item) => item.slug === slug);
}

export function addToCompare(product: CompareProduct) {
  const items = readCompare();
  if (items.some((item) => item.slug === product.slug)) {
    return { ok: true as const, items, reason: "exists" as const };
  }
  if (items.length >= MAX_COMPARE_ITEMS) {
    return { ok: false as const, items, reason: "limit" as const };
  }

  const next = [...items, sanitizeProduct(product)];
  writeCompare(next);
  trackGaEvent("compare_add", {
    item_id: product.slug,
    item_name: product.nameFa,
    item_brand: product.brand,
    compare_count: next.length,
  });
  return { ok: true as const, items: next, reason: "added" as const };
}

export function removeFromCompare(slug: string) {
  const items = readCompare();
  const removed = items.find((item) => item.slug === slug);
  const next = items.filter((item) => item.slug !== slug);
  writeCompare(next);
  if (removed) {
    trackGaEvent("compare_remove", {
      item_id: removed.slug,
      item_name: removed.nameFa,
      compare_count: next.length,
    });
  }
  return next;
}

export function clearCompare() {
  writeCompare([]);
  trackGaEvent("compare_clear");
}

export function onCompareUpdated(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(COMPARE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(COMPARE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
