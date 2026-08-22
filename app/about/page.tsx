/* eslint-disable @next/next/no-img-element -- local editorial imagery */
import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, HeadsetIcon, PackageIcon, ShieldIcon } from "../components/Icons";
import { buildSeoMetadata } from "../lib/seo";

export const metadata = buildSeoMetadata({
  title: "درباره Sepiid Beauty",
  description:
    "سپید بیوتی کمک می‌کند مدل، حجم، بسته و راه خرید محصولات زیبایی را ساده‌تر بررسی کنید.",
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
            <span className="sb-eyebrow">درباره سپید بیوتی</span>
            <h1>اطلاعات روشن، خرید آرام‌تر.</h1>
            <p>
              سپید بیوتی کمک می‌کند قبل از خرید بدانید دقیقاً چه مدلی، با چه حجمی
              و در چه بسته‌ای می‌خواهید. تصمیم پزشکی همچنان با پزشک است.
            </p>
            <Link className="sb-btn sb-btn--dark" href="/shop">
              دیدن محصولات
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
              <span className="sb-eyebrow">روش کار سپید</span>
              <h2>سه چیز را روشن نگه می‌داریم</h2>
            </div>
          </div>
          <div>
            <article>
              <ShieldIcon />
              <span>۰۱</span>
              <h3>اطلاعات قابل فهم</h3>
              <p>نام، مدل، حجم و تعداد بسته را همان‌طور که هست می‌نویسیم.</p>
            </article>
            <article>
              <PackageIcon />
              <span>۰۲</span>
              <h3>خرید قابل پیگیری</h3>
              <p>از پرسیدن قیمت تا تحویل، می‌دانید باید با چه کسی در تماس باشید.</p>
            </article>
            <article>
              <HeadsetIcon />
              <span>۰۳</span>
              <h3>قول‌های بی‌دلیل نمی‌دهیم</h3>
              <p>اگر چیزی برای همه قطعی نیست، آن را قطعی و اغراق‌آمیز نمی‌نویسیم.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="sb-about-manifesto">
        <div className="sb-shell">
          <span>Sepiid Beauty</span>
          <blockquote>
            «می‌خواهیم قبل از خرید بدانید چه چیزی می‌خرید و اگر سؤال داشتید،
            یک آدم واقعی جواب‌تان را بدهد.»
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
