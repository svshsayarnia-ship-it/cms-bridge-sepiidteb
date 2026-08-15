"use client";

/* eslint-disable @next/next/no-img-element -- local editorial product imagery */
import Link from "next/link";
import { useState } from "react";
import type { Product, ProductVariant } from "../data";
import { getPublicPackagingLabel } from "../lib/public-copy";
import { ArrowIcon } from "./Icons";

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
  variants?: ProductExperienceVariant[];
};

type ProductVariantExperienceProps = {
  product: ProductExperienceProduct;
  liveImage: { src: string; alt: string } | null;
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
    : "استعلام همان روز";
}

function buildInquiryLink(name: string, volume?: string) {
  const message = `سلام، موجودی و قیمت «${name}»${volume ? ` با بسته ${volume}` : ""} را می‌خواهم.`;
  return `https://wa.me/989037251266?text=${encodeURIComponent(message)}`;
}

const internalProductTerms = /سازنده|تولیدکننده|کشور|تطبیق|تأیید|تایید|بررسی|فهرست|گزارش|مرجع|بچ‌کد|پلمب/u;

function conciseProductCopy(value: string, supplierTerms: string[]) {
  const plain = value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) return "";

  const firstSentence = plain.split(/(?<=[.!؟])\s+/u)[0] ?? plain;

  if (
    internalProductTerms.test(firstSentence) ||
    supplierTerms.some((term) => term && firstSentence.toLowerCase().includes(term.toLowerCase()))
  ) {
    return "";
  }

  return firstSentence.length > 180
    ? `${firstSentence.slice(0, 177).trimEnd()}…`
    : firstSentence;
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

    const cleanValue = value
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
  livePricing,
  liveShortDescription,
  liveDescription,
  brandHref,
  initialVariantId,
}: ProductVariantExperienceProps) {
  const defaultVariantId = product.variants?.[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(
    product.variants?.some((variant) => variant.id === initialVariantId)
      ? initialVariantId ?? defaultVariantId
      : defaultVariantId,
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
  const displayImage = selectedVariant?.image ?? liveImage?.src ?? product.image;
  const displayImageAlt = selectedVariant?.imageAlt ?? liveImage?.alt ?? product.imageAlt ?? `تصویر ${displayName}`;
  const isEditorialFamilyImage =
    (selectedVariant?.imageKind ?? product.imageKind) === "editorial-family" &&
    !liveImage?.src;
  const pricing = livePricing ?? (hasVariants
    ? {
        label: formatStaticPrice(selectedVariant?.priceToman ?? product.priceToman),
        note: selectedVariant?.priceNote ?? product.priceNote ?? "قیمت و موجودی امروز",
      }
    : {
        label: formatStaticPrice(product.priceToman),
        note: product.priceNote ?? "قیمت و موجودی امروز",
      });
  const inquiryLink = buildInquiryLink(displayName, displayVolume);

  function selectVariant(id: string) {
    setSelectedId(id);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("variant", id);
      window.history.replaceState({}, "", url);
    }
  }

  return (
    <>
      <section className="sb-product-detail">
        <div className="sb-shell sb-product-detail__grid">
          <div className="sb-product-gallery">
            <div className="sb-product-gallery__main">
              <img
                key={displayImage}
                src={displayImage}
                alt={displayImageAlt}
                width="1254"
                height="1254"
                fetchPriority="high"
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
                تصویر ادیتوریال هم‌خانواده است؛ بسته دقیق هنگام استعلام تطبیق می‌شود.
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
            <h1>{displayName}</h1>
            <p className="sb-product-summary__en">{displayNameEn}</p>

            {hasVariants && (
              <div className="sb-product-variants">
                <div className="sb-product-variants__head">
                  <strong>انتخاب مدل</strong>
                  <span>
                    {displayVolume}
                    {packagingLabel ? ` · ${packagingLabel}` : ""}
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
              <p className="sb-product-summary__lead" aria-live="polite">
                {visibleSummary}
              </p>
            )}

            <div className="sb-product-summary__order">
              <div>
                <span>قیمت</span>
                <strong>{pricing.label}</strong>
                <small>{pricing.note}</small>
              </div>
              <Link className="sb-btn sb-btn--dark" href={inquiryLink}>
                استعلام موجودی و قیمت
                <ArrowIcon />
              </Link>
            </div>
            <p className="sb-product-summary__notice">
              ویژه استفاده حرفه‌ای
            </p>
          </div>
        </div>
      </section>

      {liveDescription && (
        <section className="sb-section sb-product-description" id="description">
          <div className="sb-shell sb-product-description__grid">
            <div className="sb-product-description__heading">
              <h2>توضیحات محصول</h2>
            </div>
            <article className="sb-product-description__content sb-product-rich-text" dangerouslySetInnerHTML={{ __html: liveDescription }} />
          </div>
        </section>
      )}

      {visibleSpecs.length > 0 && (
        <section className="sb-section sb-product-info-section" id="specs">
          <div className="sb-shell sb-product-info-section__grid">
            <div>
              <h2>مشخصات محصول</h2>
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
        <Link href={inquiryLink}>استعلام قیمت</Link>
      </div>
    </>
  );
}
