import Link from "next/link";
import { ArticleCard } from "../components/ArticleCard";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, CheckIcon } from "../components/Icons";
import { articles, whatsappHref } from "../data";
import { concerns, guides } from "../content-architecture";
import { getEditorialCategoryCopy } from "../lib/editorial-category-copy";
import { getStorefrontCategories } from "../lib/storefront-categories";
import { buildSeoMetadata } from "../lib/seo";

export const revalidate = 300;

export const metadata = buildSeoMetadata({
  title: "راهنمای انتخاب محصولات حرفه‌ای زیبایی",
  description:
    "اگر هنوز بین فیلر، مزوژل، اسکین‌بوستر، بوتولینوم یا کوکتل‌های مختلف مردد هستید، از این راهنما برای شناخت دسته و مدل درست شروع کنید.",
  path: "/guides",
  image: "/images/magazine-authenticity-v2.webp",
  imageAlt: "راهنمای انتخاب محصولات حرفه‌ای زیبایی",
});

const steps = [
  {
    index: "۰۱",
    title: "اول نیاز را مشخص کنید",
    text: "نام محصول را کنار بگذارید و ببینید دقیقاً دنبال شناخت کدام گروه هستید.",
  },
  {
    index: "۰۲",
    title: "بعد سراغ مدل بروید",
    text: "نام کامل، حجم و محتویات همان بسته را کنار گزینه‌های مشابه ببینید.",
  },
  {
    index: "۰۳",
    title: "قیمت را برای همان بسته مقایسه کنید",
    text: "قیمت یک سرنگ، یک ویال و جعبه کامل را با هم اشتباه نگیرید.",
  },
  {
    index: "۰۴",
    title: "مرز تصمیم پزشکی را نگه دارید",
    text: "تناسب محصول، ناحیه و روش استفاده را فرد واجد صلاحیت تعیین می‌کند.",
  },
];

export default async function GuidesPage() {
  const categories = await getStorefrontCategories();

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "راهنمای انتخاب" }]} />
      </div>

      <section className="sb-guides-hero">
        <div className="sb-shell sb-guides-hero__grid">
          <div>
            <span className="sb-eyebrow">SEPIID DECISION GUIDE</span>
            <h1>اگر هنوز دقیقاً نمی‌دانید کدام محصول را باید ببینید، از اینجا شروع کنید.</h1>
            <p>
              این بخش برای زمانی است که اسم چند محصول را شنیده‌اید اما تفاوت دسته، مدل یا بسته‌ها هنوز روشن نیست. از موضوع یا نیاز شروع کنید و قدم‌به‌قدم به محصولات مرتبط برسید.
            </p>
            <Link className="sb-btn sb-btn--dark" href="/shop">
              رفتن مستقیم به فروشگاه
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
              <h2>موضوعی را انتخاب کنید که می‌خواهید بهتر بشناسید</h2>
            </div>
            <p>هر راهنما یک سؤال مشخص را جواب می‌دهد و شما را به دسته و محصولات مرتبط می‌رساند.</p>
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
            <p>اول مسئله را بشناسید؛ بعد به دسته و محصول برسید.</p>
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
                    شروع از این موضوع
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
              <h2>دسته‌ها را با سؤال درست مقایسه کنید.</h2>
            </div>
            <p>در هر گروه، معیار مقایسه کمی متفاوت است.</p>
          </div>
          <div className="sb-guide-paths__grid">
            {categories.map((category, index) => {
              const editorial = getEditorialCategoryCopy(
                category.slug,
                category.description,
                category.guide,
              );

              return (
                <article key={category.slug}>
                  <span>۰{index + 1}</span>
                  <small>{category.en}</small>
                  <h3>{category.title}</h3>
                  <p>{editorial.intro}</p>
                  <div>
                    <CheckIcon />
                    {editorial.guideLead}
                  </div>
                  <Link className="sb-text-link" href={`/shop/${category.slug}`}>
                    دیدن این دسته
                    <ArrowIcon />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sb-guide-comparison">
        <div className="sb-shell sb-guide-comparison__grid">
          <div>
            <span className="sb-eyebrow sb-eyebrow--gold">BOUNDARIES / مرزها</span>
            <h2>شناخت محصول با انتخاب درمان یکی نیست.</h2>
          </div>
          <div className="sb-guide-comparison__cards">
            <article>
              <strong>سپید بیوتی کمک می‌کند</strong>
              <ul>
                <li>دسته، برند و مدل محصول را بهتر بشناسید</li>
                <li>حجم، بسته‌بندی و قیمت را مقایسه کنید</li>
                <li>برای موجودی و سفارش مسیر روشنی داشته باشید</li>
              </ul>
            </article>
            <article>
              <strong>فرد واجد صلاحیت باید تصمیم بگیرد</strong>
              <ul>
                <li>آیا محصول برای فرد مناسب است</li>
                <li>کدام ناحیه و چه روشی مناسب است</li>
                <li>محدودیت‌ها و عوارض چگونه مدیریت شوند</li>
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
            <span>هنوز بین چند دسته مردد هستید؟</span>
            <h2>اسم محصول لازم نیست؛ بگویید دنبال شناخت چه گروهی هستید.</h2>
          </div>
          <Link
            className="sb-btn sb-btn--gold"
            href={whatsappHref("سلام، برای پیدا کردن دسته محصول مناسب راهنمایی می‌خواهم.")}
          >
            گفت‌وگو با تیم سپید
            <ArrowIcon />
          </Link>
        </div>
      </section>
    </main>
  );
}
