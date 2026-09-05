"use client";

import { useEffect, useState } from "react";
import type { CompareProduct } from "../lib/compare";
import {
  addToCompare,
  isCompared,
  onCompareUpdated,
  readCompare,
  removeFromCompare,
} from "../lib/compare";

type CompareButtonProps = {
  product: CompareProduct;
  className?: string;
};

export function CompareButton({
  product,
  className = "sb-compare-button",
}: CompareButtonProps) {
  const [selected, setSelected] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sync = () => setSelected(isCompared(product.slug, readCompare()));
    sync();
    return onCompareUpdated(sync);
  }, [product.slug]);

  return (
    <div className="sb-compare-button-wrap">
      <button
        className={`${className}${selected ? " is-selected" : ""}`}
        type="button"
        aria-pressed={selected}
        onClick={() => {
          if (selected) {
            removeFromCompare(product.slug);
            setMessage("از مقایسه حذف شد");
            return;
          }

          const result = addToCompare(product);
          if (!result.ok && result.reason === "limit") {
            setMessage("حداکثر ۴ محصول را می‌توانید هم‌زمان مقایسه کنید.");
            return;
          }
          setMessage("به مقایسه اضافه شد");
        }}
      >
        {selected ? "✓ در مقایسه" : "مقایسه"}
      </button>
      <span className="sb-sr-only" aria-live="polite">{message}</span>
    </div>
  );
}
