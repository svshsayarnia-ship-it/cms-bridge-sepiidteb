import type { CSSProperties } from "react";

type CategoryHoverVisualProps = {
  slug: string;
  title: string;
};

const categoryStoryboards: Record<string, string> = {
  fillers: "/images/storyboard/fillers-triptych.webp",
  "skin-boosters": "/images/storyboard/mesogel-triptych.webp",
  "botulinum-toxins": "/images/storyboard/botox-triptych.webp",
  "rejuvenation-cocktails": "/images/storyboard/rejuvenation-boho-triptych.webp",
  "brightening-cocktails": "/images/storyboard/brightening-boho-triptych.webp",
  "eye-cocktails": "/images/storyboard/eye-contour-boho-triptych.webp",
  "hair-cocktails": "/images/storyboard/hair-triptych.webp",
  "hyaluronidase-products": "/images/storyboard/correction-boho-triptych.webp",
};

export function CategoryHoverVisual({
  slug,
  title,
}: CategoryHoverVisualProps) {
  const image = categoryStoryboards[slug] ?? categoryStoryboards.fillers;
  const style = { "--category-story-image": `url(${image})` } as CSSProperties;

  return (
    <div
      className="sb-category-story"
      data-category={slug}
      style={style}
      aria-hidden="true"
    >
      <span className="sb-category-story__paper" />
      <span className="sb-category-story__frame sb-category-story__frame--before" />
      <span className="sb-category-story__frame sb-category-story__frame--process" />
      <span className="sb-category-story__frame sb-category-story__frame--after" />

      <svg className="sb-category-story__botanical" viewBox="0 0 96 132" role="presentation">
        <path d="M72 126C40 92 43 47 66 9" />
        <path d="M58 87c-16-2-25-10-28-24 14 1 24 9 28 24ZM55 58c12-5 20-15 21-29-13 4-20 14-21 29ZM64 101c12-4 21-12 25-25-14 2-23 11-25 25Z" />
      </svg>

      <span className="sb-category-story__sun" />
      <span className="sb-category-story__state sb-category-story__state--before">حالت اولیه</span>
      <span className="sb-category-story__state sb-category-story__state--after">نتیجهٔ دسته</span>
      <span className="sb-category-story__hint">برای دیدن تغییر، روی کارت بروید</span>
      <span className="sb-sr-only">نمایش تغییر مرتبط با دستهٔ {title}</span>
    </div>
  );
}
