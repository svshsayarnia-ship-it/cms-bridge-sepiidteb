/* eslint-disable @next/next/no-img-element -- local editorial imagery */
import Link from "next/link";
import { ArticleCard } from "../components/ArticleCard";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, ClockIcon } from "../components/Icons";
import type { Article } from "../data";
import { getManagedArticles, getSitePresentation } from "../lib/site-presentation";
import { articlePath } from "../lib/article-url";
import { sortArticlesNewestFirst } from "../lib/article-order";
import { buildSeoMetadata } from "../lib/seo";

// Static revenue guides use dedicated App Router pages so their SEO metadata,
// FAQ schema and internal commerce links remain deterministic. Keep them in the
// magazine index too so they are never orphaned from the editorial hub.
const staticEditorialGuides: Article[] = [
  {
    slug: "revofil-10ml-vs-1ml-guide",
    title: "رووفیل ۱۰ سی‌سی یا ۱ سی‌سی؟ تفاوت حجم، مدل و روش درست مقایسه قیمت",
    excerpt:
      "راهنمای تفکیک Revofil ۱۰ میلی‌لیتری از نسخه ۱ میلی‌لیتری؛ با تمرکز بر مدل، حجم، واحد فروش و مقایسه درست قیمت.",
    category: "راهنمای انتخاب فیلر",
    date: "شهریور ۱۴۰۵",
    readTime: "۷ دقیقه",
    image: "/images/drive/product-revofil.webp",
    lead: "",
    notice: "",
    sections: [],
    sources: [],
    relatedProducts: ["revofil-ultra"],
    datePublished: "2026-09-07",
    dateModified: "2026-09-07",
  },
  {
    slug: "jalupro-classic-hmw-super-hydro-guide",
    title: "جالپرو Classic، HMW یا Super Hydro؟ تفاوت مدل‌ها، ترکیب و بسته‌بندی",
    excerpt:
      "مقایسه سه مدل Jalupro بر اساس اطلاعات رسمی سازنده، تفاوت ترکیب و ساختار بسته؛ بدون تبدیل نام برند به توصیه درمانی.",
    category: "راهنمای اسکین‌بوستر",
    date: "شهریور ۱۴۰۵",
    readTime: "۸ دقیقه",
    image: "/images/drive/product-jalupro.webp",
    lead: "",
    notice: "",
    sections: [],
    sources: [],
    relatedProducts: ["jalupro-hmw"],
    datePublished: "2026-09-07",
    dateModified: "2026-09-07",
  },
  {
    slug: "neuramis-10ml-pack-guide",
    title: "نورامیس ۱۰ سی‌سی یعنی چه؟ تفاوت بسته ۱۰ عددی با سرنگ ۱ سی‌سی",
    excerpt:
      "تفاوت بسته ۱۰ × ۱ میلی‌لیتر با نورامیس تکی و روش درست مقایسه قیمت؛ برای جلوگیری از اشتباه بین حجم کل و واحد فروش.",
    category: "راهنمای انتخاب فیلر",
    date: "شهریور ۱۴۰۵",
    readTime: "۶ دقیقه",
    image: "/images/products/neuramis-deep-10-pack.webp",
    lead: "",
    notice: "",
    sections: [],
    sources: [],
    relatedProducts: ["neuramis-deep-lidocaine"],
    datePublished: "2026-09-07",
    dateModified: "2026-09-07",
  },
];

export const dynamic = "force-dynamic";

export const metadata = buildSeoMetadata({
  title: "مجله سپید؛ راهنماهای اصالت، انتخاب و مراقبت",
  description:
    "مقالات منبع‌دار و به‌روز درباره فیلرهای پرجست‌وجو، بوتولینوم، مزوژل، ریزش مو، اصالت محصولات و مدیریت خرید کلینیک.",
  path: "/magazine",
  image: "/images/magazine-authenticity-v2.webp",
  imageAlt: "مجله سپید بیوتی",
});

export default async function MagazinePage() {
  const staticSlugs = new Set(staticEditorialGuides.map((article) => article.slug));
  const editableArticles = sortArticlesNewestFirst(
    getManagedArticles(await getSitePresentation()),
  ).filter((article) => !staticSlugs.has(article.slug));
  const allArticles = [...staticEditorialGuides, ...editableArticles];
  const featured = allArticles[0];

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "مجله سپید" }]} />
      </div>

      <section className="sb-magazine-hero">
        <div className="sb-shell sb-magazine-hero__head">
          <div>
            <span className="sb-eyebrow">مجله سپید</span>
            <h1>مجله راهنمای محصولات زیبایی و خرید آگاهانه</h1>
          </div>
          <p>
            تحریریه سپید بیوتی، محتوای آموزشی را با تاریخ بازبینی، محدودیت روشن و
            لینک مستقیم به منابع رسمی یا پژوهشی منتشر می‌کند.
          </p>
        </div>

        <article className="sb-magazine-featured sb-shell">
          <Link href={articlePath(featured.slug)} className="sb-magazine-featured__image">
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
            <Link className="sb-btn sb-btn--dark" href={articlePath(featured.slug)}>
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
              <span className="sb-eyebrow">تازه‌ترین مطالب</span>
              <h2>تازه‌ترین راهنماها</h2>
            </div>
            <p>{allArticles.length} مقاله با صفحه مستقل و منابع قابل بررسی</p>
            <div className="sb-preferred-source" aria-label="منبع ترجیحی گوگل">
              <div google-add-preferred-source-btn></div>
              <small>اگر مطالب سپید برایتان مفید است، آن را به منابع ترجیحی گوگل اضافه کنید.</small>
            </div>
          </div>
          <div className="sb-article-grid">
            {allArticles.map((article) => (
              <ArticleCard article={article} key={article.slug} />
            ))}
          </div>
        </div>
      </section>

      <section className="sb-editorial-policy">
        <div className="sb-shell sb-editorial-policy__grid">
          <div>
            <span className="sb-eyebrow sb-eyebrow--gold">روش کار تحریریه</span>
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
