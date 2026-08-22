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

const categoryDetails: Record<
  string,
  { displayTitle: string; note: string; summary: string }
> = {
  fillers: {
    displayTitle: "فیلر",
    note: "مدل، حجم و شکل بسته",
    summary: "مدل‌ها را بر اساس نام، حجم و تعداد بسته کنار هم ببینید",
  },
  "skin-boosters": {
    displayTitle: "مزوژل",
    note: "مزوژل و اسکین‌بوستر",
    summary: "محصولات مرتبط با ظاهر و کیفیت پوست را جداگانه ببینید",
  },
  "botulinum-toxins": {
    displayTitle: "بوتاکس",
    note: "محصولات بوتولینوم",
    summary: "نام محصول، تعداد واحد و شرایط نگهداری را بررسی کنید",
  },
  "rejuvenation-cocktails": {
    displayTitle: "جوان‌سازی",
    note: "کوکتل‌های پوستی",
    summary: "مدل‌ها و محتویات بسته را قبل از سفارش بخوانید",
  },
  "brightening-cocktails": {
    displayTitle: "روشن‌کننده",
    note: "محصولات روشن‌کننده",
    summary: "نام مدل و ترکیبات نوشته‌شده روی بسته را مقایسه کنید",
  },
  "eye-cocktails": {
    displayTitle: "دور چشم",
    note: "محصولات دور چشم",
    summary: "این گروه را با توجه به حساسیت ناحیه، دقیق‌تر بررسی کنید",
  },
  "hair-cocktails": {
    displayTitle: "تقویت مو",
    note: "مو و پوست سر",
    summary: "مدل‌ها را بشناسید؛ علت ریزش را پزشک بررسی می‌کند",
  },
  "hyaluronidase-products": {
    displayTitle: "هیالورونیداز",
    note: "محصولات مصرف حرفه‌ای",
    summary: "قدرت و تعداد بسته را از روی اطلاعات همان محصول بخوانید",
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
  en,
}: CategoryStoryCardProps) {
  const [previewed, setPreviewed] = useState(false);
  const detail = categoryDetails[slug] ?? {
    displayTitle: title,
    note: "محصولات این گروه",
    summary: "محصولات و مشخصات این گروه را ببینید",
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
          <small>{en}</small>
        </div>
        <span className="sb-category-card__arrow" aria-hidden="true">
          <ArrowIcon />
        </span>
      </div>
    </Link>
  );
}
