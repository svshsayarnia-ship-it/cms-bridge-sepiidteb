"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import { whatsappHref } from "../data";
import { ArrowIcon } from "./Icons";

const paths = [
  {
    title: "کیفیت و رطوبت پوست",
    kicker: "برای شناخت اسکین‌بوسترها",
    headline: "از ترکیب و هدف محصول شروع کنید.",
    text: "اصطلاحات تجاری همیشه تعریف یکسانی ندارند. محصول مشخص، بروشور و ارزیابی پزشک سه مرجع تصمیم‌گیری هستند.",
    href: "/shop/skin-boosters",
    chips: ["ترکیب محصول", "هدف پروتکل", "نظر پزشک"],
  },
  {
    title: "فرم و خطوط صورت",
    kicker: "برای شناخت فیلرها",
    headline: "هر ناحیه، رفتار و انتخاب متفاوتی می‌خواهد.",
    text: "فیلر مناسب به ناحیه، ویژگی ژل و تکنیک وابسته است؛ نام محبوب در شبکه‌های اجتماعی برای انتخاب کافی نیست.",
    href: "/shop/fillers",
    chips: ["ناحیه هدف", "ویژگی ژل", "تکنیک"],
  },
  {
    title: "خرید حرفه‌ای کلینیک",
    kicker: "برای سبدهای برنامه‌ریزی‌شده",
    headline: "موجودی، بچ‌کد و تحویل را یک‌جا پیگیری کنید.",
    text: "مسیر حرفه‌ای برای دریافت جزئیات بسته، تطبیق مشخصات و برنامه‌ریزی سفارش‌های تکرارشونده ساخته شده است.",
    href: "/professional",
    chips: ["استعلام موجودی", "ثبت بچ‌کد", "برنامه تحویل"],
  },
];

export function HomeFinder() {
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const path = paths[active];

  const moveTab = (index: number) => {
    const next = (index + paths.length) % paths.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <section className="sb-finder">
      <div className="sb-shell sb-finder__grid">
        <div className="sb-finder__intro">
          <span className="sb-eyebrow sb-eyebrow--gold">SEPIID PRODUCT FINDER</span>
          <h2>مسیر انتخاب را با نیاز واقعی بسازید.</h2>
          <p>این ابزار آموزشی است؛ پاسخ شما نسخه پزشکی تولید نمی‌کند.</p>
          <div className="sb-finder__tabs" role="tablist" aria-label="انتخاب هدف">
            {paths.map((item, index) => (
              <button
                type="button"
                role="tab"
                id={`finder-tab-${index}`}
                aria-controls="finder-panel"
                aria-selected={active === index}
                tabIndex={active === index ? 0 : -1}
                className={active === index ? "sb-finder__tab--active" : ""}
                onClick={() => setActive(index)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft") moveTab(index + 1);
                  if (event.key === "ArrowRight") moveTab(index - 1);
                  if (event.key === "Home") moveTab(0);
                  if (event.key === "End") moveTab(paths.length - 1);
                }}
                ref={(element) => {
                  tabs.current[index] = element;
                }}
                key={item.title}
              >
                <span>۰{index + 1}</span>
                <i style={{ "--progress": `${((index + 1) / paths.length) * 100}%` } as CSSProperties} />
                {item.title}
                <ArrowIcon />
              </button>
            ))}
          </div>
        </div>
        <div
          className="sb-finder__result"
          id="finder-panel"
          role="tabpanel"
          aria-labelledby={`finder-tab-${active}`}
          tabIndex={0}
        >
          <span className="sb-finder__index">۰{active + 1}</span>
          <span className="sb-finder__result-icon" aria-hidden="true" />
          <span className="sb-eyebrow">{path.kicker}</span>
          <h3>{path.headline}</h3>
          <p>{path.text}</p>
          <div className="sb-finder__chips">
            {path.chips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
          <div className="sb-finder__actions">
            <Link className="sb-btn sb-btn--gold" href={path.href}>
              ادامه این مسیر
              <ArrowIcon />
            </Link>
            <Link href={whatsappHref("سلام، برای انتخاب دسته مناسب راهنمایی می‌خواهم.")}>
              گفت‌وگو با پشتیبانی
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
