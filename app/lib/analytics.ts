"use client";

export type AnalyticsItem = {
  slug: string;
  nameFa: string;
  brand?: string;
  category?: string;
  volume?: string;
  priceToman?: number;
  quantity?: number;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const TOMAN_TO_RIAL = 10;

export function getGaMeasurementId() {
  return (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "").trim();
}

export function trackGaEvent(
  name: string,
  params: Record<string, unknown> = {},
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("event", name, params);
}

export function toGaItem(item: AnalyticsItem, index = 0) {
  const priceToman = Number(item.priceToman);
  const priceRial = Number.isFinite(priceToman) && priceToman > 0
    ? Math.round(priceToman * TOMAN_TO_RIAL)
    : undefined;

  return {
    item_id: item.slug,
    item_name: item.nameFa,
    item_brand: item.brand || undefined,
    item_category: item.category || undefined,
    item_variant: item.volume || undefined,
    price: priceRial,
    quantity: Math.max(1, Number(item.quantity) || 1),
    index,
  };
}

export function ecommerceValueRial(items: AnalyticsItem[]) {
  return items.reduce((total, item) => {
    const priceToman = Number(item.priceToman);
    const quantity = Math.max(1, Number(item.quantity) || 1);
    return total + (Number.isFinite(priceToman) && priceToman > 0
      ? priceToman * TOMAN_TO_RIAL * quantity
      : 0);
  }, 0);
}

export function trackEcommerceEvent(
  name: "add_to_cart" | "remove_from_cart" | "view_cart" | "begin_checkout",
  items: AnalyticsItem[],
) {
  if (!items.length) return;

  const value = ecommerceValueRial(items);
  trackGaEvent(name, {
    currency: "IRR",
    ...(value > 0 ? { value } : {}),
    items: items.map((item, index) => toGaItem(item, index)),
  });
}
