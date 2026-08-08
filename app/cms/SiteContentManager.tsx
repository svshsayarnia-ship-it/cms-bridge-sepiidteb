"use client";

import { useEffect, useState } from "react";
import type { SitePresentation } from "../lib/site-presentation";

type Section = "header" | "footer" | "home" | "articles";

export function SiteContentManager() {
  const [content, setContent] = useState<SitePresentation | null>(null);
  const [section, setSection] = useState<Section>("header");
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
  const article = content.articles[articleIndex];

  return (
    <section className="spb-site-content">
      <div className="spb-site-content__head">
        <div><span>SITE CONTENT</span><h2>ویرایش بخش‌های سایت</h2></div>
        <button type="button" className="spb-button is-primary" disabled={saving} onClick={() => void save()}>
          {saving ? "در حال ذخیره…" : "ذخیره و انتشار"}
        </button>
      </div>
      <nav className="spb-site-content__tabs">
        {([['header','هدر'],['footer','فوتر'],['home','صفحه اصلی'],['articles','نوشته‌ها']] as const).map(([key,label]) =>
          <button type="button" className={section === key ? "is-active" : ""} onClick={() => setSection(key)} key={key}>{label}</button>)}
      </nav>
      <div className="spb-form-grid spb-site-content__form">
        {section === "header" && <>
          {field("زیرعنوان برند", content.header.brandTagline, (value) => setContent({...content, header:{...content.header, brandTagline:value}}))}
          {field("متن دکمه مشاوره", content.header.consultationLabel, (value) => setContent({...content, header:{...content.header, consultationLabel:value}}))}
          {content.header.navigation.map((item, index) => <div className="spb-inline-fields" key={`${item.href}-${index}`}>
            {field(`عنوان منو ${index + 1}`, item.label, (value) => { const navigation=[...content.header.navigation]; navigation[index]={...item,label:value}; setContent({...content,header:{...content.header,navigation}}); })}
            {field("لینک", item.href, (value) => { const navigation=[...content.header.navigation]; navigation[index]={...item,href:value}; setContent({...content,header:{...content.header,navigation}}); })}
          </div>)}
        </>}
        {section === "footer" && <>
          {field("عنوان کوچک پشتیبانی", content.footer.supportEyebrow, v => setContent({...content,footer:{...content.footer,supportEyebrow:v}}))}
          {field("عنوان پشتیبانی", content.footer.supportTitle, v => setContent({...content,footer:{...content.footer,supportTitle:v}}))}
          {field("توضیح پشتیبانی", content.footer.supportText, v => setContent({...content,footer:{...content.footer,supportText:v}}), true)}
          {field("متن دکمه", content.footer.supportButtonLabel, v => setContent({...content,footer:{...content.footer,supportButtonLabel:v}}))}
          {field("معرفی برند", content.footer.brandDescription, v => setContent({...content,footer:{...content.footer,brandDescription:v}}), true)}
          {field("شماره تماس", content.footer.phone, v => setContent({...content,footer:{...content.footer,phone:v}}))}
          {field("ساعات کاری", content.footer.hours, v => setContent({...content,footer:{...content.footer,hours:v}}))}
          {field("متن حقوقی", content.footer.legalNotice, v => setContent({...content,footer:{...content.footer,legalNotice:v}}), true)}
        </>}
        {section === "home" && <>
          {field("بالانویس Hero", content.home.hero.eyebrow, v => setContent({...content,home:{hero:{...content.home.hero,eyebrow:v}}}))}
          {field("عنوان Hero", content.home.hero.title, v => setContent({...content,home:{hero:{...content.home.hero,title:v}}}), true)}
          {field("توضیح Hero", content.home.hero.description, v => setContent({...content,home:{hero:{...content.home.hero,description:v}}}), true)}
          {field("تصویر Hero", content.home.hero.image, v => setContent({...content,home:{hero:{...content.home.hero,image:v}}}))}
          {field("ALT تصویر", content.home.hero.imageAlt, v => setContent({...content,home:{hero:{...content.home.hero,imageAlt:v}}}))}
          {field("متن دکمه اصلی", content.home.hero.primaryCtaLabel, v => setContent({...content,home:{hero:{...content.home.hero,primaryCtaLabel:v}}}))}
          {field("لینک دکمه اصلی", content.home.hero.primaryCtaHref, v => setContent({...content,home:{hero:{...content.home.hero,primaryCtaHref:v}}}))}
        </>}
        {section === "articles" && article && <>
          <label className="is-wide"><span>انتخاب نوشته</span><select value={articleIndex} onChange={e => setArticleIndex(Number(e.target.value))}>{content.articles.map((item,index)=><option value={index} key={item.slug}>{item.title}</option>)}</select></label>
          {field("عنوان نوشته", article.title, v => { const articles=[...content.articles]; articles[articleIndex]={...article,title:v}; setContent({...content,articles}); }, true)}
          {field("دسته نوشته", article.category, v => { const articles=[...content.articles]; articles[articleIndex]={...article,category:v}; setContent({...content,articles}); })}
          {field("خلاصه", article.excerpt, v => { const articles=[...content.articles]; articles[articleIndex]={...article,excerpt:v}; setContent({...content,articles}); }, true)}
          {field("مقدمه", article.lead, v => { const articles=[...content.articles]; articles[articleIndex]={...article,lead:v}; setContent({...content,articles}); }, true)}
          {field("هشدار/نکته", article.notice, v => { const articles=[...content.articles]; articles[articleIndex]={...article,notice:v}; setContent({...content,articles}); }, true)}
        </>}
      </div>
      {message && <p className="spb-site-content__message">{message}</p>}
    </section>
  );
}
