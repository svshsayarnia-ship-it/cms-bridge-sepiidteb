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
  title: "راهنمای ساده انتخاب محصولات زیبایی",
  description:
    "کمک می‌کنیم گروه محصول، مدل، حجم بسته و سؤال‌های مهم قبل از خرید را ساده‌تر بشناسید.",
  path: "/guides",
  image: "/images/magazine-authenticity-v2.webp",
  imageAlt: "راهنمای انتخاب محصولات حرفه‌ای زیبایی",
});

const steps = [
  {
    index: "۰۱",
    title: "اول ببینید چه می‌خواهید",
    text: "پوست، مو یا فرم؟ اول خواسته‌تان را روشن کنید، نه اسم یک برند را.",
  },
  {
    index: "۰۲",
    title: "اسم و بسته را بخوانید",
    text: "نام مدل، حجم و تعداد داخل همان جعبه را ببینید.",
  },
  {
    index: "۰۳",
    title: "تصمیم پزشکی را به پزشک بسپارید",
    text: "مناسب‌بودن، ناحیه و روش استفاده را پزشک مشخص می‌کند.",
  },
  {
    index: "۰۴",
    title: "قبل از پرداخت سؤال کنید",
    text: "قیمت روز، موجودی، سلامت بسته و زمان ارسال را روشن کنید.",
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
            <span className="sb-eyebrow">راهنمای انتخاب سپید</span>
            <h1>از اسم محصول شروع نکنید؛ از نیازتان شروع کنید.</h1>
            <p>
              اگر هنوز نمی‌دانید کدام گروه یا مدل را ببینید، از اینجا شروع کنید.
              اطلاعات خرید را ساده می‌گوییم و تصمیم پزشکی را به پزشک می‌سپاریم.
            </p>
            <Link className="sb-btn sb-btn--dark" href="/shop">
              دیدن محصولات
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
              <h2>موضوعی را انتخاب کنید که می‌خواهید بهتر بفهمید</h2>
            </div>
            <p>هر راهنما یک موضوع را ساده توضیح می‌دهد و به محصول‌های مرتبط می‌رسد.</p>
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
                    خواندن راهنمای ساده
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
            <p>اول خواسته‌تان را روشن کنید؛ بعد سراغ دسته یا مدل بروید.</p>
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
                    دیدن راهنمای مرتبط
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
              <span className="sb-eyebrow">شروع از گروه محصول</span>
              <h2>اگر نام مدل را نمی‌دانید، از اینجا شروع کنید.</h2>
            </div>
            <p>در هر گروه، اطلاعات مهم خودش را پیدا می‌کنید.</p>
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
                  دیدن محصولات این گروه
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
            <span className="sb-eyebrow sb-eyebrow--gold">یک نکته مهم</span>
            <h2>شناخت محصول با انتخاب پزشکی فرق دارد.</h2>
          </div>
          <div className="sb-guide-comparison__cards">
            <article>
              <strong>سپید بیوتی درباره این‌ها کمک می‌کند</strong>
              <ul>
                <li>گروه و نام دقیق محصول را بشناسید</li>
                <li>قیمت روز و اطلاعات بسته را بپرسید</li>
                <li>زمان تحویل و پیگیری را روشن کنید</li>
              </ul>
            </article>
            <article>
              <strong>پزشک باید این‌ها را مشخص کند</strong>
              <ul>
                <li>محصول برای فرد مناسب هست یا نه</li>
                <li>کدام ناحیه و با چه روشی کار شود</li>
                <li>خطرها و عوارض چطور مدیریت شوند</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="sb-section">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">برای شروع بخوانید</span>
              <h2>سه مقاله کوتاه و کاربردی</h2>
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
            <h2>نمی‌دانید از کجا شروع کنید؟ برایمان بنویسید.</h2>
          </div>
          <Link
            className="sb-btn sb-btn--gold"
            href={whatsappHref("سلام، برای پیدا کردن دسته محصول مناسب راهنمایی می‌خواهم.")}
          >
            پرسیدن از سپید
            <ArrowIcon />
          </Link>
        </div>
      </section>
    </main>
  );
}
