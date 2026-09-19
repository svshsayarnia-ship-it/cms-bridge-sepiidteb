"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProductVisualProfile } from "../config/visualProfiles";
import type { Product, ProductVariant } from "../data";
import { isCmsManagedProductImageSrc } from "../lib/product-image";
import { isPublicVariantImageSrc } from "../lib/public-product";
import { getPublicPackagingLabel, toPublicCopy } from "../lib/public-copy";
import { ProductVisual } from "./product/ProductVisual";
import { AddToCartButton } from "./AddToCartButton";

type Pricing = {
  label: string;
  note: string;
};

type PublicRoleImage = {
  src: string;
  alt: string;
};

type ProductImageRolesResponse = {
  cardImage: PublicRoleImage | null;
  variantImages: Record<string, PublicRoleImage>;
};

type VariantPriceOverride = {
  regularPrice: string;
  salePrice: string;
  updatedAt?: string;
};

type ProductVariantPricesResponse = {
  prices: Record<string, VariantPriceOverride>;
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
  | "slug"
  | "nameFa"
  | "nameEn"
  | "brand"
  | "category"
  | "categoryTitle"
  | "image"
  | "fallbackImage"
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
    : "قیمت را بپرسید";
}

const internalProductTerms = /تطبیق|تأیید|تایید|فهرست|گزارش|مرجع|بچ‌کد|پلمب|نمایه|مسیر استعلام|داده‌های بازار|این صفحه برای/u;

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
  const [cmsVariantImages, setCmsVariantImages] = useState<
    Record<string, PublicRoleImage>
  >({});
  const [cmsCardImage, setCmsCardImage] = useState<PublicRoleImage | null>(null);
  const [cmsVariantPrices, setCmsVariantPrices] = useState<
    Record<string, VariantPriceOverride>
  >({});
  const variantIds = product.variants?.map((variant) => variant.id).join(",") ?? "";

  useEffect(() => {
    if (!variantIds || typeof window === "undefined") return;

    const pathnameParts = window.location.pathname.split("/").filter(Boolean);
    const slug = decodeURIComponent(pathnameParts[pathnameParts.length - 1] ?? "");
    if (!slug) return;

    const controller = new AbortController();
    const query = new URLSearchParams({
      slug,
      variants: variantIds,
    });

    void fetch(`/api/product-image-roles?${query.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as ProductImageRolesResponse;
      })
      .then((data) => {
        if (data?.cardImage) setCmsCardImage(data.cardImage);
        if (data?.variantImages) setCmsVariantImages(data.variantImages);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("[product-variant] role image load failed", error);
      });

    return () => controller.abort();
  }, [variantIds]);

  useEffect(() => {
    if (!variantIds || !product.slug) return;

    const controller = new AbortController();
    const query = new URLSearchParams({ slug: product.slug });
    void fetch(`/api/product-variant-prices?${query.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as ProductVariantPricesResponse;
      })
      .then((data) => {
        if (data?.prices) setCmsVariantPrices(data.prices);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("[product-variant] price override load failed", error);
      });

    return () => controller.abort();
  }, [product.slug, variantIds]);

  const selectedVariant = product.variants?.find((variant) => variant.id === selectedId);
  const selectedCmsVariantImage = selectedVariant
    ? cmsVariantImages[selectedVariant.id]
    : undefined;
  const hasVariants = Boolean(product.variants?.length);
  const displayName = selectedVariant?.nameFa ?? product.nameFa;
  const displayNameEn = selectedVariant?.nameEn ?? product.nameEn;
  const displaySummary = selectedVariant?.summary ?? product.summary;
  const visibleSummary = conciseProductCopy(
    !hasVariants && liveShortDescription ? liveShortDescription : displaySummary,
    getSupplierTerms(product.brand),
  );
  const editorialDescription = hasVariants
    ? ""
    : toPublicCopy(liveDescription || product.summary);
  const variantEditorialDescription = hasVariants
    ? toPublicCopy(displaySummary)
    : "";
  const selectedSpecLabels = new Set(
    selectedVariant?.specs.map(([label]) => label) ?? [],
  );
  const hasModelListSpec = product.specs.some(([label]) => label === "مدل‌های موجود");
  const currentVariantList = product.variants
    ?.map((variant) => variant.label.replace(/^مدل\s+/u, "").trim())
    .filter(Boolean)
    .join("، ");
  const currentProductSpecs =
    hasVariants && hasModelListSpec && currentVariantList
      ? [
          ["مدل‌های موجود", currentVariantList] as [string, string],
          ...product.specs.filter(([label]) => label !== "مدل‌های موجود"),
        ]
      : product.specs;
  const displaySpecs = selectedVariant
    ? [
        ...currentProductSpecs.filter(([label]) => !selectedSpecLabels.has(label)),
        ...selectedVariant.specs,
      ]
    : currentProductSpecs;
  const visibleSpecs = getVisibleSpecs(displaySpecs);
  const displayVolume = selectedVariant?.volume ?? product.volume;
  const packagingLabel = getPublicPackagingLabel(displayVolume);

  // CMS is the sole source of product media. A variant switch may use the
  // exact CMS role image; when that role is empty, retain the CMS primary image
  // rather than reviving an older bundled or WooCommerce photograph.
  const canonicalImage =
    [liveImage?.src, cmsCardImage?.src, catalogImage?.src, product.image].find((src) =>
      isCmsManagedProductImageSrc(src),
    ) || "";
  const canonicalImageAlt =
    liveImage?.alt ||
    cmsCardImage?.alt ||
    catalogImage?.alt ||
    product.imageAlt ||
    `تصویر ${product.nameFa}`;
  const selectedCmsImage = selectedCmsVariantImage?.src?.trim() || "";
  const selectedLocalImage =
    selectedVariant &&
    isPublicVariantImageSrc(
      selectedVariant.image,
      selectedVariant.imageVerified,
    )
      ? selectedVariant.image.trim()
      : "";
  const selectedVariantImage = selectedCmsImage || selectedLocalImage;
  const displayImage = selectedVariant
    ? selectedVariantImage
    : canonicalImage;
  const displayImageAlt = selectedVariant
    ? selectedCmsVariantImage?.alt ||
      selectedVariant.imageAlt ||
      (displayImage
        ? `نمای ${displayName}`
        : `تصویر اختصاصی ${displayName} در حال تکمیل است`)
    : canonicalImageAlt;
  const displayImageIsCms = Boolean(
    displayImage && isCmsManagedProductImageSrc(displayImage),
  );
  const displayImageKind = selectedVariant
    ? selectedVariant.imageKind
    : product.imageKind;
  const isEditorialFamilyImage =
    !selectedVariant && displayImageKind === "editorial-family";

  const hasSavedVariantPrice = Boolean(
    selectedVariant &&
      Object.prototype.hasOwnProperty.call(cmsVariantPrices, selectedVariant.id),
  );
  const savedVariantPrice = selectedVariant
    ? cmsVariantPrices[selectedVariant.id]
    : undefined;
  const savedCurrentPrice = Number(
    savedVariantPrice?.salePrice || savedVariantPrice?.regularPrice || 0,
  );
  const selectedPriceToman = hasSavedVariantPrice
    ? (Number.isFinite(savedCurrentPrice) && savedCurrentPrice > 0
        ? savedCurrentPrice
        : undefined)
    : selectedVariant?.priceToman ?? product.priceToman;

  const pricing = hasVariants
    ? hasSavedVariantPrice
      ? {
          label: formatStaticPrice(selectedPriceToman),
          note:
            savedVariantPrice?.salePrice && savedVariantPrice.regularPrice
              ? `قیمت عادی: ${formatStaticPrice(Number(savedVariantPrice.regularPrice))}`
              : "قیمت ثبت‌شده در سایت",
        }
      : {
          label: formatStaticPrice(selectedVariant?.priceToman ?? product.priceToman),
          note: selectedVariant?.priceNote ?? product.priceNote ?? "قیمت امروز",
        }
    : livePricing ?? {
        label: formatStaticPrice(product.priceToman),
        note: product.priceNote ?? "قیمت امروز",
      };

  const inquiryProduct = {
    slug: product.slug,
    nameFa: displayName,
    nameEn: displayNameEn,
    brand: product.brand,
    image: displayImage,
    volume: displayVolume,
    priceToman: selectedPriceToman,
  };

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
      <section className="sb-product-detail" data-category={product.category}>
        <div className="sb-shell sb-product-detail__grid">
          <div className="sb-product-gallery">
            <div className="sb-product-gallery__main">
              <ProductVisual
                key={displayImage}
                product={{
                  nameFa: displayName,
                  category: product.category,
                  masterImage: displayImageIsCms ? displayImage : "",
                  fallbackImage: selectedVariant
                    ? !displayImageIsCms && displayImage
                      ? displayImage
                      : undefined
                    : product.fallbackImage,
                  imageAlt: displayImageAlt,
                  visualProfile: product.visualProfile,
                  visualScale: product.visualScale,
                  visualOffsetX: product.visualOffsetX,
                  visualOffsetY: product.visualOffsetY,
                }}
                variant="detail"
                priority
              />
              {selectedVariant && !displayImage && (
                <span className="sb-product-gallery__image-note" role="status">
                  تصویر اختصاصی این مدل هنوز ثبت نشده است.
                </span>
              )}
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
                این تصویر نمای خانواده محصول است. قبل از سفارش، مدل دقیق روی بسته را با ما چک کنید.
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
                  <strong>مدل را انتخاب کنید</strong>
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
                <small>{toPublicCopy(pricing.note)}</small>
              </div>
              <AddToCartButton product={inquiryProduct} />
            </div>
            <p className="sb-product-summary__notice">
              افزودن به لیست استعلام به معنی خرید یا پرداخت قطعی نیست؛ قیمت و موجودی روز قبل از تأیید سفارش بررسی می‌شود.
            </p>
          </div>
        </div>
      </section>

      {(variantEditorialDescription || editorialDescription) && (
        <section className="sb-section sb-product-description" id="description">
          <div className="sb-shell sb-product-description__grid">
            <div className="sb-product-description__heading">
              <h2>بیشتر درباره {displayName}</h2>
            </div>
            {hasVariants ? (
              <article className="sb-product-description__content sb-product-rich-text">
                <p>{variantEditorialDescription}</p>
              </article>
            ) : (
              <article className="sb-product-description__content sb-product-rich-text" dangerouslySetInnerHTML={{ __html: editorialDescription }} />
            )}
          </div>
        </section>
      )}

      {visibleSpecs.length > 0 && (
        <section className="sb-section sb-product-info-section" id="specs">
          <div className="sb-shell sb-product-info-section__grid">
            <div>
              <h2>مشخصات و بسته‌بندی</h2>
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
        <AddToCartButton
          product={inquiryProduct}
          className="sb-btn sb-btn--dark"
          label="استعلام قیمت و موجودی"
        />
      </div>
    </>
  );
}
