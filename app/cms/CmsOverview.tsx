"use client";

import { useEffect, useMemo, useState } from "react";
import type { CmsConnectionStatus, CmsProduct, CmsProductsResponse } from "../lib/cms-types";
import type { SitePresentation } from "../lib/site-presentation";
import type { MarketPricingDashboard } from "../lib/market-pricing";

type Section = "products" | "pricing" | "content" | "categories" | "media" | "settings";

export function CmsOverview({ connection, onNavigate }: {
  connection: CmsConnectionStatus | null;
  onNavigate: (section: Section) => void;
}) {
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [productTotal, setProductTotal] = useState(0);
  const [articles, setArticles] = useState<SitePresentation["articles"]>([]);
  const [pricing, setPricing] = useState<MarketPricingDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/cms/products?page=1&perPage=100&search=&status=all", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/cms/presentation", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/cms/pricing", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([productData, presentationData, pricingData]: [CmsProductsResponse, { presentation?: SitePresentation }, MarketPricingDashboard]) => {
      if (cancelled) return;
      setProducts(Array.isArray(productData.products) ? productData.products : []);
      setProductTotal(Number(productData.total) || 0);
      setArticles(presentationData.presentation?.articles ?? []);
      setPricing(Array.isArray(pricingData.products) ? pricingData : null);
      setUpdatedAt(new Date());
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const published = products.filter((p) => p.status === "publish").length;
    const outOfStock = products.filter((p) => p.stockStatus === "outofstock").length;
    const withoutPrice = products.filter((p) => !Number(p.salePrice || p.regularPrice || p.price)).length;
    const withoutImage = products.filter((p) => !p.images?.length).length;
    const pendingPrices = pricing?.products?.filter((p) => p.pricing?.proposal).length ?? 0;
    const stalePrices = pricing?.products?.filter((p) => !p.pricing?.lastCheckedAt).length ?? 0;
    const publishedArticles = articles.filter((a) => (a.status ?? "publish") === "publish").length;
    const draftArticles = articles.length - publishedArticles;
    return { published, outOfStock, withoutPrice, withoutImage, pendingPrices, stalePrices, publishedArticles, draftArticles };
  }, [products, articles, pricing]);

  const stockBase = Math.max(products.length, 1);
  const healthyStock = Math.max(0, products.length - stats.outOfStock);
  const completeness = Math.round(((products.length - stats.withoutImage - stats.withoutPrice / 2) / stockBase) * 100);
  const tasks = [
    { count: stats.pendingPrices, text: "پیشنهاد قیمت منتظر تأیید", section: "pricing" as const },
    { count: stats.outOfStock, text: "محصول ناموجود", section: "products" as const },
    { count: stats.withoutPrice, text: "محصول بدون قیمت", section: "products" as const },
    { count: stats.withoutImage, text: "محصول بدون تصویر", section: "media" as const },
    { count: stats.draftArticles, text: "مقاله پیش‌نویس", section: "content" as const },
  ].filter((item) => item.count > 0).sort((a, b) => b.count - a.count);

  return (
    <section className="spb-bi" aria-busy={loading}>
      <div className="spb-bi__welcome">
        <div><span>مرکز کنترل سپید بیوتی</span><h1>سلام؛ امروز چه چیزی نیاز به توجه دارد؟</h1><p>خلاصه محصولات، موجودی، قیمت‌ها و مقاله‌ها را اینجا می‌بینی. برای انجام کار روی هر کارت بزن.</p></div>
        <div className={connection?.connected ? "is-online" : "is-offline"}><i />{connection?.connected ? "فروشگاه متصل است" : "اتصال فروشگاه بررسی شود"}</div>
      </div>

      <div className="spb-bi__kpis">
        <button onClick={() => onNavigate("products")}><span>کل محصولات</span><strong>{loading ? "…" : productTotal.toLocaleString("fa-IR")}</strong><small>{stats.published.toLocaleString("fa-IR")} منتشرشده در داده فعلی</small></button>
        <button onClick={() => onNavigate("products")} className={stats.outOfStock ? "needs-attention" : ""}><span>موجودی سالم</span><strong>{healthyStock.toLocaleString("fa-IR")}</strong><small>{stats.outOfStock.toLocaleString("fa-IR")} ناموجود</small></button>
        <button onClick={() => onNavigate("pricing")} className={stats.pendingPrices ? "needs-attention" : ""}><span>قیمت منتظر تصمیم</span><strong>{stats.pendingPrices.toLocaleString("fa-IR")}</strong><small>{stats.stalePrices.toLocaleString("fa-IR")} مورد هنوز پایش نشده</small></button>
        <button onClick={() => onNavigate("content")}><span>مقالات مجله</span><strong>{articles.length.toLocaleString("fa-IR")}</strong><small>{stats.publishedArticles.toLocaleString("fa-IR")} منتشرشده</small></button>
      </div>

      <div className="spb-bi__grid">
        <article className="spb-bi__tasks">
          <div className="spb-bi__section-head"><div><span>اولویت امروز</span><h2>کارهای نیازمند رسیدگی</h2></div><b>{tasks.reduce((sum, task) => sum + task.count, 0).toLocaleString("fa-IR")}</b></div>
          {loading ? <p>در حال جمع‌آوری وضعیت…</p> : tasks.length ? <ul>{tasks.map((task) => <li key={`${task.section}-${task.text}`}><button onClick={() => onNavigate(task.section)}><strong>{task.count.toLocaleString("fa-IR")}</strong><span>{task.text}</span><i>مشاهده ←</i></button></li>)}</ul> : <div className="spb-bi__all-good"><strong>همه‌چیز مرتب است</strong><span>در حال حاضر کار فوری ثبت نشده.</span></div>}
        </article>

        <article className="spb-bi__health">
          <div className="spb-bi__section-head"><div><span>کیفیت کاتالوگ</span><h2>آمادگی اطلاعات محصولات</h2></div><b>{Math.max(0, completeness).toLocaleString("fa-IR")}٪</b></div>
          <div className="spb-bi__bar"><i style={{ width: `${Math.max(0, Math.min(100, completeness))}%` }} /></div>
          <dl><div><dt>دارای تصویر</dt><dd>{(products.length - stats.withoutImage).toLocaleString("fa-IR")} از {products.length.toLocaleString("fa-IR")}</dd></div><div><dt>دارای قیمت</dt><dd>{(products.length - stats.withoutPrice).toLocaleString("fa-IR")} از {products.length.toLocaleString("fa-IR")}</dd></div><div><dt>موجود</dt><dd>{healthyStock.toLocaleString("fa-IR")} از {products.length.toLocaleString("fa-IR")}</dd></div></dl>
          <button className="spb-button" onClick={() => onNavigate("products")}>بهبود اطلاعات محصولات</button>
        </article>
      </div>

      <div className="spb-bi__guide"><div><span>راهنمای سریع</span><h2>از کجا شروع کنم؟</h2></div><ol><li><b>۱</b><span><strong>قیمت‌ها را بررسی کن</strong>پیشنهادهای جدید را با منبع بازار مقایسه و تأیید کن.</span></li><li><b>۲</b><span><strong>موجودی را به‌روز کن</strong>کالاهای تمام‌شده را ناموجود بزن تا سفارش اشتباه ثبت نشود.</span></li><li><b>۳</b><span><strong>محتوا را کامل کن</strong>تصویر، توضیح، سئو و منبع محصول یا مقاله را بررسی کن.</span></li></ol></div>
      {updatedAt && <p className="spb-bi__updated">آخرین به‌روزرسانی این نما: {new Intl.DateTimeFormat("fa-IR", { timeStyle: "short", dateStyle: "medium" }).format(updatedAt)}</p>}
    </section>
  );
}
