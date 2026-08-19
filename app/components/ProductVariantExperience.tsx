"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductVisualProfile } from "../config/visualProfiles";
import type { Product, ProductVariant } from "../data";
import { getPublicPackagingLabel, toPublicCopy } from "../lib/public-copy";
import { ArrowIcon } from "./Icons";
import { ProductVisual } from "./product/ProductVisual";

type Pricing = {
  label: string;
  note: string;
};

type ProductExperienceVariant = Pick<
  ProductVariant,
  | "id"
  | "label"
  | "nameFa"
  | "nameEn"
  | "image"
  | "imageAlt"
  | "imageVerified"
  | "imageKind"
  | "volume"
  | "summary"
  | "specs"
  | "priceToman"
  | "priceNote"
>;

export type ProductExperienceProduct = Pick<
  Product,
  | "nameFa"
  | "nameEn"
  | "brand"
  | "category"
  | "categoryTitle"
  | "image"
  | "imageAlt"
  | "imageKind"
  | "volume"
  | "priceToman"
  | "priceNote"
  | "summary"
  | "specs"
> & {
  visualProfile?: ProductVisualProfile;
  visualScale?: number | null;
  visualOffsetX?: number;
  visualOffsetY?: number;
  variants?: ProductExperienceVariant[];
};

type ProductVariantExperienceProps = {
  product: ProductExperienceProduct;
  liveImage: { src: string; alt: string } | null;
  catalogImage?: { src: string; alt: string } | null;
  livePricing: Pricing | null;
  liveShortDescription: string;
  liveDescription: string;
  brandHref?: string;
  initialVariantId?: string;
};

const priceFormatter = new Intl.NumberFormat("fa-IR");

function formatStaticPrice(value?: number) {
  return value && value > 0
    ? `${priceFormatter.format(value)} تومان`
    : "بررسی قیمت امروز";
}

function buildInquiryLink(name: string, volume?: string) {
  const message = `سلام، موجودی و قیمت «${name}»${volume ? ` با بسته ${volume}` : ""} را می‌خواهم.`;
  return `https://wa.me/989037251266?text=${encodeURIComponent(message)}`;
}

const internalProductTerms = /تطبیق|تأیید|تایید|فهرست|گزارش|مرجع|بچ‌کد|پلمب/u;

