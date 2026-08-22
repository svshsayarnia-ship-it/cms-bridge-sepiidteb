import Link from "next/link";
import { ArrowIcon, CheckIcon, ShieldIcon } from "./Icons";
import { VialMark } from "./VialMark";

const steps = [
  ["۰۱", "انتخاب روشن", "از نام کامل محصول، دسته و اطلاعات قابل‌مشاهده شروع کنید."],
  ["۰۲", "بررسی قابل‌پیگیری", "وضعیت بسته، بچ‌کد و جزئیات ضروری را پیش از نهایی‌شدن سفارش بپرسید."],
  ["۰۳", "خرید با پشتیبانی", "برای موجودی، تحویل و سفارش‌های حرفه‌ای، یک مسیر انسانی در کنار شماست."],
];

export function BrandStory() {
  return (
    <section className="sb-brand-story" aria-labelledby="brand-story-title">
      <div className="sb-shell sb-brand-story__grid">
        <div className="sb-brand-story__intro">
          <span className="sb-eyebrow sb-eyebrow--gold">SEPIID METHOD / 03 STEPS</span>
          <h2 id="brand-story-title">خرید حرفه‌ای، از یک انتخاب روشن شروع می‌شود.</h2>
          <p>
            سپید بیوتی قرار نیست جای تصمیم تخصصی را بگیرد؛ فقط کمک می‌کند مسیر بررسی محصول،
            استعلام و پشتیبانی مرتب‌تر و قابل‌فهم‌تر باشد.
          </p>
          <Link className="sb-text-link sb-text-link--light" href="/magazine/verify-dermal-filler-authenticity">
            چک‌لیست بررسی اصالت
            <ArrowIcon />
          </Link>
        </div>
        <div className="sb-brand-story__panel">
          <VialMark className="sb-vial-mark--method" />
          <div className="sb-brand-story__seal"><ShieldIcon /><span>انتخاب آگاهانه</span></div>
          <ol>
            {steps.map(([number, title, text]) => (
              <li key={number}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <CheckIcon />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
