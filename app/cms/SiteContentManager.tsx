"use client";

import { useEffect, useState } from "react";
import type { SitePresentation } from "../lib/site-presentation";
import { MagazineManager } from "./MagazineManager";

type Section = "header" | "footer" | "home" | "articles";

export function SiteContentManager() {
  const [content, setContent] = useState<SitePresentation | null>(null);
  const [section, setSection] = useState<Section>("articles");
  const [articleIndex, setArticleIndex] = useState(0);
  const [message, setMessage] = useState("در حال دریافت محتوای سایت…");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/cms/presentation", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "دریافت محتوا ناموفق بود.");
        setContent(payload.presentation);
        setMessage("");
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  async function save() {
    if (!content) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/cms/presentation", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(content),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "ذخیره محتوا ناموفق بود.");
      setContent(payload.presentation);
      setMessage("تغییرات ذخیره شد و کش سایت پاک شد.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ذخیره محتوا ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  if (!content) return <section className="spb-site-content"><p>{message}</p></section>;
  const field = (label: string, value: string, onChange: (value: string) => void, multiline = false) => (
    <label className={multiline ? "is-wide" : ""}>
      <span>{label}</span>
      {multiline ? <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} /> :
        <input value={value} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
  return (
    <section className="spb-site-content">
      <div className="spb-site-content__head">
        <div><span>مدیریت محتوای مجله</span><h2>مدیریت مقاله‌های مجله سپید</h2></div>
        <button type="button" className="spb-button is-primary" disabled={saving} onClick={() => void save()}>
          {saving ? "در حال ذخیره…" : "ذخیره و انتشار"}
        </button>
      </div>
      <nav className="spb-site-content__tabs">
        {([['articles','مقاله‌ها و مجله سپید'],['header','هدر'],['footer','فوتر'],['home','صفحه اصلی']] as const).map(([key,label]) =>
          <button type="button" className={section === key ? "is-active" : ""} onClick={() => setSection(key)} key={key}>{label}</button>)}
      </nav>
      <div className="spb-form-grid spb-site-content__form">
        {section === "header" && <>
          {field("زیرعنوان برند", content.header.brandTagline, (value) => setContent({...content, header:{...content.header, brandTagline:value}}))}
          {field("متن دکمه مشاوره", content.header.consultationLabel, (value) => setContent({...content, header:{...content.header, consultationLabel:value}}))}
          {content.header.navigation.map((item, index) => <div className="spb-inline-fields" key={`${item.href}-${index}`}>
            {field(`عنوان منو ${index + 1}`, item.label, (value) => { const navigation=[...content.header.navigation]; navigation[index]={...item,label:value}; setContent({...content,header:{...content.header,navigation}}); })}
            {field("لینک", item.href, (value) => { const navigation=[...content.header.navigation]; navigation[index]={...item,href:value}; setContent({...content,header:{...content.header,navigation}}); })}
     �����$z{-���jם)}</b>
          </p>
        </aside>

        <article className="sb-article-body">
          <section className="sb-article-summary" id="summary">
            <span>خلاصه سریع</span>
            <p>{article.lead}</p>
          </section>

          {article.slug === neuramisModelsGuideSlug ? <NeuramisModelComparison /> : null}

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
                <span className="sb-eyebrow">پرسش‌های پرتکرار</span>
              <h2>سؤال‌هایی که معمولاً پیش از تصمیم مطرح می‌شوند</h2>
              <FaqList items={article.faq} />
            </section>
          ) : null}

          {(article.contentMode !== "html" || (!hasEmbeddedSources && article.sources.length > 0)) ? <section className="sb-article-sources" id="sources">
            <span className="sb-eyebrow">منابع این مطلب</span>
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
                <span className="sb-eyebrow">محصولات مرتبط</span>
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
              <span className="sb-eyebrow">مطالب مرتبط</span>
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
