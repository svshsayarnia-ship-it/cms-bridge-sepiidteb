"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { productHref } from "../catalog";
import type { PublicProduct } from "../lib/public-product";
import {
  getCompactBrandLabel,
  getPublicPackagingLabel,
  getPublicVolumeLabel,
} from "../lib/public-copy";
import { ArrowIcon } from "./Icons";
import { ProductVisual } from "./product/ProductVisual";
import { addToCart } from "../lib/cart";

const priceFormatter = new Intl.NumberFormat("fa-IR");
const productImageSizes = "(max-width: 1100px) 50vw, 33vw";

type PublicRoleImage = {
  src: string;
  alt: string;
};

type ProductImageRolesResponse = {
  cardImage: PublicRoleImage | null;
  variantImages: Record<string, PublicRoleImage>;
};

function numericPrice(value?: string | number): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function formatPrice(value: number): string {
  return `${priceFormatter.format(value)} تومان`;
}

export function ProductCard({
  product,
  priority = false,
}: {
  product: PublicProduct;
  priority?: boolean;
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
        setCardImage(data?.cardImage?.src ? data.cardImage : null);
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

  const href = productHref(product);
  const volume = getPublicVolumeLabel(product.volume);
  const brand = getCompactBrandLabel(product.brand);
  const packagingLabel = getPublicPackagingLabel(volume);
  const salePrice = numericPrice(product.salePrice);
  const regularPrice = numericPrice(
    product.regularPrice || product.price,
  );
  const visiblePrice =
    salePrice || regularPrice || numericPrice(product.priceToman);
  const cartProduct = {
    slug: product.slug,
    nameFa: product.nameFa,
    nameEn: product.nameEn,
    brand,
    image: displayProduct.image,
    volume,
    priceToman: visiblePrice ?? undefined,
  };

  return (
    <article className="sb-product-card" data-category={product.category}>
      <Link
        className="sb-product-card__visual"
        href={href}
        aria-label={`دیدن ${product.nameFa}`}
      >
        <ProductVisual
          product={displayProduct}
          variant="card"
          priority={priority}
          sizes={productImageSizes}
        />

        {displayProduct.imageKind === "editorial-family" && (
          <span className="sb-product-card__identity" aria-hidden="true">
            <small>{brand || "سپید بیوتی"}</small>
            <strong>{displayProduct.nameFa}</strong>
            {displayProduct.nameEn && <em>{displayProduct.nameEn}</em>}
          </span>
        )}

        {product.badge && (
          <span className="sb-product-card__badge">
            {product.badge}
          </span>
        )}

        <span className="sb-product-card__view">
          دیدن محصول
          <ArrowIcon />
        </span>
      </Link>

      <div className="sb-product-card__content">
        <div className="sb-product-card__meta">
          {brand && <span>{brand}</span>}
        </div>

        <Link href={href}>
          <h3>{product.nameFa}</h3>

          {product.nameEn && (
            <small>{product.nameEn}</small>
          )}
        </Link>

        {volume && (
          <div className="sb-product-card__facts">
            <span>{volume}</span>
            {packagingLabel && <span>{packagingLabel}</span>}
          </div>
        )}

        <div className="sb-product-card__footer">
          <div
            className={`sb-product-card__price${visiblePrice ? "" : " is-pending"}`}
            aria-label={`قیمت ${product.nameFa}`}
          >
            <span>{salePrice ? "قیمت ویژه" : "قیمت"}</span>
            {visiblePrice ? (
              <div>
                <strong>{formatPrice(visiblePrice)}</strong>
                {salePrice && regularPrice && salePrice < regularPrice
                  ? <del>{formatPrice(regularPrice)}</del>
                  : null}
              </div>
            ) : (
              <strong>قیمت را داخل محصول ببینید</strong>
            )}
          </div>
          <Link
            className="sb-product-card__cta"
            href={href}
            aria-label={`دیدن جزئیات ${product.nameFa}`}
          >
            <span>بیشتر ببینید</span>
            <ArrowIcon />
          </Link>
        </div>
        <button className="sb-product-card__cart" type="button" onClick={() => addToCart(cartProduct)}>
          افزودن به سبد خرید
        </button>
      </div>
    </article>
  );
}
