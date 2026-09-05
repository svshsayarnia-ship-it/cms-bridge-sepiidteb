"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowIcon, PackageIcon } from "../components/Icons";
import {
  cartCount,
  onCartUpdated,
  readCart,
  type CartItem,
} from "../lib/cart";
import { trackGaEvent } from "../lib/analytics";
import styles from "./checkout.module.css";

const DRAFT_KEY = "sepiid-beauty-inquiry-session-v1";
const priceFormatter = new Intl.NumberFormat("fa-IR");
const WHATSAPP_NUMBER = "989037251266";

type InquiryForm = {
  fullName: string;
  phone: string;
  customerType: "consumer" | "clinic";
  note: string;
  termsAccepted: boolean;
};

type Errors = Partial<Record<keyof InquiryForm, string>>;

const initialForm: InquiryForm = {
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

function validate(form: InquiryForm): Errors {
  const errors: Errors = {};
  if (form.fullName.trim().length < 3) errors.fullName = "نام و نام خانوادگی را وارد کنید.";
  if (!/^09\d{9}$/.test(normalizePhone(form.phone))) errors.phone = "شماره موبایل معتبر ۱۱ رقمی وارد کنید؛ مثال: ۰۹۱۲۱۲۳۴۵۶۷.";
  if (!form.termsAccepted) errors.termsAccepted = "برای ارسال درخواست، شرایط استفاده و حریم خصوصی را تأیید کنید.";
  return errors;
}

function RequiredMark() {
  return <span className={styles.required} aria-hidden="true">*</span>;
}

function buildInquiryMessage(items: CartItem[], form: InquiryForm) {
  const customerType = form.customerType === "clinic" ? "پزشک / کلینیک" : "مصرف‌کننده";
  const itemLines = items.map((item, index) => {
    const volume = item.volume ? ` — ${item.volume}` : "";
    return `${index + 1}. ${item.nameFa}${volume} — تعداد: ${item.quantity}`;
  });

  return [
    "سلام، درخواست استعلام قیمت و موجودی سپید بیوتی دارم.",
    "",
    `نام: ${form.fullName.trim()}`,
    `شماره تماس: ${normalizePhone(form.phone)}`,
    `نوع مشتری: ${customerType}`,
    "",
    "اقلام:",
    ...itemLines,
    ...(form.note.trim() ? ["", `توضیحات: ${form.note.trim()}`] : []),
    "",
    "لطفاً قیمت و موجودی امروز را تأیید کنید.",
  ].join("\n");
}

export function CheckoutClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState<InquiryForm>(initialForm);
  const [errors, setErrors] = useState<Errors>({});

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
      // Keep a clean form when an old or invalid draft cannot be parsed.
    }

    return unsubscribe;
  }, []);

  const pricedSubtotal = useMemo(
    () => items.reduce((total, item) => total + (item.priceToman ?? 0) * item.quantity, 0),
    [items],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      window.setTimeout(() => {
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      }, 0);
      return;
    }

    const cleanForm: InquiryForm = {
      ...form,
      fullName: form.fullName.trim(),
      phone: normalizePhone(form.phone),
      note: form.note.trim(),
    };

    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...cleanForm, termsAccepted: false }),
    );

    trackGaEvent("inquiry_submit", {
      item_count: cartCount(items),
      customer_type: cleanForm.customerType,
      inquiry_channel: "whatsapp",
    });

    const message = buildInquiryMessage(items, cleanForm);
    window.location.assign(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`);
  }

  if (!items.length) {
    return (
      <main id="main-content" className={styles.page}>
        <div className="sb-shell">
          <section className={styles.empty}>
            <PackageIcon />
            <h1>برای ارسال درخواست، ابتدا محصولی به لیست استعلام اضافه کنید.</h1>
            <p>مدل و تعداد محصول را انتخاب کنید؛ سپس قیمت و موجودی روز برای شما بررسی می‌شود.</p>
            <Link className="sb-btn sb-btn--dark" href="/shop">انتخاب محصول <ArrowIcon /></Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className={styles.page}>
      <div className="sb-shell">
        <nav className={styles.steps} aria-label="مراحل استعلام و سفارش">
          <Link href="/cart"><b>✓</b> لیست استعلام</Link>
          <span className={styles.activeStep}><b>۲</b> ارسال درخواست</span>
          <span><b>۳</b> تأیید قیمت و سفارش</span>
        </nav>

        <header className={styles.intro}>
          <span className="sb-eyebrow">INQUIRY / ارسال درخواست</span>
          <h1>ارسال درخواست قیمت و موجودی</h1>
          <p>فقط اطلاعات لازم برای پیگیری استعلام را وارد کنید. در این مرحله پرداختی انجام نمی‌شود؛ قیمت و موجودی روز پس از بررسی برای تأیید نهایی سفارش اعلام خواهد شد.</p>
        </header>

        <form className={styles.layout} onSubmit={handleSubmit} noValidate>
          <div className={styles.formColumn}>
            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <span>01</span>
                <div>
                  <h2>اطلاعات تماس</h2>
                  <p>برای اعلام نتیجه استعلام و هماهنگی سفارش.</p>
                </div>
              </div>

              <div className={styles.gridTwo}>
                <label className={styles.field}>
                  <span>نام و نام خانوادگی <RequiredMark /></span>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, fullName: event.target.value }));
                      setErrors((current) => ({ ...current, fullName: undefined }));
                    }}
                    autoComplete="name"
                    aria-invalid={Boolean(errors.fullName)}
                  />
                  {errors.fullName && <small role="alert">{errors.fullName}</small>}
                </label>

                <label className={styles.field}>
                  <span>شماره موبایل <RequiredMark /></span>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, phone: event.target.value }));
                      setErrors((current) => ({ ...current, phone: undefined }));
                    }}
                    autoComplete="tel"
                    inputMode="tel"
                    dir="ltr"
                    placeholder="09121234567"
                    aria-invalid={Boolean(errors.phone)}
                  />
                  {errors.phone && <small role="alert">{errors.phone}</small>}
                </label>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <span>02</span>
                <div>
                  <h2>نوع درخواست</h2>
                  <p>برای اینکه پاسخ و پیگیری متناسب با نوع خرید انجام شود.</p>
                </div>
              </div>

              <div className={styles.gridTwo}>
                <label className={`${styles.paymentMethod} ${form.customerType === "consumer" ? styles.paymentMethodSelected : ""}`}>
                  <input
                    type="radio"
                    name="customerType"
                    value="consumer"
                    checked={form.customerType === "consumer"}
                    onChange={() => setForm((current) => ({ ...current, customerType: "consumer" }))}
                  />
                  <span className={styles.radioDot} aria-hidden="true" />
                  <div>
                    <strong>مصرف‌کننده</strong>
                    <p>برای بررسی یک یا چند محصول و هماهنگی سفارش شخصی.</p>
                  </div>
                </label>

                <label className={`${styles.paymentMethod} ${form.customerType === "clinic" ? styles.paymentMethodSelected : ""}`}>
                  <input
                    type="radio"
                    name="customerType"
                    value="clinic"
                    checked={form.customerType === "clinic"}
                    onChange={() => setForm((current) => ({ ...current, customerType: "clinic" }))}
                  />
                  <span className={styles.radioDot} aria-hidden="true" />
                  <div>
                    <strong>پزشک / کلینیک</strong>
                    <p>برای استعلام چندقلمی، خرید حرفه‌ای و سفارش تکرارشونده.</p>
                  </div>
                </label>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <span>03</span>
                <div>
                  <h2>توضیحات تکمیلی</h2>
                  <p>اختیاری؛ مثلاً زمان موردنظر، تعداد بیشتر یا سؤال درباره مدل.</p>
                </div>
              </div>

              <label className={styles.field}>
                <span>توضیحات <em>اختیاری</em></span>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  rows={4}
                  placeholder="اگر نکته‌ای برای استعلام دارید اینجا بنویسید"
                />
              </label>
            </section>
          </div>

          <aside className={styles.summary} aria-label="خلاصه درخواست استعلام">
            <div className={styles.summaryHead}>
              <span>لیست شما</span>
              <Link href="/cart">ویرایش لیست</Link>
            </div>

            <div className={styles.compactItems}>
              {items.map((item) => (
                <div key={`${item.slug}-${item.volume ?? "default"}`}>
                  <span>{item.nameFa}{item.volume ? ` — ${item.volume}` : ""} × {priceFormatter.format(item.quantity)}</span>
                  <strong>{item.priceToman ? `${priceFormatter.format(item.priceToman)} تومان` : "استعلام روز"}</strong>
                </div>
              ))}
            </div>

            <div className={styles.summaryRow}>
              <span>تعداد</span>
              <strong>{priceFormatter.format(cartCount(items))} قلم</strong>
            </div>
            {pricedSubtotal > 0 && (
              <div className={styles.summaryRow}>
                <span>جمع قیمت‌های ثبت‌شده</span>
                <strong>{priceFormatter.format(pricedSubtotal)} تومان</strong>
              </div>
            )}

            <div className={styles.blockingNotice} role="status">
              <strong>این فرم پرداخت نیست.</strong>
              <p>پس از ارسال درخواست، قیمت و موجودی روز بررسی می‌شود. سفارش فقط بعد از تأیید شما نهایی خواهد شد.</p>
            </div>

            <label className={styles.terms}>
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(event) => {
                  setForm((current) => ({ ...current, termsAccepted: event.target.checked }));
                  setErrors((current) => ({ ...current, termsAccepted: undefined }));
                }}
                aria-invalid={Boolean(errors.termsAccepted)}
              />
              <span>
                <Link href="/policies/terms" target="_blank">شرایط استفاده</Link> و <Link href="/policies/privacy" target="_blank">حریم خصوصی</Link> را خوانده‌ام و می‌پذیرم. <RequiredMark />
              </span>
            </label>
            {errors.termsAccepted && <small className={styles.termsError} role="alert">{errors.termsAccepted}</small>}

            <button className="sb-btn sb-btn--dark" type="submit">
              ارسال درخواست استعلام <ArrowIcon />
            </button>

            <p className={styles.secureNote}>درخواست آماده‌شده در واتساپ باز می‌شود تا ارسال آن را خودتان تأیید کنید. هیچ مبلغی در این مرحله از حساب شما کسر نمی‌شود.</p>
          </aside>
        </form>
      </div>
    </main>
  );
}
