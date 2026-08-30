"use client";
/* eslint-disable @next/next/no-img-element -- product assets already have a managed source */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowIcon, CloseIcon, PackageIcon } from "../components/Icons";
import { cartCount, onCartUpdated, readCart, removeFromCart, updateCartQuantity, type CartItem } from "../lib/cart";

const priceFormatter = new Intl.NumberFormat("fa-IR");
const whatsapp = (text: string) => `https://wa.me/989037251266?text=${encodeURIComponent(text)}`;

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    return onCartUpdated(sync);
  }, []);

  const inquiryText = useMemo(() => items.map((item) => `${item.nameFa}${item.volume ? ` (${item.volume})` : ""} × ${item.quantity}`).join("، "), [items]);

  return (
    <main id="main-content" className="sb-cart-page">
      <div className="sb-shell">
        <div className="sb-cart-page__intro">
          <span className="sb-eyebrow">CART / سبد خرید</span>
          <h1>سبد خرید شما</h1>
          <p>محصولات را یک‌جا نگه دارید و برای قیمت، موجودی و شرایط ارسال استعلام بگیرید.</p>
        </div>
        {!items.length ? (
          <section className="sb-cart-empty">
            <PackageIcon />
            <h2>سبد خرید هنوز خالی است.</h2>
            <p>از فروشگاه یک محصول انتخاب کنید تا اینجا نمایش داده شود.</p>
            <Link className="sb-btn sb-btn--dark" href="/shop">رفتن به فروشگاه <ArrowIcon /></Link>
          </section>
        ) : (
          <div className="sb-cart-layout">
            <section className="sb-cart-list" aria-label="محصولات سبد خرید">
              {items.map((item) => (
                <article className="sb-cart-item" key={`${item.slug}-${item.volume ?? "default"}`}>
                  <img src={item.image} alt={item.nameFa} width="140" height="140" />
                  <div className="sb-cart-item__info">
                    <span>{item.brand || "Sepiid Beauty"}</span>
                    <h2>{item.nameFa}</h2>
                    <small>{item.volume || item.nameEn}</small>
                    {item.priceToman ? <strong>{priceFormatter.format(item.priceToman)} تومان</strong> : <strong>استعلام قیمت و موجودی</strong>}
                  </div>
                  <div className="sb-cart-item__controls">
                    <label>تعداد<select value={item.quantity} onChange={(event) => updateCartQuantity(item.slug, Number(event.target.value))}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                    <button type="button" onClick={() => removeFromCart(item.slug)} aria-label={`حذف ${item.nameFa}`}><CloseIcon /> حذف</button>
                  </div>
                </article>
              ))}
            </section>
            <aside className="sb-cart-summary">
              <span>خلاصه سبد</span>
              <strong>{cartCount(items)} قلم محصول</strong>
              <p>قیمت نهایی و موجودی پس از بررسی روز تأیید می‌شود.</p>
              <Link className="sb-btn sb-btn--gold" href={whatsapp(`سلام، برای سبد خرید زیر قیمت و موجودی را استعلام می‌کنم: ${inquiryText}`)}>استعلام سبد خرید <ArrowIcon /></Link>
              <Link className="sb-text-link" href="/shop">ادامه خرید</Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
