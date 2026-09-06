"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  cartCount,
  onCartUpdated,
  readCart,
  type CartItem,
} from "../lib/cart";
import styles from "./checkout.module.css";

const DRAFT_KEY = "sepiid-beauty-checkout-draft-v2";
const IDEMPOTENCY_KEY = "sepiid-beauty-checkout-idempotency-v1";
const priceFormatter = new Intl.NumberFormat("fa-IR");

type CheckoutForm = {
  fullName: string;
  phone: string;
  customerType: "consumer" | "clinic";
  note: string;
  termsAccepted: boolean;
};

type Errors = Partial<Record<keyof CheckoutForm, string>>;
type CreatedOrder = {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  existing: boolean;
};

type PaymentStart = {
  url: string;
};

const initialForm: CheckoutForm = {
  fullName: "",
  phone: "",
  customerType: "consumer",
  note: "",
  termsAccepted: false,
};

function normalizeDigits(value: string) {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return value
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)));
}

function normalizePhone(value: string) {
  let phone = normalizeDigits(value).replace(/[^0-9+]/g, "");
  if (phone.startsWith("+98")) phone = `0${phone.slice(3)}`;
  if (phone.startsWith("0098")) phone = `0${phone.slice(4)}`;
  if (phone.startsWith("98") && phone.length === 12) phone = `0${phone.slice(2)}`;
  return phone;
}

function validate(form: CheckoutForm): Errors {
  const errors: Errors = {};
  if (form.fullName.trim().length < 3) {
    errors.fullName = "نام و نام خانوادگی را کامل وارد کنید.";
  }
  if (!/^09\d{9}$/.test(normalizePhone(form.phone))) {
    errors.phone = "شماره موبایل معتبر ۱۱ رقمی وارد کنید؛ مثال: ۰۹۱۲۱۲۳۴۵۶۷.";
  }
  if (!form.termsAccepted) {
    errors.termsAccepted = "برای ثبت سفارش، شرایط استفاده و حریم خصوصی را تأیید کنید.";
  }
  return errors;
}

function cartFingerprint(items: CartItem[]) {
  return items
    .map((item) => `${item.slug}::${item.volume ?? ""}::${item.quantity}`)
    .sort()
    .join("|");
}

