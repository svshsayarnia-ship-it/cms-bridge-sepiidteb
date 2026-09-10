"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { SitePresentation } from "../lib/site-presentation";
import { ArrowIcon } from "./Icons";

type HeroTreatment = {
  id: string;
  label: string;
  result: string;
  href: string;
  image: string;
  alt: string;
};

const HERO_TREATMENTS: HeroTreatment[] = [
  {
    id: "filler",
    label: "فیلرها",
    result: "حجم‌دهی متعادل لب و صورت",
    href: "/shop/fillers",
    image: "/images/hero-treatments/filler-before-after.webp",
    alt: "تغییر ظریف حجم لب و صورت پس از استفاده از فیلر",
  },
  {
    id: "botox",
    label: "بوتاکس‌ها",
    result: "ظاهر آرام‌تر و لیفت ملایم ابرو",
    href: "/shop/botulinum-toxins",
    image: "/images/hero-treatments/botox-before-after.webp",
    alt: "تغییر ظریف پیشانی و ابرو پس از بوتاکس",
  },
  {
    id: "mesogel",
    label: "مزوژل‌ها",
    result: "پوست شاداب‌تر و درخشان‌تر",
    href: "/shop/skin-boosters",
    image: "/images/hero-treatments/mesogel-before-after.webp",
    alt: "تغییر شفافیت و شادابی پوست پس از مزوژل",
  },
  {
    id: "cocktail",
    label: "کوکتل‌ها",
    result: "پوست یکدست‌تر و موهای پُرتر",
    href: "/shop/rejuvenation-cocktails",
    image: "/images/hero-treatments/cocktail-before-after.webp",
    alt: "تغییر ظریف تراکم مو و یکدستی پوست پس از کوکتل تخصصی",
  },
];

export function EditableHomeHero({ hero }: { hero: SitePresentation["home"]["hero"] }) {
  const treatmentRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeTreatment = activeIndex === null ? null : HERO_TREATMENTS[activeIndex];

  const selectNearestTreatment = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;

    let nearestIndex = -1;
    let nearestDistance = Number.POSITIVE_INFINITY;

    treatmentRefs.current.forEach((treatment, index) => {
      if (!treatment) return;
      const rect = treatment.getBoundingClientRect();
      const distance = Math.hypot(
        event.clientX - (rect.left + rect.width / 2),
        event.clientY - (rect.top + rect.height / 2),
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveIndex(nearestDistance < 155 && nearestIndex >= 0 ? nearestIndex : null);
  }, []);

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

        <div className="sb-hero__media" aria-label="تغییرات ظریف درمان‌های حرفه‌ای سپید بیوتی">
          <div className="sb-hero__media-meta" aria-hidden="true">
            <span>نتیجه را لمس کنید</span>
            <span>۰۱ — ۰۴</span>
          </div>

          <div
            className="sb-hero__stage"
            onPointerMove={selectNearestTreatment}
            onPointerLeave={() => setActiveIndex(null)}
          >
            <span className={`sb-hero__halo${activeIndex !== null ? " sb-hero__halo--active" : ""}`} aria-hidden="true" />
            <span className="sb-hero__halo sb-hero__halo--secondary" aria-hidden="true" />

            <div className="sb-hero__treatment-row">
              {HERO_TREATMENTS.map((treatment, index) => {
                const isActive = index === activeIndex;
                const style = { "--sb-treatment-portrait": `url(${treatment.image})` } as CSSProperties;

                return (
                  <Link
                    key={treatment.id}
                    ref={(element) => {
                      treatmentRefs.current[index] = element;
                    }}
                    href={treatment.href}
                    className={`sb-hero__treatment${isActive ? " sb-hero__treatment--active" : ""}`}
                    aria-label={`${treatment.label}: ${treatment.result}. ورود به دسته ${treatment.label}`}
                    onPointerEnter={(event) => {
                      if (event.pointerType !== "touch") setActiveIndex(index);
                    }}
                    onFocus={() => setActiveIndex(index)}
                  >
                    <span className="sb-hero__face" style={style} aria-hidden="true">
                      <span className="sb-hero__face-before" />
                      <span className="sb-hero__face-after" />
                      <span className="sb-hero__face-gloss" />
                    </span>
                    <span className="sb-hero__treatment-label">{treatment.label}</span>
                    <span className="sb-hero__treatment-state">{isActive ? "ورود به دسته" : "مشاهده و انتخاب"}</span>
                  </Link>
                );
              })}
            </div>

            <div className={`sb-hero__active-caption${activeTreatment ? " sb-hero__active-caption--visible" : ""}`} aria-live="polite">
              <span>{activeTreatment ? "بعد از درمان" : "قبل و بعد"}</span>
              <strong>{activeTreatment?.label ?? "یک دسته را لمس کنید"}</strong>
              <small>{activeTreatment?.result ?? "تغییر ظریف، قابل مشاهده"}</small>
            </div>
          </div>

          <div className="sb-hero__media-foot" aria-hidden="true">
            <span>۴ درمان حرفه‌ای</span>
            <span>لمس یا حرکت موس برای مشاهده تغییر</span>
          </div>
        </div>
      </div>
    </section>
  );
}
