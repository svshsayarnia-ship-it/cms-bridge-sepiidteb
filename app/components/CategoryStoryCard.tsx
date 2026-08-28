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
};

const categoryDetails: Record<
  string,
  { displayTitle: string; note: string; summary: string }
> = {
  fillers: {
    displayTitle: "فیلر",
    note: "فرم و حجم طبیعی",
    summary: "انتخاب بر اساس ناحیه، فرم و حجم موردنیاز",
  },
  "skin-boosters": {
    displayTitle: "مزوژل",
    note: "آبرسانی و کیفیت پوست",
    summary: "محصولات مرتبط با رطوبت، شفافیت و بافت پوست",
  },
  "botulinum-toxins": {
    displayTitle: "بوتاکس",
    note: "کنترل خطوط پویا",
    summary: "محصولات مرتبط با خطوط پیشانی، اخم و دور چشم",
  },
  "rejuvenation-cocktails": {
    displayTitle: "جوان‌سازی",
    note: "بازسازی و شادابی",
    summary: "کوکتل‌های مرتبط با طراوت و کیفیت ظاهری پوست",
  },
  "brightening-cocktails": {
    displayTitle: "روشن‌کننده",
    note: "روشنایی و یکنواختی",
    summary: "محصولات مرتبط با لک، تیرگی و یکنواختی رنگ پوست",
  },
  "eye-cocktails": {
    displayTitle: "دور چشم",
    note: "مراقبت ظریف دور چشم",
    summary: "محصولات مرتبط با تیرگی، پف و خطوط ظریف",
  },
  "hair-cocktails": {
    displayTitle: "تقویت مو",
    note: "مو و پوست سر",
    summary: "کوکتل‌های مرتبط با ریزش، تراکم و مراقبت پوست سر",
  },
  "hyaluronidase-products": {
    displayTitle: "هیالورونیداز",
    note: "اصلاح و بازگشت",
    summary: "محصولات حرفه‌ای مرتبط با اصلاح و بازگشت تعادل",
  },
};

const persianDigits = new Intl.NumberFormat("fa-IR", {
  minimumIntegerDigits: 2,
  useGrouping: false,
});

export function CategoryStoryCard({
  index,
  slug,
  title,
}: CategoryStoryCardProps) {
  const [previewed, setPreviewed] = useState(false);
  const detail = categoryDetails[slug] ?? {
    displayTitle: title,
    note: "انتخاب تخصصی",
    summary: "مشاهده محصولات و مشخصات این دسته",
  };

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

    if (isTouch && !previewed) {
      event.preventDefault();
      setPreviewed(true);
    }
  }

  return (
    <Link
      aria-label={`${title}؛ ${detail.note}`}
      className={`sb-category-card${previewed ? " sb-category-card--previewed" : ""}`}
      href={`/shop/${slug}`}
      onBlur={() => setPreviewed(false)}
      onClick={handleClick}
    >
      <CategoryHoverVisual
        displayTitle={detail.displayTitle}
        note={detail.note}
        slug={slug}
        summary={detail.summary}
        title={title}
      />

      <div className="sb-category-card__content">
        <span className="sb-category-card__number">
          {persianDigits.format(index + 1)}
        </span>
        <div>
          <h3>{title}</h3>
          <small>{detail.note}</small>
        </div>
        <span className="sb-category-card__arrow" aria-hidden="true">
          <ArrowIcon />
        </span>
      </div>
    </Link>
  );
}
