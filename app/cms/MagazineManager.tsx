"use client";

import type { Article, ArticleSection } from "../data";

type Props = {
  articles: Article[];
  selectedIndex: number;
  onSelect(index: number): void;
  onChange(articles: Article[]): void;
};

const today = () => new Date().toISOString().slice(0, 10);

function blankArticle(): Article {
  return {
    slug: "",
    title: "مقاله جدید",
    excerpt: "",
    category: "راهنمای انتخاب",
    date: "به‌روزرسانی: امروز",
    readTime: "۵ دقیقه",
    image: "/images/magazine-authenticity-v2.webp",
    imageAlt: "",
    imageCaption: "",
    lead: "",
    notice: "این مطلب برای آشنایی و بررسی بهتر محصول است و جایگزین نظر فرد واجد صلاحیت نیست.",
    sections: [{ heading: "عنوان بخش اول", paragraphs: [""] }],
    sources: [],
    relatedProducts: [],
    relatedArticles: [],
    faq: [],
    seoTitle: "",
    metaDescription: "",
    focusKeyword: "",
    datePublished: today(),
    dateModified: today(),
    status: "draft",
    brandSlugs: [],
    authorName: "تحریریه سپید بیوتی",
    reviewerName: "",
    reviewerRole: "",
    contentMode: "structured",
    htmlContent: "",
  };
}

const lines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);
const joinLines = (value?: string[]) => (value ?? []).join("\n");

