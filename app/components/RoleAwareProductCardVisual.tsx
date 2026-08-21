"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicProduct } from "../lib/public-product";
import { ProductVisual } from "./product/ProductVisual";

type PublicRoleImage = {
  src: string;
  alt: string;
};

type ProductImageRolesResponse = {
  cardImage: PublicRoleImage | null;
  variantImages: Record<string, PublicRoleImage>;
};

export function RoleAwareProductCardVisual({
  product,
  brand,
  priority,
  sizes,
}: {
  product: PublicProduct;
  brand: string;
  priority: boolean;
  sizes: string;
}) {
  const [cardImage, setCardImage] = useState<PublicRoleImage | null>(null);

  useEffect(() => {
    if (!product.slug) return;

    const controller = new AbortController();
    const query = new URLSearchParams({ slug: product.slug });

    void fetch(`/api/product-image-roles?${query.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as ProductImageRolesResponse;
      })
      .then((data) => {
        if (data?.cardImage?.src) setCardImage(data.cardImage);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("[product-card] role image load failed", error);
      });

    return () => controller.abort();
  }, [product.slug]);

  const displayProduct = useMemo<PublicProduct>(() => {
    if (!cardImage?.src) return product;

    return {
      ...product,
      image: cardImage.src,
      imageAlt: cardImage.alt || product.imageAlt,
      imageKind: "official",
    };
  }, [cardImage, product]);

  return (
    <>
      <ProductVisual
        product={displayProduct}
        variant="card"
        priority={priority}
        sizes={sizes}
      />

      {displayProduct.imageKind === "editorial-family" && (
        <span className="sb-product-card__identity" aria-hidden="true">
          <small>{brand || "سپید بیوتی"}</small>
          <strong>{displayProduct.nameFa}</strong>
          {displayProduct.nameEn && <em>{displayProduct.nameEn}</em>}
        </span>
      )}
    </>
  );
}
