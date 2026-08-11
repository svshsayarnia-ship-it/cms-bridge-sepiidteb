type CategoryHoverVisualProps = {
  slug: string;
  title: string;
  en: string;
};

/**
 * A shared, image-free category visual.
 *
 * The form is intentionally identical for every category so newly added
 * categories never fall back to a mismatched vendor image. The category data
 * only controls the restrained accent tone and the English catalogue label.
 */
export function CategoryHoverVisual({
  slug,
  title,
  en,
}: CategoryHoverVisualProps) {
  return (
    <div
      className="sb-category-visual"
      data-category={slug}
      aria-hidden="true"
    >
      <span className="sb-category-visual__grid" />
      <span className="sb-category-visual__halo" />
      <span className="sb-category-visual__pack sb-category-visual__pack--rear" />
      <span className="sb-category-visual__pack sb-category-visual__pack--front" />
      <span className="sb-category-visual__seal">SB</span>
      <span className="sb-category-visual__label">{en}</span>
      <span className="sb-category-visual__prompt">مشاهده دسته</span>
      <span className="sb-sr-only">ورود به دستهٔ {title}</span>
    </div>
  );
}
