"use client";

import Link from "next/link";
import Image, { type ImageLoaderProps } from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { ArrowIcon, ChevronIcon } from "./Icons";

export type FeaturedCarouselProduct = {
  slug: string;
  nameFa: string;
  nameEn: string;
  brand: string;
  categoryTitle: string;
  badge?: string;
  image: string;
  imageAlt?: string;
  volume?: string;
  shortBenefit: string;
  position: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  stockStatus: string;
};

type Phase = "idle" | "leaving";

const autoplayDelay = 6_000;
const transitionDelay = 360;
const priceFormatter = new Intl.NumberFormat("fa-IR");
const numberFormatter = new Intl.NumberFormat("fa-IR", {
  minimumIntegerDigits: 2,
});

function storefrontImageLoader({ src }: ImageLoaderProps) {
  return src;
}

function formatPrice(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return `${priceFormatter.format(numeric)} تومان`;
}

function getDiscountPercent(regularPrice: string, salePrice: string) {
  const regular = Number(regularPrice);
  const sale = Number(salePrice);

  if (
    !Number.isFinite(regular) ||
    !Number.isFinite(sale) ||
    regular <= 0 ||
    sale <= 0 ||
    sale >= regular
  ) {
    return 0;
  }

  return Math.round(((regular - sale) / regular) * 100);
}

function cleanVolume(value?: string) {
  return value
    ?.replace(/\s+(?:در|طبق)\s+فهرست(?:\s+موجودی)?.*$/u, "")
    .trim();
}

