import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon } from "../components/Icons";
import { JsonLd } from "../components/JsonLd";
import { concernTopics } from "../lib/discovery-hubs";
import { buildSeoMetadata } from "../lib/seo";
import { siteOrigin } from "../lib/site-url";

export const metadata = buildSeoMetadata({
  title: "نیازها و دغدغه‌های رایج در انتخاب محصولات زیبایی",
  description:
    "مرور نیازمحور موضوعاتی مثل کیفیت پوست، حجم و فرم، خطوط صورت، دور چشم، لک و ریزش مو؛ با مسیرهای آموزشی و بدون توصیه درمانی خودکار.",
  path: "/concerns",
  image: "/images/hero-editorial-portrait.webp",
  imageAlt: "راهنمای نیازها و دغدغه‌های رایج زیبایی",
});

export default function ConcernsPage() {
  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "نیازها و دغدغه‌ها" }]} />
      </div>

      <section className="sb-guides-hero">
        <div className="sb-shell sb-guides-hero__grid">
          <div>
            <span className="sb-eyebrow">START FROM THE CONCERN</span>
            <h1>از مسئله واقعی کاربر شروع کنید، نه از اسم محصول.</h1>
            <p>
              اگر هنوز نمی‌دانید کدام دسته یا محصول را باید بررسی کنید، این مسیرها
              کمک می‌کنند سؤال را دقیق‌تر کنید و سپس به راهنما، دسته و صفحه محصول
              برسید.
            </p>
            <Link className="sb-btn sb-btn--dark" href="/guides">
              مشاهده راهنماهای تصمیم‌گیری
              <ArrowIcon />
            </Link>
          </div>

          <ol>
            <li>
              <span>۰۱</span>
              <div>
                <h2>مسئله را نام‌گذاری کنید</h2>
                <p>کیفیت پوست، فرم، خطوط، دور چشم، رنگ پوست یا مو؟</p>
              </div>
            </li>
            <li>
              <span>۰۲</span>
              <div>
                <h2>علت را با محصول اشتباه نگیرید</h2>
                <p>یک دغدغه ظاهری می‌تواند چند علت و چند مسیر بررسی داشته باشد.</p>
              </div>
            </li>
            <li>
              <span>۰۳</span>
              <div>
                <h2>بعد سراغ دسته بروید</h2>
                <p>دسته محصول فقط وقتی مفید است که هدف و محدودیت‌ها روشن باشند.</p>
              </div>
            </li>
            <li>
              <span>۰۴</span>
              <div>
                <h2>تصمیم پزشکی را جدا نگه دارید</h2>
                <p>تشخیص و انتخاب روش، ناحیه و پروتکل بر عهده پزشک است.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="sb-section sb-guide-paths">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">CONCERN HUBS</span>
              <h2>مسیر مناسب را از روی نیاز انتخاب کنید.</h2>
            </div>
            <p>هر صفحه، سؤال‌های تصمیم و دسته‌های مرتبط را کنار هم می‌آورد.</p>
          </div>

          <div className="sb-guide-paths__grid">
            {concernTopics.map((topic, index) => (
              <article key={topic.slug}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <small>{topic.eyebrow}</small>
                <h3>{topic.title}</h3>
                <p>{topic.description}</p>
                <Link className="sb-text-link" href={`/concerns/${topic.slug}`}>
                  ورود به این مسیر
                  <ArrowIcon />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sb-guide-comparison">
        <div className="sb-shell sb-guide-comparison__grid">
          <div>
            <span className="sb-eyebrow sb-eyebrow--gold">IMPORTANT / مرز تصمیم</span>
            <h2>صفحه نیاز، نسخه درمانی نیست.</h2>
          </div>
          <div className="sb-guide-comparison__cards">
            <article>
              <strong>این صفحات کمک می‌کنند</strong>
              <ul>
                <li>مسئله کاربر دقیق‌تر تعریف شود</li>
                <li>راهنما و دسته مرتبط پیدا شود</li>
                <li>اطلاعات محصول برای مقایسه مرتب شود</li>
              </ul>
            </article>
            <article>
              <strong>این صفحات تصمیم نمی‌گیرند</strong>
              <ul>
                <li>تشخیص پزشکی ارائه نمی‌کنند</li>
                <li>محصول را برای فرد تجویز نمی‌کنند</li>
                <li>نتیجه یا ایمنی یک روش را تضمین نمی‌کنند</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "نیازها و دغدغه‌های کاربران Sepiid Beauty",
          url: `${siteOrigin}/concerns`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: concernTopics.length,
            itemListElement: concernTopics.map((topic, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: topic.title,
              url: `${siteOrigin}/concerns/${topic.slug}`,
            })),
          },
        }}
      />
    </main>
  );
}
