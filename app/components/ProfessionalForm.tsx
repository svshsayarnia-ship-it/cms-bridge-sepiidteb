"use client";

import { useState } from "react";
import { ArrowIcon } from "./Icons";

export function ProfessionalForm() {
  const [name, setName] = useState("");
  const [center, setCenter] = useState("");
  const [city, setCity] = useState("");
  const [need, setNeed] = useState("استعلام چند محصول");

  const href = `https://wa.me/989037251266?text=${encodeURIComponent(
    `سلام، برای همکاری حرفه‌ای پیام می‌دهم.\nنام: ${name || "—"}\nمرکز: ${
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
        <span className="sb-eyebrow">QUICK BRIEF / فرم کوتاه</span>
        <h2>درخواست خود را در یک پیام کامل بفرستید.</h2>
        <p>این فرم اطلاعات را ذخیره نمی‌کند؛ متن آماده در واتساپ شما باز می‌شود.</p>
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
          <span>نوع درخواست</span>
          <select value={need} onChange={(event) => setNeed(event.target.value)}>
            <option>استعلام چند محصول</option>
            <option>برنامه خرید دوره‌ای</option>
            <option>ملزومات کلینیکی</option>
            <option>پیگیری سفارش</option>
          </select>
        </label>
      </div>
      <button className="sb-btn sb-btn--gold" type="submit">
        ساخت پیام و ادامه در واتساپ
        <ArrowIcon />
      </button>
    </form>
  );
}

