"use client";
/* eslint-disable @next/next/no-img-element -- product assets already have a managed source */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowIcon, CloseIcon, PackageIcon } from "../components/Icons";
import {
  cartCount,
  cartHasUnknownPrice,
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
const whatsapp = (text: string) => `https://wa.me/989037251266?text=${encodeURIComponent(text)}`;

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    return onCartUpdated(sync);
  }, []);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const hasUnknownPrice = useMemo(() => cartHasUnknownPrice(items), [items]);
  const unknownPriceItems = useMemo(
    () => items.filter((item) => !item.priceToman).map((item) => `${item.nameFa}${item.volume ? ` (${item.volume})` : ""}`).join("، "),
    [items],
  );

  return (
    <main id="main-content" className={styles.page}>
      <div className="sb-shell">
        <nav className={styles.steps} aria-label="مراحل خرید">
          <span className={styles.activeStep}><b>۱</b> سبد خرید</span>
          <span><b>۲</b> اطلاعات ارسال</span>
          <span><b>۳</b> پرداخت</span>
        </nav>

        <header className={styles.intro}>
          <span className="sb-eyebrow">CART / سبد خرید</span>
          <h1>سبد خرید شما</h1>
          <p>تعداد و مدل محصولات را بررسی کنید؛ در مرحله بعد اطلاعات گیرنده، نشانی و روش پرداخت را تکمیل می‌کنید.</p>
        </header>

        {!items.length ? (
          <section className={styles.empty}>
            <PackageIcon />
            <h2>سبد خرید هنوز خالی است.</h2>
            <p>از فروشگاه محصول موردنظرتان را انتخاب کنید تا اینجا نمایش داده شود.</p>
            <Link className="sb-btn sb-btn--dark" href="/shop">رفتن به فروشگاه <ArrowIcon /></Link>
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
                      <strong>{priceFormatter.format(item.priceToman)} تومان</strong>
                    ) : (
                      <strong className={styles.needsInquiry}>نیاز به استعلام قیمت</strong>
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
                    <button type="button" onClick={() => removeFromCart(item)} aria-label={`حذف ${item.nameFa}`}>
                      <CloseIcon /> حذف
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <aside className={styles.summary} aria-label="خلاصه سفارش">
              <div className={styles.summaryHead}>
                <span>خلاصه سفارش</span>
                <strong>{priceFormatter.format(cartCount(items))} قلم</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>جمع محصولات قیمت‌دار</span>
                <strong>{priceFormatter.format(subtotal)} تومان</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>هزینه ارسال</span>
                <strong className={styles.pending}>پس از بررسی مقصد</strong>
              </div>

              {hasUnknownPrice ? (
                <div className={styles.notice} role="status">
                  <strong>برای ادامه پرداخت، قیمت همه اقلام باید مشخص باشد.</strong>
                  <p>یک یا چند محصول هنوز قیمت قطعی ندارند. ابتدا همان اقلام را استعلام کنید تا مبلغ اشتباه وارد مرحله پرداخت نشود.</p>
                </div>
              ) : (
                <p className={styles.helper}>هزینه و روش ارسال بر اساس مقصد و شرایط نگهداری محصول در مرحله بعد مشخص می‌شود.</p>
              )}

              {hasUnknownPrice ? (
                <Link
                  className="sb-btn sb-btn--gold"
                  href={whatsapp(`سلام، برای ادامه خرید لطفاً قیمت و موجودی این اقلام را بررسی کنید: ${unknownPriceItems}`)}
                >
                  استعلام اقلام بدون قیمت <ArrowIcon />
                </Link>
              ) : (
                <Link className="sb-btn sb-btn--dark" href="/checkout">
                  ادامه و ثبت اطلاعات ارسال <ArrowIcon />
                </Link>
              )}
              <Link className={styles.continueShopping} href="/shop">ادامه خرید</Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
