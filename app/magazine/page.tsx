/* eslint-disable @next/next/no-img-element -- local editorial imagery */
import Link from "next/link";
import { ArticleCard } from "../components/ArticleCard";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, ClockIcon } from "../components/Icons";
import { getManagedArticles, getSitePresentation } from "../lib/site-presentation";
import { buildSeoMetadata } from "../lib/seo";

export const metadata = buildSeoMetadata({
  title: "مجله سپید؛ راهنماهای اصالت، انتخاب و مراقبت",
  description:
    "مقالات منبع‌دار و به‌روز درباره فیلرهای پرجست‌وجو، بوتولینوم، مزوژل، ریزش مو، اصالت محصولات و مدیریت خرید کلینیک.",
  path: "/magazine",
  image: "/images/magazine-authenticity-v2.webp",
  imageAlt: "مجله سپید بیوتی",
});

export default async function MagazinePage() {
  const editableArticles = getManagedArticles(await getSitePresentation());
  const featured =
    editableArticles.find((article) => article.slug === "neuramis-vs-revofil-guide") ??
    editableArticles[0];

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "مجله سپید" }]} />
      </div>

      <section className="sb-magazine-hero">
        <div className="sb-shell sb-magazine-hero__head">
          <div>
            <span className="sb-eyebrow">SEPIID JOURNAL / 2026</span>
            <h1>مجله راهنمای محصولات زیبایی و خرید آگاهانه</h1>
          </div>
          <p>
            تحریریه سپید بیوتی، محتوای آموزشی را با تاریخ بازبینی، محدودیت روشن و
            لینک مستقیم به منابع رسمی یا پژوهشی منتشر می‌کند.
          </p>
        </div>

        <article className="sb-magazine-featured sb-shell">
          <Link href={`/magazine/${featured.slug}`} className="sb-magazine-featured__image">
            <img
              src={featured.image}
              alt={featured.imageAlt ?? featured.title}
              width="1254"
              height="1254"
              fetchPriority="high"
            />
          </Link>
          <div className="sb-magazine-featured__content">
            <span>{featured.category}</span>
            <h2>{featured.title}</h2>
            <p>{featured.excerpt}</p>
            <div className="sb-magazine-featured__meta">
              <span>{featured.date}</span>
              <span>
                <ClockIcon />
                {featured.readTime}
              </span>
            </div>
            <Link className="sb-btn sb-btn--dark" href={`/magazine/${featured.slug}`}>
              مطالعه مقاله شاخص
              <ArrowIcon />
            </Link>
          </div>
        </article>
      </section>

      <section className="sb-topic-strip">
        <div className="sb-shell">
          <span>موضوع‌ها:</span>
          {["راهنمای انتخاب", "مو و پوست سر", "ایمنی و اصالت", "مراقبت آگاهانه"].map(
            (topic) => (
              <a href="#articles" key={topic}>
                {topic}
              </a>
            ),
          )}
        </div>
      </section>

      <section className="sb-section sb-magazine-list" id="articles">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">LATEST / ARTICLES</span>
              <h2>تازه‌ترین راهنماها</h2>
            </div>
            <p>{editableArticles.length} مقاله با صفحه مستقل و منابع قابل بررسی</p>
          </div>
          <div className="sb-article-grid">
            {editableArticles.map((article) => (
              <ArticleCard article={article} key={article.slug} />
            ))}
          </div>
        </div>
      </section>

      <section className="sb-editorial-policy">
        <div className="sb-shell sb-editorial-policy__grid">
          <div>
            <span className="sb-eyebrow sb-eyebrow--gold">EDITORIAL STANDARD</span>
            <h2>استاندارد تحریریه سپید</h2>
          </div>
          <ol>
            <li>
              <span>۰۱</span>
              <div>
                <strong>منبع مستقیم</strong>
                <p>اولویت با نهادهای رسمی و پژوهش‌های منتشرشده است.</p>
              </div>
            </li>
            <li>
              <span>۰۲</span>
              <div>
                <strong>ادعای محتاطانه</strong>
                <p>نتیجه قطعی، بی‌خطر یا مناسب برای همه نمی‌نویسیم.</p>
              </div>
            </li>
            <li>
              <span>۰۳</span>
              <div>
                <strong>بازبینی و اصلاح</strong>
                <p>تاریخ بازبینی و لینک منابع روی هر مقاله دیده می‌شود.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </main>
  );
}
