"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { SitePresentation } from "../lib/site-presentation";
import { ArrowIcon } from "./Icons";

type HeroProduct = {
  id: string;
  label: string;
  name: string;
  kicker: string;
  image: string;
  alt: string;
};

const HERO_PRODUCTS: HeroProduct[] = [
  {
    id: "filler",
    label: "فیلرها",
    name: "Revofil Ultra",
    kicker: "تزریق حرفه‌ای",
    image: "/images/products/cutouts/revofil-1ml.webp",
    alt: "فیلر Revofil Ultra همراه با سرنگ",
  },
  {
    id: "botox",
    label: "بوتاکس‌ها",
    name: "Dyston 500",
    kicker: "بوتولینوم تخصصی",
    image: "/images/products/cutouts/dyston-500.webp",
    alt: "بوتاکس Dyston 500",
  },
  {
    id: "mesogel",
    label: "مزوژل‌ها",
    name: "Kiara Reju",
    kicker: "بازسازی و جوان‌سازی",
    image: "/images/products/cutouts/kiara-reju.webp",
    alt: "مزوژل Kiara Reju",
  },
  {
    id: "clinical",
    label: "محصولات کلینیکی",
    name: "Neuramis Deep",
    kicker: "انتخاب برای کلینیک",
    image: "/images/products/cutouts/neuramis-deep-1ml.webp",
    alt: "فیلر Neuramis Deep",
  },
];

function getProductState(index: number, activeIndex: number) {
  if (index === activeIndex) return "sb-hero__product--active";
  if (Math.abs(index - activeIndex) === 1) return "sb-hero__product--neighbor";
  return "sb-hero__product--rest";
}

export function EditableHomeHero({ hero }: { hero: SitePresentation["home"]["hero"] }) {
  const productRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(1);
  const activeProduct = HERO_PRODUCTS[activeIndex];

  const selectNearestProduct = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") return;

      let nearestIndex = -1;
      let nearestDistance = Number.POSITIVE_INFINITY;

      productRefs.current.forEach((product, index) => {
        if (!product) return;
        const rect = product.getBoundingClientRect();
        const distance = Math.hypot(
          event.clientX - (rect.left + rect.width / 2),
          event.clientY - (rect.top + rect.height / 2),
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      setActiveIndex(nearestDistance < 190 && nearestIndex >= 0 ? nearestIndex : 1);
    },
    [],
  );

  const resetProductFocus = useCallback(() => setActiveIndex(1), []);

  return (
    <section className="sb-hero sb-hero--dock" aria-labelledby="home-hero-title">
      <div className="sb-shell sb-hero__grid">
        <div className="sb-hero__content">
          <span className="sb-eyebrow">
            <i aria-hidden="true" />
            {hero.eyebrow}
          </span>
          <h1 id="home-hero-title">
            <em>{hero.title}</em>
          </h1>
          <p>{hero.description}</p>

          <div className="sb-hero__actions">
            <Link className="sb-btn sb-btn--dark" href={hero.primaryCtaHref}>
              {hero.primaryCtaLabel}
              <ArrowIcon />
            </Link>
            <Link className="sb-btn sb-btn--outline" href={hero.secondaryCtaHref}>
              {hero.secondaryCtaLabel}
            </Link>
          </div>

          <div className="sb-hero__microproof">
            {hero.microproofItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="sb-hero__media" aria-label="محصولات شاخص سپید بیوتی">
          <div className="sb-hero__media-meta" aria-hidden="true">
            <span>PRODUCT STORIES</span>
            <span>۰۱ — ۰۴</span>
          </div>

          <div
            className="sb-hero__stage"
            onPointerMove={selectNearestProduct}
            onPointerLeave={resetProductFocus}
          >
            <span
              className={`sb-hero__halo${activeIndex !== 1 ? " sb-hero__halo--active" : ""}`}
              aria-hidden="true"
            />
            <span className="sb-hero__halo sb-hero__halo--secondary" aria-hidden="true" />
            <span className="sb-hero__stage-line" aria-hidden="true" />

            {HERO_PRODUCTS.map((product, index) => (
              <button
                key={product.id}
                ref={(element) => {
                  productRefs.current[index] = element;
                }}
                type="button"
                className={`sb-hero__product sb-hero__product--${index + 1} ${getProductState(index, activeIndex)}`}
                aria-label={`${product.label}: ${product.name}`}
                aria-pressed={index === activeIndex}
                onPointerEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
              >
                <span className="sb-hero__product-label" aria-hidden="true">
                  <strong>{product.label}</strong>
                  <small>{product.kicker}</small>
                </span>
                <span className="sb-hero__product-shadow" aria-hidden="true" />
                <span className="sb-hero__product-image">
                  <Image
                    src={product.image}
                    alt={product.alt}
                    fill
                    sizes="(max-width: 680px) 28vw, (max-width: 1100px) 18vw, 210px"
                    priority={index === 1}
                  />
                </span>
              </button>
            ))}

            <div className="sb-hero__active-caption" aria-live="polite">
              <span>دسته منتخب</span>
              <strong>{activeProduct.label}</strong>
              <small>{activeProduct.name}</small>
            </div>
          </div>

          <div className="sb-hero__media-foot" aria-hidden="true">
            <span>۴ گروه حرفه‌ای</span>
            <span>حرکت ظریف · انتخاب روشن</span>
          </div>
        </div>
      </div>
    </section>
  );
}
