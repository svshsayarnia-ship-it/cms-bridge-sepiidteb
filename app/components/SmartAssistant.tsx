"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Topic = "stock" | "guide" | "authenticity";

const waHref =
  "https://wa.me/989037251266?text=%D8%B3%D9%84%D8%A7%D9%85%D8%8C%20%D8%A7%D8%B2%20%D8%B3%D8%A7%DB%8C%D8%AA%20%D8%B3%D9%BE%DB%8C%D8%AF%20%D8%A8%DB%8C%D9%88%D8%AA%DB%8C%20%D8%A8%D8%B1%D8%A7%DB%8C%20%D8%B1%D8%A7%D9%87%D9%86%D9%85%D8%A7%DB%8C%DB%8C%20%D9%BE%DB%8C%D8%A7%D9%85%20%D9%85%DB%8C%E2%80%8C%D8%AF%D9%87%D9%85.";

const answers: Record<Topic, { title: string; text: string; href: string; action: string }> = {
  stock: { title: "موجودی و قیمت روز", text: "نام برند یا مدل را بفرستید تا وضعیت همان محصول و جزئیات بسته بررسی شود.", href: waHref, action: "استعلام در واتساپ" },
  guide: { title: "شروع از راهنمای انتخاب", text: "دسته‌بندی و اطلاعات محصول را نشان می‌دهیم؛ انتخاب و مصرف محصولات تزریقی باید با پزشک واجد صلاحیت باشد.", href: "/guides", action: "دیدن راهنمای انتخاب" },
  authenticity: { title: "چک‌لیست اصالت", text: "برای بررسی محصول، نام کامل، پلمب، تاریخ و اطلاعات قابل مشاهدهٔ بچ را کنار هم بررسی کنید.", href: "/magazine/verify-dermal-filler-authenticity", action: "باز کردن چک‌لیست" },
};

export function SmartAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<Topic | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  const answer = topic ? answers[topic] : null;

  if (pathname.startsWith("/cms")) return null;

  return (
    <aside id="sepiid-smart-assistant" className={`sb-smart-assistant${open ? " is-open" : ""}`} aria-label="دستیار هوشمند سپید">
      {open && (
        <section id="sepiid-smart-assistant-panel" className="sb-smart-assistant__panel" aria-live="polite">
          <div className="sb-smart-assistant__head">
            <div><span>کمک برای انتخاب</span><strong>دستیار سپید</strong></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="بستن دستیار">×</button>
          </div>
          {!answer ? (
            <div className="sb-smart-assistant__body">
              <p>برای شروع، یکی از این موضوع‌ها را انتخاب کنید.</p>
              <div className="sb-smart-assistant__topics">
                <button type="button" onClick={() => setTopic("stock")}>موجودی و قیمت روز</button>
                <button type="button" onClick={() => setTopic("guide")}>پیدا کردن دستهٔ محصول</button>
                <button type="button" onClick={() => setTopic("authenticity")}>بررسی اصالت سفارش</button>
              </div>
            </div>
          ) : (
            <div className="sb-smart-assistant__body">
              <span className="sb-smart-assistant__eyebrow">پاسخ پیشنهادی</span>
              <h2>{answer.title}</h2>
              <p>{answer.text}</p>
              <Link className="sb-smart-assistant__action" href={answer.href}>{answer.action}<span aria-hidden="true">←</span></Link>
              <button className="sb-smart-assistant__restart" type="button" onClick={() => setTopic(null)}>سؤال دیگری دارم</button>
            </div>
          )}
        </section>
      )}
      <button className="sb-smart-assistant__trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="sepiid-smart-assistant-panel">
        <span className="sb-smart-assistant__spark" aria-hidden="true">✦</span>
        <span>{open ? "بستن راهنما" : "دستیار هوشمند"}</span>
      </button>
    </aside>
  );
}