function createRandomKey() {
  const bytes = new Uint8Array(18);
  window.crypto.getRandomValues(bytes);
  return `sb_${Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function getIdempotencyKey(items: CartItem[]) {
  const fingerprint = cartFingerprint(items);
  try {
    const saved = window.sessionStorage.getItem(IDEMPOTENCY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as { fingerprint?: string; key?: string };
      if (
        parsed.fingerprint === fingerprint &&
        typeof parsed.key === "string" &&
        /^[A-Za-z0-9_-]{16,80}$/.test(parsed.key)
      ) {
        return parsed.key;
      }
    }
  } catch {
    // A new key below is safer than reusing a malformed browser value.
  }

  const key = createRandomKey();
  window.sessionStorage.setItem(IDEMPOTENCY_KEY, JSON.stringify({ fingerprint, key }));
  return key;
}

function goToGateway(payment: PaymentStart) {
  const url = new URL(payment.url);
  if (url.protocol !== "https:" || url.hostname !== "panel.aqayepardakht.ir") {
    throw new Error("آدرس درگاه پرداخت معتبر نیست. لطفاً با پشتیبانی سپید بیوتی تماس بگیرید.");
  }
  window.location.assign(url.toString());
}

export function TransactionalCheckoutClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [order, setOrder] = useState<CreatedOrder | null>(null);

  useEffect(() => {
    const syncCart = () => setItems(readCart());
    syncCart();
    const unsubscribe = onCartUpdated(syncCart);

    try {
      const saved = window.sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        setForm({
          ...initialForm,
          ...JSON.parse(saved),
          termsAccepted: false,
        });
      }
    } catch {
      // Invalid old browser state must not block checkout.
    }

    return unsubscribe;
  }, []);

  const browserSubtotal = useMemo(
    () => items.reduce((total, item) => total + (item.priceToman ?? 0) * item.quantity, 0),
    [items],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length || submitting || order) return;

    const nextErrors = validate(form);
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length) return;

    try {
      window.sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ...form, termsAccepted: false }),
      );
    } catch {
      // Draft persistence is optional; order persistence is server-side.
    }

    setSubmitting(true);
    try {
      const idempotencyKey = getIdempotencyKey(items);
      const response = await fetch("/api/checkout/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          idempotencyKey,
          fullName: form.fullName,
          phone: form.phone,
          customerType: form.customerType,
          note: form.note,
          lines: items.map((item) => ({
            slug: item.slug,
            quantity: item.quantity,
            volume: item.volume,
          })),
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        order?: CreatedOrder;
        payment?: PaymentStart | null;
        paymentConfigured?: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !payload.ok || !payload.order) {
        throw new Error("ثبت سفارش یا شروع پرداخت کامل نشد. لطفاً دوباره تلاش کنید.");
      }

      if (payload.payment?.url) {
        goToGateway(payload.payment);
        return;
      }

      setOrder(payload.order);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "ثبت سفارش یا شروع پرداخت کامل نشد. لطفاً دوباره تلاش کنید.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (order) {
    return (
      <main className={styles.page}>
        <div className="sb-shell">
          <div className={styles.steps} aria-label="مراحل خرید">
            <Link href="/cart"><b>✓</b> سبد خرید</Link>
            <span className={styles.activeStep}><b>✓</b> ثبت سفارش</span>
            <span><b>۳</b> پرداخت</span>
          </div>
          <section className={styles.card} style={{ maxWidth: 760, margin: "0 auto" }}>
            <div className={styles.sectionHeading}>
              <span>✓</span>
              <div>
                <h2>سفارش شما ثبت شد</h2>
                <p>شماره سفارش: <strong>#{order.number}</strong></p>
              </div>
            </div>
            <p>پرداخت هنوز انجام نشده است. لطفاً دوباره برای پرداخت تلاش کنید.</p>
            {Number(order.total) > 0 && (
              <p><strong>مبلغ سفارش: {priceFormatter.format(Number(order.total))} {order.currency === "IRT" ? "تومان" : order.currency}</strong></p>
            )}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
              <Link className="sb-btn sb-btn--dark" href="/checkout">تلاش دوباره برای پرداخت</Link>
              <Link className="sb-btn" href="/contact">تماس با سپید بیوتی</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className={styles.page}>
        <div className="sb-shell">
          <section className={styles.card} style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <h1>سبد خرید خالی است</h1>
            <p>برای ثبت سفارش، ابتدا یک محصول به سبد خرید اضافه کنید.</p>
            <Link className="sb-btn sb-btn--dark" href="/shop">مشاهده محصولات</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className="sb-shell">
        <div className={styles.steps} aria-label="مراحل خرید">
          <Link href="/cart"><b>✓</b> سبد خرید</Link>
          <span className={styles.activeStep}><b>۲</b> ثبت سفارش</span>
          <span><b>۳</b> پرداخت</span>
        </div>

        <div className={styles.intro}>
          <span className="sb-eyebrow">تکمیل سفارش</span>
          <h1>اطلاعات تماس و پرداخت امن</h1>
        </div>

        <form className={styles.layout} onSubmit={handleSubmit} noValidate>
          <div className={styles.formColumn}>
            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <span>۱</span>
                <div>
                  <h2>اطلاعات خریدار</h2>
                </div>
              </div>

              <div className={styles.gridTwo}>
                <label className={styles.field}>
                  <span>نام و نام خانوادگی</span>
                  <input
                    value={form.fullName}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    autoComplete="name"
                    aria-invalid={Boolean(errors.fullName)}
                    disabled={submitting}
                  />
                  {errors.fullName && <small>{errors.fullName}</small>}
                </label>
                <label className={styles.field}>
                  <span>شماره موبایل</span>
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="09121234567"
                    aria-invalid={Boolean(errors.phone)}
                    disabled={submitting}
                  />
                  {errors.phone && <small>{errors.phone}</small>}
                </label>
              </div>

              <label className={styles.field} style={{ marginTop: 16 }}>
                <span>نوع مشتری</span>
                <select
                  value={form.customerType}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    customerType: event.target.value === "clinic" ? "clinic" : "consumer",
                  }))}
                  disabled={submitting}
                >
                  <option value="consumer">مصرف‌کننده</option>
                  <option value="clinic">پزشک / کلینیک</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>توضیحات سفارش <em>اختیاری</em></span>
                <textarea
                  value={form.note}
                  onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  maxLength={1000}
                  disabled={submitting}
                />
              </label>
            </section>

            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <span>۲</span>
                <div>
                  <h2>پرداخت</h2>
                </div>
              </div>
              <div className={`${styles.paymentMethod} ${styles.paymentMethodSelected}`}>
                <span className={styles.radioDot} aria-hidden="true" />
                <div>
                  <strong>پرداخت آنلاین با آقای پرداخت</strong>
                </div>
                <b>پرداخت امن</b>
              </div>
            </section>

            <section className={styles.card}>
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={(event) => setForm((current) => ({ ...current, termsAccepted: event.target.checked }))}
                  disabled={submitting}
                />
                <span>
                  شرایط استفاده و حریم خصوصی را مطالعه کرده‌ام و با ثبت اطلاعات سفارش و انتقال به درگاه پرداخت موافقم.
                </span>
              </label>
              {errors.termsAccepted && <p className={styles.termsError}>{errors.termsAccepted}</p>}
              {submitError && (
                <p className={styles.termsError} role="alert" style={{ marginTop: 12 }}>
                  {submitError}
                </p>
              )}
              <button
                className="sb-btn sb-btn--dark"
                type="submit"
                disabled={submitting}
                style={{ width: "100%", marginTop: 18 }}
              >
                {submitting ? "در حال انتقال به پرداخت…" : "ادامه و پرداخت"}
              </button>
            </section>
          </div>

          <aside className={styles.summary}>
            <div className={styles.summaryHead}>
              <strong>خلاصه سفارش</strong>
              <span>{priceFormatter.format(cartCount(items))} کالا</span>
            </div>
            <div className={styles.compactItems}>
              {items.map((item) => (
                <div key={`${item.slug}:${item.volume ?? "default"}`}>
                  <span>{item.nameFa}{item.volume ? ` — ${item.volume}` : ""} × {priceFormatter.format(item.quantity)}</span>
                  <strong>
                    {item.priceToman
                      ? `${priceFormatter.format(item.priceToman * item.quantity)} تومان`
                      : "قیمت هنگام پرداخت"}
                  </strong>
                </div>
              ))}
            </div>
            <div className={styles.summaryRow}>
              <span>جمع سبد</span>
              <strong>{browserSubtotal > 0 ? `${priceFormatter.format(browserSubtotal)} تومان` : "محاسبه هنگام پرداخت"}</strong>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
