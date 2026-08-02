"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { whatsappHref } from "../data";

type AccountMode = "login" | "register" | "profile";

type CustomerProfile = {
  fullName: string;
  phone: string;
  clinicName: string;
  city: string;
  role: string;
};

const STORAGE_KEY = "sepiid_customer_profile_v1";

const emptyProfile: CustomerProfile = {
  fullName: "",
  phone: "",
  clinicName: "",
  city: "",
  role: "clinic",
};

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export function CustomerAccount({ initialMode = "login" }: { initialMode?: AccountMode }) {
  const [mode, setMode] = useState<AccountMode>(initialMode);
  const [profile, setProfile] = useState<CustomerProfile>(emptyProfile);
  const [savedProfile, setSavedProfile] = useState<CustomerProfile | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      try {
        const saved = JSON.parse(raw) as CustomerProfile;
        setSavedProfile(saved);
        setProfile(saved);
        if (initialMode === "profile") setMode("profile");
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialMode]);

  const supportLink = useMemo(() => {
    const text = [
      "سلام، برای حساب کاربری سپید بیوتی نیاز به بررسی دارم.",
      profile.fullName && `نام: ${profile.fullName}`,
      profile.phone && `شماره: ${profile.phone}`,
      profile.clinicName && `کلینیک/مرکز: ${profile.clinicName}`,
      profile.city && `شهر: ${profile.city}`,
    ]
      .filter(Boolean)
      .join("\n");
    return whatsappHref(text);
  }, [profile]);

  function update(field: keyof CustomerProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function submitRegister(event: FormEvent) {
    event.preventDefault();
    if (!profile.fullName.trim() || normalizePhone(profile.phone).length < 10) {
      setMessage("نام و شماره موبایل معتبر را وارد کن.");
      return;
    }

    const nextProfile = { ...profile, phone: normalizePhone(profile.phone) };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
    setSavedProfile(nextProfile);
    setProfile(nextProfile);
    setMode("profile");
    setMessage("مشخصات اولیه روی همین دستگاه ذخیره شد.");
  }

  function submitLogin(event: FormEvent) {
    event.preventDefault();
    const phone = normalizePhone(profile.phone);
    if (savedProfile && normalizePhone(savedProfile.phone) === phone) {
      setProfile(savedProfile);
      setMode("profile");
      setMessage("وارد پنل کاربری شدی.");
      return;
    }

    setMessage("برای این شماره پروفایلی روی این دستگاه پیدا نشد. ابتدا عضویت را ثبت کن.");
  }

  function clearProfile() {
    window.localStorage.removeItem(STORAGE_KEY);
    setSavedProfile(null);
    setProfile(emptyProfile);
    setMode("login");
    setMessage("از حساب کاربری خارج شدی.");
  }

  return (
    <main id="main-content" className="sb-account-page">
      <section className="sb-account-hero">
        <div className="sb-shell sb-account-hero__grid">
          <div>
            <span className="sb-eyebrow">CUSTOMER ACCOUNT</span>
            <h1>ورود و پروفایل مشتریان سپید بیوتی</h1>
            <p>
              این نسخه، پروفایل اولیه مشتری را برای پیگیری سریع استعلام‌ها آماده
              می‌کند. سفارش، پرداخت و سوابق خرید رسمی هنوز باید از مسیر پشتیبانی
              تأیید شود.
            </p>
          </div>
          <div className="sb-account-status">
            <strong>{savedProfile ? savedProfile.fullName : "پروفایل ثبت نشده"}</strong>
            <span>{savedProfile ? savedProfile.phone : "ثبت سریع با موبایل"}</span>
          </div>
        </div>
      </section>

      <section className="sb-section">
        <div className="sb-shell sb-account-layout">
          <aside className="sb-account-side">
            <button
              type="button"
              className={mode === "login" ? "is-active" : ""}
              onClick={() => setMode("login")}
            >
              ورود
            </button>
            <button
              type="button"
              className={mode === "register" ? "is-active" : ""}
              onClick={() => setMode("register")}
            >
              ثبت‌نام
            </button>
            <button
              type="button"
              className={mode === "profile" ? "is-active" : ""}
              onClick={() => setMode("profile")}
            >
              مشخصات کاربر
            </button>
          </aside>

          <div className="sb-account-panel">
            {message && <p className="sb-account-message">{message}</p>}

            {mode === "login" && (
              <form className="sb-account-form" onSubmit={submitLogin}>
                <div>
                  <span className="sb-eyebrow">LOGIN</span>
                  <h2>ورود با شماره موبایل</h2>
                  <p>در این نسخه، ورود فقط پروفایل ذخیره‌شده روی همین دستگاه را باز می‌کند.</p>
                </div>
                <label>
                  <span>شماره موبایل</span>
                  <input
                    dir="ltr"
                    inputMode="tel"
                    value={profile.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    placeholder="09xxxxxxxxx"
                  />
                </label>
                <button type="submit" className="sb-btn sb-btn--dark">ورود</button>
                <button type="button" className="sb-account-inline" onClick={() => setMode("register")}>
                  هنوز ثبت‌نام نکرده‌ام
                </button>
              </form>
            )}

            {mode === "register" && (
              <form className="sb-account-form" onSubmit={submitRegister}>
                <div>
                  <span className="sb-eyebrow">REGISTER</span>
                  <h2>ثبت مشخصات اولیه</h2>
                  <p>این اطلاعات برای سریع‌تر شدن استعلام و ارتباط با پشتیبانی استفاده می‌شود.</p>
                </div>
                <div className="sb-account-form__grid">
                  <label>
                    <span>نام و نام خانوادگی</span>
                    <input value={profile.fullName} onChange={(event) => update("fullName", event.target.value)} />
                  </label>
                  <label>
                    <span>شماره موبایل</span>
                    <input
                      dir="ltr"
                      inputMode="tel"
                      value={profile.phone}
                      onChange={(event) => update("phone", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>کلینیک یا مرکز</span>
                    <input value={profile.clinicName} onChange={(event) => update("clinicName", event.target.value)} />
                  </label>
                  <label>
                    <span>شهر</span>
                    <input value={profile.city} onChange={(event) => update("city", event.target.value)} />
                  </label>
                  <label>
                    <span>نوع کاربر</span>
                    <select value={profile.role} onChange={(event) => update("role", event.target.value)}>
                      <option value="clinic">کلینیک / مرکز زیبایی</option>
                      <option value="doctor">پزشک یا فرد واجد صلاحیت</option>
                      <option value="buyer">مسئول خرید</option>
                    </select>
                  </label>
                </div>
                <button type="submit" className="sb-btn sb-btn--dark">ثبت مشخصات</button>
              </form>
            )}

            {mode === "profile" && (
              <div className="sb-account-profile">
                <div>
                  <span className="sb-eyebrow">PROFILE</span>
                  <h2>مشخصات کاربر</h2>
                  <p>برای ویرایش مشخصات، فرم ثبت‌نام را دوباره ذخیره کن.</p>
                </div>
                <dl>
                  <div>
                    <dt>نام</dt>
                    <dd>{savedProfile?.fullName || "ثبت نشده"}</dd>
                  </div>
                  <div>
                    <dt>موبایل</dt>
                    <dd dir="ltr">{savedProfile?.phone || "ثبت نشده"}</dd>
                  </div>
                  <div>
                    <dt>کلینیک / مرکز</dt>
                    <dd>{savedProfile?.clinicName || "ثبت نشده"}</dd>
                  </div>
                  <div>
                    <dt>شهر</dt>
                    <dd>{savedProfile?.city || "ثبت نشده"}</dd>
                  </div>
                </dl>
                <div className="sb-account-actions">
                  <a className="sb-btn sb-btn--dark" href={supportLink}>
                    ارسال مشخصات برای پشتیبانی
                  </a>
                  <button type="button" className="sb-btn sb-btn--ghost" onClick={() => setMode("register")}>
                    ویرایش مشخصات
                  </button>
                  {savedProfile && (
                    <button type="button" className="sb-account-inline" onClick={clearProfile}>
                      خروج از حساب
                    </button>
                  )}
                </div>
              </div>
            )}

            <p className="sb-account-note">
              برای پنل واقعی شامل رمز عبور، سفارش‌ها، پرداخت و تاریخچه خرید، مرحله بعد باید
              دیتابیس و احراز هویت امن اضافه شود. <Link href="/contact">تماس با پشتیبانی</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
