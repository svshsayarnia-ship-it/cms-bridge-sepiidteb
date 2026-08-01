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
    <article className={`sb-product-card${product.imageVerified ? " is-verified" : " is-concept"}`}>
      <Link
        className="sb-product-card__visual"
        href={href}
        aria-label={`مشاهده ${product.nameFa}`}
      >
        <span className="sb-product-card__halo" />
        <img
          src={product.image}
          alt={product.imageAlt ?? `تصویر ${product.nameFa}`}
          width="1254"
          height="1254"
          loading={priority ? "eager" : "lazy"}
        />
        {product.badge && <span className="sb-product-card__badge">{product.badge}</span>}
        <span className="sb-product-card__brand">{product.brand}</span>
        <span className="sb-product-card__line" />
        <span className="sb-product-card__view">
          مشاهده جزئیات
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
        <p>{product.shortBenefit}</p>
        <div className="sb-product-card__facts">
          {product.volume && <span>{product.volume}</span>}
          <span>{product.imageVerified ? "تصویر محصول موجود" : "اطلاعات نیازمند تطبیق"}</span>
        </div>
        <div className="sb-product-card__footer">
          <strong>استعلام موجودی و قیمت</strong>
          <Link href={href} aria-label={`جزئیات ${product.nameFa}`}>
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}
