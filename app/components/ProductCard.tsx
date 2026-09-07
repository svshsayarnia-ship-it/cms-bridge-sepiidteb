"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { productHref } from "../catalog";
import type {
  PublicProduct,
  PublicProductVariant,
} from "../lib/public-product";
import {
  getCompactBrandLabel,
  getPublicPackagingLabel,
  getPublicVolumeLabel,
} from "../lib/public-copy";
import { ArrowIcon, CloseIcon } from "./Icons";
import { ProductVisual } from "./product/ProductVisual";
import { addToCart } from "../lib/cart";
import selectorStyles from "./ProductVariantSelector.module.css";

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

type SelectorPosition = {
  left: number;
  width: number;
  maxHeight: number;
  placement: "above" | "below";
  top?: number;
  bottom?: number;
};

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
        ? data.cardImages[slug] ?? null
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

function getVariantImage(variant: PublicProductVariant, fallback: string) {
  const variantImage = variant.image?.trim();
  const hasApprovedVariantImage = Boolean(
    variantImage &&
      (variant.imageVerified === true ||
        variant.imageKind === "official" ||
        variant.imageKind === "market-reference" ||
        variant.imageKind === "editorial-family"),
  );

  return hasApprovedVariantImage ? variantImage : fallback;
}

function getVariantSecondaryLabel(variant: PublicProductVariant) {
  const cleanLabel = variant.label.replace(/^مدل\s+/u, "").trim();
  const parts = [cleanLabel, variant.volume]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(parts)).join(" · ");
}

