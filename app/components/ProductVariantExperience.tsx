"use client";

/* eslint-disable @next/next/no-img-element -- local editorial product imagery */
import Link from "next/link";
import { useState } from "react";
import type { Product } from "../data";
import { ArrowIcon, CheckIcon, PackageIcon, ShieldIcon } from "./Icons";

type Pricing = {
  label: string;
  note: string;
};

type ProductVariantExperienceProps = {
  product: Product;
  liveImage: { src: string; alt: string } | null;
  livePricing: Pricing | null;
  liveShortDescription: string;
  liveDescription: string;
  reviewerName?: string;
  reviewerRole?: string;
  reviewedAtLabel?: string;
};

const priceFormatter = new Intl.NumberFormat("fa-IR");

function formatStaticPrice(value?: number) {
  return value && value > 0
    ? `${priceFormatter.format(value)} تومان`
    : "استعلام همان روز";
}

function buildInquiryLink(name: string, volume?: string) {
  const message = `سلام، برای «${name}»${volume ? ` با بسته ${volume}` : ""} موجودی، قیمت و مشخصات همان بچ را استعلام می‌کنم.`;
  return `https://wa.me/989037251266?text=${encodeURIComponent(message)}`;
}

export function ProductVariantExperience({
  product,
  liveImage,
  livePricing,
  liveShortDescription,
  liveDescription,
  reviewerName,
  reviewerRole,
  reviewedAtLabel,
}: ProductVariantExperienceProps) {
  const [selectedId, setSelectedId] = useState(product.variants?.[0]?.id ?? "");
  const selectedVariant = product.variants?.find((variant) => variant.id === selectedId);
  const hasVariants = Boolean(product.variants?.length);
  const displayName = selectedVariant?.nameFa ?? product.nameFa;
  const displayNameEn = selectedVariant?.nameEn ?? product.nameEn;
  const displaySummary = selectedVariant?.summary ?? product.summary;
  const displayFeatures = selectedVariant?.features ?? product.features;
  const selectedSpecLabels = new Set(
    selectedVariant?.specs.map(([label]) => label) ?? [],
  );
  const displaySpecs = selectedVariant
    ? [
        ...product.specs.filter(([label]) => !selectedSpecLabels.has(label)),
        ...selectedVariant.specs,
      ]
    : product.specs;
  const displayVolume = selectedVariant?.volume ?? product.volume;
  const displayImage = selectedVariant?.image ?? liveImage?.src ?? product.image;
  const displayImageAlt = selectedVariant?.imageAlt ?? liveImage?.alt ?? product.imageAlt ?? `تصویر ${displayName}`;
  const imageVerified = selectedVariant?.imageVerified ?? (liveImage?.src ? true : product.imageVerified);
  const needsVerification = hasVariants ? !imageVerified : Boolean(product.warning) || !imageVerified;
  const sourceName = selectedVariant?.sourceName ?? product.sourceName;
  const sourceUrl = selectedVariant?.sourceUrl ?? product.sourceUrl;
  const sourceStatus = selectedVariant?.sourceStatus ?? product.sourceStatus;
  const pricing = hasVariants
    ? {
        label: formatStaticPrice(selectedVariant?.priceToman ?? product.priceToman),
        note: selectedVariant?.priceNote ?? product.priceNote ?? "قیمت فهرست موجودی؛ موجودی نهایی استعلام شود.",
      }
    : livePricing ?? {
        label: formatStaticPrice(product.priceToman),
        note: product.priceNote ?? "قیمت فهرست موجودی؛ موجودی نهایی استعلام شود.",
      };
  const inquiryLink = buildInquiryLink(displayName, displayVolume);

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
              <span>
                {imageVerified
                  ? "عکس واقعی محصول با ادیت اختصاصی سفید بیوتی"
                  : "تصویر بسته هنگام استعلام نهایی می‌شود"}
              </span>
            </div>
            <div className="sb-product-gallery__proofs">
              <article>
                <ShieldIcon />
                <strong>تطبیق همان مدل</strong>
                <p>نام، حجم، بچ‌کد و تاریخ</p>
              </article>
              <article>
                <PackageIcon />
                <strong>واحد قیمت روشن</strong>
                <p>هر سرنگ، ویال یا جعبه کامل</p>
              </article>
            </div>
          </div>

          <div className="sb-product-summary">
            <div className="sb-product-summary__top">
              <span>{product.categoryTitle}</span>
              <span>{product.brand}</span>
            </div>
            <h1>{displayName}</h1>
            <p className="sb-product-summary__en">{displayNameEn}</p>

            {hasVariants && (
              <div className="sb-product-variants">
                <div className="sb-product-variants__head">
                  <strong>انتخاب مدل</strong>
                  <span>{displayVolume}</span>
                </div>
                <div className="sb-product-variants__options" role="group" aria-label="انتخاب مدل محصول">
                  {product.variants?.map((variant) => (
                    <button
                      type="button"
                      aria-pressed={variant.id === selectedId}
                      className={variant.id === selectedId ? "is-active" : ""}
                      key={variant.id}
                      onClick={() => setSelectedId(variant.id)}
                    >
                      {variant.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!hasVariants && liveShortDescription ? (
              <div
                className="sb-product-summary__lead sb-product-rich-text"
                dangerouslySetInnerHTML={{ __html: liveShortDescription }}
              />
            ) : (
              <p className="sb-product-summary__lead" aria-live="polite">{displaySummary}</p>
            )}

            {sourceStatus && (
              <div className={`sb-product-summary__verification${needsVerification ? " sb-product-summary__verification--warning" : ""}`}>
                <span>وضعیت تطبیق اطلاعات</span>
                <strong>{needsVerification ? "نیازمند تأیید بسته" : "بررسی‌شده"}</strong>
                <p>{sourceStatus}</p>
              </div>
            )}

            <div className="sb-product-summary__facts">
              <div><span>حجم انتخاب‌شده</span><strong>{displayVolume ?? "روی بسته موجود"}</strong></div>
              <div><span>وضعیت</span><strong>موجود در فهرست فعلی</strong></div>
            </div>

            <ul className="sb-product-summary__features">
              {displayFeatures.map((feature) => (
                <li key={feature}><CheckIcon />{feature}</li>
              ))}
            </ul>

            <div className="sb-product-summary__order">
              <div>
                <span>قیمت فهرست فعلی</span>
                <strong>{pricing.label}</strong>
                <small>{pricing.note}</small>
              </div>
              <Link className="sb-btn sb-btn--dark" href={inquiryLink}>
                استعلام همین مدل و همین بسته
                <ArrowIcon />
              </Link>
            </div>
            <p className="sb-product-summary__notice">
              استفاده این محصولات فقط در محیط حرفه‌ای و توسط فرد واجد صلاحیت انجام می‌شود.
            </p>
          </div>
        </div>
      </section>

      <nav className="sb-product-anchor-nav" aria-label="بخش‌های صفحه محصول">
        <div className="sb-shell">
          {liveDescription && <a href="#description">توضیحات</a>}
          <a href="#specs">مشخصات</a>
          <a href="#authenticity">کنترل اصالت</a>
          <a href="#safety">نکات مهم</a>
          <a href="#questions">پرسش‌ها</a>
        </div>
      </nav>

      {liveDescription && (
        <section className="sb-section sb-product-description" id="description">
          <div className="sb-shell sb-product-description__grid">
            <div className="sb-product-description__heading">
              <span className="sb-eyebrow">PRODUCT / DESCRIPTION</span>
              <h2>توضیحات محصول</h2>
              <p>ترکیبات، کاربرد حرفه‌ای و نکات مهم محصول را یک‌جا بخوانید.</p>
            </div>
            <article className="sb-product-description__content sb-product-rich-text" dangerouslySetInnerHTML={{ __html: liveDescription }} />
          </div>
        </section>
      )}

      <section className="sb-section sb-product-info-section" id="specs">
        <div className="sb-shell sb-product-info-section__grid">
          <div>
            <span className="sb-eyebrow">PRODUCT / SPECIFICATIONS</span>
            <h2>مشخصات همین انتخاب</h2>
            <p>با تغییر مدل، این جدول و عکس هم‌زمان عوض می‌شوند. برچسب همان بسته مرجع نهایی تحویل است.</p>
          </div>
          <dl className="sb-spec-table">
            {displaySpecs.map(([label, value]) => (
              <div key={`${selectedId}-${label}`}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
            {sourceName && (
              <div>
                <dt>منبع اطلاعات</dt>
                <dd>
                  {sourceUrl && /^https?:\/\//i.test(sourceUrl)
                    ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer">{sourceName}</a>
                    : sourceName}
                </dd>
              </div>
            )}
            {reviewerName && <div><dt>بازبینی محتوا</dt><dd>{reviewerName}{reviewerRole ? ` — ${reviewerRole}` : ""}</dd></div>}
            {reviewedAtLabel && <div><dt>تاریخ آخرین بازبینی</dt><dd>{reviewedAtLabel}</dd></div>}
          </dl>
        </div>
      </section>

      <div className="sb-product-mobile-cta">
        <div><span>{displayName}</span><strong>{pricing.label}</strong></div>
        <Link href={inquiryLink}>استعلام همین مدل</Link>
      </div>
    </>
  );
}
