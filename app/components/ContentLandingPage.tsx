import Link from "next/link";
import { ArticleCard } from "./ArticleCard";
import { Breadcrumbs } from "./Breadcrumbs";
import { FaqList } from "./FaqList";
import { ArrowIcon } from "./Icons";
import { JsonLd } from "./JsonLd";
import { ProductCard } from "./ProductCard";
import type {
  ConcernPage,
  GuidePage,
} from "../content-architecture";
import {
  concerns,
  guides,
} from "../content-architecture";
import type {
  Article,
  Category,
  Product,
} from "../data";
import { siteOrigin } from "../lib/site-url";
import { toReaderFriendlyCopy } from "../lib/public-copy";

type ContentLandingPageProps = {
  page: GuidePage | ConcernPage;
  kind: "guide" | "concern";
  products: Product[];
  categories: Category[];
  articles: Article[];
};

function isGuide(
  page: GuidePage | ConcernPage,
): page is GuidePage {
  return "sources" in page;
}

export function ContentLandingPage({
  page,
  kind,
  products,
  categories,
  articles,
}: ContentLandingPageProps) {
  const root =
    kind === "guide"
      ? { label: "راهنماها", href: "/guides" }
      : { label: "نیازها و دغدغه‌ها", href: "/guides#concerns" };

  const relatedCategories = categories.filter(
    (category) =>
      page.categorySlugs.includes(category.slug),
  );

  const relatedProducts = isGuide(page)
    ? products
        .filter((product) =>
          page.productSlugs.length
            ? page.productSlugs.includes(product.slug)
            : page.categorySlugs.includes(product.category),
        )
        .slice(0, 3)
    : products
        .filter((product) =>
          page.categorySlugs.includes(product.category),
        )
        .slice(0, 3);

  const relatedArticles = articles
    .filter((article) =>
      page.articleSlugs.includes(article.slug),
    )
    .slice(0, 3);

  const relatedPages = isGuide(page)
    ? concerns.filter((concern) =>
        page.concernSlugs.includes(concern.slug),
      )
    : guides.filter((guide) =>
        page.guideSlugs.includes(guide.slug),
      );

  const path = `/${kind === "guide" ? "guides" : "concerns"}/${page.slug}`;

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            root,
            { label: page.title },
          ]}
        />
      </div>

      <header className="sb-content-landing__hero">
        <div className="sb-shell">
          <span className="sb-eyebrow">
            {page.eyebrow}
          </span>
          <h1>{toReaderFriendlyCopy(page.title)}</h1>
          <p>{toReaderFriendlyCopy(page.intro)}</p>
          <small>
            آخرین بازبینی: {page.reviewedAt}
          </small>
        </div>
      </header>

      <section className="sb-content-landing__quick">
        <div className="sb-shell">
          <h2>خلاصه‌ای که به کارتان می‌آید</h2>
          <ol>
            {page.quickChecks.map((item, index) => (
              <li key={item}>
                <span>۰{index + 1}</span>
                <p>{toReaderFriendlyCopy(item)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="sb-shell sb-content-landing__layout">
        <article className="sb-content-landing__body">
          {page.sections.map((section, index) => (
            <section
              id={`section-${index + 1}`}
              key={section.title}
            >
              <span>۰{index + 1}</span>
              <h2>{toReaderFriendlyCopy(section.title)}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{toReaderFriendlyCopy(paragraph)}</p>
              ))}
              {section.bullets?.length ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{toReaderFriendlyCopy(bullet)}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </article>

        <aside className="sb-content-landing__aside">
          <strong>اگر خواستید بیشتر بخوانید</strong>
          {relatedCategories.map((category) => (
            <Link
              href={`/shop/${category.slug}`}
              key={category.slug}
            >
              {toReaderFriendlyCopy(category.title)}
              <ArrowIcon />
            </Link>
          ))}
          {relatedPages.map((related) => (
            <Link
              href={`/${kind === "guide" ? "concerns" : "guides"}/${related.slug}`}
              key={related.slug}
            >
              {toReaderFriendlyCopy(related.title)}
              <ArrowIcon />
            </Link>
          ))}
        </aside>
      </div>

      <section className="sb-section sb-content-landing__faq">
        <div className="sb-shell sb-faq-section__grid">
          <div>
            <span className="sb-eyebrow">سؤال‌های رایج</span>
            <h2>جواب‌های کوتاه</h2>
          </div>
          <FaqList items={page.faq.map((item) => ({
            question: toReaderFriendlyCopy(item.question),
            answer: toReaderFriendlyCopy(item.answer),
          }))} />
        </div>
      </section>

      {isGuide(page) && page.sources.length > 0 ? (
        <section className="sb-content-landing__sources">
          <div className="sb-shell">
            <h2>منابعی که به آن‌ها تکیه کرده‌ایم</h2>
            <ul>
              {page.sources.map((source) => (
                <li key={source.href}>
                  <a
                    href={source.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {source.label}
                    <span>↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {relatedProducts.length > 0 ? (
        <section className="sb-section sb-related-products">
          <div className="sb-shell">
            <div className="sb-section-head">
              <div>
                <h2>محصولات مرتبط برای دیدن مشخصات</h2>
              </div>
              <Link className="sb-text-link" href="/shop">
                همه محصولات
                <ArrowIcon />
              </Link>
            </div>
            <div className="sb-product-grid sb-product-grid--three">
              {relatedProducts.map((product) => (
                <ProductCard
                  product={product}
                  key={product.slug}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {relatedArticles.length > 0 ? (
        <section className="sb-section sb-related-articles">
          <div className="sb-shell">
            <div className="sb-section-head">
              <div>
                <h2>اگر خواستید بیشتر بدانید</h2>
              </div>
              <Link className="sb-text-link" href="/magazine">
                همه مقاله‌ها
                <ArrowIcon />
              </Link>
            </div>
            <div className="sb-article-grid">
              {relatedArticles.map((article) => (
                <ArticleCard
                  article={article}
                  key={article.slug}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: page.title,
          description: page.description,
          url: `${siteOrigin}${path}`,
          inLanguage: "fa-IR",
          dateModified: "2026-08-11",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: page.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }}
      />
    </main>
  );
}
