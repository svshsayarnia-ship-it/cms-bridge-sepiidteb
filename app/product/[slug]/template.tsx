"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import styles from "./technical-specs.module.css";

type PublicSpecsPayload = {
  slug: string;
  nameFa: string;
  rows: Array<[string, string]>;
  audience: string;
  warning: string;
  sourceStatus: string;
  reviewedAt: string;
};

function formatReviewDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default function ProductTemplate({ children }: { children: ReactNode }) {
  const params = useParams<{ slug?: string | string[] }>();
  const rawSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const slug = useMemo(() => rawSlug?.trim() ?? "", [rawSlug]);
  const [details, setDetails] = useState<PublicSpecsPayload | null>(null);

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();
    setDetails(null);

    void fetch(`/api/product-public-specs?slug=${encodeURIComponent(slug)}`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as PublicSpecsPayload;
      })
      .then((payload) => {
        if (payload) setDetails(payload);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("[product-public-specs] failed", error);
      });

    return () => controller.abort();
  }, [slug]);

  const reviewedAt = details ? formatReviewDate(details.reviewedAt) : "";
  const notes = details
    ? [details.audience, details.warning, details.sourceStatus].filter(Boolean)
    : [];

  return (
    <>
      {children}

      {details && details.rows.length > 0 ? (
        <section className={styles.section} dir="rtl" aria-labelledby="technical-product-specs-title">
          <div className={styles.shell}>
            <div className={styles.headingRow}>
              <div>
                <p className={styles.eyebrow}>PRODUCT IDENTITY & SAFETY</p>
                <h2 id="technical-product-specs-title" className={styles.title}>
                  شناسنامه فنی و اطلاعات ایمنی {details.nameFa}
                </h2>
                <p className={styles.lead}>
                  مشخصات زیر فقط از داده‌های شناسنامه‌ای، بسته‌بندی و اطلاعات ایمنی ثبت‌شده برای همین مدل نمایش داده می‌شوند.
                </p>
              </div>
              {reviewedAt ? (
                <div className={styles.reviewBadge}>
                  <span>آخرین بازبینی داده</span>
                  <strong>{reviewedAt}</strong>
                </div>
              ) : null}
            </div>

            <dl className={styles.grid}>
              {details.rows.map(([label, value]) => (
                <div className={styles.specCard} key={`${label}-${value}`}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            {notes.length > 0 ? (
              <div className={styles.notes}>
                <h3>وضعیت داده و ایمنی</h3>
                {notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