function conciseProductCopy(value: string, supplierTerms: string[]) {
  const plain = toPublicCopy(
    value
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );

  if (!plain) return "";

  const sentences = plain
    .split(/(?<=[.!؟])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const editorialSentences = sentences.filter(
    (sentence) =>
      !internalProductTerms.test(sentence) &&
      !supplierTerms.some(
        (term) => term && sentence.toLowerCase().includes(term.toLowerCase()),
      ),
  );

  const selected = (editorialSentences.length ? editorialSentences : sentences)
    .slice(0, 2)
    .join(" ");

  return selected.length > 260
    ? `${selected.slice(0, 257).trimEnd()}…`
    : selected;
}

function getSupplierTerms(brand: string) {
  return brand
    .split("/")
    .slice(1)
    .flatMap((part) => [part.trim(), ...part.trim().split(/\s+/u)])
    .filter((term) => term.length >= 4);
}

const visibleSpecLabels = new Map<string, string>([
  ["مدل", "مدل"],
  ["مدل‌های موجود", "مدل‌های موجود"],
  ["حجم", "حجم"],
  ["حجم یا واحد مشاهده‌شده", "حجم"],
  ["حجم‌های موجود", "حجم‌های موجود"],
  ["حجم کل", "حجم کل"],
  ["حجم هر سرنگ", "حجم هر سرنگ"],
  ["حجم هر ویال", "حجم هر ویال"],
  ["تعداد", "تعداد"],
  ["تعداد ست", "تعداد ست"],
  ["تعداد جعبه", "تعداد جعبه"],
  ["تعداد و حجم", "محتویات"],
  ["محتویات", "محتویات"],
  ["بسته", "بسته"],
  ["بسته رایج", "بسته"],
  ["شکل بسته", "بسته‌بندی"],
  ["شکل محصول", "بسته‌بندی"],
  ["سرنگ", "سرنگ"],
  ["ویال", "ویال"],
  ["قدرت", "قدرت"],
  ["غلظت درج‌شده", "غلظت"],
  ["ترکیبات فعال اعلام‌شده", "ترکیبات"],
  ["واحد قیمت", "واحد قیمت"],
]);

function getVisibleSpecs(specs: Array<[string, string]>) {
  const seen = new Set<string>();

  return specs.flatMap(([label, value]) => {
    const displayLabel = visibleSpecLabels.get(label);

    const cleanValue = toPublicCopy(value)
      .replace(/(?:؛|،)?\s*(?:گزارش(?:\s+برخی\s+آگهی‌ها|\s+بازار)?|طبق\s+فهرست\s+موجودی).*$/u, "")
      .trim();

    if (!displayLabel || seen.has(displayLabel) || !cleanValue) {
      return [];
    }

    seen.add(displayLabel);
    return [[displayLabel, cleanValue] as [string, string]];
  });
}

export function ProductVariantExperience({
  product,
  liveImage,
  catalogImage,
  livePricing,
  liveShortDescription,
  liveDescription,
  brandHref,
  initialVariantId,
}: ProductVariantExperienceProps) {
  const defaultVariantId = product.variants?.[0]?.id ?? "";
  const hasInitialVariantSelection = Boolean(
    initialVariantId && product.variants?.some((variant) => variant.id === initialVariantId),
  );
  const [selectedId, setSelectedId] = useState(
    hasInitialVariantSelection
      ? initialVariantId ?? defaultVariantId
      : defaultVariantId,
  );
  const [hasExplicitVariantSelection, setHasExplicitVariantSelection] = useState(
    hasInitialVariantSelection,
  );
  const selectedVariant = product.variants?.find((variant) => variant.id === selectedId);
  const hasVariants = Boolean(product.variants?.length);
  const displayName = selectedVariant?.nameFa ?? product.nameFa;
  const displayNameEn = selectedVariant?.nameEn ?? product.nameEn;
  const displaySummary = selectedVariant?.summary ?? product.summary;
  const visibleSummary = conciseProductCopy(
    !hasVariants && liveShortDescription ? liveShortDescription : displaySummary,
    getSupplierTerms(product.brand),
  );
  const editorialDescription = toPublicCopy(liveDescription);
  const selectedSpecLabels = new Set(
    selectedVariant?.specs.map(([label]) => label) ?? [],
  );
  const displaySpecs = selectedVariant
    ? [
        ...product.specs.filter(([label]) => !selectedSpecLabels.has(label)),
        ...selectedVariant.specs,
      ]
    : product.specs;
  const visibleSpecs = getVisibleSpecs(displaySpecs);
  const displayVolume = selectedVariant?.volume ?? product.volume;
  const packagingLabel = getPublicPackagingLabel(displayVolume);

  // The same canonical master used by discovery cards must also be the PDP
  // default. Woo/CMS stays authoritative; local catalog media is fallback only.
  // A variant may replace the master only after an explicit selection and only
  // when that variant has an exact verified image.
  const canonicalImage = liveImage?.src || catalogImage?.src || product.image;
  const canonicalImageAlt =
    liveImage?.alt || catalogImage?.alt || product.imageAlt || `تصویر ${product.nameFa}`;
  const canUseSelectedVariantImage = Boolean(
    hasExplicitVariantSelection &&
      selectedVariant?.imageVerified === true &&
      selectedVariant.image?.trim(),
  );
  const displayImage = canUseSelectedVariantImage
    ? selectedVariant?.image || canonicalImage
    : canonicalImage;
  const displayImageAlt = canUseSelectedVariantImage
    ? selectedVariant?.imageAlt || canonicalImageAlt
    : canonicalImageAlt;
  const displayImageKind = canUseSelectedVariantImage
    ? selectedVariant?.imageKind
    : product.imageKind;
  const isEditorialFamilyImage =
    displayImageKind === "editorial-family" && !liveImage?.src;

  const pricing = livePricing ?? (hasVariants
    ? {
        label: formatStaticPrice(selectedVariant?.priceToman ?? product.priceToman),
        note: selectedVariant?.priceNote ?? product.priceNote ?? "قیمت امروز",
      }
    : {
        label: formatStaticPrice(product.priceToman),
        note: product.priceNote ?? "قیمت امروز",
      });
  const inquiryLink = buildInquiryLink(displayName, displayVolume);
  const variantFeedbackKey = hasVariants ? selectedId : "single-product";
  const variantMeta = [selectedVariant?.label, displayVolume, packagingLabel]
    .filter(Boolean)
    .join(" · ");

  function selectVariant(id: string) {
    setSelectedId(id);
    setHasExplicitVariantSelection(true);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("variant", id);
      window.history.replaceState({}, "", url);
    }
  }

  return (
    <>
      <section className="sb-product-detail" data-category={product.category}>
        <div className="sb-shell sb-product-detail__grid">
          <div className="sb-product-gallery">
            <div className="sb-product-gallery__main">
              <ProductVisual
                key={displayImage}
                product={{
                  nameFa: displayName,
                  category: product.category,
                  masterImage: displayImage,
                  imageAlt: displayImageAlt,
                  visualProfile: product.visualProfile,
                  visualScale: product.visualScale,
                  visualOffsetX: product.visualOffsetX,
                  visualOffsetY: product.visualOffsetY,
                }}
                variant="detail"
                priority
              />
              {isEditorialFamilyImage && (
                <span className="sb-product-gallery__identity" aria-hidden="true">
                  <small>{product.brand || "سپید بیوتی"}</small>
                  <strong>{displayName}</strong>
                  <em>{displayNameEn}</em>
                </span>
              )}
            </div>
            {isEditorialFamilyImage && (
              <p className="sb-product-gallery__image-note">
                نمای ادیتوریال خانواده محصول است؛ مدل دقیق روی بسته پیش از سفارش مشخص می‌شود.
              </p>
            )}
          </div>

          <div className="sb-product-summary">
            <div className="sb-product-summary__top">
              <span>{product.categoryTitle}</span>
              {product.brand ? (
                brandHref ? (
                  <Link href={brandHref}>{product.brand}</Link>
                ) : (
                  <span>{product.brand}</span>
                )
              ) : null}
            </div>
            <div
              className="sb-product-summary__identity-change"
              key={`identity-${variantFeedbackKey}`}
            >
              <h1>{displayName}</h1>
              <p className="sb-product-summary__en">{displayNameEn}</p>
            </div>

            {hasVariants && (
              <div className="sb-product-variants">
                <div className="sb-product-variants__head">
                  <strong>مدل موردنظر</strong>
                  <span
                    className="sb-product-variants__selection-meta"
                    key={`meta-${variantFeedbackKey}`}
                    aria-live="polite"
                  >
                    {variantMeta}
                  </span>
                </div>
                <div className="sb-product-variants__options" role="group" aria-label="انتخاب مدل محصول">
                  {product.variants?.map((variant) => (
                    <button
                      type="button"
                      aria-pressed={variant.id === selectedId}
                      className={variant.id === selectedId ? "is-active" : ""}
                      key={variant.id}
                      onClick={() => selectVariant(variant.id)}
                    >
                      {variant.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {visibleSummary && (
              <p
                className="sb-product-summary__lead sb-product-summary__state-change"
                key={`summary-${variantFeedbackKey}`}
                aria-live="polite"
              >
                {visibleSummary}
              </p>
            )}

            <div className="sb-product-summary__order">
              <div
                className="sb-product-summary__price-change"
                key={`price-${variantFeedbackKey}`}
              >
                <span>قیمت فعلی</span>
                <strong>{pricing.label}</strong>
                <small>{toPublicCopy(pricing.note)}</small>
              </div>
              <Link className="sb-btn sb-btn--dark" href={inquiryLink}>
                بررسی موجودی امروز
                <ArrowIcon />
              </Link>
            </div>
            <p className="sb-product-summary__notice">
              محصول حرفه‌ای
            </p>
          </div>
        </div>
      </section>

      {editorialDescription && (
        <section className="sb-section sb-product-description" id="description">
          <div className="sb-shell sb-product-description__grid">
            <div className="sb-product-description__heading">
              <h2>درباره {displayName}</h2>
            </div>
            <article className="sb-product-description__content sb-product-rich-text" dangerouslySetInnerHTML={{ __html: editorialDescription }} />
          </div>
        </section>
      )}

      {visibleSpecs.length > 0 && (
        <section className="sb-section sb-product-info-section" id="specs">
          <div className="sb-shell sb-product-info-section__grid">
            <div>
              <h2>بسته و مشخصات</h2>
            </div>
            <dl className="sb-spec-table">
              {visibleSpecs.map(([label, value]) => (
                <div key={`${selectedId}-${label}`}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </div>
        </section>
      )}

      <div className="sb-product-mobile-cta">
        <div><span>{displayName}</span><strong>{pricing.label}</strong></div>
        <Link href={inquiryLink}>بررسی موجودی</Link>
      </div>
    </>
  );
}
