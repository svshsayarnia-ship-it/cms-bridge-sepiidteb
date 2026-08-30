"use client";

import { useState } from "react";
import { addToCart, type CartProduct } from "../lib/cart";

export function AddToCartButton({ product }: { product: CartProduct }) {
  const [added, setAdded] = useState(false);
  return (
    <button className="sb-btn sb-btn--outline sb-add-to-cart" type="button" onClick={() => {
      addToCart(product);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1800);
    }} aria-live="polite">
      {added ? "به سبد اضافه شد" : "افزودن به سبد خرید"}
    </button>
  );
}
