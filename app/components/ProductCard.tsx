import Link from "next/link";

import { productHref } from "../catalog";
import type { PublicProduct } from "../lib/public-product";
import {
  getCompactBrandLabel,
  getPublicPackagingLabel,
  getPublicVolumeLabel,
} from "../lib/public-copy";
import { ArrowIcon } from "./Icons";
import { RoleAwareProductCardVisual } from "./RoleAwareProductCardVisual";

const priceFormatter = new Intl.NumberFormat("fa-IR");
const productImageSizes = "(max-width: 1100px) 50vw, 33vw";

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
  const volume = getPublicVolumeLabel(product.volume);
  const brand = getCompactBrandLabel(product.brand);
  const packagingLabel = getPublicPackagingLabel(volume);
  const salePrice = numericPrice(product.salePrice);
  const regularPrice = numericPrice(
    product.regularPrice || product.price,
  );
  const visiblePrice =
    salePrice || regularPrice || numericPrice(product.priceToman);

  return (
    <article className="sb-product-card" data-category={product.category}>
      <Link
        className="sb-product-card__visual"
        href={href}
        aria-label={`مشاهده ${product.nameFa}`}
      >
        <RoleAwareProductCardVisual
          product={product}
          brand={brand}
          priority={priority}
          sizes={productImageSizes}
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
            {packagingLabel && <span>{packagingLabel}</span>}
          </div>
        )}

        <div className="sb-product-card__footer">
          <div
            className={`sb-product-card__price${visiblePrice ? "" : " is-pending"}`}
            aria-label={`قیمت ${product.nameFa}`}
          >
            <span>{salePrice ? "قیمت ویژه" : "قیمت فعلی"}</span>
            {visiblePrice ? (
              <div>
                <strong>{formatPrice(visiblePrice)}</strong>
                {salePrice && regularPrice && salePrice < regularPrice
                  ? <del>{formatPrice(regularPrice)}</del>
                  : null}
              </div>
            ) : (
              <strong>قیمت در صفحه محصول</strong>
            )}
          </div>
          <Link
            className="sb-product-card__cta"
            href={href}
            aria-label={`مشاهده جزئیات ${product.nameFa}`}
          >
            <span>جزئیات محصول</span>
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}
