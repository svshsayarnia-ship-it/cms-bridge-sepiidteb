"use client";

import type { Article } from "../data";

type Props = { articles: Article[]; selectedIndex: number; onSelect(index: number): void; onChange(articles: Article[]): void };

const today = () => new Date().toISOString().slice(0, 10);

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function editableHtml(article: Article) {
  if (article.htmlContent) return article.htmlContent;
  const sections = article.sections.flatMap((section) => [
    `<h2>${escapeHtml(section.heading)}</h2>`,
    ...section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
    ...(section.bullets?.length ? [`<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`] : []),
    ...(section.subsections ?? []).flatMap((subsection) => [
      `<h3>${escapeHtml(subsection.heading)}</h3>`,
      ...subsection.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
    ]),
  ]);
  const faq = article.faq?.length ? ["<h2 id=\"faq\">سؤال‌های متداول</h2>", ...article.faq.flatMap((item) => [`<h3>${escapeHtml(item.question)}</h3>`, `<p>${escapeHtml(item.answer)}</p>`])] : [];
  const sources = article.sources.length ? ["<h2 id=\"sources\">منابع</h2>", `<ol>${article.sources.map((source) => `<li><a href=\"${escapeHtml(source.href)}\">${escapeHtml(source.label)}</a></li>`).join("")}</ol>`] : [];
  return [...sections, ...faq, ...sources].join("\n");
}

function blankArticle(): Article {
  return { slug: "", title: "", excerpt: "", category: "راهنمای انتخاب", date: "به‌روزرسانی: امروز", readTime: "۵ دقیقه", image: "/images/magazine-authenticity-v2.webp", lead: "", notice: "این مطلب برای آشنایی و بررسی بهتر محصول است و جایگزین نظر فرد واجد صلاحیت نیست.", sections: [], sources: [], relatedProducts: [], relatedArticles: [], faq: [], datePublished: today(), dateModified: today(), status: "draft", contentMode: "html", htmlContent: "" };
}

const htmlTemplate = `<h1>عنوان اصلی مقاله</h1>
<p>مقدمه کوتاه و روشن مقاله را اینجا بنویسید.</p>

<h2>عنوان بخش اول</h2>
<p>متن بخش اول...</p>

<h3>زیرعنوان</h3>
<p>توضیح تکمیلی...</p>

<h2 id="faq">سؤال‌های متداول</h2>
<h3>سؤال اول چیست؟</h3>
<p>پاسخ کوتاه، دقیق و غیراغراق‌آمیز.</p>

<h2 id="sources">منابع</h2>
<ol><li><a href="https://example.com">عنوان منبع</a></li></ol>`;

export function MagazineManager({ articles, selectedIndex, onSelect, onChange }: Props) {
  const article = articles[selectedIndex];
  function update(patch: Partial<Article>) {
    if (!article) return;
    const next = [...articles];
    next[selectedIndex] = { ...article, htmlContent: editableHtml(article), ...patch, contentMode: "html" };
    onChange(next);
  }
  function addArticle() { const next = [...articles, blankArticle()]; onChange(next); onSelect(next.length - 1); }
  function removeArticle() {
    if (!article || !window.confirm(`مقاله «${article.title || "بدون عنوان"}» حذف شود؟`)) return;
    onChange(articles.filter((_, index) => index !== selectedIndex));
    onSelect(Math.max(0, selectedIndex - 1));
  }
  if (!article) return <div className="spb-empty-state">هنوز مقاله‌ای وجود ندارد. «مقاله جدید» را بزن.</div>;

  return <div className="spb-magazine-manager is-wide">
    <div className="spb-magazine-toolbar">
      <label><span>انتخاب مقاله</span><select value={selectedIndex} onChange={(event) => onSelect(Number(event.target.value))}>{articles.map((item, index) => <option value={index} key={`${item.slug}-${index}`}>{item.status === "draft" ? "پیش‌نویس — " : ""}{item.title || "بدون عنوان"}</option>)}</select></label>
      <button type="button" className="spb-button" onClick={addArticle}>+ مقاله جدید</button>
      <button type="button" className="spb-button is-danger" onClick={removeArticle}>حذف مقاله</button>
    </div>

    <fieldset className="spb-editor-box">
      <legend>مقاله</legend>
      <label className="is-wide"><span>عنوان اصلی مقاله</span><input value={article.title} onChange={(event) => update({ title: event.target.value })} placeholder="مثال: فیلر نورامیس چیست و چه کاربردی دارد؟" /><small>این عنوان، H1 نهایی صفحه است.</small></label>
      <div className="spb-html-entry">
        <div className="spb-html-entry__head"><div><strong>کد کامل HTML مقاله</strong><small>کل مقاله را یک‌جا Paste کن: مقدمه، H2، H3، جدول، لینک داخلی، FAQ و منابع. اگر H1 هم در کد باشد، برای جلوگیری از H1 تکراری فقط عنوان بالا در صفحه نمایش داده می‌شود.</small></div><button type="button" className="spb-button" onClick={() => update({ htmlContent: htmlTemplate })}>درج قالب نمونه</button></div>
        <textarea className="spb-html-code" dir="ltr" rows={32} spellCheck={false} value={editableHtml(article)} onChange={(event) => update({ htmlContent: event.target.value })} placeholder={htmlTemplate} />
        <div className="spb-html-tags"><strong>تگ‌های مجاز:</strong><code>h1, h2, h3, h4, p, strong, em, a, ul, ol, li, blockquote, table, figure, img</code></div>
      </div>
    </fieldset>

    <details className="spb-editor-box spb-magazine-advanced"><summary>تنظیمات پیشرفتهٔ انتشار و سئو (اختیاری)</summary><div className="spb-form-grid">
      <label><span>وضعیت</span><select value={article.status ?? "draft"} onChange={(event) => update({ status: event.target.value as Article["status"] })}><option value="draft">پیش‌نویس</option><option value="publish">منتشرشده</option></select></label>
      <label><span>نامک URL</span><input value={article.slug} onChange={(event) => update({ slug: event.target.value })} placeholder="خودکار از عنوان ساخته می‌شود" /></label>
      <label className="is-wide"><span>عنوان سئو</span><input value={article.seoTitle ?? ""} onChange={(event) => update({ seoTitle: event.target.value })} placeholder="در صورت خالی‌بودن، عنوان مقاله استفاده می‌شود" /></label>
      <label className="is-wide"><span>توضیحات متا</span><textarea rows={3} value={article.metaDescription ?? ""} onChange={(event) => update({ metaDescription: event.target.value })} placeholder="در صورت خالی‌بودن، از ابتدای مقاله ساخته می‌شود" /></label>
      <label className="is-wide"><span>تصویر شاخص</span><input value={article.image} onChange={(event) => update({ image: event.target.value })} /></label>
      <label><span>ALT تصویر</span><input value={article.imageAlt ?? ""} onChange={(event) => update({ imageAlt: event.target.value })} /></label>
      <label><span>تاریخ انتشار</span><input type="date" value={article.datePublished ?? ""} onChange={(event) => update({ datePublished: event.target.value })} /></label>
      <label><span>تاریخ آخرین ویرایش</span><input type="date" value={article.dateModified ?? ""} onChange={(event) => update({ dateModified: event.target.value })} /></label>
    </div></details>
  </div>;
}
