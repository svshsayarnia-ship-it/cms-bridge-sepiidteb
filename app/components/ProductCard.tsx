/* eslint-disable @next/next/no-img-element -- generated project imagery */
import Link from "next/link";
import { productHref } from "../catalog";
import type { Product } from "../data";
import { ArrowIcon, ShieldIcon } from "./Icons";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const href = productHref(product);
  return (
    <article
      className="sb-product-card"
    >
      <Link
        className="sb-product-card__visual"
        href={href}
        aria-label={`مشاهده ${product.nameFa}`}
      >
        <img
          src={product.image}
          alt={product.imageAlt ?? `تصویر ${product.nameFa}`}
          width="1254"
          height="1254"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
        {product.badge && <span className="sb-product-card__badge">{product.badge}</span>}
        <span className="sb-product-card__view">
          مشاهده محصول
          <ArrowIcon />
        </span>
      </Link>
      <div className="sb-product-card__content">
        <div className="sb-product-card__meta">
          <span>{product.brand}</span>
          <span>
            <ShieldIcon />
            بررسی پیش از ارسال
          </span>
        </div>
        <Link href={href}>
          <h3>{product.nameFa}</h3>
          <small>{product.nameEn}</small>
        </Link>
        <div className="sb-product-card__facts">
          {product.volume && <span>{product.volume}</span>}
          <span>{product.sourceStatus}</span>
        </div>
        <div className="sb-product-card__footer">
          <strong>مشاهده و استعلام</strong>
          <Link className="sb-product-card__cta" href={href} aria-label={`مشاهده و استعلام ${product.nameFa}`}>
            <span>جزئیات</span>
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}
