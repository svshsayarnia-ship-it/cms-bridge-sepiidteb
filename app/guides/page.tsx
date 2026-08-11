import Link from "next/link";
import { ArticleCard } from "../components/ArticleCard";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, CheckIcon } from "../components/Icons";
import { articles, whatsappHref } from "../data";
import { concerns, guides } from "../content-architecture";
import { getStorefrontCategories } from "../lib/storefront-categories";
import { buildSeoMetadata } from "../lib/seo";

export const revalidate = 300;

export const metadata = buildSeoMetadata({
  title: "راهنمای انتخاب محصولات حرفه‌ای زیبایی",
  description:
    "مسیر آموزشی برای شناخت دسته محصولات، پرسش‌های لازم پیش از خرید، بررسی اصالت و تفکیک راهنمای خرید از تصمیم پزشکی.",
  path: "/guides",
  image: "/images/magazine-authenticity-v2.webp",
  imageAlt: "راهنمای انتخاب محصولات حرفه‌ای زیبایی",
});

const steps = [
  {
    index: "۰۱",
    title: "هدف را دقیق کنید",
    text: "کیفیت پوست، فرم یا مو؟ اول مسئله را از نام محصول جدا کنید.",
  },
  {
    index: "۰۲",
    title: "محصول مشخص را بخوانید",
    text: "نام مدل، حجم و محتویات همان بسته را بررسی کنید.",
  },
  {
    index: "۰۳",
    title: "مرز پزشکی را رعایت کنید",
    text: "تناسب، منع مصرف و پروتکل را پزشک واجد صلاحیت تعیین می‌کند.",
  },
  {
    index: "۰۴",
    title: "پیش از پرداخت تطبیق دهید",
    text: "موجودی، بچ‌کد، تاریخ، بسته‌بندی و روش تحویل را استعلام کنید.",
  },
];

export default async function GuidesPage() {
  const categories =
    await getStorefrontCategories();

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "راهنمای انتخاب" }]} />
      </div>

      <section className="sb-guides-hero">
        <div className="sb-shell sb-guides-hero__grid">
          <div>
            <span className="sb-eyebrow">SEPIID DECISION GUIDE</span>
            <h1>راهنمای انتخاب محصولات زیبایی و کلینیکی</h1>
            <p>
              این صفحه به شما کمک می‌کند اطلاعات لازم برای گفت‌وگو با پزشک یا
              پشتیبانی را مرتب کنید و از تصمیم‌های سریع و مبتنی بر نام تجاری فاصله
              بگیرید.
            </p>
            <Link className="sb-btn sb-btn--dark" href="/shop">
              مرور دسته‌های فروشگاه
              <ArrowIcon />
            </Link>
          </div>
          <ol>
            {steps.map((step) => (
              <li key={step.index}>
                <span>{step.index}</span>
                <div>
                  <h2>{step.title}</h2>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sb-section sb-architecture-hub">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">راهنماهای اصلی</span>
              <h2>از موضوعی که می‌خواهید بشناسید شروع کنید</h2>
            </div>
            <p>هر راهنما یک موضوع مشخص دارد و به دسته و محصول مرتبط می‌رسد.</p>
          </div>
          <div className="sb-architecture-grid">
            {guides
              .filter((guide) => guide.indexable)
              .map((guide) => (
                <Link href={`/guides/${guide.slug}`} key={guide.slug}>
                  <span>{guide.eyebrow}</span>
                  <h3>{guide.title}</h3>
                  <p>{guide.description}</p>
                  <strong>
                    خواندن راهنما
                    <ArrowIcon />
                  </strong>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <section className="sb-section sb-concerns-hub" id="concerns">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">نیازها و دغدغه‌ها</span>
              <h2>اگر هنوز نام محصول را نمی‌دانید</h2>
            </div>
            <p>اول مسئله را روشن کنید؛ بعد سراغ دسته یا محصول بروید.</p>
          </div>
          <div className="sb-architecture-grid sb-architecture-grid--concerns">
            {concerns
              .filter((concern) => concern.indexable)
              .map((concern) => (
                <Link href={`/concerns/${concern.slug}`} key={concern.slug}>
                  <span>{concern.eyebrow}</span>
                  <h3>{concern.title}</h3>
                  <p>{concern.description}</p>
                  <strong>
                    دیدن مسیر مناسب
                    <ArrowIcon />
                  </strong>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <section className="sb-section sb-guide-paths">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">START / CATEGORY</span>
              <h2>از گروه درست شروع کنید.</h2>
            </div>
            <p>هر مسیر، سؤال‌های مخصوص خود را دارد.</p>
          </div>
          <div className="sb-guide-paths__grid">
            {categories.map((category, index) => (
              <article key={category.slug}>
                <span>۰{index + 1}</span>
                <small>{category.en}</small>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <div>
                  <CheckIcon />
                  {category.guide}
                </div>
                <Link className="sb-text-link" href={`/shop/${category.slug}`}>
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
            <span className="sb-eyebrow sb-eyebrow--gold">BOUNDARIES / مرزها</span>
            <h2>راهنمای خرید با تشخیص پزشکی فرق دارد.</h2>
          </div>
          <div className="sb-guide-comparison__cards">
            <article>
              <strong>سپید بیوتی کمک می‌کند</strong>
              <ul>
                <li>گروه و عنوان دقیق محصول را بشناسید</li>
                <li>موجودی و اطلاعات بسته را استعلام کنید</li>
                <li>فرایند تحویل و پیگیری را روشن کنید</li>
              </ul>
            </article>
            <article>
              <strong>پزشک باید تصمیم بگیرد</strong>
              <ul>
                <li>آیا محصول برای فرد مناسب است</li>
                <li>چه ناحیه و چه پروتکلی استفاده شود</li>
                <li>موارد منع مصرف و عارضه چگونه مدیریت شود</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="sb-section">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">READ / NEXT</span>
              <h2>سه مقاله برای شروع</h2>
            </div>
            <Link className="sb-text-link" href="/magazine">
              همه مقاله‌ها
              <ArrowIcon />
            </Link>
          </div>
          <div className="sb-article-grid">
            {articles.slice(0, 3).map((article) => (
              <ArticleCard article={article} key={article.slug} />
            ))}
          </div>
        </div>
      </section>

      <section className="sb-guides-cta">
        <div className="sb-shell">
          <div>
            <span>هنوز دسته مناسب را نمی‌دانید؟</span>
            <h2>هدف خود را بگویید؛ ما مسیر اطلاعات را نشان می‌دهیم.</h2>
          </div>
          <Link
            className="sb-btn sb-btn--gold"
            href={whatsappHref("سلام، برای پیدا کردن دسته محصول مناسب راهنمایی می‌خواهم.")}
          >
            گفت‌وگو با پشتیبانی
            <ArrowIcon />
          </Link>
        </div>
      </section>
    </main>
  );
}