export function ProductCard({
  product,
  priority = false,
}: {
  product: PublicProduct;
  priority?: boolean;
}) {
  const [cardImage, setCardImage] = useState<PublicRoleImage | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectorPosition, setSelectorPosition] = useState<SelectorPosition | null>(null);
  const [added, setAdded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectorId = useId();

  useEffect(() => {
    if (!product.slug) return;
    return subscribeToCardRoleImage(product.slug, setCardImage);
  }, [product.slug]);

  useEffect(() => () => {
    if (addedTimerRef.current) window.clearTimeout(addedTimerRef.current);
  }, []);

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
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const parentOutOfStock = product.stockStatus === "outofstock";
  const cartProduct = {
    slug: product.slug,
    nameFa: product.nameFa,
    nameEn: product.nameEn,
    brand,
    image: displayProduct.image,
    volume,
    priceToman: visiblePrice ?? undefined,
  };

  const markAdded = useCallback(() => {
    if (addedTimerRef.current) window.clearTimeout(addedTimerRef.current);
    setAdded(true);
    addedTimerRef.current = window.setTimeout(() => setAdded(false), 1800);
  }, []);

  const updateSelectorPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger || typeof window === "undefined") return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 12;
    const gap = 9;
    const width = Math.min(
      Math.max(rect.width, 310),
      Math.max(240, viewportWidth - margin * 2),
    );
    const idealLeft = rect.right - width;
    const left = Math.max(
      margin,
      Math.min(idealLeft, viewportWidth - width - margin),
    );
    const estimatedHeight = Math.min(430, 96 + variants.length * 73);
    const spaceBelow = Math.max(0, viewportHeight - rect.bottom - margin - gap);
    const spaceAbove = Math.max(0, rect.top - margin - gap);
    const placement =
      spaceBelow >= Math.min(estimatedHeight, 300) || spaceBelow >= spaceAbove
        ? "below"
        : "above";
    const availableHeight = placement === "below" ? spaceBelow : spaceAbove;
    const maxHeight = Math.max(150, Math.min(430, availableHeight));

    setSelectorPosition({
      left,
      width,
      maxHeight,
      placement,
      ...(placement === "below"
        ? { top: rect.bottom + gap }
        : { bottom: viewportHeight - rect.top + gap }),
    });
  }, [variants.length]);

  const closeSelector = useCallback((restoreFocus = false) => {
    setSelectorOpen(false);
    setSelectorPosition(null);
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    if (!selectorOpen) return;

    updateSelectorPosition();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      closeSelector(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSelector(true);
    };
    const onViewportChange = () => updateSelectorPosition();

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);

    const focusFrame = window.requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLButtonElement>("button[data-variant]:not(:disabled)")
        ?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [closeSelector, selectorOpen, updateSelectorPosition]);

  function handleCartClick() {
    if (!hasVariants) {
      addToCart(cartProduct);
      markAdded();
      return;
    }

    if (selectorOpen) {
      closeSelector(false);
      return;
    }

    setSelectedVariantId(null);
    updateSelectorPosition();
    setSelectorOpen(true);
  }

  function handleVariantAdd() {
    if (!selectedVariant) return;
    if (parentOutOfStock || selectedVariant.stockStatus === "outofstock") return;

    const variantPrice = numericPrice(selectedVariant.priceToman) ?? visiblePrice ?? undefined;
    addToCart({
      slug: product.slug,
      nameFa: selectedVariant.nameFa || product.nameFa,
      nameEn: selectedVariant.nameEn || product.nameEn,
      brand,
      image: getVariantImage(selectedVariant, displayProduct.image),
      volume: selectedVariant.volume || volume,
      priceToman: variantPrice,
      variantId: selectedVariant.id,
      variantLabel: selectedVariant.label || selectedVariant.nameFa,
    });
    markAdded();
    setSelectedVariantId(null);
    closeSelector(true);
  }

  const selector = selectorOpen && selectorPosition && typeof document !== "undefined"
    ? createPortal(
        <div
          id={selectorId}
          ref={panelRef}
          className={selectorStyles.panel}
          role="dialog"
          aria-label={`انتخاب مدل ${product.nameFa}`}
          data-placement={selectorPosition.placement}
          style={{
            left: selectorPosition.left,
            width: selectorPosition.width,
            maxHeight: selectorPosition.maxHeight,
            ...(selectorPosition.top !== undefined
              ? { top: selectorPosition.top }
              : { bottom: selectorPosition.bottom }),
          }}
        >
          <div className={selectorStyles.header}>
            <strong>کدام مدل را می‌خواهید؟</strong>
            <button
              className={selectorStyles.close}
              type="button"
              onClick={() => closeSelector(true)}
              aria-label="بستن انتخاب مدل"
            >
              <CloseIcon />
            </button>
          </div>

          <div className={selectorStyles.list}>
            {variants.map((variant) => {
              const unavailable = parentOutOfStock || variant.stockStatus === "outofstock";
              const selected = variant.id === selectedVariantId;
              const secondaryLabel = getVariantSecondaryLabel(variant);
              const variantPrice = numericPrice(variant.priceToman);
              const variantImage = getVariantImage(variant, displayProduct.image);

              return (
                <button
                  key={variant.id}
                  className={selectorStyles.variant}
                  type="button"
                  data-variant
                  aria-pressed={selected}
                  disabled={unavailable}
                  onClick={() => setSelectedVariantId(variant.id)}
                >
                  <ProductVisual
                    className={selectorStyles.image}
                    product={{
                      slug: `${product.slug}-${variant.id}`,
                      nameFa: variant.nameFa || variant.label,
                      category: product.category,
                      masterImage: variantImage,
                      imageAlt: variant.imageAlt || `تصویر ${variant.nameFa}`,
                    }}
                    variant="thumbnail"
                    sizes="50px"
                    showBackground={false}
                  />
                  <span className={selectorStyles.copy}>
                    <strong>{variant.nameFa || variant.label}</strong>
                    {secondaryLabel && <small>{secondaryLabel}</small>}
                  </span>
                  <span className={selectorStyles.price}>
                    <strong>
                      {variantPrice ? formatPrice(variantPrice) : "قیمت را استعلام کنید"}
                    </strong>
                    {unavailable && <small>ناموجود</small>}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            className={selectorStyles.confirm}
            type="button"
            disabled={!selectedVariant}
            onClick={handleVariantAdd}
          >
            {selectedVariant ? "افزودن همین مدل به لیست" : "یک مدل را انتخاب کنید"}
          </button>
        </div>,
        document.body,
      )
    : null;

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

        <div className={selectorStyles.root}>
          <button
            ref={triggerRef}
            className="sb-product-card__cart"
            type="button"
            onClick={handleCartClick}
            aria-label={
              hasVariants
                ? `انتخاب مدل ${product.nameFa} برای افزودن به لیست استعلام`
                : `افزودن ${product.nameFa} به لیست استعلام`
            }
            aria-expanded={hasVariants ? selectorOpen : undefined}
            aria-controls={hasVariants && selectorOpen ? selectorId : undefined}
            aria-haspopup={hasVariants ? "dialog" : undefined}
          >
            {added
              ? "به لیست اضافه شد"
              : hasVariants
                ? "انتخاب مدل و افزودن"
                : "افزودن به لیست استعلام"}
          </button>
          {selector}
        </div>
      </div>
    </article>
  );
}
