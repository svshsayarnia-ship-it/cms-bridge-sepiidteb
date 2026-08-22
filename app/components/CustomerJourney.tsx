"use client";

import Link from "next/link";
import { useState } from "react";

const steps = [
  { label: "پیدا کردن گروه", hint: "اگر نام مدل را نمی‌دانید، از گروه محصول شروع کنید.", href: "/shop", action: "دیدن گروه‌ها" },
  { label: "دیدن جزئیات", hint: "نام مدل، حجم و مشخصات بسته را کنار هم بخوانید.", href: "/guides", action: "راهنمای ساده" },
  {
    label: "پرسیدن قیمت",
    hint: "قیمت روز و وضعیت همان مدل را از ما بپرسید.",
    href: "https://wa.me/989037251266?text=%D8%B3%D9%84%D8%A7%D9%85%D8%8C%20%D8%A8%D8%B1%D8%A7%DB%8C%20%D8%A7%D8%B3%D8%AA%D8%B9%D9%84%D8%A7%D9%85%20%D9%85%D9%88%D8%AC%D9%88%D8%AF%DB%8C%20%D9%88%20%D9%82%DB%8C%D9%85%D8%AA%20%D9%BE%DB%8C%D8%A7%D9%85%20%D9%85%DB%8C%E2%80%8C%D8%AF%D9%87%D9%85.",
    action: "شروع گفت‌وگو",
  },
  { label: "پیگیری سفارش", hint: "برای زمان تحویل یا وضعیت سفارش پیام بدهید.", href: "/contact", action: "تماس با سپید" },
];

export function CustomerJourney() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <nav className="sb-page-journey" aria-label="مسیر مشتری در سپید بیوتی">
      <div className="sb-page-journey__rail">
        <span className="sb-page-journey__label">از اینجا تا سفارش</span>
        <ol>
          {steps.map((step, index) => (
            <li className={expanded === index ? "sb-page-journey__item--expanded" : ""} key={step.label}>
              <Link href={step.href} onClick={(event) => { if (event.detail === 0) setExpanded(index); }}>
                <span className="sb-page-journey__bubble">۰{index + 1}</span>
                <span>{step.label}</span>
              </Link>
              <div className="sb-page-journey__suggestions">
                <p>{step.hint}</p>
                <Link href={step.href}>{step.action}</Link>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
