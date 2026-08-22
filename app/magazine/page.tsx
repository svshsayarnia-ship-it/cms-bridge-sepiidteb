/* eslint-disable @next/next/no-img-element -- local editorial imagery */
import Link from "next/link";
import { ArticleCard } from "../components/ArticleCard";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, ClockIcon } from "../components/Icons";
import { articles } from "../data";
import { applyArticlePresentation, getSitePresentation } from "../lib/site-presentation";
import { buildSeoMetadata } from "../lib/seo";
import { toReaderFriendlyCopy } from "../lib/public-copy";

export const metadata = buildSeoMetadata({
  title: "مجله سپید؛ راهنمای ساده محصولات زیبایی",
  description:
    "نوشته‌های ساده درباره فیلر، بوتاکس، مزوژل، بسته‌بندی، خرید و سؤال‌هایی که بهتر است قبل از سفارش بپرسید.",
  path: "/magazine",
  image: "/images/magazine-authenticity-v2.webp",
  imageAlt: "مجله سپید بیوتی",
});

export default async function MagazinePage() {
  const editableArticles = applyArticlePresentation(articles, await getSitePresentation());
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
            <span className="sb-eyebrow">مجله سپید</span>
            <h1>قبل از خرید، چند نکته ساده بخوانید.</h1>
          </div>
          <p>
            اینجا درباره نام مدل‌ها، حجم بسته، راه بررسی و سؤال‌های مهم خرید می‌نویسیم.
            متن‌ها آموزشی‌اند و جای معاینه یا نظر پزشک را نمی‌گیرند.
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
            <h2>{toReaderFriendlyCopy(featured.title)}</h2>
            <p>{toReaderFriendlyCopy(featured.excerpt)}</p>
            <div className="sb-magazine-featured__meta">
              <span>{featured.date}</span>
              <span>
                <ClockIcon />
                {featured.readTime}
              </span>
            </div>
            <Link className="sb-btn sb-btn--dark" href={`/magazine/${featured.slug}`}>
              خواندن مقاله
              <ArrowIcon />
            </Link>
          </div>
        </article>
      </section>

      <section className="sb-topic-strip">
        <div className="sb-shell">
          <span>از این موضوع‌ها شروع کنید:</span>
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
              <span className="sb-eyebrow">نوشته‌های سپید</span>
              <h2>تازه‌ترین مقاله‌ها</h2>
            </div>
            <p>{editableArticles.length} مقاله درباره انتخاب، بسته و خرید</p>
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
            <span className="sb-eyebrow sb-eyebrow--gold">روش نوشتن ما</span>
            <h2>واضح می‌نویسیم و اغراق نمی‌کنیم</h2>
          </div>
          <ol>
            <li>
              <span>۰۱</span>
              <div>
                <strong>منبع را نشان می‌دهیم</strong>
                <p>هرجا لازم باشد، لینک منبع رسمی یا پژوهشی را می‌گذاریم.</p>
              </div>
            </li>
            <li>
              <span>۰۲</span>
              <div>
                <strong>قول عجیب نمی‌دهیم</strong>
                <p>نتیجه قطعی یا مناسب‌بودن برای همه را وعده نمی‌دهیم.</p>
              </div>
            </li>
            <li>
              <span>۰۳</span>
              <div>
                <strong>متن را به‌روز می‌کنیم</strong>
                <p>تاریخ آخرین بازبینی هر مقاله را روشن می‌نویسیم.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </main>
  );
}
