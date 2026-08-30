"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowIcon, PackageIcon } from "../components/Icons";
import {
  cartCount,
  cartHasUnknownPrice,
  cartSubtotal,
  onCartUpdated,
  readCart,
  type CartItem,
} from "../lib/cart";
import styles from "./checkout.module.css";

const provinces = [
  "آذربایجان شرقی", "آذربایجان غربی", "اردبیل", "اصفهان", "البرز", "ایلام", "بوشهر", "تهران",
  "چهارمحال و بختیاری", "خراسان جنوبی", "خراسان رضوی", "خراسان شمالی", "خوزستان", "زنجان", "سمنان",
  "سیستان و بلوچستان", "فارس", "قزوین", "قم", "کردستان", "کرمان", "کرمانشاه", "کهگیلویه و بویراحمد",
  "گلستان", "گیلان", "لرستان", "مازندران", "مرکزی", "هرمزگان", "همدان", "یزد",
];

const DRAFT_KEY = "sepiid-beauty-checkout-session-v1";
const priceFormatter = new Intl.NumberFormat("fa-IR");

type CheckoutForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  plate: string;
  unit: string;
  note: string;
  paymentMethod: "online";
  termsAccepted: boolean;
};

type FieldName = keyof CheckoutForm;
type Errors = Partial<Record<FieldName, string>>;

const initialForm: CheckoutForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  province: "",
  city: "",
  address: "",
  postalCode: "",
  plate: "",
  unit: "",
  note: "",
  paymentMethod: "online",
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
  const phone = normalizePhone(form.phone);
  const postal = normalizeDigits(form.postalCode).replace(/\D/g, "");

  if (form.firstName.trim().length < 2) errors.firstName = "نام را کامل وارد کنید.";
  if (form.lastName.trim().length < 2) errors.lastName = "نام خانوادگی را کامل وارد کنید.";
  if (!/^09\d{9}$/.test(phone)) errors.phone = "شماره موبایل معتبر ۱۱ رقمی وارد کنید؛ مثال: ۰۹۱۲۱۲۳۴۵۶۷.";
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "ایمیل واردشده معتبر نیست.";
  if (!form.province) errors.province = "استان را انتخاب کنید.";
  if (form.city.trim().length < 2) errors.city = "نام شهر را وارد کنید.";
  if (form.address.trim().length < 10) errors.address = "آدرس کامل‌تر وارد کنید تا بسته بدون ابهام تحویل شود.";
  if (!/^\d{10}$/.test(postal)) errors.postalCode = "کد پستی باید ۱۰ رقم باشد.";
  if (!form.plate.trim()) errors.plate = "پلاک را وارد کنید.";
  if (!form.termsAccepted) errors.termsAccepted = "برای ادامه، شرایط خرید و ارسال را تأیید کنید.";

  return errors;
}

function RequiredMark() {
  return <span className={styles.required} aria-hidden="true">*</span>;
}

