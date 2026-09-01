import type { ReactNode } from "react";

import type { CmsProduct } from "../../lib/cms-types";
import { getRuntimeStorefrontProduct } from "../../lib/storefront-runtime-cache";

const reviewDateFormatter = new Intl.DateTimeFormat("fa-IR", {
  dateStyle: "long",
  timeZone: "UTC",
});

const placeholderValuePattern =
  /^(?:-|—|n\/?a|none|null|undefined)|در حال تکمیل|تکمیل می‌شود|نامشخص|ثبت نشده|بدون اطلاعات|pending|todo/iu;

type VerifiedSourceFallback = {
  sourceName: string;
  sourceUrl: string;
  sourceCheckedAt: string;
};

const NEURAMIS_OFFICIAL_SOURCE: VerifiedSourceFallback = {
  sourceName: "Medytox — صفحه رسمی Neuramis®",
  sourceUrl: "https://medytox.com/page/neuramis_en?site_id=en",
  sourceCheckedAt: "2026-09-01",
};

function cleanPublicValue(value: string | null | undefined) {
  const clean = (value ?? "").replace(/\s+/g, " ").trim();
  if (!clean || placeholderValuePattern.test(clean)) return "";
  return clean;
}

function safeExternalUrl(value: string | null | undefined) {
  const clean = (value ?? "").trim();
  if (!clean) return "";

  try {
    const url = new URL(clean);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

function formatReviewDate(value: string | null | undefined) {
  const clean = (value ?? "").trim();
  if (!clean) return "";

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/u.test(clean) ? `${clean}T00:00:00.000Z` : clean,
  );

  return Number.isNaN(date.getTime()) ? "" : reviewDateFormatter.format(date);
}

function storefrontSlugCandidates(slug: string) {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return [];

  const candidates = [cleanSlug];
  const withoutDuplicateSuffix = cleanSlug.replace(/-\d+$/, "");

  if (withoutDuplicateSuffix !== cleanSlug) {
    candidates.push(withoutDuplicateSuffix);
  } else {
    for (let suffix = 2; suffix <= 4; suffix += 1) {
      candidates.push(`${cleanSlug}-${suffix}`);
    }
  }

  return candidates;
}

function latestProduct(products: CmsProduct[]) {
  return products.reduce<CmsProduct | null>((latest, product) => {
    if (!latest) return product;

    const latestModified = Date.parse(latest.dateModifiedGmt || "");
    const productModified = Date.parse(product.dateModifiedGmt || "");

    if (
      Number.isFinite(productModified) &&
      (!Number.isFinite(latestModified) || productModified > latestModified)
    ) {
      return product;
    }

    return latest;
  }, null);
}

async function getProductProvenance(slug: string) {
  const candidates = storefrontSlugCandidates(slug);
  if (candidates.length === 0) return null;

  const products = (
    await Promise.all(
      candidates.map((candidate) => getRuntimeStorefrontProduct(candidate)),
    )
  ).filter((product): product is CmsProduct => Boolean(product));

  return latestProduct(products);
}

function getVerifiedSourceFallback(slug: string): VerifiedSourceFallback | null {
  const normalizedSlug = slug.trim().toLowerCase();

  // Medytox's official Neuramis page covers the Neuramis family, including
  // Deep Lidocaine and Volume Lidocaine. Keep this as a fallback only: if the
  // CMS has a product-specific source, the CMS source wins.
  if (normalizedSlug.startsWith("neuramis")) {
    return NEURAMIS_OFFICIAL_SOURCE;
  }

  return null;
}

export default async function ProductDetailLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductProvenance(slug);
  const verifiedFallback = getVerifiedSourceFallback(slug);

  const cmsSourceUrl = safeExternalUrl(product?.sourceUrl);
  const fallbackSourceUrl = safeExternalUrl(verifiedFallback?.sourceUrl);
  const sourceUrl = cmsSourceUrl || fallbackSourceUrl;
  const sourceName =
    cleanPublicValue(product?.sourceName) ||
    (fallbackSourceUrl ? verifiedFallback?.sourceName ?? "" : "");
  const reviewerName = cleanPublicValue(product?.reviewerName);
  const reviewerRole = cleanPublicValue(product?.reviewerRole);
  const reviewedAt = formatReviewDate(product?.reviewedAt);
  const sourceCheckedAt = cmsSourceUrl
    ? ""
    : formatReviewDate(verifiedFallback?.sourceCheckedAt);

  const hasSource = Boolean(sourceUrl);
  const hasReviewer = Boolean(reviewerName);
  const hasReviewDate = Boolean(reviewedAt);
  const hasSourceCheckDate = Boolean(sourceCheckedAt);
  const hasProvenance =
    hasSource || hasReviewer || hasReviewDate || hasSourceCheckDate;

  return (
    <>
      {children}

      {hasProvenance ? (
        <section
          className="sb-section sb-product-info-section"
          id="product-provenance"
          aria-labelledby="product-provenance-title"
        >
          <div className="sb-shell sb-product-info-section__grid">
            <div>
              <h2 id="product-provenance-title">منبع و بازبینی اطلاعات محصول</h2>
              <p>
                این بخش فقط منبع رسمی یا اطلاعات بازبینی ثبت‌شده برای همین محصول
                را نمایش می‌دهد و جایگزین نظر پزشک یا دستور مصرف حرفه‌ای نیست.
              </p>
            </div>

            <dl className="sb-spec-table">
              {hasSource ? (
                <div>
                  <dt>منبع رسمی اطلاعات</dt>
                  <dd>
                    <a href={sourceUrl} rel="noreferrer" target="_blank">
                      {sourceName || new URL(sourceUrl).hostname.replace(/^www\./u, "")}
                    </a>
                  </dd>
                </div>
              ) : null}

              {hasSourceCheckDate ? (
                <div>
                  <dt>تاریخ بررسی منبع رسمی</dt>
                  <dd>{sourceCheckedAt}</dd>
                </div>
              ) : null}

              {hasReviewDate ? (
                <div>
                  <dt>آخرین بازبینی محتوا</dt>
                  <dd>{reviewedAt}</dd>
                </div>
              ) : null}

              {hasReviewer ? (
                <div>
                  <dt>بازبین محتوا</dt>
                  <dd>
                    {reviewerName}
                    {reviewerRole ? ` — ${reviewerRole}` : ""}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>
      ) : null}
    </>
  );
}
