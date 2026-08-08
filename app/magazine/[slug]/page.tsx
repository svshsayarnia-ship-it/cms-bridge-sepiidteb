/* eslint-disable @next/next/no-img-element -- local editorial imagery */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "../../components/ArticleCard";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { ArrowIcon, ClockIcon } from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { ProductCard } from "../../components/ProductCard";
import { articles, products } from "../../data";
import { siteOrigin } from "../../lib/site-url";
import { applyArticlePresentation, getSitePresentation } from "../../lib/site-presentation";

async function getEditableArticle(slug: string) {
  return applyArticlePresentation(articles, await getSitePresentation())
    .find((article) => article.slug === slug);
}

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getEditableArticle(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/magazine/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      images: [
        article.slug === "verify-dermal-filler-authenticity"
          ? "/images/magazine-authenticity-v2.webp"
          : article.image,
      ],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getEditableArticle(slug);
  if (!article) notFound();

  const image =
    article.slug === "verify-dermal-filler-authenticity"
      ? "/images/magazine-authenticity-v2.webp"
      : article.image;
  const relatedProducts = products.filter((product) =>
    article.relatedProducts.includes(product.slug),
  );
  const relatedArticles = articles.filter((item) => item.slug !== article.slug).slice(0, 2);

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            { label: "مجله سپید", href: "/magazine" },
            { label: article.title },
          ]}
        />
      </div>

      <header className="sb-article-header">
        <div className="sb-shell sb-article-header__grid">
          <div className="sb-article-header__content">
            <span className="sb-eyebrow">{article.category}</span>
            <h1>{article.title}</h1>
            <p>{article.excerpt}</p>
            <div className="sb-article-header__meta">
              <span>تحریریه سپید بیوتی</span>
              <span>{article.date}</span>
              <span>
                <ClockIcon />
                {article.readTime}
              </span>
            </div>
          </div>
          <figure>
            <img
              src={image}
              alt=""
              width="1672"
              height="941"
              fetchPriority="high"
              style={{ objectPosition: article.imagePosition }}
            />
            <figcaption>تصویر ادیتوریال · بدون نمایش محصول یا برند مشخص</figcaption>
          </figure>
        </div>
      </header>

      <section className="sb-article-layout sb-shell">
        <aside className="sb-article-toc">
          <strong>در این مقاله</strong>
          <nav>
            <a href="#summary">خلاصه سریع</a>
            {article.sections.map((section, index) => (
              <a href={`#section-${index + 1}`} key={section.heading}>
                {section.heading}
              </a>
            ))}
            <a href="#sources">منابع</a>
          </nav>
          <p>
            آخرین بازبینی محتوایی
            <b>۲۵ ژوئیه ۲۰۲۶</b>
          </p>
        </aside>

        <article className="sb-article-body">
          <section className="sb-article-summary" id="summary">
            <span>خلاصه سریع</span>
            <p>{article.lead}</p>
          </section>

          <div className="sb-article-notice">
            <strong>یادداشت ایمنی</strong>
            <p>{article.notice}</p>
          </div>

          {article.sections.map((section, index) => (
            <section id={`section-${index + 1}`} key={section.heading}>
              <span className="sb-article-body__index">۰{index + 1}</span>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets && (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="sb-article-sources" id="sources">
            <span className="sb-eyebrow">SOURCES / منابع</span>
            <h2>منابع مستقیم و قابل بررسی</h2>
            <p>
              لینک‌ها برای بررسی بیشتر ارائه شده‌اند. منابع ممکن است در آینده
              به‌روزرسانی شوند؛ تاریخ بازبینی مقاله را بالای صفحه ببینید.
            </p>
            <ol>
              {article.sources.map((source) => (
                <li key={source.href}>
                  <a href={source.href} rel="noreferrer" target="_blank">
                    {source.label}
                    <span>↗</span>
                  </a>
                </li>
              ))}
            </ol>
          </section>

          <footer className="sb-article-author">
            <span>نویسنده</span>
            <div>
              <strong>تحریریه سپید بیوتی</strong>
              <p>
                محتوای آموزشی برای خرید آگاهانه؛ بدون معرفی پزشک یا بازبین ساختگی.
              </p>
            </div>
          </footer>
        </article>
      </section>

      {relatedProducts.length > 0 && (
        <section className="sb-section sb-article-products">
          <div className="sb-shell">
            <div className="sb-section-head">
              <div>
                <span className="sb-eyebrow">PRODUCT / REFERENCE</span>
                <h2>مشاهده مشخصات محصولات مرتبط</h2>
              </div>
              <p>نمایش محصول به معنی مناسب‌بودن آن برای خواننده نیست.</p>
            </div>
            <div className="sb-product-grid sb-product-grid--three">
              {relatedProducts.map((product) => (
                <ProductCard product={product} key={product.slug} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="sb-section sb-related-articles">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">KEEP READING</span>
              <h2>ادامه مسیر مطالعه</h2>
            </div>
            <Link className="sb-text-link" href="/magazine">
              همه مقاله‌ها
              <ArrowIcon />
            </Link>
          </div>
          <div className="sb-article-grid sb-article-grid--two">
            {relatedArticles.map((item) => (
              <ArticleCard article={item} key={item.slug} />
            ))}
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt,
          image: `${siteOrigin}${image}`,
          inLanguage: "fa-IR",
          author: {
            "@type": "Organization",
            name: "تحریریه سپید بیوتی",
          },
          publisher: {
            "@type": "Organization",
            name: "Sepiid Beauty",
          },
          datePublished: "2026-07-25",
          dateModified: "2026-07-25",
          mainEntityOfPage: `${siteOrigin}/magazine/${article.slug}`,
        }}
      />
    </main>
  );
}
