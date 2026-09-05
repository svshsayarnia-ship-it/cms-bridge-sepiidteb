"use client";

import { useState } from "react";
import { addToCart, type CartProduct } from "../lib/cart";

type AddToCartButtonProps = {
  product: CartProduct;
  className?: string;
  label?: string;
  addedLabel?: string;
};

export function AddToCartButton({
  product,
  className = "sb-btn sb-btn--dark sb-add-to-cart",
  label = "استعلام قیمت و موجودی امروز",
  addedLabel = "به لیست استعلام اضافه شد",
}: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);

  return (
    <button
      className={className}
      type="button"
      onClick={() => {
        addToCart(product);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }}
      aria-live="polite"
    >
      {added ? addedLabel : label}
    </button>
  );
}
