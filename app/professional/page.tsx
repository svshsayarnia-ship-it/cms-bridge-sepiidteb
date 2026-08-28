/* eslint-disable @next/next/no-img-element -- local generated imagery */
import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, CheckIcon } from "../components/Icons";
import { ProfessionalForm } from "../components/ProfessionalForm";
import { buildSeoMetadata } from "../lib/seo";

export const metadata = buildSeoMetadata({
  title: "خرید حرفه‌ای پزشکان و کلینیک‌ها",
  description:
    "فهرست محصولات موردنیاز کلینیک را یک‌جا بفرستید تا موجودی، قیمت، مدل و زمان تحویل هر قلم را با شما هماهنگ کنیم.",
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
            <span className="sb-eyebrow">همکاری با پزشکان و کلینیک‌ها</span>
            <h1>چند محصول می‌خواهید؟ همه را یک‌جا بفرستید.</h1>
            <p>
              اگر برای کلینیک یا مرکز زیبایی چند قلم می‌خواهید، لازم نیست برای هر محصول جدا پیام بدهید. اسم محصول، مدل، تعداد و زمانی که نیاز دارید را یک‌جا بفرستید تا موجودی و قیمت هر مورد را با هم جلو ببریم.
            </p>
            <div className="sb-professional-hero__actions">
              <a className="sb-btn sb-btn--gold" href="#brief">
                فرستادن فهرست خرید
                <ArrowIcon />
              </a>
              <Link className="sb-btn sb-btn--light-outline" href="/shop">
                دیدن محصولات
              </Link>
            </div>
            <small>
              انتخاب و استفاده از محصولات حرفه‌ای باید توسط پزشک یا مسئول فنی واجد صلاحیت انجام شود.
            </small>
          </div>
          <figure>
            <img
              src="/images/professional-clinic-v2.webp"
              alt="متخصص کلینیک در حال بررسی محصولات موردنیاز"
              width="1672"
              height="941"
              fetchPriority="high"
            />
            <figcaption>برای خریدهای چندقلمی و تکرارشونده</figcaption>
          </figure>
        </div>
      </section>

      <section className="sb-professional-process">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">از پیام شما تا تحویل سفارش</span>
              <h2>کار پیچیده‌ای نیست؛ این چهار قدم را با هم جلو می‌رویم.</h2>
            </div>
          </div>
          <ol>
            {[
              ["فهرست را بفرستید", "اسم دقیق محصول‌ها، مدل و تعداد موردنیاز را برای ما می‌فرستید."],
              ["موجودی را چک می‌کنیم", "برای هر قلم، مدل و نوع بسته را جدا بررسی می‌کنیم."],
              ["قیمت و زمان تحویل را می‌گوییم", "همه موارد را یک‌جا برایتان می‌فرستیم تا تصمیم‌گیری راحت‌تر باشد."],
              ["تا تحویل در تماس می‌مانیم", "اگر سؤال یا تغییری بود، همان گفت‌وگو را ادامه می‌دهید و لازم نیست همه چیز را دوباره توضیح دهید."],
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
            <span className="sb-eyebrow">برای خریدهای کلینیکی</span>
            <h2>همه چیز را در یک گفت‌وگو نگه دارید.</h2>
            <p>
              فهرست خرید را یک‌جا بفرستید و برای هر محصول، مدل، موجودی، قیمت و زمان تحویل را روشن کنید.
            </p>
          </div>
          <div>
            {[
              "چند محصول در یک پیام",
              "مدل و نوع بسته مشخص برای هر قلم",
              "موجودی هر محصول به‌صورت جداگانه",
              "هماهنگی زمان و روش تحویل",
              "مناسب برای سفارش‌های تکرارشونده",
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
