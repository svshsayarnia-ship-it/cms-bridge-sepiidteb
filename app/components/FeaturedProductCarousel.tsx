"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  addToCart,
  cartItemKey,
  onCartUpdated,
  readCart,
  updateCartQuantity,
  type CartItem,
} from "../lib/cart";
import { ArrowIcon, ChevronIcon } from "./Icons";
import { ProductVisual } from "./product/ProductVisual";
import styles from "./FeaturedProductCarousel.module.css";

export type FeaturedCarouselProduct = {
  slug: string;
  nameFa: string;
  nameEn: string;
  brand: string;
  category: string;
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
  priceToman?: number;
  stockStatus: string;
};

type FeaturedVariant = {
  id: string;
  label: string;
  nameFa: string;
  nameEn: string;
  image: string;
  imageAlt: string;
  volume: string;
  priceToman: number;
  stockStatus?: "instock" | "outofstock" | "onbackorder" | "unknown";
  regularPrice?: string;
  salePrice?: string;
};

type VariantResponse = {
  products?: Record<string, { variants?: FeaturedVariant[] }>;
};

const FAVORITES_KEY = "sepiid-beauty-favorites-v1";
const autoplayDelay = 5_600;
const rotationInterval = 3 * 60 * 60 * 1_000;
const iranUtcOffset = 3.5 * 60 * 60 * 1_000;
const visibleProductCount = 4;
const priceFormatter = new Intl.NumberFormat("fa-IR");

