"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onCompareUpdated, readCompare } from "../lib/compare";

export function CompareDock() {
  const [items, setItems] = useState(() => readCompare());

  useEffect(() => {
    const sync = () => setItems(readCompare());
    sync();
    return onCompareUpdated(sync);
  }, []);

  if (items.length === 0) return null;

  return (
    <aside className="sb-compare-dock" aria-label="مقایسه محصولات">
      <Link className="sb-compare-dock__open" href="/compare">
        <span>مقایسه</span>
        <strong>{items.length}</strong>
        <small>از ۴ محصول</small>
      </Link>
    </aside>
  );
}
