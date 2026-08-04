"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { productHref } from "../catalog";
import type { Product } from "../data";
import { ArrowIcon, ShieldIcon } from "./Icons";

type ProductImageResponse = {
  found?: boolean;
  image?: string | null;
  alt?: string;
};

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const href = productHref(product);

  const [imageSrc, setImageSrc] = useState(product.image);
  const [imageAlt, setImageAlt] = useState(
    product.imageAlt ?? `تصویر ${product.nameFa}`,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadLiveImage() {
      try {
        const response = await fetch(
          `/api/store-product-image?slug=${encodeURIComponent(product.slug)}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) return;

        const data =
          (await response.json()) as ProductImageResponse;

        if (cancelled) return;

        if (data.image) {
          setImageSrc(data.image);
        }

        if (data.alt) {
          setImageAlt(data.alt);
        }
      } catch {
        // اگر وردپرس موقتاً پاسخ نداد، تصویر ثابت قبلی باقی می‌ماند.
      }
    }

    void loadLiveImage();

    return () => {
      cancelled = true;
    };
  }, [product.slug]);

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
          loading={priority ? "eager" : "lazy"}
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

          <Link
            className="sb-product-card__cta"
            href={href}
            aria-label={`مشاهده و استعلام ${product.nameFa}`}
          >
            <span>جزئیات</span>
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}
