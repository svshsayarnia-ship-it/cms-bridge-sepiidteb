"use client";

import { useEffect, useState } from "react";

import {
  ProductVisual,
  type ProductVisualProduct,
} from "./product/ProductVisual";

type PublicRoleImage = {
  src: string;
  alt: string;
};

type ProductImageRoleResponse = {
  cardImage: PublicRoleImage | null;
};

export function CategoryPreviewVisual({
  product,
}: {
  product: ProductVisualProduct;
}) {
  const [roleImage, setRoleImage] = useState<PublicRoleImage | null>(null);

  useEffect(() => {
    if (!product.slug) return;

    let active = true;
    const query = new URLSearchParams({ slug: product.slug });

    void fetch(`/api/product-image-roles?${query.toString()}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Category image failed with ${response.status}`);
        return (await response.json()) as ProductImageRoleResponse;
      })
      .then((data) => {
        if (active) setRoleImage(data.cardImage ?? null);
      })
      .catch(() => {
        // The category card stays empty rather than falling back to Woo or a
        // checked-in placeholder when CMS media is unavailable.
      });

    return () => {
      active = false;
    };
  }, [product.slug]);

  const displayProduct = roleImage?.src
    ? {
        ...product,
        image: roleImage.src,
        masterImage: roleImage.src,
        imageAlt: roleImage.alt || product.imageAlt,
      }
    : product;

  return (
    <ProductVisual
      decorative
      product={displayProduct}
      sizes="64px"
      variant="thumbnail"
    />
  );
}
