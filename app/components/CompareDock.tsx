"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { PublicProduct } from "../lib/public-product";
import {
  addToCompare,
  isCompared,
  onCompareUpdated,
  readCompare,
  removeFromCompare,
} from "../lib/compare";

export function CompareDock({ products }: { products: PublicProduct[] }) {
  const pathname = usePathname();
  const [items, setItems] = useState(() => readCompare());
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sync = () => setItems(readCompare());
    sync();
    return onCompareUpdated(sync);
  }, []);

  const currentProduct = useMemo(() => {
    const match = pathname.match(/^\/product\/([^/?#]+)/u);
    if (!match) return null;
    const slug = decodeURIComponent(match[1]);
    return products.find((product) => product.slug === slug) ?? null;
  }, [pathname, products]);

  const currentSelected = currentProduct
    ? isCompared(currentProduct.slug, items)
    : false;

  if (!currentProduct && items.length === 0) return null;

  return (
    <aside className="sb-compare-dock" aria-label="مقایسه محصولات">
      {currentProduct && (
        <button
          className={`sb-compare-dock__add${currentSelected ? " is-selected" : ""}`}
          type="button"
          aria-pressed={currentSelected}
          onClick={() => {
            if (currentSelected) {
              removeFromCompare(currentProduct.slug);
              setMessage("از مقایسه حذف شد");
              return;
            }
            const result = addToCompare(currentProduct);
            if (!result.ok) {
              setMessage("برای افزودن محصول جدید، یکی از ۴ محصول مقایسه را حذف کنید.");
              return;
            }
            setMessage("این محصول به مقایسه اضافه شد");
          }}
        >
          {currentSelected ? "✓ این محصول در مقایسه است" : "+ افزودن این محصول به مقایسه"}
        </button>
      )}

      {items.length > 0 && (
        <Link className="sb-compare-dock__open" href="/compare">
          <span>مقایسه</span>
          <strong>{items.length}</strong>
          <small>از ۴ محصول</small>
        </Link>
      )}
      <span className="sb-sr-only" aria-live="polite">{message}</span>
    </aside>
  );
}
