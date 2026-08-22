/* eslint-disable @next/next/no-img-element -- local editorial imagery */
import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, HeadsetIcon, PackageIcon, ShieldIcon } from "../components/Icons";
import { buildSeoMetadata } from "../lib/seo";

export const metadata = buildSeoMetadata({
  title: "درباره Sepiid Beauty",
  description:
    "سپید بیوتی برای شناخت روشن‌تر محصولات حرفه‌ای زیبایی ساخته شده است؛ با تمرکز بر مدل، بسته‌بندی، قیمت و پاسخ‌گویی انسانی.",
  path: "/about",
  imageAlt: "درباره سپید بیوتی",
});

export default function AboutPage() {
  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "درباره سپید بیوتی" }]} />
      </div>
      <section className="sb-about-hero">
        <div className="sb-shell sb-about-hero__grid">
          <div>
            <span className="sb-eyebrow">ABOUT / SEPIID BEAUTY</span>
            <h1>سپید بیوتی برای انتخاب روشن‌تر ساخته شده است.</h1>
            <p>
              بازار محصولات حرفه‌ای زیبایی پر از نام‌های مشابه، مدل‌های متعدد و بسته‌هایی است که همیشه به‌سادگی قابل مقایسه نیستند. ما این جزئیات را کنار هم می‌آوریم تا قبل از خرید بدانید دقیقاً کدام محصول را می‌بینید.
            </p>
            <Link className="sb-btn sb-btn--dark" href="/shop">
              مشاهده محصولات
              <ArrowIcon />
            </Link>
          </div>
          <img
            src="/images/editorial-detail.webp"
            alt="تصویر ادیتوریال پوست و محصول زیبایی"
            width="1536"
            height="1024"
          />
        </div>
      </section>

      <section className="sb-section sb-about-standards">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">THE SEPIID STANDARD</span>
              <h2>سه چیزی که باید قبل از خرید روشن باشد</h2>
            </div>
          </div>
          <div>
            <article>
              <ShieldIcon />
              <span>۰۱</span>
              <h3>دقیقاً کدام محصول؟</h3>
              <p>نام مدل، حجم و نوع بسته را واضح می‌نویسیم تا محصول مشابه با گزینه دیگری اشتباه نشود.</p>
            </article>
            <article>
              <PackageIcon />
              <span>۰۲</span>
              <h3>قیمت برای کدام بسته؟</h3>
              <p>اگر قیمت برای سرنگ، ویال یا جعبه کامل باشد، همان‌جا مشخص می‌کنیم.</p>
            </article>
            <article>
              <HeadsetIcon />
              <span>۰۳</span>
              <h3>اگر سؤال ماند چه؟</h3>
              <p>برای موجودی و جزئیات سفارش، مسیر تماس مستقیم و پاسخ‌گویی انسانی در دسترس است.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="sb-about-manifesto">
        <div className="sb-shell">
          <span>Sepiid Beauty</span>
          <blockquote>
            «قرار نیست با توضیحات مبهم محصول بفروشیم؛ کار ما این است که قبل از خرید، تصویر روشن‌تری از چیزی که انتخاب می‌کنید داشته باشید.»
          </blockquote>
          <Link className="sb-text-link sb-text-link--light" href="/contact">
            گفت‌وگو با تیم سپید
            <ArrowIcon />
          </Link>
        </div>
      </section>
    </main>
  );
}
