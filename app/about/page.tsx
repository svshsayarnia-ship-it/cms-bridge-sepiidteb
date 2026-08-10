/* eslint-disable @next/next/no-img-element -- local editorial imagery */
import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, HeadsetIcon, PackageIcon, ShieldIcon } from "../components/Icons";
import { buildSeoMetadata } from "../lib/seo";

export const metadata = buildSeoMetadata({
  title: "درباره Sepiid Beauty",
  description:
    "استاندارد سپید برای انتخاب آگاهانه، بررسی قابل‌پیگیری و پشتیبانی انسانی در خرید محصولات حرفه‌ای زیبایی.",
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
            <span className="sb-eyebrow">ABOUT / BEAUTY SEPIID</span>
            <h1>زیبایی حرفه‌ای، بدون انتخاب‌های مبهم.</h1>
            <p>
              سپید بیوتی یک فروشگاه صرف نیست؛ یک سیستم تصمیم‌یار است که اطلاعات
              محصول، فرایند خرید و مرز تصمیم پزشکی را از هم جدا و شفاف می‌کند.
            </p>
            <Link className="sb-btn sb-btn--dark" href="/shop">
              مشاهده فروشگاه
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
              <h2>سه اصل، در تمام تجربه سایت</h2>
            </div>
          </div>
          <div>
            <article>
              <ShieldIcon />
              <span>۰۱</span>
              <h3>اعتماد قابل بررسی</h3>
              <p>جزئیات بسته، تاریخ و بچ‌کد جای ادعاهای مبهم را می‌گیرند.</p>
            </article>
            <article>
              <PackageIcon />
              <span>۰۲</span>
              <h3>خرید قابل پیگیری</h3>
              <p>از استعلام تا تحویل، مسیر و مسئول پاسخ‌گویی روشن است.</p>
            </article>
            <article>
              <HeadsetIcon />
              <span>۰۳</span>
              <h3>محتوای مسئولانه</h3>
              <p>منبع، تاریخ بازبینی و محدودیت آموزشی روی مقاله دیده می‌شود.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="sb-about-manifesto">
        <div className="sb-shell">
          <span>Sepiid Beauty</span>
          <blockquote>
            «هدف ما فروش بیشتر به هر قیمت نیست؛ انتخاب روشن‌تر، خرید قابل‌پیگیری‌تر
            و گفت‌وگوی حرفه‌ای‌تر است.»
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
