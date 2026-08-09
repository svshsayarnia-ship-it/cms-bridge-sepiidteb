"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application render error", error);
  }, [error]);

  return (
    <main className="sb-system-page" id="main-content">
      <div className="sb-system-page__card">
        <span className="sb-eyebrow">SEPIID BEAUTY</span>
        <h1>نمایش این بخش موقتاً با مشکل روبه‌رو شد.</h1>
        <p>اطلاعات شما از بین نرفته است. یک‌بار دوباره تلاش کنید یا به صفحه اصلی برگردید.</p>
        <div>
          <button className="sb-btn sb-btn--dark" onClick={reset} type="button">تلاش دوباره</button>
          <Link className="sb-btn sb-btn--outline" href="/">صفحه اصلی</Link>
        </div>
      </div>
    </main>
  );
}
