import Link from "next/link";
import { ArrowIcon, CheckIcon, ShieldIcon } from "./Icons";
import { VialMark } from "./VialMark";

const steps = [
  ["۰۱", "اول اسم دقیق را پیدا کنید", "نام کامل مدل، حجم و تعداد داخل بسته را ببینید."],
  ["۰۲", "بعد سؤال‌های مهم را بپرسید", "قیمت روز، موجودی، وضعیت بسته و زمان ارسال را روشن کنید."],
  ["۰۳", "بعد سفارش بدهید", "اگر چیزی مبهم بود، قبل از پرداخت با ما گفت‌وگو کنید."],
];

export function BrandStory() {
  return (
    <section className="sb-brand-story" aria-labelledby="brand-story-title">
      <div className="sb-shell sb-brand-story__grid">
        <div className="sb-brand-story__intro">
          <span className="sb-eyebrow sb-eyebrow--gold">سه قدم ساده برای خرید</span>
          <h2 id="brand-story-title">اول اطلاعات را روشن کنید، بعد خرید کنید.</h2>
          <p>
            سپید بیوتی به جای شما تصمیم پزشکی نمی‌گیرد. کمک می‌کند مدل‌ها، بسته‌ها و
            سؤال‌های مهم را ساده‌تر کنار هم ببینید.
          </p>
          <Link className="sb-text-link sb-text-link--light" href="/magazine/verify-dermal-filler-authenticity">
            چک‌لیست بررسی بسته
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
