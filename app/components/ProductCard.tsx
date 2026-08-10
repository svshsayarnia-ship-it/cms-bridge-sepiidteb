/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import { productHref } from "../catalog";
import type { Product } from "../data";
import { getCompactBrandLabel } from "../lib/public-copy";
import { ArrowIcon } from "./Icons";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
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
          </div>
        )}

        <div className="sb-product-card__footer">
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