function numericPrice(value?: string | number | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function formatPrice(value?: string | number | null) {
  const numeric = numericPrice(value);
  return numeric ? `${priceFormatter.format(numeric)} تومان` : "";
}

function getRotationWindow(now: number) {
  const shiftedNow = now + iranUtcOffset;
  const seed = Math.floor(shiftedNow / rotationInterval);
  return { seed };
}

function hashRotationKey(value: string) {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function selectRotatingProducts(products: FeaturedCarouselProduct[], seed: number) {
  return Array.from(
    new Map(products.map((product) => [product.slug, product])).values(),
  )
    .sort((first, second) => {
      const firstScore = hashRotationKey(`${seed}:${first.slug}`);
      const secondScore = hashRotationKey(`${seed}:${second.slug}`);
      return firstScore - secondScore || first.slug.localeCompare(second.slug);
    })
    .slice(0, visibleProductCount);
}

function cleanVolume(value?: string) {
  return value
    ?.replace(
      /(?:؛|،)?\s*(?:گزارش(?:\s+برخی\s+آگهی‌ها|\s+بازار)?|طبق\s+فهرست(?:\s+موجودی)?|در\s+فهرست(?:\s+موجودی)?).*$/u,
      "",
    )
    .replace(/^(?:نسخه‌های|چند نسخه)\s+متفاوت\s+در\s+بازار$/u, "")
    .trim();
}

function getDiscountPercent(regular: number | null, sale: number | null) {
  if (!regular || !sale || sale >= regular) return 0;
  return Math.round(((regular - sale) / regular) * 100);
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

export function FeaturedProductCarousel({
  products: productPool,
  initialRotationSeed,
}: {
  products: FeaturedCarouselProduct[];
  initialRotationSeed: number;
}) {
  const [rotationSeed, setRotationSeed] = useState(initialRotationSeed);
  const products = useMemo(
    () => selectRotatingProducts(productPool, rotationSeed),
    [productPool, rotationSeed],
  );
  const [variantsBySlug, setVariantsBySlug] = useState<Record<string, FeaturedVariant[]>>({});
  const [selectedVariantIds, setSelectedVariantIds] = useState<Record<string, string>>({});
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [toastSlug, setToastSlug] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const syncRotation = () => {
      const rotation = getRotationWindow(Date.now());
      setRotationSeed((current) => (current === rotation.seed ? current : rotation.seed));
    };
    syncRotation();
    const timer = window.setInterval(syncRotation, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const syncCart = () => setCartItems(readCart());
    syncCart();
    return onCartUpdated(syncCart);
  }, []);

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]");
      if (Array.isArray(parsed)) {
        setFavorites(new Set(parsed.filter((item): item is string => typeof item === "string")));
      }
    } catch {
      setFavorites(new Set());
    }
  }, []);

  useEffect(() => {
    if (!products.length) return;
    const controller = new AbortController();
    const slugs = products.map((product) => product.slug).join(",");

    void fetch(`/api/featured-product-variants?slugs=${encodeURIComponent(slugs)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Variant request failed with ${response.status}`);
        return (await response.json()) as VariantResponse;
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        const next = Object.fromEntries(
          products.map((product) => [
            product.slug,
            data.products?.[product.slug]?.variants ?? [],
          ]),
        );
        setVariantsBySlug(next);
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        console.warn("[featured-carousel] variant data unavailable", error);
      });

    return () => controller.abort();
  }, [products]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const getTrackStep = useCallback(() => {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>("[data-carousel-card]");
    if (!track || !card) return 0;
    const style = window.getComputedStyle(track);
    const gap = Number.parseFloat(style.columnGap || style.gap || "0") || 0;
    return card.getBoundingClientRect().width + gap;
  }, []);

  const move = useCallback(
    (direction: 1 | -1) => {
      const track = trackRef.current;
      if (!track) return;
      const step = getTrackStep();
      if (!step) return;

      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      const next = track.scrollLeft + direction * step;
      if (direction > 0 && next >= maxScroll - 2) {
        track.scrollTo({ left: maxScroll, behavior: "smooth" });
      } else if (direction < 0 && next <= 2) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        track.scrollBy({ left: direction * step, behavior: "smooth" });
      }
    },
    [getTrackStep],
  );

  useEffect(() => {
    if (paused || products.length < 2) return;
    const timer = window.setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      if (track.scrollLeft >= maxScroll - 6) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        move(1);
      }
    }, autoplayDelay);
    return () => window.clearInterval(timer);
  }, [move, paused, products.length]);

  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const step = getTrackStep();
    if (!step) return;
    setActiveIndex(Math.max(0, Math.min(products.length - 1, Math.round(track.scrollLeft / step))));
  }, [getTrackStep, products.length]);

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const showToast = useCallback((slug: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastSlug(slug);
    toastTimer.current = setTimeout(() => setToastSlug(null), 1_900);
  }, []);

  if (!products.length) return null;

  return (
    <section
      className={styles.section}
      aria-labelledby="featured-products-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className={styles.shell}>
        <div className={styles.head}>
          <div>
            <span className={styles.eyebrow}>BEAUTY E-COMMERCE</span>
            <h2 id="featured-products-title">
              انتخاب محصول،
              <em>روان‌تر و زنده‌تر.</em>
            </h2>
          </div>
          <div className={styles.headAside}>
            <p>
              قیمت، تخفیف و مدل‌های هر محصول را همان‌جا ببینید؛ مدل را عوض کنید و بدون خروج از کاروسل به سبد اضافه کنید.
            </p>
            <Link className={styles.shopLink} href="/shop">
              دیدن همه محصولات
              <ArrowIcon />
            </Link>
          </div>
        </div>

        <div className={styles.carousel}>
          <div
            ref={trackRef}
            className={styles.track}
            dir="ltr"
            onScroll={handleScroll}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
            onPointerCancel={() => setPaused(false)}
            aria-label="محصولات پیشنهادی"
          >
            {products.map((product) => {
              const variants = variantsBySlug[product.slug] ?? [];
              const selectedVariantId = selectedVariantIds[product.slug];
              const selectedVariant =
                variants.find((variant) => variant.id === selectedVariantId) ?? variants[0] ?? null;
              const href = `/product/${product.slug}`;
              const displayName = selectedVariant?.nameFa || product.nameFa;
              const displayNameEn = selectedVariant?.nameEn || product.nameEn;
              const displayVolume = cleanVolume(selectedVariant?.volume || product.volume);
              const displayImage = selectedVariant?.image || product.image;
              const regularPrice = selectedVariant
                ? numericPrice(selectedVariant.regularPrice) ?? numericPrice(selectedVariant.priceToman)
                : numericPrice(product.regularPrice || product.price) ?? numericPrice(product.priceToman);
              const salePrice = selectedVariant
                ? numericPrice(selectedVariant.salePrice)
                : numericPrice(product.salePrice);
              const visiblePrice = salePrice || regularPrice;
              const discount = getDiscountPercent(regularPrice, salePrice);
              const stockStatus = selectedVariant?.stockStatus || product.stockStatus;
              const outOfStock = stockStatus === "outofstock";
              const cartTarget = {
                slug: product.slug,
                volume: displayVolume || undefined,
                variantId: selectedVariant?.id,
              };
              const targetKey = cartItemKey(cartTarget);
              const cartItem = cartItems.find((item) => cartItemKey(item) === targetKey);
              const favorite = favorites.has(product.slug);
              const badge = discount > 0
                ? `${priceFormatter.format(discount)}٪ تخفیف`
                : product.badge || (variants.length ? "چند مدل" : "منتخب");

              const handleAdd = () => {
                if (outOfStock) return;
                addToCart({
                  slug: product.slug,
                  nameFa: displayName,
                  nameEn: displayNameEn,
                  brand: product.brand,
                  image: displayImage || "",
                  volume: displayVolume || undefined,
                  priceToman: visiblePrice ?? undefined,
                  variantId: selectedVariant?.id,
                  variantLabel: selectedVariant?.label || selectedVariant?.nameFa,
                });
                showToast(product.slug);
              };

              return (
                <article
                  key={product.slug}
                  className={styles.card}
                  data-carousel-card
                  dir="rtl"
                  data-category={product.category}
                >
                  <div className={styles.visualArea}>
                    <span className={styles.badge}>{badge}</span>
                    <button
                      type="button"
                      className={`${styles.favorite}${favorite ? ` ${styles.favoriteActive}` : ""}`}
                      aria-label={favorite ? `حذف ${product.nameFa} از علاقه‌مندی` : `افزودن ${product.nameFa} به علاقه‌مندی`}
                      aria-pressed={favorite}
                      onClick={() => toggleFavorite(product.slug)}
                    >
                      <HeartIcon />
                    </button>

                    {displayImage ? (
                      <ProductVisual
                        key={`${product.slug}:${selectedVariant?.id ?? "default"}`}
                        className={`${styles.productVisual} ${styles.morphVisual}`}
                        product={{
                          slug: selectedVariant ? `${product.slug}-${selectedVariant.id}` : product.slug,
                          nameFa: displayName,
                          category: product.category,
                          image: displayImage,
                          masterImage: displayImage,
                          imageAlt: selectedVariant?.imageAlt || product.imageAlt || `تصویر ${displayName}`,
                        }}
                        variant="carousel"
                        priority
                        sizes="(max-width: 720px) 70vw, (max-width: 1040px) 38vw, 26vw"
                        showBackground={false}
                        unoptimized
                      />
                    ) : (
                      <span className={styles.emptyImage}>تصویر محصول در حال تکمیل است</span>
                    )}

                    <span className={styles.benefitChip}>
                      {selectedVariant?.label || product.shortBenefit || "مشخصات این مدل را ببینید"}
                    </span>

                    {toastSlug === product.slug && (
                      <span className={styles.toast} role="status">
                        به سبد خرید اضافه شد
                      </span>
                    )}
                  </div>

                  <div className={styles.body}>
                    <div className={styles.swatches} aria-label={variants.length ? "انتخاب مدل محصول" : "محصول تک‌مدل"}>
                      {variants.length ? (
                        <>
                          {variants.slice(0, 5).map((variant, index) => {
                            const active = variant.id === (selectedVariant?.id ?? variants[0]?.id);
                            const variantImage = variant.image || product.image;
                            return (
                              <button
                                type="button"
                                key={variant.id}
                                className={`${styles.swatch}${active ? ` ${styles.swatchActive}` : ""}`}
                                aria-label={`انتخاب ${variant.nameFa || variant.label}`}
                                aria-pressed={active}
                                title={variant.nameFa || variant.label}
                                onClick={() =>
                                  setSelectedVariantIds((current) => ({
                                    ...current,
                                    [product.slug]: variant.id,
                                  }))
                                }
                              >
                                {variantImage && (
                                  <ProductVisual
                                    className={styles.swatchVisual}
                                    product={{
                                      slug: `${product.slug}-${variant.id}-${index}`,
                                      nameFa: variant.nameFa || variant.label,
                                      category: product.category,
                                      image: variantImage,
                                      masterImage: variantImage,
                                      imageAlt: "",
                                    }}
                                    variant="thumbnail"
                                    decorative
                                    sizes="31px"
                                    showBackground={false}
                                    unoptimized
                                  />
                                )}
                              </button>
                            );
                          })}
                          {variants.length > 5 && (
                            <span className={styles.variantHint}>+{priceFormatter.format(variants.length - 5)} مدل</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className={styles.singleDot} aria-hidden="true" />
                          <span className={styles.variantHint}>تک‌مدل</span>
                        </>
                      )}
                    </div>

                    <p className={styles.brand}>{product.brand || product.categoryTitle || "Sepiid Beauty"}</p>
                    <h3 className={styles.title}>
                      <Link href={href}>{displayName}</Link>
                    </h3>
                    <p className={styles.meta}>
                      {selectedVariant?.label
                        ? `${selectedVariant.label}${displayVolume ? ` · ${displayVolume}` : ""}`
                        : product.shortBenefit || displayNameEn || "مشخصات و قیمت این محصول را ببینید"}
                    </p>

                    <div className={styles.priceRow}>
                      <div className={styles.price}>
                        <strong>
                          {outOfStock
                            ? "ناموجود"
                            : visiblePrice
                              ? formatPrice(visiblePrice)
                              : "قیمت را استعلام کنید"}
                        </strong>
                        {!outOfStock && salePrice && regularPrice && salePrice < regularPrice && (
                          <del>{formatPrice(regularPrice)}</del>
                        )}
                      </div>
                      {displayVolume && <span className={styles.volume}>{displayVolume}</span>}
                    </div>

                    <div className={styles.actionRow}>
                      {outOfStock ? (
                        <Link className={styles.cta} href={href}>
                          مشاهده محصول
                          <ArrowIcon />
                        </Link>
                      ) : cartItem ? (
                        <>
                          <Link className={styles.addedButton} href="/cart">
                            در سبد خرید ✓
                          </Link>
                          <div className={styles.stepper} aria-label={`تعداد ${displayName} در سبد`}>
                            <button
                              type="button"
                              aria-label="کم کردن تعداد"
                              onClick={() => updateCartQuantity(cartTarget, cartItem.quantity - 1)}
                            >
                              −
                            </button>
                            <span>{priceFormatter.format(cartItem.quantity)}</span>
                            <button
                              type="button"
                              aria-label="زیاد کردن تعداد"
                              onClick={() => updateCartQuantity(cartTarget, cartItem.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                        </>
                      ) : (
                        <button className={styles.cta} type="button" onClick={handleAdd}>
                          افزودن به سبد
                          <ArrowIcon />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className={styles.controls}>
            <div className={styles.nav}>
              <button type="button" aria-label="محصول قبلی" onClick={() => move(-1)}>
                <ChevronIcon />
              </button>
              <button type="button" aria-label="محصول بعدی" onClick={() => move(1)}>
                <ChevronIcon />
              </button>
            </div>
            <div className={styles.progress} aria-hidden="true">
              <i
                style={{
                  transform: `translateX(${Math.max(0, Math.min(3, activeIndex)) * 100}%)`,
                }}
              />
            </div>
            <span className={styles.counter} aria-hidden="true">
              {priceFormatter.format(Math.min(products.length, activeIndex + 1))} / {priceFormatter.format(products.length)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
