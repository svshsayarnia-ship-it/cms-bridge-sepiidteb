"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useState } from "react";
import { ArrowIcon } from "./Icons";
import { CategoryHoverVisual } from "./CategoryHoverVisual";

type CategoryStoryCardProps = {
  index: number;
  slug: string;
  title: string;
  en: string;
};

const categoryDetails: Record<string, { note: string; tags: string[] }> = {
  fillers: { note: "فرم و حجم طبیعی", tags: ["فرم صورت", "حجم", "کانتور"] },
  "skin-boosters": { note: "آبرسانی و کیفیت پوست", tags: ["رطوبت", "شفافیت", "بافت پوست"] },
  "botulinum-toxins": { note: "کنترل خطوط پویا", tags: ["خطوط پیشانی", "اخم", "کنترل حرکت"] },
  "rejuvenation-cocktails": { note: "بازسازی و شادابی", tags: ["جوان‌سازی", "طراوت", "کیفیت پوست"] },
  "brightening-cocktails": { note: "روشنایی و یکنواختی", tags: ["لک", "تیرگی", "روشن‌کننده"] },
  "eye-cocktails": { note: "مراقبت ظریف دور چشم", tags: ["تیرگی", "پف", "خطوط ظریف"] },
  "hair-cocktails": { note: "تقویت مو و پوست سر", tags: ["ریزش", "تراکم", "پوست سر"] },
  "hyaluronidase-products": { note: "اصلاح و بازگشت", tags: ["اصلاح فرم", "تعادل", "بازگشت طبیعی"] },
};

const persianDigits = new Intl.NumberFormat("fa-IR", {
  minimumIntegerDigits: 2,
  useGrouping: false,
});

export function CategoryStoryCard({
  index,
  slug,
  title,
  en,
}: CategoryStoryCardProps) {
  const [previewed, setPreviewed] = useState(false);
  const detail = categoryDetails[slug] ?? {
    note: "انتخاب تخصصی",
    tags: ["محصولات", "مشخصات", "استعلام"],
  };

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const clickedCta = (event.target as HTMLElement).closest(".sb-category-card__cta");

    if (isTouch && !previewed && !clickedCta) {
      event.preventDefault();
      setPreviewed(true);
    }
  }

  return (
    <Link
      className={`sb-category-card${previewed ? " sb-category-card--previewed" : ""}`}
      href={`/shop/${slug}`}
      onClick={handleClick}
      onBlur={() => setPreviewed(false)}
      aria-label={`${title}؛ ${detail.note}`}
    >
      <div className="sb-category-card__copy">
        <span className="sb-category-card__number">{persianDigits.format(index + 1)}</span>
        <div>
          <h3>{title}</h3>
          <small>{en}</small>
        </div>
      </div>

      <span className="sb-category-card__cta">
        <b>مشاهده محصولات</b>
        <ArrowIcon />
      </span>

      <CategoryHoverVisual slug={slug} title={title} />

      <div className="sb-category-card__footer">
        <p>{detail.note}</p>
        <ul aria-hidden="true">
          {detail.tags.map((tag) => <li key={tag}>{tag}</li>)}
        </ul>
      </div>
    </Link>
  );
}
