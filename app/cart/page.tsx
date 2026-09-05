"use client";
/* eslint-disable @next/next/no-img-element -- product assets already have a managed source */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowIcon, CloseIcon, PackageIcon } from "../components/Icons";
import {
  cartCount,
  cartItemKey,
  cartSubtotal,
  onCartUpdated,
  readCart,
  removeFromCart,
  updateCartQuantity,
  type CartItem,
} from "../lib/cart";
import styles from "./cart.module.css";

const priceFormatter = new Intl.NumberFormat("fa-IR");

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    return onCartUpdated(sync);
  }, []);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);

  return (
    <main id="main-content" className={styles.page}>
      <div className="sb-shell">
        <nav className={styles.steps} aria-label="مراحل استعلام و سفارش">
          <span className={styles.activeStep}><b>۱</b> لیست استعلام</span>
          <span><b>۲</b> ارسال درخواست</span>
          <span><b>۳</b> تأیید قیمت و سفارش</span>
        </nav>

        <header className={styles.intro}>
          <span className="sb-eyebrow">INQUIRY LIST / لیست استعلام</span>
          <h1>لیست استعلام شما</h1>
          <p>مدل و تعداد محصولات را بررسی کنید. با ارسال این لیست، قیمت و موجودی روز برای شما تأیید می‌شود و هیچ پرداختی در این مرحله انجام نمی‌شود.</p>
        </header>

        {!items.length ? (
          <section className={styles.empty}>
            <PackageIcon />
            <h2>لیست استعلام هنوز خالی است.</h2>
            <p>محصولات موردنظرتان را از فروشگاه به این لیست اضافه کنید.</p>
            <Link className="sb-btn sb-btn--dark" href="/shop">انتخاب محصول <ArrowIcon /></Link>
          </section>
        ) : (
          <div className={styles.layout}>
            <section className={styles.list} aria-label="محصولات لیست استعلام">
              {items.map((item) => (
                <article className={styles.item} key={cartItemKey(item)}>
                  <div className={styles.imageWrap}>
                    <img src={item.image} alt={item.nameFa} width="140" height="140" />
                  </div>
                  <div className={styles.itemInfo}>
                    <span>{item.brand || "Sepiid Beauty"}</span>
                    <h2>{item.nameFa}</h2>
                    <small>{item.volume || item.nameEn || ""}</small>
                    {item.priceToman ? (
                      <strong>{priceFormatter.format(item.priceToman)} تومان <small>قیمت ثبت‌شده</small></strong>
                    ) : (
                      <strong className={styles.needsInquiry}>قیمت روز نیاز به استعلام دارد</strong>
                    )}
                  </div>
                  <div className={styles.controls}>
                    <label>
                      <span>تعداد</span>
                      <select
                        value={item.quantity}
                        onChange={(event) => updateCartQuantity(item, Number(event.target.value))}
                        aria-label={`تعداد ${item.nameFa}`}
                      >
                        {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                    <button type="button" onClick={() => removeFromCart(item)} aria-label={`حذف ${item.nameFa} از لیست استعلام`}>
                      <CloseIcon /> حذف
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <aside className={styles.summary} aria-label="خلاصه لیست استعلام">
              <div className={styles.summaryHead}>
                <span>خلاصه درخواست</span>
                <strong>{priceFormatter.format(cartCount(items))} قلم</strong>
              </div>
              {subtotal > 0 && (
                <div className={styles.summaryRow}>
                  <span>جمع قیمت‌های ثبت‌شده</span>
                  <strong>{priceFormatter.format(subtotal)} تومان</strong>
                </div>
              )}

              <div className={styles.notice} role="status">
                <strong>قیمت و موجودی نهایی بعد از ارسال درخواست تأیید می‌شود.</strong>
                <p>مبلغ‌های نمایش‌داده‌شده در این صفحه به معنی رزرو موجودی یا پرداخت نهایی نیستند. پس از بررسی، نتیجه برای تأیید سفارش با شما هماهنگ می‌شود.</p>
              </div>

              <Link className="sb-btn sb-btn--dark" href="/checkout">
                ارسال درخواست استعلام <ArrowIcon />
              </Link>
              <Link className={styles.continueShopping} href="/shop">افزودن محصول دیگر</Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
