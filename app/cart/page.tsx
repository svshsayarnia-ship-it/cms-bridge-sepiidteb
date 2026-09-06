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
        <nav className={styles.steps} aria-label="مراحل خرید">
          <span className={styles.activeStep}><b>۱</b> سبد خرید</span>
          <span><b>۲</b> ثبت سفارش</span>
          <span><b>۳</b> پرداخت</span>
        </nav>

        <header className={styles.intro}>
          <span className="sb-eyebrow">SHOPPING CART / سبد خرید</span>
          <h1>سبد خرید شما</h1>
          <p>مدل و تعداد محصولات را بررسی کنید. قیمت و موجودی هنگام ثبت سفارش دوباره از WooCommerce کنترل می‌شود و سفارش پیش از ورود به درگاه ذخیره خواهد شد.</p>
        </header>

        {!items.length ? (
          <section className={styles.empty}>
            <PackageIcon />
            <h2>سبد خرید هنوز خالی است.</h2>
            <p>محصولات موردنظرتان را از فروشگاه به سبد اضافه کنید.</p>
            <Link className="sb-btn sb-btn--dark" href="/shop">انتخاب محصول <ArrowIcon /></Link>
          </section>
        ) : (
          <div className={styles.layout}>
            <section className={styles.list} aria-label="محصولات سبد خرید">
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
                      <strong>{priceFormatter.format(item.priceToman)} تومان <small>قیمت نمایشی</small></strong>
                    ) : (
                      <strong className={styles.needsInquiry}>قیمت هنگام ثبت سفارش تأیید می‌شود</strong>
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
                    <button type="button" onClick={() => removeFromCart(item)} aria-label={`حذف ${item.nameFa} از سبد خرید`}>
                      <CloseIcon /> حذف
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <aside className={styles.summary} aria-label="خلاصه سبد خرید">
              <div className={styles.summaryHead}>
                <span>خلاصه سبد</span>
                <strong>{priceFormatter.format(cartCount(items))} قلم</strong>
              </div>
              {subtotal > 0 && (
                <div className={styles.summaryRow}>
                  <span>جمع قیمت‌های نمایشی</span>
                  <strong>{priceFormatter.format(subtotal)} تومان</strong>
                </div>
              )}

              <div className={styles.notice} role="status">
                <strong>مبلغ نهایی سمت سرور محاسبه می‌شود.</strong>
                <p>قیمت داخل مرورگر ملاک برداشت وجه نیست. WooCommerce در مرحله بعد قیمت، موجودی و تعداد را دوباره بررسی می‌کند و سپس یک سفارش قابل پیگیری می‌سازد.</p>
              </div>

              <Link className="sb-btn sb-btn--dark" href="/checkout">
                ادامه و ثبت سفارش <ArrowIcon />
              </Link>
              <Link className={styles.continueShopping} href="/shop">افزودن محصول دیگر</Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
