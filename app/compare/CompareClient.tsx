"use client";
/* eslint-disable @next/next/no-img-element -- product images may come from the managed CMS */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowIcon, CloseIcon } from "../components/Icons";
import { addToCart } from "../lib/cart";
import {
  clearCompare,
  onCompareUpdated,
  readCompare,
  removeFromCompare,
  type CompareProduct,
} from "../lib/compare";
import { trackGaEvent } from "../lib/analytics";

const priceFormatter = new Intl.NumberFormat("fa-IR");

function numericPrice(product: CompareProduct) {
  const values = [product.salePrice, product.regularPrice, product.price, product.priceToman];
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return Math.round(parsed);
  }
  return null;
}

function specValue(product: CompareProduct, patterns: RegExp[]) {
  for (const [label, value] of product.specs ?? []) {
    if (patterns.some((pattern) => pattern.test(label))) return value;
  }
  return "—";
}

function availabilityLabel(product: CompareProduct) {
  if (product.stockStatus === "outofstock") return "ناموجود؛ جایگزین را استعلام کنید";
  if (product.stockStatus === "onbackorder") return "قابل استعلام / سفارش";
  if (product.stockStatus === "instock") return "موجودی امروز نیازمند تأیید";
  return "استعلام موجودی روز";
}

function productModel(product: CompareProduct) {
  return specValue(product, [/^مدل$/u, /مدل‌های موجود/u]);
}

function packLabel(product: CompareProduct) {
  return specValue(product, [
    /تعداد و حجم/u,
    /محتویات/u,
    /^تعداد$/u,
    /تعداد (?:ست|جعبه)/u,
    /بسته/u,
    /سرنگ/u,
    /ویال/u,
  ]);
}

function ingredientLabel(product: CompareProduct) {
  return specValue(product, [/ترکیب/u, /غلظت/u, /ماده فعال/u]);
}

function storageLabel(product: CompareProduct) {
  return specValue(product, [/نگهداری/u, /دمای/u, /شرایط نگهداری/u]);
}

export function CompareClient() {
  const [items, setItems] = useState<CompareProduct[]>([]);

  useEffect(() => {
    const sync = () => setItems(readCompare());
    sync();
    const unsubscribe = onCompareUpdated(sync);
    trackGaEvent("compare_view", { compare_count: readCompare().length });
    return unsubscribe;
  }, []);

  const rows = useMemo(() => [
    { label: "برند", value: (product: CompareProduct) => product.brand || "—" },
    { label: "مدل", value: productModel },
    {
      label: "حجم",
      value: (product: CompareProduct) =>
        product.volume || product.variantVolumes?.filter(Boolean).join("، ") || "—",
    },
    { label: "تعداد / بسته", value: packLabel },
    { label: "ترکیبات / غلظت", value: ingredientLabel },
    {
      label: "کاربرد / ویژگی اعلام‌شده",
      value: (product: CompareProduct) => product.features?.[0] || product.audience || "—",
    },
    { label: "شرایط نگهداری", value: storageLabel },
    { label: "SKU", value: (product: CompareProduct) => product.sku || "—" },
    {
      label: "قیمت ثبت‌شده",
      value: (product: CompareProduct) => {
        const price = numericPrice(product);
        return price ? `${priceFormatter.format(price)} تومان` : "استعلام قیمت امروز";
      },
    },
    { label: "وضعیت موجودی", value: availabilityLabel },
  ], []);

  function addAllToInquiry() {
    for (const product of items) {
      addToCart({
        slug: product.slug,
        nameFa: product.nameFa,
        nameEn: product.nameEn,
        brand: product.brand,
        image: product.image,
        volume: product.volume,
        priceToman: numericPrice(product) ?? undefined,
      });
    }
    trackGaEvent("compare_to_inquiry", {
      compare_count: items.length,
      item_ids: items.map((item) => item.slug).join(","),
    });
    window.location.assign("/cart");
  }

  if (!items.length) {
    return (
      <section className="sb-compare-empty">
        <span>COMPARE / مقایسه</span>
        <h1>هنوز محصولی برای مقایسه انتخاب نکرده‌اید.</h1>
        <p>از فروشگاه روی «مقایسه» بزنید. انتخاب شما بین صفحات حفظ می‌شود و می‌توانید تا ۴ محصول را کنار هم بررسی کنید.</p>
        <Link className="sb-btn sb-btn--dark" href="/shop">
          انتخاب محصولات <ArrowIcon />
        </Link>
      </section>
    );
  }

  return (
    <>
      <header className="sb-compare-intro">
        <div>
          <span className="sb-eyebrow">COMPARE / مقایسه محصول</span>
          <h1>تفاوت‌ها را قبل از استعلام کنار هم ببینید.</h1>
          <p>این جدول فقط اطلاعات ثبت‌شده همان محصولات را مقایسه می‌کند. قیمت و موجودی نهایی در مرحله استعلام روز تأیید می‌شود.</p>
        </div>
        <div className="sb-compare-intro__actions">
          <strong>{priceFormatter.format(items.length)} از ۴ محصول</strong>
          <button type="button" onClick={clearCompare}>پاک‌کردن مقایسه</button>
        </div>
      </header>

      <div className="sb-compare-scroll" role="region" aria-label="جدول مقایسه محصولات" tabIndex={0}>
        <table className="sb-compare-table">
          <thead>
            <tr>
              <th scope="col">مشخصه</th>
              {items.map((product) => (
                <th scope="col" key={product.slug}>
                  <div className="sb-compare-product">
                    <button
                      type="button"
                      onClick={() => removeFromCompare(product.slug)}
                      aria-label={`حذف ${product.nameFa} از مقایسه`}
                    >
                      <CloseIcon />
                    </button>
                    <img src={product.image} alt={product.imageAlt || product.nameFa} width="180" height="180" />
                    <span>{product.categoryTitle}</span>
                    <strong>{product.nameFa}</strong>
                    {product.nameEn && <small>{product.nameEn}</small>}
                    <Link href={`/product/${product.slug}`}>دیدن صفحه محصول</Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {items.map((product) => (
                  <td key={`${row.label}-${product.slug}`}>{row.value(product)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sb-compare-conversion">
        <div>
          <strong>گزینه‌های مناسب را پیدا کردید؟</strong>
          <span>همه محصولات این مقایسه را یکجا به لیست استعلام ببرید.</span>
        </div>
        <button className="sb-btn sb-btn--dark" type="button" onClick={addAllToInquiry}>
          افزودن همه به لیست استعلام <ArrowIcon />
        </button>
      </div>
    </>
  );
}
