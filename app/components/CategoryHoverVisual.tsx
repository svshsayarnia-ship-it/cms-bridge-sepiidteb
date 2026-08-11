type CategoryHoverVisualProps = {
  slug: string;
  title: string;
  en: string;
};

function CategorySubject({ slug }: Pick<CategoryHoverVisualProps, "slug">) {
  switch (slug) {
    case "fillers":
      return (
        <svg viewBox="0 0 260 190" role="presentation">
          <g className="sb-category-subject__motion-a">
            <path d="M18 99h38m-24-16v32M56 88h119v22H56zM175 93h35v12h-35zM210 99h34M89 88v22m39-22v22" />
            <rect className="sb-category-subject__accent" x="68" y="93" width="93" height="12" rx="2" />
          </g>
          <g className="sb-category-subject__motion-b">
            <rect className="sb-category-subject__solid" x="158" y="29" width="58" height="105" rx="5" />
            <path d="M169 49h36m-36 12h36m-36 49h36" />
          </g>
        </svg>
      );

    case "body-fillers":
      return (
        <svg viewBox="0 0 260 190" role="presentation">
          <g className="sb-category-subject__motion-a">
            <path d="M18 101h37m-23-21v42M55 83h127c8 0 14 6 14 14v8c0 8-6 14-14 14H55zM196 94h24v14h-24zM220 101h27" />
            <path d="M80 83v36m28-36v36m28-36v36m28-36v36" />
          </g>
          <g className="sb-category-subject__motion-b">
            <rect className="sb-category-subject__solid" x="149" y="31" width="67" height="93" rx="6" />
            <path d="M162 52h41m-41 14h41m-41 35h41" />
            <circle className="sb-category-subject__accent" cx="182" cy="84" r="12" />
          </g>
        </svg>
      );

    case "skin-boosters":
      return (
        <svg viewBox="0 0 260 190" role="presentation">
          <g className="sb-category-subject__motion-a">
            <path d="M42 117h31m-19-13v26M73 109h104v16H73zM177 112h27v10h-27zM204 117h28M103 109v16m37-16v16" />
            <rect className="sb-category-subject__accent" x="84" y="113" width="80" height="8" rx="2" />
          </g>
          <g className="sb-category-subject__motion-b">
            <path className="sb-category-subject__solid" d="M130 28c17 23 29 39 29 56a29 29 0 1 1-58 0c0-17 12-33 29-56z" />
            <path d="M117 88c4 8 12 12 22 9" />
          </g>
        </svg>
      );

    case "botulinum-toxins":
      return (
        <svg viewBox="0 0 260 190" role="presentation">
          <g className="sb-category-subject__motion-a">
            <path className="sb-category-subject__solid" d="M92 43h57v19l9 14v65c0 10-8 18-18 18h-39c-10 0-18-8-18-18V76l9-14z" />
            <path d="M92 43h57M83 91h75m-62 18h49m-49 14h49" />
          </g>
          <g className="sb-category-subject__signal">
            <path d="M188 51v59m-26-44 52 30m-52 0 52-30M188 51l-7 8m7-8 7 8m-33 7 10 2m-10-2 3-9m49 9-10 2m10-2-3-9m3 39-10-2m10 2-3 9m-49-9 10-2m-10 2 3 9" />
          </g>
        </svg>
      );

    case "rejuvenation-cocktails":
      return (
        <svg viewBox="0 0 260 190" role="presentation">
          <g className="sb-category-subject__signal">
            <path d="M37 105c15-39 49-66 93-66s78 27 93 66M53 111c12-29 40-49 77-49s65 20 77 49" />
          </g>
          <g className="sb-category-subject__motion-a">
            <path className="sb-category-subject__solid" d="M66 60h18v18l7 13v49c0 8-6 14-14 14h-4c-8 0-14-6-14-14V91l7-13z" />
            <path className="sb-category-subject__solid" d="M120 43h22v23l9 15v60c0 9-7 16-16 16h-8c-9 0-16-7-16-16V81l9-15z" />
            <path className="sb-category-subject__solid" d="M176 60h18v18l7 13v49c0 8-6 14-14 14h-4c-8 0-14-6-14-14V91l7-13z" />
            <path d="M59 112h32m20 0h40m22 0h28" />
          </g>
        </svg>
      );

    case "brightening-cocktails":
      return (
        <svg viewBox="0 0 260 190" role="presentation">
          <g className="sb-category-subject__motion-a">
            <path className="sb-category-subject__solid" d="M86 56h25v24l9 16v48c0 8-6 14-14 14H91c-8 0-14-6-14-14V96l9-16z" />
            <path d="M77 113h43m-32 14h20" />
          </g>
          <g className="sb-category-subject__signal">
            <circle className="sb-category-subject__accent" cx="171" cy="88" r="25" />
            <path d="M171 48v-14m0 108v-14m40-40h14M117 88h14m68-28 10-10m-76 76 10-10m56 0 10 10m-76-76 10 10" />
          </g>
        </svg>
      );

    case "eye-cocktails":
      return (
        <svg viewBox="0 0 260 190" role="presentation">
          <g className="sb-category-subject__signal">
            <path d="M34 94c26-34 59-49 96-49s70 15 96 49c-26 34-59 49-96 49S60 128 34 94z" />
            <circle className="sb-category-subject__accent" cx="130" cy="94" r="25" />
            <circle cx="130" cy="94" r="8" />
          </g>
          <g className="sb-category-subject__motion-b">
            <path className="sb-category-subject__solid" d="M183 66h16v17l7 12v48c0 7-5 12-12 12h-6c-7 0-12-5-12-12V95l7-12z" />
            <path d="M176 116h30" />
          </g>
        </svg>
      );

    case "hair-cocktails":
      return (
        <svg viewBox="0 0 260 190" role="presentation">
          <g className="sb-category-subject__signal">
            <path d="M42 143c28-24 55-31 88-31s60 7 88 31M73 117c-2-36 6-65 27-88m13 83c-4-35 1-63 17-89m20 89c5-34 16-58 35-78" />
            <path d="M92 68c9 7 14 14 15 24m36-28c8 8 11 17 10 28m27-12c5 6 7 12 6 20" />
          </g>
          <g className="sb-category-subject__motion-b">
            <path className="sb-category-subject__solid" d="M36 72h19v19l8 14v43c0 7-5 12-12 12h-11c-7 0-12-5-12-12v-43l8-14z" />
            <path d="M28 124h35" />
          </g>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 260 190" role="presentation">
          <g className="sb-category-subject__signal">
            <circle cx="130" cy="98" r="61" strokeDasharray="5 7" />
            <path d="M176 51c19 16 29 39 28 63m-148 0c-1-24 9-47 28-63" />
          </g>
          <g className="sb-category-subject__motion-a">
            <path className="sb-category-subject__solid" d="M105 45h50v18l9 14v65c0 9-7 16-16 16h-36c-9 0-16-7-16-16V77l9-14z" />
            <path d="M105 45h50M96 96h68m-56 20h44" />
          </g>
          <g className="sb-category-subject__motion-b">
            <circle className="sb-category-subject__accent" cx="191" cy="129" r="5" />
            <circle className="sb-category-subject__accent" cx="207" cy="116" r="3" />
            <circle className="sb-category-subject__accent" cx="213" cy="139" r="2" />
          </g>
        </svg>
      );
  }
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
