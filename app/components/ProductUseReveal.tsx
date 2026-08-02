"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowIcon } from "./Icons";

const cards = [
  { slug: "fillers", title: "فیلر و ژل", en: "Dermal Fillers", accent: "violet", href: "/shop/fillers", notes: ["مدل‌ها", "مشخصات", "استعلام"] },
  { slug: "botox", title: "بوتاکس", en: "Botulinum Toxin", accent: "gold", href: "/shop/botulinum-toxins", notes: ["نام محصول", "اطلاعات بسته", "استعلام"] },
  { slug: "mesogel", title: "مزوژل و اسکین‌بوستر", en: "Skin Boosters", accent: "blue", href: "/shop/skin-boosters", notes: ["برندها", "مشخصات", "مقایسه"] },
  { slug: "cocktail", title: "کوکتل‌های پوستی", en: "Skin Cocktails", accent: "green", href: "/shop/rejuvenation-cocktails", notes: ["مدل‌ها", "جزئیات", "استعلام"] },
  { slug: "hair", title: "محصولات مو", en: "Hair Products", accent: "rose", href: "/shop/hair-cocktails", notes: ["محصولات", "مشخصات", "موجودی"] },
];

export function ProductUseReveal() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section className="sb-use-reveal" aria-labelledby="use-reveal-title">
      <div className="sb-shell">
        <div className="sb-use-reveal__head">
          <div>
            <span className="sb-eyebrow">PRODUCTS / QUICK ACCESS</span>
            <h2 id="use-reveal-title">دستهٔ محصولتان را انتخاب کنید.</h2>
          </div>
          <p>با یک لمس، مستقیم وارد محصولات همان دسته می‌شوید. برای دیدن نمای دوم، ماوس را روی کارت نگه دارید.</p>
        </div>

        <div className="sb-use-reveal__grid">
          {cards.map((card, index) => (
            <article
              className={`sb-use-card sb-use-card--${card.accent} sb-use-card--${card.slug} ${active === card.slug ? "sb-use-card--active" : ""}`}
              key={card.slug}
              onMouseEnter={() => setActive(card.slug)}
              onMouseLeave={() => setActive(null)}
              onFocusCapture={() => setActive(card.slug)}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setActive(null);
                }
              }}
              onPointerDown={(event) => {
                if (event.pointerType !== "mouse") setActive(card.slug);
              }}
            >
              <div className="sb-use-card__copy">
                <span>۰{index + 1}</span>
                <h3>{card.title}</h3>
                <small>{card.en}</small>
              </div>

              <div className="sb-use-card__stage">
                <figure className="sb-use-storyboard" aria-label={`نمایش دو حالت از دستهٔ ${card.title}`}>
                  <div
                    className="sb-use-storyboard__frame sb-use-storyboard__frame--before"
                    style={{ backgroundImage: `url(/images/storyboard/${card.slug}-triptych.webp)` }}
                  />
                  <div
                    className="sb-use-storyboard__frame sb-use-storyboard__frame--after"
                    style={{ backgroundImage: `url(/images/storyboard/${card.slug}-triptych.webp)` }}
                  />
                  <span className="sb-use-storyboard__state sb-use-storyboard__state--before">نمای کلی</span>
                  <span className="sb-use-storyboard__state sb-use-storyboard__state--after">نمای دوم</span>
                  <span className="sb-use-storyboard__hint">برای دیدن جزئیات، روی کارت بروید</span>
                </figure>
              </div>

              <ul aria-label={`اطلاعات قابل مشاهدهٔ دستهٔ ${card.title}`}>
                {card.notes.map((note) => <li key={note}>{note}</li>)}
              </ul>
              <Link className="sb-use-card__link" href={card.href}>
                مشاهده محصولات
                <ArrowIcon />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
