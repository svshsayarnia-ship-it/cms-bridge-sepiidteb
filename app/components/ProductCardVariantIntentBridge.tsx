"use client";

import { useEffect } from "react";

/**
 * Variable product cards keep their explicit detail links, but a plain click on
 * the product visual should start the existing variant-selection flow instead
 * of navigating away. The selector itself stays owned by ProductCard, so this
 * bridge adds no second cart/price/variant implementation.
 */
export function ProductCardVariantIntentBridge() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const visualLink = target.closest<HTMLAnchorElement>(
        ".sb-product-card__visual",
      );
      if (!visualLink) return;

      const card = visualLink.closest<HTMLElement>(".sb-product-card");
      const variantTrigger = card?.querySelector<HTMLButtonElement>(
        '.sb-product-card__cart[aria-haspopup="dialog"]',
      );
      if (!variantTrigger || variantTrigger.disabled) return;

      event.preventDefault();
      variantTrigger.click();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
