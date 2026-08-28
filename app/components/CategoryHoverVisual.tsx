import Image from "next/image";

type CategoryHoverVisualProps = {
  slug: string;
  title: string;
  displayTitle: string;
  note: string;
  summary: string;
};

const categoryArtwork: Record<string, string> = {
  fillers: "/images/categories/boho-fillers.webp",
  "skin-boosters": "/images/categories/boho-skin-boosters.webp",
  "botulinum-toxins": "/images/categories/boho-botox-v2.webp",
  "rejuvenation-cocktails": "/images/categories/boho-rejuvenation.webp",
  "brightening-cocktails": "/images/categories/boho-brightening.webp",
  "eye-cocktails": "/images/categories/boho-eye.webp",
  "hair-cocktails": "/images/categories/boho-hair.webp",
  "hyaluronidase-products": "/images/categories/boho-hyaluronidase.webp",
};

export function CategoryHoverVisual({
  slug,
  title,
  displayTitle,
  note,
  summary,
}: CategoryHoverVisualProps) {
  const image = categoryArtwork[slug] ?? categoryArtwork.fillers;

  return (
    <div className="sb-category-visual" data-category={slug}>
      <Image
        alt=""
        aria-hidden="true"
        className="sb-category-visual__image"
        fill
        sizes="(max-width: 620px) 50vw, (max-width: 1080px) 33vw, 25vw"
        src={image}
      />
      <span className="sb-category-visual__veil" aria-hidden="true" />

      <span className="sb-category-visual__title">
        <small>بر اساس نیاز شما</small>
        <strong>{displayTitle}</strong>
      </span>

      <span className="sb-category-visual__destination">
        <b>{note}</b>
        <span>{summary}</span>
      </span>

      <span className="sb-sr-only">
        ورود به دستهٔ {title}؛ {note}
      </span>
    </div>
  );
}