export function FeaturedProductCarousel({
  products,
}: {
  products: FeaturedCarouselProduct[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStart = useRef<number | null>(null);
  const dragged = useRef(false);

  const moveTo = useCallback(
    (nextIndex: number) => {
      if (products.length < 2 || phase !== "idle") return;

      const normalized =
        (nextIndex + products.length) % products.length;
      if (normalized === currentIndex) return;

      setPhase("leaving");
      transitionTimer.current = setTimeout(() => {
        setCurrentIndex(normalized);
        setPhase("idle");
      }, transitionDelay);
    },
    [currentIndex, phase, products.length],
  );

  useEffect(() => {
    if (
      paused ||
      reducedMotion ||
      phase !== "idle" ||
      products.length < 2
    ) return;

    const timer = window.setTimeout(() => {
      moveTo(currentIndex + 1);
    }, autoplayDelay);

    return () => window.clearTimeout(timer);
  }, [currentIndex, moveTo, paused, phase, products.length, reducedMotion]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(media.matches);
    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    },
    [],
  );

  if (!products.length) return null;

  const product = products[currentIndex];
  const href = `/product/${product.slug}`;
  const volume = cleanVolume(product.volume);
  const salePrice = formatPrice(product.salePrice);
  const regularPrice = formatPrice(
    product.regularPrice || product.price,
  );
  const livePrice = salePrice || regularPrice;
  const discountPercent = getDiscountPercent(
    product.regularPrice || product.price,
    product.salePrice,
  );
  const isOutOfStock = product.stockStatus === "outofstock";

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    pointerStart.current = event.clientX;
    dragged.current = false;
    setPaused(true);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;

    if (start !== null) {
      const distance = event.clientX - start;
      if (Math.abs(distance) > 44) {
        dragged.current = true;
        moveTo(currentIndex + (distance > 0 ? 1 : -1));
      }
    }

    setPaused(false);
  }

  return (
    <section
      className="sb-section sb-featured-products sb-featured-carousel"
      aria-labelledby="featured-products-title"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onFocusCapture={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="sb-shell">
        <div className="sb-featured-carousel__head">
          <div>
            <span className="sb-eyebrow">FEATURED / SHOP</span>
            <h2 id="featured-products-title">
              انتخاب‌های ویژه،
              <em>در مرکز توجه.</em>
            </h2>
          </div>
          <div className="sb-featured-carousel__intro">
            <p>
              هر محصول با اطلاعات کوتاه و مسیر مستقیم خرید نمایش داده می‌شود؛
              تخفیف نیز فقط براساس قیمت ثبت‌شدهٔ فروشگاه نشان داده می‌شود.
            </p>
            <Link className="sb-text-link" href="/shop">
              مشاهده همه محصولات
              <ArrowIcon />
            </Link>
          </div>
        </div>

        <div
          className="sb-featured-carousel__viewport"
          onPointerCancel={() => {
            pointerStart.current = null;
            setPaused(false);
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <article
            className={`sb-featured-carousel__slide${
              phase === "leaving" ? " sb-featured-carousel__slide--leaving" : ""
            }`}
            key={product.slug}
            aria-live="polite"
          >
            <div className="sb-featured-carousel__copy">
              <div className="sb-featured-carousel__kicker">
                <span>{numberFormatter.format(currentIndex + 1)}</span>
                <b>{product.categoryTitle || "محصول منتخب"}</b>
              </div>

              <p className="sb-featured-carousel__brand">
                {product.brand || "Sepiid Beauty"}
              </p>
              <h3>{product.nameFa}</h3>
              {product.nameEn && <small>{product.nameEn}</small>}

              <p className="sb-featured-carousel__benefit">
                {product.shortBenefit || product.position}
              </p>

              <div className="sb-featured-carousel__facts">
                {volume && <span>{volume}</span>}
                {product.position && <span>{product.position}</span>}
              </div>

              <div className="sb-featured-carousel__purchase">
                <div className="sb-featured-carousel__price">
                  <span>{isOutOfStock ? "وضعیت محصول" : "قیمت فروشگاه"}</span>
                  <strong>
                    {isOutOfStock
                      ? "ناموجود"
                      : livePrice || "استعلام قیمت روز"}
                  </strong>
                  {!isOutOfStock && salePrice && regularPrice && (
                    <del>{regularPrice}</del>
                  )}
                </div>

                <Link className="sb-featured-carousel__cta" href={href}>
                  <span>{isOutOfStock ? "مشاهده محصول" : "مشاهده و خرید"}</span>
                  <ArrowIcon />
                </Link>
              </div>
            </div>

            <Link
              className="sb-featured-carousel__visual"
              href={href}
              aria-label={`مشاهده ${product.nameFa}`}
              onClick={(event) => {
                if (dragged.current) {
                  event.preventDefault();
                  dragged.current = false;
                }
              }}
            >
              <span className="sb-featured-carousel__halo" aria-hidden="true" />
              <Image
                alt={product.imageAlt || `تصویر ${product.nameFa}`}
                draggable={false}
                height="1254"
                loader={storefrontImageLoader}
                loading={currentIndex === 0 ? "eager" : "lazy"}
                sizes="(max-width: 820px) 92vw, 52vw"
                src={product.image}
                unoptimized
                width="1254"
              />

              <span className="sb-featured-carousel__offer">
                {discountPercent > 0 ? (
                  <>
                    <b>{priceFormatter.format(discountPercent)}٪</b>
                    <small>تخفیف ویژه</small>
                  </>
                ) : (
                  <>
                    <b>{product.badge || "منتخب"}</b>
                    <small>پیشنهاد سپید</small>
                  </>
                )}
              </span>
            </Link>
          </article>

          <div className="sb-featured-carousel__controls">
            <button
              aria-label="محصول قبلی"
              disabled={phase !== "idle"}
              onClick={() => moveTo(currentIndex - 1)}
              type="button"
            >
              <ChevronIcon />
            </button>
            <button
              aria-label="محصول بعدی"
              disabled={phase !== "idle"}
              onClick={() => moveTo(currentIndex + 1)}
              type="button"
            >
              <ChevronIcon />
            </button>
          </div>

          <div className="sb-featured-carousel__counter" aria-hidden="true">
            <b>{numberFormatter.format(currentIndex + 1)}</b>
            <span />
            <small>{numberFormatter.format(products.length)}</small>
          </div>
        </div>

        <div className="sb-featured-carousel__rail" role="tablist" aria-label="محصولات منتخب">
          {products.map((item, index) => (
            <button
              aria-label={`نمایش ${item.nameFa}`}
              aria-selected={index === currentIndex}
              className={index === currentIndex ? "is-active" : ""}
              key={item.slug}
              onClick={() => moveTo(index)}
              role="tab"
              type="button"
            >
              <Image
                alt=""
                aria-hidden="true"
                height="88"
                loader={storefrontImageLoader}
                loading="lazy"
                sizes="58px"
                src={item.image}
                unoptimized
                width="88"
              />
              <span>
                <small>{item.brand || item.categoryTitle}</small>
                <b>{item.nameFa}</b>
              </span>
              {index === currentIndex && (
                <i
                  className={paused || reducedMotion ? "is-paused" : ""}
                  style={{ animationDuration: `${autoplayDelay}ms` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
