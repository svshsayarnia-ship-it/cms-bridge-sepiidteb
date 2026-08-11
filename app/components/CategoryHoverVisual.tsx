type CategoryHoverVisualProps = {
  slug: string;
  title: string;
  en: string;
};

function CategorySubject({ slug }: Pick<CategoryHoverVisualProps, "slug">) {
  if (slug === "fillers" || slug === "body-fillers") {
    return (
      <svg viewBox="0 0 260 190" role="presentation">
        <g className="sb-category-subject__syringe">
          <path d="M22 86h42m-25-16v32M64 76h118v20H64zM182 80h34v12h-34zM216 84h27M99 76v20m42-20v20" />
          <path d="M77 80h90v12H77z" className="sb-category-subject__label-line" />
        </g>
        <g className="sb-category-subject__box">
          <rect x="156" y="28" width="55" height="108" rx="4" />
          <path d="M166 51h35m-35 12h35m-35 46h35" />
        </g>
      </svg>
    );
  }

  if (slug === "botulinum-toxins" || slug === "hyaluronidase-products") {
    return (
      <svg viewBox="0 0 260 190" role="presentation">
        <g className="sb-category-subject__vial">
          <path d="M91 42h54v18l8 13v69c0 9-7 16-16 16h-38c-9 0-16-7-16-16V73l8-13z" />
          <path d="M91 42h54M83 89h70m-59 18h48m-48 13h48" />
        </g>
        <g className="sb-category-subject__ampoule">
          <path d="M173 51h17v17l7 13v56c0 7-5 12-12 12h-7c-7 0-12-5-12-12V81l7-13z" />
          <path d="M166 99h31" />
        </g>
      </svg>
    );
  }

  if (slug === "skin-boosters" || slug === "eye-cocktails") {
    return (
      <svg viewBox="0 0 260 190" role="presentation">
        <g className="sb-category-subject__ampoules">
          <path d="M71 48h19v19l8 14v58c0 8-6 14-14 14h-7c-8 0-14-6-14-14V81l8-14z" />
          <path d="M111 36h22v23l9 15v68c0 9-7 16-16 16h-8c-9 0-16-7-16-16V74l9-15z" />
          <path d="M157 53h18v18l7 13v54c0 8-6 14-14 14h-5c-8 0-14-6-14-14V84l8-13z" />
          <path d="M63 104h35m4 3h40m7-3h33" />
        </g>
      </svg>
    );
  }

  if (slug === "hair-cocktails") {
    return (
      <svg viewBox="0 0 260 190" role="presentation">
        <g className="sb-category-subject__bottle">
          <path d="M102 37h48v25l10 18v62c0 9-7 16-16 16h-36c-9 0-16-7-16-16V80l10-18z" />
          <path d="M102 37h48m-55 60h62m-51 20h40m-40 14h40" />
        </g>
        <path d="M184 52v77m-12-10 12 10 12-10" className="sb-category-subject__hair-line" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 260 190" role="presentation">
      <g className="sb-category-subject__cocktail">
        <path d="M62 54h18v18l7 13v53c0 8-6 14-14 14h-4c-8 0-14-6-14-14V85l7-13z" />
        <path d="M105 40h22v23l9 15v64c0 9-7 16-16 16h-8c-9 0-16-7-16-16V78l9-15z" />
        <path d="M157 54h18v18l7 13v53c0 8-6 14-14 14h-4c-8 0-14-6-14-14V85l7-13z" />
        <path d="M55 106h32m9 1h40m15-1h31" />
      </g>
    </svg>
  );
}

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
      <span className="sb-category-visual__subject">
        <CategorySubject slug={slug} />
      </span>
      <span className="sb-category-visual__seal">SB</span>
      <span className="sb-category-visual__label">{en}</span>
      <span className="sb-category-visual__prompt">مشاهده دسته</span>
      <span className="sb-sr-only">ورود به دستهٔ {title}</span>
    </div>
  );
}
