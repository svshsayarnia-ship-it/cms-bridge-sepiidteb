"use client";

import { useState } from "react";
import { ArrowIcon } from "./Icons";

export function ProfessionalForm() {
  const [name, setName] = useState("");
  const [center, setCenter] = useState("");
  const [city, setCity] = useState("");
  const [need, setNeed] = useState("قیمت و موجودی چند محصول");

  const href = `https://wa.me/989037251266?text=${encodeURIComponent(
    `سلام، برای خرید کلینیکی پیام می‌دهم.\nنام: ${name || "—"}\nمرکز: ${
      center || "—"
    }\nشهر: ${city || "—"}\nدرخواست: ${need}`,
  )}`;

  return (
    <form
      className="sb-professional-form"
      onSubmit={(event) => {
        event.preventDefault();
        window.open(href, "_blank", "noopener,noreferrer");
      }}
    >
      <div className="sb-professional-form__head">
        <span className="sb-eyebrow">یک پیام کامل بفرستید</span>
        <h2>چند مورد کوتاه را بنویسید؛ ادامه‌اش در واتساپ است.</h2>
        <p>چیزی در سایت ذخیره نمی‌شود. فقط یک پیام آماده می‌کنیم تا لازم نباشد اطلاعات را دوباره تایپ کنید.</p>
      </div>
      <div className="sb-professional-form__fields">
        <label>
          <span>نام و نام خانوادگی</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          <span>نام کلینیک یا مرکز</span>
          <input value={center} onChange={(event) => setCenter(event.target.value)} required />
        </label>
        <label>
          <span>شهر</span>
          <input value={city} onChange={(event) => setCity(event.target.value)} required />
        </label>
        <label>
          <span>برای چه کاری پیام می‌دهید؟</span>
          <select value={need} onChange={(event) => setNeed(event.target.value)}>
            <option>قیمت و موجودی چند محصول</option>
            <option>خرید دوره‌ای برای کلینیک</option>
            <option>ملزومات کلینیکی</option>
            <option>پیگیری سفارش</option>
          </select>
        </label>
      </div>
      <button className="sb-btn sb-btn--gold" type="submit">
        ادامه در واتساپ
        <ArrowIcon />
      </button>
    </form>
  );
}
