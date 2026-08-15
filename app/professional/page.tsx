/* eslint-disable @next/next/no-img-element -- local generated imagery */
import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, CheckIcon } from "../components/Icons";
import { ProfessionalForm } from "../components/ProfessionalForm";
import { buildSeoMetadata } from "../lib/seo";

export const metadata = buildSeoMetadata({
  title: "خرید حرفه‌ای پزشکان و کلینیک‌ها",
  description:
    "فهرست چندمحصولی کلینیک را یک‌جا ارسال کنید و موجودی، قیمت، مدل و زمان تحویل هر قلم را در یک مسیر مشخص پیگیری کنید.",
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
            <span className="sb-eyebrow">PROFESSIONAL ACCESS</span>
            <h1>خرید چندقلمی، بدون رفت‌وبرگشت‌های بی‌پایان.</h1>
            <p>
              اگر برای کلینیک یا مرکز زیبایی چند محصول را هم‌زمان تهیه می‌کنید، فهرست را یک‌جا بفرستید. نام محصول، مدل، تعداد و زمان موردنیاز مشخص می‌شود و وضعیت هر قلم در همان مسیر پیگیری می‌شود.
            </p>
            <div className="sb-professional-hero__actions">
              <a className="sb-btn sb-btn--gold" href="#brief">
                ارسال فهرست خرید
                <ArrowIcon />
              </a>
              <Link className="sb-btn sb-btn--light-outline" href="/shop">
                دیدن محصولات
              </Link>
            </div>
            <small>
              انتخاب و استفاده از محصولات حرفه‌ای بر عهده پزشک یا مسئول فنی واجد صلاحیت مرکز است.
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
            <figcaption>Clinic inventory / one clear workflow</figcaption>
          </figure>
        </div>
      </section>

      <section className="sb-professional-process">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">WORKFLOW / روند همکاری</span>
              <h2>از فهرست خرید تا تحویل، چهار مرحله ساده</h2>
            </div>
          </div>
          <ol>
            {[
              ["فهرست را بفرستید", "نام دقیق محصولات، مدل و تعداد موردنیاز را می‌فرستید."],
              ["وضعیت هر قلم مشخص می‌شود", "موجودی، مدل و شکل بسته هر محصول جداگانه بررسی می‌شود."],
              ["سفارش نهایی می‌شود", "قیمت و زمان تحویل اقلام در یک پاسخ یکپارچه جمع‌بندی می‌شود."],
              ["یک مسیر برای پیگیری دارید", "برای پیگیری یا سفارش بعدی لازم نیست همه چیز را از اول توضیح دهید."],
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
            <h2>برای تیم‌هایی که نمی‌خواهند خرید پراکنده باشد</h2>
            <p>
              به‌جای چند گفت‌وگوی جدا، فهرست خرید را یک‌جا مدیریت کنید و وضعیت هر محصول را واضح ببینید.
            </p>
          </div>
          <div>
            {[
              "چند محصول در یک درخواست",
              "نام مدل و بسته برای هر قلم",
              "وضعیت موجودی هر محصول به‌صورت جداگانه",
              "هماهنگی زمان و روش تحویل",
              "امکان برنامه‌ریزی سفارش‌های تکرارشونده",
              "پاسخ‌گویی مستقیم برای پیگیری",
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
