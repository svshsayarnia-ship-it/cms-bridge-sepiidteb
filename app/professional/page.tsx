/* eslint-disable @next/next/no-img-element -- local generated imagery */
import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, CheckIcon } from "../components/Icons";
import { ProfessionalForm } from "../components/ProfessionalForm";
import { buildSeoMetadata } from "../lib/seo";

export const metadata = buildSeoMetadata({
  title: "سفارش محصولات برای کلینیک‌ها",
  description:
    "برای کلینیک‌ها: فهرست چند محصول، قیمت روز، موجودی، زمان تحویل و پیگیری سفارش را یک‌جا هماهنگ کنید.",
  path: "/professional",
  image: "/images/professional-clinic-v2.webp",
  imageAlt: "خرید حرفه‌ای پزشکان و کلینیک‌ها",
});

export default function ProfessionalPage() {
  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "همکاری با کلینیک‌ها" }]} />
      </div>

      <section className="sb-professional-hero">
        <div className="sb-shell sb-professional-hero__grid">
          <div>
            <span className="sb-eyebrow">سفارش کلینیک</span>
            <h1>فهرست سفارش‌تان را یک‌جا بفرستید.</h1>
            <p>
              نام محصولات، تعداد و زمان تحویل را بفرستید. ما قیمت روز و وضعیت هر
              مدل را جداگانه بررسی می‌کنیم و پاسخ می‌دهیم.
            </p>
            <div className="sb-professional-hero__actions">
              <a className="sb-btn sb-btn--gold" href="#brief">
                فرستادن فهرست سفارش
                <ArrowIcon />
              </a>
              <Link className="sb-btn sb-btn--light-outline" href="/shop">
                مرور فروشگاه
              </Link>
            </div>
            <small>
              انتخاب و استفاده از محصولات بر عهده پزشک و مسئول فنی مرکز است.
            </small>
          </div>
          <figure>
            <img
              src="/images/professional-clinic-v2.webp"
              alt="متخصص کلینیک در حال بررسی موجودی"
              width="1672"
              height="941"
              fetchPriority="high"
            />
            <figcaption>Clinic inventory / controlled workflow</figcaption>
          </figure>
        </div>
      </section>

      <section className="sb-professional-process">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">روند سفارش</span>
              <h2>از پیام اول تا تحویل، چهار قدم ساده</h2>
            </div>
          </div>
          <ol>
            {[
              ["فرستادن فهرست", "نام مدل، تعداد و اولویت‌ها را می‌فرستید."],
              ["بررسی هر مدل", "بسته، قیمت و موجودی هر مورد جداگانه بررسی می‌شود."],
              ["هماهنگی سفارش", "قیمت روز و زمان تحویل را یک‌جا اعلام می‌کنیم."],
              ["پیگیری تا تحویل", "برای سفارش فعلی و سفارش بعدی، مسیر مشخص دارید."],
            ].map(([title, text], index) => (
              <li key={title}>
                <span>۰{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sb-section sb-professional-benefits">
        <div className="sb-shell sb-professional-benefits__grid">
          <div>
            <span className="sb-eyebrow">FOR YOUR TEAM</span>
            <h2>برای مسئول خرید و مسئول فنی</h2>
            <p>
              اطلاعات پراکنده را در یک پیام بفرستید تا پاسخ‌گویی و پیگیری ساده‌تر شود.
            </p>
          </div>
          <div>
            {[
              "بررسی چند محصول در یک پیام",
              "اعلام جداگانه قیمت و مشخصات بسته",
              "مشخص بودن وضعیت هر قلم",
              "هماهنگی زمان و روش تحویل",
              "کمک به برنامه‌ریزی سفارش بعدی",
              "پاسخ‌گویی بعد از تحویل",
            ].map((item) => (
              <p key={item}>
                <CheckIcon />
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="sb-professional-brief" id="brief">
        <div className="sb-shell">
          <ProfessionalForm />
        </div>
      </section>
    </main>
  );
}
