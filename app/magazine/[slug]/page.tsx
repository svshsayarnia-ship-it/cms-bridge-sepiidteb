/* eslint-disable @next/next/no-img-element -- local editorial imagery */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { ArticleCard } from "../../components/ArticleCard";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FaqList } from "../../components/FaqList";
import { ArrowIcon, ClockIcon } from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { ProductCard } from "../../components/ProductCard";
import { articles } from "../../data";
import { getGuideForArticle } from "../../content-architecture";
import { getStorefrontProducts } from "../../lib/storefront-catalog";
import {
  articlePath,
  canonicalArticleSlug,
  isLegacyArticleSlug,
} from "../../lib/article-url";
import { siteOrigin } from "../../lib/site-url";
import { buildSeoMetadata } from "../../lib/seo";
import { getArticleHeadings } from "../../lib/article-html";
import {
  getManagedArticles,
  getSitePresentation,
  normalizeSitePresentation,
} from "../../lib/site-presentation";
import { getSitePresentation as getRemoteSitePresentation } from "../../lib/woocommerce";

function headingText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}
const neuramisVariantLinks = {
  Deep: "/product/neuramis-deep-lidocaine?variant=deep-1ml",
  Volume: "/product/neuramis-deep-lidocaine?variant=volume-1ml",
  Lido: "/product/neuramis-deep-lidocaine?variant=lido-10ml",
} as const;

function isNeuramisGuide(slug: string) {
  return /(?:نورامیس|neuramis)/i.test(slug);
}

function normalizeNeuramisModelCopy(value: string) {
  return value
    .replace(/Neuramis Light/gi, "Neuramis Lido")
    .replace(/نورامیس Light/gi, "نورامیس Lido")
    .replace(/مدل Light/gi, "مدل Lido")
    .replace(/Light ظریف‌تر، Deep/gi, "Lido لیدوکائین‌دار، Deep")
    .replace(/\bLight\b/gi, "Lido");
}

function absoluteArticleImage(value: string) {
  return /^https?:\/\//i.test(value) ? value : `${siteOrigin}${value}`;
}

