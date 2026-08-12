/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import { productHref } from "../catalog";
import type { PublicProduct } from "../lib/public-product";
import {
  getCompactBrandLabel,
  getPublicPackagingLabel,
} from "../lib/public-copy";
import { ArrowIcon } from "./Icons";

const priceFormatter = new Intl.NumberFormat("fa-IR");

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
  const href = productHref(product);
  const volume = product.volume
    ?.replace(/\s+(?:در|طبق)\s+فهرست(?:\s+موجودی)?.*$/u, "")
    .trim();

  const imageSrc = product.image;
  const imageAlt =
    product.imageAlt ||
    `تصویر ${product.nameFa}`;
  const brand = getCompactBrandLabel(product.brand);
  const packagingLabel = getPublicPackagingLabel(product.volume);
  const salePrice = numericPrice(product.salePrice);
  const regularPrice = numericPrice(
    product.regularPrice || product.price,
  );
  const visiblePrice =
    salePrice || regularPrice || numericPrice(product.priceToman);

  return (
    <article className="sb-product-card">
      <Link
        className="sb-product-card__visual"
        href={href}
        aria-label={`مشاهده ${product.nameFa}`}
      >
        <img
          src={imageSrc}
          alt={imageAlt}
          width="1254"
          height="1254"
          loading={
            priority ? "eager" : "lazy"
          }
          fetchPriority={
            priority ? "high" : "auto"
          }
          decoding="async"
        />

        {product.imageKind === "editorial-family" && (
          <span className="sb-product-card__identity" aria-hidden="true">
            <small>{brand || "سپید بیوتی"}</small>
            <strong>{product.nameFa}</strong>
            {product.nameEn && <em>{product.nameEn}</em>}
          </span>
        )}

        {product.badge && (
          <span className="sb-product-card__badge">
            {product.badge}
          </span>
        )}

        <span className="sb-product-card__view">
          مشاهده محصول
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
              <strong>در حال بررسی بازار</strong>
            )}
          </div>
          <Link
            className="sb-product-card__cta"
            href={href}
            aria-label={`مشاهده و استعلام ${product.nameFa}`}
          >
            <span>مشاهده و استعلام</span>
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}