export function MagazineManager({ articles, selectedIndex, onSelect, onChange }: Props) {
  const article = articles[selectedIndex];

  function update(patch: Partial<Article>) {
    if (!article) return;
    const next = [...articles];
    next[selectedIndex] = { ...article, ...patch };
    onChange(next);
  }

  function updateSection(index: number, patch: Partial<ArticleSection>) {
    if (!article) return;
    const sections = [...article.sections];
    sections[index] = { ...sections[index], ...patch };
    update({ sections });
  }

  function addArticle() {
    const next = [...articles, blankArticle()];
    onChange(next);
    onSelect(next.length - 1);
  }

  function removeArticle() {
    if (!article || !window.confirm(`مقاله «${article.title}» حذف شود؟`)) return;
    const next = articles.filter((_, index) => index !== selectedIndex);
    onChange(next);
    onSelect(Math.max(0, selectedIndex - 1));
  }

  const textField = (
    label: string,
    value: string,
    onValue: (value: string) => void,
    options: { wide?: boolean; rows?: number; hint?: string; type?: string } = {},
  ) => (
    <label className={options.wide ? "is-wide" : ""}>
      <span>{label}</span>
      {options.rows ? (
        <textarea rows={options.rows} value={value} onChange={(event) => onValue(event.target.value)} />
      ) : (
        <input type={options.type ?? "text"} value={value} onChange={(event) => onValue(event.target.value)} />
      )}
      {options.hint ? <small>{options.hint}</small> : null}
    </label>
  );

  return (
    <div className="spb-magazine-manager is-wide">
      <div className="spb-magazine-toolbar">
        <label>
          <span>انتخاب مقاله</span>
          <select value={selectedIndex} onChange={(event) => onSelect(Number(event.target.value))}>
            {articles.map((item, index) => (
              <option value={index} key={`${item.slug}-${index}`}>
                {item.status === "draft" ? "پیش‌نویس — " : ""}{item.title}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="spb-button" onClick={addArticle}>+ مقاله جدید</button>
        <button type="button" className="spb-button is-danger" disabled={!article} onClick={removeArticle}>حذف مقاله</button>
      </div>

      {!article ? <div className="spb-empty-state">هنوز مقاله‌ای وجود ندارد. «مقاله جدید» را بزن.</div> : (
        <>
          <fieldset className="spb-editor-box">
            <legend>انتشار و هویت مقاله</legend>
            <div className="spb-form-grid">
              {textField("عنوان اصلی مقاله (H1)", article.title, (title) => update({ title }), { wide: true })}
              {textField("نامک انگلیسی", article.slug, (slug) => update({ slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") }), { hint: "/magazine/your-slug" })}
              <label><span>وضعیت</span><select value={article.status ?? "publish"} onChange={(event) => update({ status: event.target.value as Article["status"] })}><option value="draft">پیش‌نویس</option><option value="publish">منتشرشده</option></select></label>
              {textField("دسته مقاله", article.category, (category) => update({ category }))}
              {textField("زمان مطالعه", article.readTime, (readTime) => update({ readTime }))}
              {textField("متن تاریخ نمایشی", article.date, (date) => update({ date }))}
              {textField("تاریخ انتشار", article.datePublished ?? "", (datePublished) => update({ datePublished }), { type: "date" })}
              {textField("تاریخ آخرین ویرایش", article.dateModified ?? "", (dateModified) => update({ dateModified }), { type: "date" })}
              {textField("برندهای مرتبط", joinLines(article.brandSlugs), (value) => update({ brandSlugs: lines(value) }), { rows: 3, hint: "هر نامک در یک خط؛ نمونه: neuramis" })}
              {textField("نام نویسنده", article.authorName ?? "تحریریه سپید بیوتی", (authorName) => update({ authorName }))}
              {textField("نام بازبین محتوا", article.reviewerName ?? "", (reviewerName) => update({ reviewerName }))}
              {textField("سمت بازبین", article.reviewerRole ?? "", (reviewerRole) => update({ reviewerRole }))}
            </div>
          </fieldset>

          <fieldset className="spb-editor-box">
            <legend>کارت مقاله و تصویر شاخص</legend>
            <div className="spb-form-grid">
              {textField("خلاصه کارت مقاله", article.excerpt, (excerpt) => update({ excerpt }), { wide: true, rows: 4 })}
              {textField("مسیر یا URL تصویر", article.image, (image) => update({ image }), { wide: true })}
              {textField("متن ALT تصویر", article.imageAlt ?? "", (imageAlt) => update({ imageAlt }))}
              {textField("جایگاه تصویر", article.imagePosition ?? "", (imagePosition) => update({ imagePosition }), { hint: "مثال: center 35%" })}
              {textField("کپشن تصویر", article.imageCaption ?? "", (imageCaption) => update({ imageCaption }), { wide: true })}
            </div>
          </fieldset>

          <fieldset className="spb-editor-box">
            <legend>مقدمه و خلاصه سریع</legend>
            <div className="spb-form-grid">
              {textField("خلاصه سریع / لید", article.lead, (lead) => update({ lead }), { wide: true, rows: 5 })}
              {textField("یادداشت ایمنی یا نکته مهم", article.notice, (notice) => update({ notice }), { wide: true, rows: 4 })}
            </div>
          </fieldset>

          <fieldset className="spb-editor-box">
            <legend>بدنه مقاله (H2 و H3)</legend>
            <div className="spb-content-mode" role="group" aria-label="نوع ورود محتوای مقاله">
              <button type="button" className={(article.contentMode ?? "structured") === "structured" ? "is-active" : ""} onClick={() => update({ contentMode: "structured" })}>ورود با باکس‌ها</button>
              <button type="button" className={article.contentMode === "html" ? "is-active" : ""} onClick={() => update({ contentMode: "html" })}>ورود مستقیم HTML</button>
            </div>
            {article.contentMode === "html" ? (
              <div className="spb-html-entry">
                <div className="spb-html-entry__head">
                  <div><strong>کد HTML مقاله</strong><small>تگ‌های امن محتوایی حفظ می‌شوند؛ اسکریپت، iframe، فرم و رویدادهای JavaScript حذف خواهند شد.</small></div>
                  <button type="button" className="spb-button" onClick={() => update({ htmlContent: `<h2>عنوان بخش</h2>\n<p>متن پاراگراف مقاله را اینجا وارد کنید.</p>\n<h3>عنوان فرعی</h3>\n<ul>\n  <li>مورد اول</li>\n  <li>مورد دوم</li>\n</ul>` })}>درج قالب نمونه</button>
                </div>
                <textarea
                  className="spb-html-code"
                  dir="ltr"
                  rows={28}
                  spellCheck={false}
                  value={article.htmlContent ?? ""}
                  onChange={(event) => update({ htmlContent: event.target.value })}
                  placeholder={'<h2>عنوان بخش</h2>\n<p>متن مقاله...</p>'}
                />
                <div className="spb-html-tags"><strong>تگ‌های مجاز:</strong><code>p, h2, h3, h4, strong, em, a, ul, ol, li, blockquote, table, figure, img</code></div>
              </div>
            ) : <>
            <div className="spb-repeat-list">
              {article.sections.map((section, sectionIndex) => (
                <div className="spb-repeat-card" key={`section-${sectionIndex}`}>
                  <div className="spb-repeat-card__head"><strong>بخش {sectionIndex + 1}</strong><button type="button" onClick={() => update({ sections: article.sections.filter((_, index) => index !== sectionIndex) })}>حذف بخش</button></div>
                  {textField("عنوان بخش (H2)", section.heading, (heading) => updateSection(sectionIndex, { heading }), { wide: true })}
                  {textField("پاراگراف‌ها", joinLines(section.paragraphs), (value) => updateSection(sectionIndex, { paragraphs: lines(value) }), { wide: true, rows: 8, hint: "هر پاراگراف در یک خط جدا" })}
                  {textField("فهرست نشانه‌دار", joinLines(section.bullets), (value) => updateSection(sectionIndex, { bullets: lines(value) }), { wide: true, rows: 4, hint: "هر مورد در یک خط" })}
                  <div className="spb-section-table">
                    <strong>جدول مقایسه (اختیاری)</strong>
                    {textField("عنوان ستون‌ها", joinLines(section.table?.headers), (value) => updateSection(sectionIndex, { table: { headers: lines(value), rows: section.table?.rows ?? [] } }), { wide: true, rows: 3, hint: "هر عنوان ستون در یک خط" })}
                    {textField("ردیف‌های جدول", (section.table?.rows ?? []).map((row) => row.join(" | ")).join("\n"), (value) => updateSection(sectionIndex, { table: { headers: section.table?.headers ?? [], rows: value.split("\n").map((row) => row.split("|").map((cell) => cell.trim())).filter((row) => row.some(Boolean)) } }), { wide: true, rows: 5, hint: "هر ردیف در یک خط و ستون‌ها با | جدا شوند" })}
                    {section.table ? <button type="button" onClick={() => updateSection(sectionIndex, { table: undefined })}>حذف جدول</button> : null}
                  </div>
                  <div className="spb-section-links">
                    <strong>لینک‌های داخلی همین بخش</strong>
                    {(section.links ?? []).map((link, linkIndex) => (
                      <div className="spb-source-row" key={`section-link-${linkIndex}`}>
                        <input aria-label="انکر تکست" placeholder="انکر تکست" value={link.label} onChange={(event) => { const links = [...(section.links ?? [])]; links[linkIndex] = { ...link, label: event.target.value }; updateSection(sectionIndex, { links }); }} />
                        <input aria-label="مسیر داخلی" placeholder="/brands/neuramis" value={link.href} onChange={(event) => { const links = [...(section.links ?? [])]; links[linkIndex] = { ...link, href: event.target.value }; updateSection(sectionIndex, { links }); }} />
                        <button type="button" onClick={() => updateSection(sectionIndex, { links: section.links?.filter((_, index) => index !== linkIndex) })}>حذف</button>
                      </div>
                    ))}
                    <button type="button" className="spb-button" onClick={() => updateSection(sectionIndex, { links: [...(section.links ?? []), { label: "", href: "" }] })}>+ افزودن لینک داخلی</button>
                  </div>
                  <div className="spb-subsection-list">
                    {(section.subsections ?? []).map((subsection, subsectionIndex) => (
                      <div className="spb-subsection-card" key={`sub-${subsectionIndex}`}>
                        <div className="spb-repeat-card__head"><strong>زیرعنوان H3</strong><button type="button" onClick={() => updateSection(sectionIndex, { subsections: section.subsections?.filter((_, index) => index !== subsectionIndex) })}>حذف</button></div>
                        {textField("عنوان (H3)", subsection.heading, (heading) => { const subsections = [...(section.subsections ?? [])]; subsections[subsectionIndex] = { ...subsection, heading }; updateSection(sectionIndex, { subsections }); }, { wide: true })}
                        {textField("پاراگراف‌ها", joinLines(subsection.paragraphs), (value) => { const subsections = [...(section.subsections ?? [])]; subsections[subsectionIndex] = { ...subsection, paragraphs: lines(value) }; updateSection(sectionIndex, { subsections }); }, { wide: true, rows: 5 })}
                        {textField("بولت‌ها", joinLines(subsection.bullets), (value) => { const subsections = [...(section.subsections ?? [])]; subsections[subsectionIndex] = { ...subsection, bullets: lines(value) }; updateSection(sectionIndex, { subsections }); }, { wide: true, rows: 3 })}
                      </div>
                    ))}
                    <button type="button" className="spb-button" onClick={() => updateSection(sectionIndex, { subsections: [...(section.subsections ?? []), { heading: "", paragraphs: [""] }] })}>+ افزودن H3</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="spb-button is-primary" onClick={() => update({ sections: [...article.sections, { heading: "عنوان بخش", paragraphs: [""] }] })}>+ افزودن بخش H2</button>
            </>}
          </fieldset>

          <fieldset className="spb-editor-box">
            <legend>پرسش‌های متداول (FAQ)</legend>
            <div className="spb-repeat-list">
              {(article.faq ?? []).map((item, index) => (
                <div className="spb-repeat-card" key={`faq-${index}`}>
                  <div className="spb-repeat-card__head"><strong>سؤال {index + 1}</strong><button type="button" onClick={() => update({ faq: article.faq?.filter((_, itemIndex) => itemIndex !== index) })}>حذف</button></div>
                  {textField("سؤال", item.question, (question) => { const faq = [...(article.faq ?? [])]; faq[index] = { ...item, question }; update({ faq }); }, { wide: true })}
                  {textField("پاسخ", item.answer, (answer) => { const faq = [...(article.faq ?? [])]; faq[index] = { ...item, answer }; update({ faq }); }, { wide: true, rows: 4 })}
                </div>
              ))}
            </div>
            <button type="button" className="spb-button" onClick={() => update({ faq: [...(article.faq ?? []), { question: "", answer: "" }] })}>+ افزودن سؤال</button>
          </fieldset>

          <fieldset className="spb-editor-box">
            <legend>منابع و اعتبار محتوا</legend>
            <div className="spb-repeat-list">
              {article.sources.map((source, index) => (
                <div className="spb-source-row" key={`source-${index}`}>
                  <input aria-label="عنوان منبع" placeholder="عنوان منبع" value={source.label} onChange={(event) => { const sources = [...article.sources]; sources[index] = { ...source, label: event.target.value }; update({ sources }); }} />
                  <input aria-label="لینک منبع" placeholder="https://..." value={source.href} onChange={(event) => { const sources = [...article.sources]; sources[index] = { ...source, href: event.target.value }; update({ sources }); }} />
                  <button type="button" onClick={() => update({ sources: article.sources.filter((_, itemIndex) => itemIndex !== index) })}>حذف</button>
                </div>
              ))}
            </div>
            <button type="button" className="spb-button" onClick={() => update({ sources: [...article.sources, { label: "", href: "" }] })}>+ افزودن منبع</button>
          </fieldset>

          <fieldset className="spb-editor-box">
            <legend>لینک‌سازی داخلی و ارتباط‌ها</legend>
            <div className="spb-form-grid">
              {textField("نامک محصولات مرتبط", joinLines(article.relatedProducts), (value) => update({ relatedProducts: lines(value) }), { rows: 5, hint: "هر محصول در یک خط" })}
              {textField("نامک مقاله‌های مرتبط", joinLines(article.relatedArticles), (value) => update({ relatedArticles: lines(value) }), { rows: 5, hint: "هر مقاله در یک خط" })}
              {textField("بالانویس CTA", article.cta?.eyebrow ?? "", (eyebrow) => update({ cta: { eyebrow, text: article.cta?.text ?? "", label: article.cta?.label ?? "", href: article.cta?.href ?? "" } }))}
              {textField("متن دکمه CTA", article.cta?.label ?? "", (label) => update({ cta: { eyebrow: article.cta?.eyebrow ?? "", text: article.cta?.text ?? "", label, href: article.cta?.href ?? "" } }))}
              {textField("لینک CTA", article.cta?.href ?? "", (href) => update({ cta: { eyebrow: article.cta?.eyebrow ?? "", text: article.cta?.text ?? "", label: article.cta?.label ?? "", href } }), { hint: "نمونه: /brands/neuramis" })}
              {textField("توضیح CTA", article.cta?.text ?? "", (text) => update({ cta: { eyebrow: article.cta?.eyebrow ?? "", text, label: article.cta?.label ?? "", href: article.cta?.href ?? "" } }), { wide: true, rows: 3 })}
            </div>
          </fieldset>

          <fieldset className="spb-editor-box">
            <legend>تنظیمات سئو</legend>
            <div className="spb-form-grid">
              {textField("عنوان سئو", article.seoTitle ?? "", (seoTitle) => update({ seoTitle }), { wide: true, hint: `${(article.seoTitle ?? "").length} نویسه` })}
              {textField("توضیحات متا", article.metaDescription ?? "", (metaDescription) => update({ metaDescription }), { wide: true, rows: 4, hint: `${(article.metaDescription ?? "").length} نویسه` })}
              {textField("کلمه کلیدی اصلی", article.focusKeyword ?? "", (focusKeyword) => update({ focusKeyword }))}
              <div className="spb-seo-preview"><small>پیش‌نمایش نشانی</small><strong>{article.seoTitle || article.title}</strong><span>sepiidbeauty.ir/magazine/{article.slug || "your-slug"}</span><p>{article.metaDescription || article.excerpt}</p></div>
            </div>
          </fieldset>
        </>
      )}
    </div>
  );
}