function prepareNeuramisGuideHtml(value: string) {
  let html = normalizeNeuramisModelCopy(value)
    .replace(
      /مدل Lido معمولاً در دسته ژل‌های ظریف‌تر قرار می‌گیرد و برای خطوط سطحی‌تر یا نواحی ظریف‌تر مورد\s*توجه قرار می‌گیرد\. انتخاب نهایی باید با تشخیص متخصص انجام شود؛ زیرا ضخامت پوست و محل درمان در\s*نتیجه نهایی نقش تعیین‌کننده دارند\./gi,
      "نام Lido به وجود لیدوکائین در این مدل اشاره دارد. مدل موجود سپید بیوتی به‌صورت بسته ۱۰ عددی از سرنگ‌های یک‌میلی‌لیتری ارائه می‌شود؛ مشخصات روی جعبه و انتخاب نهایی باید پیش از خرید با نیاز حرفه‌ای و نظر متخصص تطبیق داده شود.",
    )
    .replace(/بافت ظریف‌تر/gi, "حاوی لیدوکائین")
    .replace(/رسیدگی به خطوط ظریف‌تر، با تشخیص متخصص/gi, "بررسی مدل لیدوکائین‌دار در بسته ۱۰ × ۱ میلی‌لیتری")
    .replace(
      /https?:\/\/(?:www\.)?sepiidbeauty\.ir\/product\/neuramis(?=["'])/gi,
      "/product/neuramis-deep-lidocaine",
    );

  for (const [model, href] of Object.entries(neuramisVariantLinks)) {
    const headingPattern = new RegExp(
      `(<h[23]\\b[^>]*>\\s*)(نورامیس\\s+${model})(\\s*</h[23]>)`,
      "gi",
    );
    html = html.replace(
      headingPattern,
      `$1<a href="${href}">$2</a>$3`,
    );

    const cellPattern = new RegExp(
      `(<td\\b[^>]*>\\s*)(Neuramis\\s+${model})(\\s*</td>)`,
      "gi",
    );
    html = html.replace(
      cellPattern,
      `$1<a href="${href}">$2</a>$3`,
    );
  }

  return html;
}

function prepareArticleHtml(value: string) {
  const fragmentByLabel = new Map<string, string>();
  for (const match of value.matchAll(/<a\b[^>]*href=["']#([a-z][a-z0-9_-]{0,79})["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    fragmentByLabel.set(headingText(match[2]), match[1]);
  }

  const anchoredHeadings = value.replace(
    /<h([2-4])\b([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (full, level: string, attributes: string, contents: string) => {
      if (/\bid\s*=/i.test(attributes)) return full;
      const label = headingText(contents);
      let id = fragmentByLabel.get(label);
      if (!id && /(?:س[ؤو]الات|پرسش).*(?:متداول|پرتکرار)/i.test(label)) id = "faq";
      if (!id && /^(?:منابع|references|sources)\b/i.test(label)) id = "sources";
      return id
        ? `<h${level}${attributes} id="${id}">${contents}</h${level}>`
        : full;
    },
  );

  return anchoredHeadings.replace(
    /<table\b([^>]*)>([\s\S]*?)<\/table>/gi,
    '<div class="sb-article-table sb-article-table--html" role="region" aria-label="جدول مقاله"><table$1>$2</table></div>',
  );
}

function hasHtmlAnchor(value: string, id: string) {
  return new RegExp(`\\bid=["']${id}["']`, "i").test(value);
}

const getEditableArticle = cache(async (slug: string) => {
  const requestedSlug = canonicalArticleSlug(slug);
  const matchesRequestedSlug = (article: { slug: string }) =>
    canonicalArticleSlug(article.slug) === requestedSlug;

  const initial = getManagedArticles(await getSitePresentation())
    .find(matchesRequestedSlug);
  if (initial) return initial;

  // A CMS-created article is not part of the static fallback. Before returning
  // a 404, bypass the cross-request cache once so a transient WordPress timeout
  // cannot hide an article that is already published.
  try {
    const fresh = normalizeSitePresentation(
      await getRemoteSitePresentation({
        requestTimeoutMs: 15_000,
        requestMaxAttempts: 3,
      }),
    );
    return getManagedArticles(fresh)
      .find(matchesRequestedSlug);
  } catch {
    return undefined;
  }
});

export const dynamicParams = true;

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (isLegacyArticleSlug(slug)) return {};
  const article = await getEditableArticle(slug);
  if (!article) return {};

  const image =
    article.slug === "verify-dermal-filler-authenticity"
      ? "/images/magazine-authenticity-v2.webp"
      : article.image;
  const description = article.metaDescription || article.excerpt;

  return buildSeoMetadata({
    title: article.seoTitle || article.title,
    description: isNeuramisGuide(article.slug)
      ? normalizeNeuramisModelCopy(description)
      : description,
    path: articlePath(article.slug),
    image,
    imageAlt:
      article.imageAlt || article.title,
    type: "article",
    publishedTime: article.datePublished,
    modifiedTime:
      article.dateModified ||
      article.datePublished,
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (isLegacyArticleSlug(slug)) {
    permanentRedirect(articlePath(slug));
  }
  const article = await getEditableArticle(slug);
  if (!article) notFound();
  const renderedHtmlContent = article.contentMode === "html"
    ? prepareArticleHtml(
        isNeuramisGuide(article.slug)
          ? prepareNeuramisGuideHtml(article.htmlContent ?? "")
          : article.htmlContent ?? "",
      )
    : "";
  const hasEmbeddedSources = hasHtmlAnchor(renderedHtmlContent, "sources");
  const hasSourceSection = hasEmbeddedSources || article.sources.length > 0;

  const image =
    article.slug === "verify-dermal-filler-authenticity"
      ? "/images/magazine-authenticity-v2.webp"
      : article.image;
  const storefrontProducts =
    await getStorefrontProducts();
  const relatedProducts = storefrontProducts.filter((product) =>
    article.relatedProducts.includes(product.slug),
  );
  const parentGuide = getGuideForArticle(article.slug);
  const managedArticles = getManagedArticles(await getSitePresentation());
  const relatedArticles = article.relatedArticles?.length
    ? managedArticles.filter((item) => article.relatedArticles?.includes(item.slug)).slice(0, 2)
    : managedArticles.filter((item) => item.slug !== article.slug).slice(0, 2);
  const articleHeadings = article.contentMode === "html"
    ? getArticleHeadings(article.htmlContent ?? "")
    : [];

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
              alt={article.imageAlt || `تصویر مقاله ${article.title}`}
              width="1672"
              height="941"
              fetchPriority="high"
              style={{ objectPosition: article.imagePosition }}
            />
            <figcaption>
              {article.imageCaption || "تصویر ادیتوریال · بدون نمایش محصول یا برند مشخص"}
            </figcaption>
          </figure>
        </div>
      </header>

      <section className="sb-article-layout sb-shell">
        <aside className="sb-article-toc">
          <strong>در این مقاله</strong>
          <nav>
            <a href="#summary">خلاصه سریع</a>
            {article.contentMode === "html" ? articleHeadings.map((heading) => (
              <a className={heading.level === 3 ? "is-subheading" : undefined} href={`#${heading.id}`} key={heading.id}>
                {heading.text}
              </a>
            )) : article.sections.map((section, index) => (
              <a href={`#section-${index + 1}`} key={section.heading}>
                {section.heading}
              </a>
            ))}
            {article.contentMode === "html"
              ? hasHtmlAnchor(renderedHtmlContent, "faq") && <a href="#faq">پرسش‌های پرتکرار</a>
              : article.faq?.length ? <a href="#faq">پرسش‌های پرتکرار</a> : null}
            {article.contentMode === "html"
              ? hasSourceSection && <a href="#sources">منابع</a>
              : <a href="#sources">منابع</a>}
          </nav>
          <p>
            آخرین بازبینی محتوایی
            <b>{article.date.replace("به‌روزرسانی: ", "")}</b>
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

          {parentGuide ? (
            <div className="sb-article-parent-guide">
              <span>راهنمای مادر این موضوع</span>
              <Link href={`/guides/${parentGuide.slug}`}>
                {parentGuide.title}
                <ArrowIcon />
              </Link>
            </div>
          ) : null}

          {article.contentMode === "html" ? (
            <section
              className="sb-product-rich-text sb-article-html-content"
              id="article-html"
              dangerouslySetInnerHTML={{ __html: renderedHtmlContent }}
            />
          ) : article.sections.map((section, index) => (
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
              {section.links?.length ? (
                <div className="sb-article-parent-guide">
                  <span>برای بررسی بیشتر</span>
                  {section.links.map((link) => (
                    <Link href={link.href} key={`${link.href}-${link.label}`}>
                      {link.label}<ArrowIcon />
                    </Link>
                  ))}
                </div>
              ) : null}
              {section.table && (
                <div className="sb-article-table" role="region" aria-label={section.heading}>
                  <table>
                    <thead>
                      <tr>
                        {section.table.headers.map((header) => (
                          <th scope="col" key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row) => (
                        <tr key={row.join("|")}>
                          {row.map((cell, cellIndex) => (
                            <td key={`${cellIndex}-${cell}`}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {section.subsections?.map((subsection) => (
                <div className="sb-article-subsection" key={subsection.heading}>
                  <h3>{subsection.heading}</h3>
                  {subsection.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {subsection.bullets && (
                    <ul>
                      {subsection.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          ))}

          {article.contentMode !== "html" && article.faq?.length ? (
            <section className="sb-article-faq" id="faq">
              <span className="sb-eyebrow">FAQ / پرسش‌های پرتکرار</span>
              <h2>سؤال‌هایی که معمولاً پیش از تصمیم مطرح می‌شوند</h2>
              <FaqList items={article.faq} />
            </section>
          ) : null}

          {(article.contentMode !== "html" || (!hasEmbeddedSources && article.sources.length > 0)) ? <section className="sb-article-sources" id="sources">
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
          </section> : null}

          {article.cta?.label && article.cta.href ? (
            <div className="sb-article-parent-guide">
              <span>{article.cta.eyebrow || "ادامه مسیر"}</span>
              {article.cta.text ? <p>{article.cta.text}</p> : null}
              <Link href={article.cta.href}>{article.cta.label}<ArrowIcon /></Link>
            </div>
          ) : null}

          <footer className="sb-article-author">
            <span>نویسنده</span>
            <div>
              <strong>{article.authorName || "تحریریه سپید بیوتی"}</strong>
              <p>
                {article.reviewerName
                  ? `بازبینی محتوا: ${article.reviewerName}${article.reviewerRole ? `، ${article.reviewerRole}` : ""}`
                  : "محتوای آموزشی برای خرید آگاهانه؛ بدون معرفی پزشک یا بازبین ساختگی."}
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
          description: isNeuramisGuide(article.slug)
            ? normalizeNeuramisModelCopy(article.excerpt)
            : article.excerpt,
          image: absoluteArticleImage(image),
          inLanguage: "fa-IR",
          author: {
            "@type": "Organization",
            name: article.authorName || "تحریریه سپید بیوتی",
          },
          publisher: {
            "@type": "Organization",
            name: "Sepiid Beauty",
            url: siteOrigin,
            logo: {
              "@type": "ImageObject",
              url: `${siteOrigin}/images/sepiid-logo.webp`,
            },
          },
          datePublished: article.datePublished || "2026-07-25",
          dateModified: article.dateModified || article.datePublished || "2026-07-25",
          mainEntityOfPage: `${siteOrigin}${articlePath(article.slug)}`,
        }}
      />
      {article.faq?.length ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: article.faq.map((item) => ({
              "@type": "Question",
              name: isNeuramisGuide(article.slug)
                ? normalizeNeuramisModelCopy(item.question)
                : item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: isNeuramisGuide(article.slug)
                  ? normalizeNeuramisModelCopy(item.answer)
                  : item.answer,
              },
            })),
          }}
        />
      ) : null}
    </main>
  );
}
