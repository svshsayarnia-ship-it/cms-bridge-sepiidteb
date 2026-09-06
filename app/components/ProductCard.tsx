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

type ProductImageRolesBatchResponse = {
  cardImages: Record<string, PublicRoleImage | null>;
};

type CardImageListener = (image: PublicRoleImage | null) => void;

const cardImageCache = new Map<string, PublicRoleImage | null>();
const cardImageListeners = new Map<string, Set<CardImageListener>>();
const queuedCardImageSlugs = new Set<string>();
const inFlightCardImageSlugs = new Set<string>();
let cardImageBatchTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleCardImageBatch() {
  if (cardImageBatchTimer !== null) return;

  cardImageBatchTimer = setTimeout(() => {
    cardImageBatchTimer = null;
    void flushCardImageBatch();
  }, 0);
}

async function flushCardImageBatch() {
  const slugs = Array.from(queuedCardImageSlugs).slice(0, 100);
  if (!slugs.length) return;

  for (const slug of slugs) {
    queuedCardImageSlugs.delete(slug);
    inFlightCardImageSlugs.add(slug);
  }

  if (queuedCardImageSlugs.size) scheduleCardImageBatch();

  try {
    const query = new URLSearchParams({ slugs: slugs.join(",") });
    const response = await fetch(`/api/product-image-roles?${query.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Role image batch failed with ${response.status}`);
    }

    const data = (await response.json()) as ProductImageRolesBatchResponse;

    for (const slug of slugs) {
      const image = Object.prototype.hasOwnProperty.call(data.cardImages, slug)
        ? data.cardImages[slug]
        : null;
      cardImageCache.set(slug, image);
      inFlightCardImageSlugs.delete(slug);

      const listeners = cardImageListeners.get(slug);
      listeners?.forEach((listener) => listener(image));
      cardImageListeners.delete(slug);
    }
  } catch (error) {
    console.warn("[product-card] role image batch load failed", error);

    for (const slug of slugs) {
      inFlightCardImageSlugs.delete(slug);
      cardImageListeners.delete(slug);
    }
  }
}

function subscribeToCardRoleImage(slug: string, listener: CardImageListener) {
  if (cardImageCache.has(slug)) {
    listener(cardImageCache.get(slug) ?? null);
    return () => undefined;
  }

  const listeners = cardImageListeners.get(slug) ?? new Set<CardImageListener>();
  listeners.add(listener);
  cardImageListeners.set(slug, listeners);

  if (!inFlightCardImageSlugs.has(slug)) {
    queuedCardImageSlugs.add(slug);
    scheduleCardImageBatch();
  }

  return () => {
    const current = cardImageListeners.get(slug);
    current?.delete(listener);
    if (current?.size === 0) cardImageListeners.delete(slug);
  };
}

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
    return subscribeToCardRoleImage(product.slug, setCardImage);
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
              <strong>برای قیمت امروز استعلام بگیرید</strong>
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
        <button
          className="sb-product-card__cart"
          type="button"
          onClick={() => addToCart(cartProduct)}
          aria-label={`افزودن ${product.nameFa} به لیست استعلام`}
        >
          افزودن به لیست استعلام
        </button>
      </div>
    </article>
  );
}