export function CheckoutClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [readyForGateway, setReadyForGateway] = useState(false);

  useEffect(() => {
    const syncCart = () => setItems(readCart());
    syncCart();
    const unsubscribe = onCartUpdated(syncCart);

    try {
      const saved = window.sessionStorage.getItem(DRAFT_KEY);
      if (saved) setForm({ ...initialForm, ...JSON.parse(saved), paymentMethod: "online", termsAccepted: false });
    } catch {
      // Ignore an invalid local draft and keep the clean form.
    }

    return unsubscribe;
  }, []);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const hasUnknownPrice = useMemo(() => cartHasUnknownPrice(items), [items]);

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setReadyForGateway(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length || hasUnknownPrice) return;

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      window.setTimeout(() => {
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      }, 0);
      return;
    }

    const cleanForm = {
      ...form,
      phone: normalizePhone(form.phone),
      postalCode: normalizeDigits(form.postalCode).replace(/\D/g, ""),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      plate: form.plate.trim(),
      unit: form.unit.trim(),
      email: form.email.trim(),
      note: form.note.trim(),
    };

    setForm(cleanForm);
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...cleanForm, termsAccepted: false }));
    setReadyForGateway(true);
    window.setTimeout(() => document.getElementById("payment-ready")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  if (!items.length) {
    return (
      <main id="main-content" className={styles.page}>
        <div className="sb-shell">
          <section className={styles.empty}>
            <PackageIcon />
            <h1>برای تکمیل سفارش، ابتدا محصولی به سبد اضافه کنید.</h1>
            <p>اطلاعات ارسال و پرداخت زمانی فعال می‌شود که سبد خرید شما محصول داشته باشد.</p>
            <Link className="sb-btn sb-btn--dark" href="/shop">رفتن به فروشگاه <ArrowIcon /></Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className={styles.page}>
      <div className="sb-shell">
        <nav className={styles.steps} aria-label="مراحل خرید">
          <Link href="/cart"><b>✓</b> سبد خرید</Link>
          <span className={styles.activeStep}><b>۲</b> اطلاعات ارسال</span>
          <span><b>۳</b> پرداخت</span>
        </nav>

        <header className={styles.intro}>
          <span className="sb-eyebrow">CHECKOUT / تکمیل سفارش</span>
          <h1>اطلاعات ارسال و پرداخت</h1>
          <p>فیلدهای ستاره‌دار برای تحویل درست سفارش ضروری‌اند. اطلاعات کارت بانکی در سایت سپید بیوتی دریافت نمی‌شود.</p>
        </header>

        {hasUnknownPrice && (
          <div className={styles.blockingNotice} role="alert">
            <strong>پرداخت این سبد هنوز قابل نهایی‌کردن نیست.</strong>
            <p>حداقل یک محصول قیمت قطعی ندارد. برای جلوگیری از ثبت مبلغ اشتباه، ابتدا از سبد خرید قیمت آن را استعلام کنید.</p>
            <Link href="/cart">بازگشت به سبد خرید</Link>
          </div>
        )}

        <form className={styles.layout} onSubmit={handleSubmit} noValidate>
          <div className={styles.formColumn} aria-disabled={hasUnknownPrice}>
            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <span>01</span>
                <div>
                  <h2>اطلاعات گیرنده</h2>
                  <p>برای هماهنگی ارسال و اطلاع‌رسانی سفارش.</p>
                </div>
              </div>

              <div className={styles.gridTwo}>
                <label className={styles.field}>
                  <span>نام <RequiredMark /></span>
                  <input name="firstName" value={form.firstName} onChange={updateField} autoComplete="given-name" aria-invalid={Boolean(errors.firstName)} disabled={hasUnknownPrice} />
                  {errors.firstName && <small role="alert">{errors.firstName}</small>}
                </label>
                <label className={styles.field}>
                  <span>نام خانوادگی <RequiredMark /></span>
                  <input name="lastName" value={form.lastName} onChange={updateField} autoComplete="family-name" aria-invalid={Boolean(errors.lastName)} disabled={hasUnknownPrice} />
                  {errors.lastName && <small role="alert">{errors.lastName}</small>}
                </label>
                <label className={styles.field}>
                  <span>شماره موبایل <RequiredMark /></span>
                  <input name="phone" value={form.phone} onChange={updateField} autoComplete="tel" inputMode="tel" dir="ltr" placeholder="09121234567" aria-invalid={Boolean(errors.phone)} disabled={hasUnknownPrice} />
                  {errors.phone && <small role="alert">{errors.phone}</small>}
                </label>
                <label className={styles.field}>
                  <span>ایمیل <em>اختیاری</em></span>
                  <input name="email" value={form.email} onChange={updateField} autoComplete="email" inputMode="email" dir="ltr" placeholder="name@example.com" aria-invalid={Boolean(errors.email)} disabled={hasUnknownPrice} />
                  {errors.email && <small role="alert">{errors.email}</small>}
                </label>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <span>02</span>
                <div>
                  <h2>نشانی تحویل</h2>
                  <p>آدرس دقیق باعث کاهش تماس اضافی و خطای ارسال می‌شود.</p>
                </div>
              </div>

              <div className={styles.gridTwo}>
                <label className={styles.field}>
                  <span>استان <RequiredMark /></span>
                  <select name="province" value={form.province} onChange={updateField} autoComplete="address-level1" aria-invalid={Boolean(errors.province)} disabled={hasUnknownPrice}>
                    <option value="">انتخاب استان</option>
                    {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
                  </select>
                  {errors.province && <small role="alert">{errors.province}</small>}
                </label>
                <label className={styles.field}>
                  <span>شهر <RequiredMark /></span>
                  <input name="city" value={form.city} onChange={updateField} autoComplete="address-level2" aria-invalid={Boolean(errors.city)} disabled={hasUnknownPrice} />
                  {errors.city && <small role="alert">{errors.city}</small>}
                </label>
              </div>

              <label className={styles.field}>
                <span>آدرس کامل <RequiredMark /></span>
                <textarea name="address" value={form.address} onChange={updateField} autoComplete="street-address" rows={3} placeholder="خیابان، کوچه، ساختمان و اطلاعات لازم برای پیدا کردن نشانی" aria-invalid={Boolean(errors.address)} disabled={hasUnknownPrice} />
                {errors.address && <small role="alert">{errors.address}</small>}
              </label>

              <div className={styles.gridThree}>
                <label className={styles.field}>
                  <span>کد پستی <RequiredMark /></span>
                  <input name="postalCode" value={form.postalCode} onChange={updateField} autoComplete="postal-code" inputMode="numeric" maxLength={10} dir="ltr" placeholder="1234567890" aria-invalid={Boolean(errors.postalCode)} disabled={hasUnknownPrice} />
                  {errors.postalCode && <small role="alert">{errors.postalCode}</small>}
                </label>
                <label className={styles.field}>
                  <span>پلاک <RequiredMark /></span>
                  <input name="plate" value={form.plate} onChange={updateField} inputMode="numeric" aria-invalid={Boolean(errors.plate)} disabled={hasUnknownPrice} />
                  {errors.plate && <small role="alert">{errors.plate}</small>}
                </label>
                <label className={styles.field}>
                  <span>واحد <em>اختیاری</em></span>
                  <input name="unit" value={form.unit} onChange={updateField} inputMode="numeric" disabled={hasUnknownPrice} />
                </label>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <span>03</span>
                <div>
                  <h2>ارسال و توضیحات</h2>
                  <p>روش نهایی ارسال بر اساس مقصد و شرایط نگهداری محصول مشخص می‌شود.</p>
                </div>
              </div>

              <div className={styles.shippingMethod}>
                <span className={styles.radioDot} aria-hidden="true" />
                <div>
                  <strong>ارسال متناسب با مقصد و شرایط محصول</strong>
                  <p>هزینه و روش حمل قبل از کسر وجه نهایی می‌شود؛ برای محصول حساس، شرایط حمل مناسب در اولویت است.</p>
                </div>
              </div>

              <label className={styles.field}>
                <span>توضیحات سفارش <em>اختیاری</em></span>
                <textarea name="note" value={form.note} onChange={updateField} rows={3} placeholder="مثلاً توضیح تکمیلی برای تحویل بسته" disabled={hasUnknownPrice} />
              </label>
            </section>

            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <span>04</span>
                <div>
                  <h2>روش پرداخت</h2>
                  <p>اطلاعات کارت باید فقط در صفحه درگاه بانکی وارد شود.</p>
                </div>
              </div>

              <label className={`${styles.paymentMethod} ${styles.paymentMethodSelected}`}>
                <input type="radio" name="paymentMethod" value="online" checked={form.paymentMethod === "online"} onChange={updateField} disabled={hasUnknownPrice} />
                <span className={styles.radioDot} aria-hidden="true" />
                <div>
                  <strong>پرداخت اینترنتی</strong>
                  <p>انتخاب پرداخت آماده است؛ پس از اتصال فنی درگاه، ادامه این مرحله به صفحه پرداخت بانکی منتقل می‌شود.</p>
                </div>
                <b>پیشنهادی</b>
              </label>
            </section>
          </div>

          <aside className={styles.summary} aria-label="خلاصه سفارش">
            <div className={styles.summaryHead}>
              <span>سفارش شما</span>
              <Link href="/cart">ویرایش سبد</Link>
            </div>

            <div className={styles.compactItems}>
              {items.map((item) => (
                <div key={`${item.slug}-${item.volume ?? "default"}`}>
                  <span>{item.nameFa}{item.volume ? ` — ${item.volume}` : ""} × {priceFormatter.format(item.quantity)}</span>
                  <strong>{item.priceToman ? `${priceFormatter.format(item.priceToman * item.quantity)} تومان` : "استعلام"}</strong>
                </div>
              ))}
            </div>

            <div className={styles.summaryRow}>
              <span>تعداد</span>
              <strong>{priceFormatter.format(cartCount(items))} قلم</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>جمع محصولات</span>
              <strong>{priceFormatter.format(subtotal)} تومان</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>ارسال</span>
              <strong className={styles.pending}>پس از بررسی مقصد</strong>
            </div>

            <label className={styles.terms}>
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(event) => {
                  setForm((current) => ({ ...current, termsAccepted: event.target.checked }));
                  setErrors((current) => ({ ...current, termsAccepted: undefined }));
                  setReadyForGateway(false);
                }}
                aria-invalid={Boolean(errors.termsAccepted)}
                disabled={hasUnknownPrice}
              />
              <span>
                <Link href="/policies/terms" target="_blank">شرایط استفاده</Link>، <Link href="/policies/shipping" target="_blank">شرایط ارسال</Link> و <Link href="/policies/privacy" target="_blank">حریم خصوصی</Link> را خوانده‌ام و می‌پذیرم. <RequiredMark />
              </span>
            </label>
            {errors.termsAccepted && <small className={styles.termsError} role="alert">{errors.termsAccepted}</small>}

            <button className="sb-btn sb-btn--dark" type="submit" disabled={hasUnknownPrice}>
              ثبت اطلاعات و ادامه به پرداخت <ArrowIcon />
            </button>

            <p className={styles.secureNote}>سپید بیوتی شماره کارت، رمز پویا یا CVV2 را در این فرم درخواست نمی‌کند.</p>

            {readyForGateway && (
              <div id="payment-ready" className={styles.paymentReady} role="status" tabIndex={-1}>
                <strong>اطلاعات سفارش کامل و روش پرداخت انتخاب شد.</strong>
                <p>اتصال نهایی درگاه بانکی هنوز فعال نشده است؛ بنابراین در این مرحله هیچ مبلغی از حساب شما کسر نشده. ساختار Checkout برای اتصال مستقیم درگاه آماده است.</p>
              </div>
            )}
          </aside>
        </form>
      </div>
    </main>
  );
}
