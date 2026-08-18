"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { whatsappHref } from "../data";
import type { CustomerUser } from "../lib/customer-auth";

type AccountMode = "login" | "register" | "profile" | "forgot";

type CustomerProfile = {
  email: string;
  fullName: string;
  phone: string;
  clinicName: string;
  city: string;
  accountType: string;
};

const emptyProfile: CustomerProfile = {
  email: "",
  fullName: "",
  phone: "",
  clinicName: "",
  city: "",
  accountType: "customer",
};

function profileFromUser(user: CustomerUser): CustomerProfile {
  return {
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    clinicName: user.clinicName,
    city: user.city,
    accountType: user.accountType || "customer",
  };
}

export function CustomerAccount({
  initialMode = "login",
  initialUser = null,
}: {
  initialMode?: AccountMode;
  initialUser?: CustomerUser | null;
}) {
  const [mode, setMode] = useState<AccountMode>(initialUser ? "profile" : initialMode);
  const [user, setUser] = useState<CustomerUser | null>(initialUser);
  const [profile, setProfile] = useState<CustomerProfile>(
    initialUser ? profileFromUser(initialUser) : emptyProfile,
  );
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (initialUser) return;

    const controller = new AbortController();
    void fetch("/api/account/auth/session", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { user?: CustomerUser };
      })
      .then((result) => {
        if (!result?.user) return;
        setUser(result.user);
        setProfile(profileFromUser(result.user));
        if (initialMode !== "register") setMode("profile");
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [initialMode, initialUser]);

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

  async function submitLogin(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    try {
      const result = await accountRequest<{ user: CustomerUser }>("login", {
        identifier,
        password,
      });
      setUser(result.user);
      setProfile(profileFromUser(result.user));
      setPassword("");
      setMode("profile");
      setMessage("ورود با موفقیت انجام شد.");

      const returnTo = safeReturnTo(new URLSearchParams(window.location.search).get("return_to"));
      if (returnTo !== "/account/profile") window.location.assign(returnTo);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  async function submitRegister(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    try {
      const result = await accountRequest<{ user: CustomerUser }>("register", {
        email: profile.email,
        phone: profile.phone,
        fullName: profile.fullName,
        password,
        city: profile.city,
        clinicName: profile.clinicName,
        accountType: profile.accountType,
      });
      setUser(result.user);
      setProfile(profileFromUser(result.user));
      setPassword("");
      setMode("profile");
      setMessage("حساب امن شما ساخته شد و وارد حساب شدید.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  async function submitProfile(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    try {
      const result = await accountRequest<{ user: CustomerUser }>("profile", {
        fullName: profile.fullName,
        phone: profile.phone,
        city: profile.city,
        clinicName: profile.clinicName,
        accountType: profile.accountType,
      }, "PATCH");
      setUser(result.user);
      setProfile(profileFromUser(result.user));
      setMessage("تغییرات حساب ذخیره شد.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  async function submitForgot(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    try {
      const result = await accountRequest<{ message?: string }>("password-request", {
        identifier,
      });
      setMessage(result.message || "اگر حسابی با این مشخصات وجود داشته باشد، لینک بازیابی ارسال می‌شود.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    setPending(true);
    setMessage("");
    try {
      await accountRequest<{ ok: boolean }>("logout", {});
      setUser(null);
      setProfile(emptyProfile);
      setIdentifier("");
      setPassword("");
      setMode("login");
      setMessage("از حساب کاربری خارج شدید.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <main id="main-content" className="sb-account-page">
      <section className="sb-account-hero">
        <div className="sb-shell sb-account-hero__grid">
          <div>
            <span className="sb-eyebrow">SECURE CUSTOMER ACCOUNT</span>
            <h1>حساب کاربری سپید بیوتی</h1>
            <p>
              ورود امن برای نگهداری مشخصات خرید و اتصال یکپارچه به حساب مشتری در
              WooCommerce؛ نشست ورود فقط در کوکی امن مرورگر نگهداری می‌شود.
            </p>
          </div>
          <div className="sb-account-status">
            <strong>{user ? user.fullName || user.email : "وارد حساب نشده‌اید"}</strong>
            <span>{user ? user.phone || user.email : "ورود با موبایل یا ایمیل"}</span>
          </div>
        </div>
      </section>

      <section className="sb-section">
        <div className="sb-shell sb-account-layout">
          <aside className="sb-account-side" aria-label="حساب کاربری">
            <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => setMode("login")}>
              ورود
            </button>
            <button type="button" className={mode === "register" ? "is-active" : ""} onClick={() => setMode("register")}>
              ثبت‌نام
            </button>
            <button
              type="button"
              className={mode === "profile" ? "is-active" : ""}
              onClick={() => setMode(user ? "profile" : "login")}
            >
              مشخصات کاربر
            </button>
          </aside>

          <div className="sb-account-panel" aria-busy={pending}>
            {message && <p className="sb-account-message" role="status">{message}</p>}

            {mode === "login" && (
              <form className="sb-account-form" onSubmit={submitLogin}>
                <div>
                  <span className="sb-eyebrow">LOGIN</span>
                  <h2>ورود امن</h2>
                  <p>شماره موبایل یا ایمیل حساب و رمز عبور را وارد کنید.</p>
                </div>
                <label>
                  <span>موبایل یا ایمیل</span>
                  <input
                    dir="ltr"
                    autoComplete="username"
                    inputMode="email"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="09xxxxxxxxx یا email@example.com"
                    required
                  />
                </label>
                <label>
                  <span>رمز عبور</span>
                  <input
                    dir="ltr"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>
                <button type="submit" className="sb-btn sb-btn--dark" disabled={pending}>
                  {pending ? "در حال بررسی..." : "ورود"}
                </button>
                <button type="button" className="sb-account-inline" onClick={() => setMode("forgot")}>
                  رمز عبور را فراموش کرده‌ام
                </button>
                <button type="button" className="sb-account-inline" onClick={() => setMode("register")}>
                  هنوز حساب ندارم
                </button>
              </form>
            )}

            {mode === "forgot" && (
              <form className="sb-account-form" onSubmit={submitForgot}>
                <div>
                  <span className="sb-eyebrow">RECOVERY</span>
                  <h2>بازیابی رمز عبور</h2>
                  <p>موبایل یا ایمیل حساب را وارد کنید. پاسخ، وجود یا عدم وجود حساب را افشا نمی‌کند.</p>
                </div>
                <label>
                  <span>موبایل یا ایمیل</span>
                  <input
                    dir="ltr"
                    autoComplete="username"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    required
                  />
                </label>
                <button type="submit" className="sb-btn sb-btn--dark" disabled={pending}>
                  {pending ? "در حال ارسال..." : "ارسال لینک بازیابی"}
                </button>
                <button type="button" className="sb-account-inline" onClick={() => setMode("login")}>
                  بازگشت به ورود
                </button>
              </form>
            )}

            {mode === "register" && (
              <form className="sb-account-form" onSubmit={submitRegister}>
                <div>
                  <span className="sb-eyebrow">REGISTER</span>
                  <h2>ساخت حساب</h2>
                  <p>حساب شما مستقیماً به هویت مشتری در WooCommerce متصل می‌شود.</p>
                </div>
                <div className="sb-account-form__grid">
                  <label>
                    <span>نام و نام خانوادگی</span>
                    <input autoComplete="name" value={profile.fullName} onChange={(event) => update("fullName", event.target.value)} required />
                  </label>
                  <label>
                    <span>شماره موبایل</span>
                    <input dir="ltr" inputMode="tel" autoComplete="tel" value={profile.phone} onChange={(event) => update("phone", event.target.value)} placeholder="09xxxxxxxxx" required />
                  </label>
                  <label>
                    <span>ایمیل</span>
                    <input dir="ltr" type="email" inputMode="email" autoComplete="email" value={profile.email} onChange={(event) => update("email", event.target.value)} required />
                  </label>
                  <label>
                    <span>رمز عبور</span>
                    <input dir="ltr" type="password" minLength={10} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                  </label>
                  <label>
                    <span>کلینیک یا مرکز</span>
                    <input autoComplete="organization" value={profile.clinicName} onChange={(event) => update("clinicName", event.target.value)} />
                  </label>
                  <label>
                    <span>شهر</span>
                    <input autoComplete="address-level2" value={profile.city} onChange={(event) => update("city", event.target.value)} />
                  </label>
                  <label>
                    <span>نوع کاربر</span>
                    <select value={profile.accountType} onChange={(event) => update("accountType", event.target.value)}>
                      <option value="customer">خریدار</option>
                      <option value="clinic">کلینیک / مرکز زیبایی</option>
                      <option value="doctor">پزشک یا فرد واجد صلاحیت</option>
                      <option value="buyer">مسئول خرید</option>
                    </select>
                  </label>
                </div>
                <p className="sb-account-note">رمز باید حداقل ۱۰ کاراکتر و ترکیبی از حداقل سه گروهِ حروف کوچک، حروف بزرگ، عدد یا نشانه باشد.</p>
                <button type="submit" className="sb-btn sb-btn--dark" disabled={pending}>
                  {pending ? "در حال ساخت حساب..." : "ساخت حساب امن"}
                </button>
              </form>
            )}

            {mode === "profile" && user && (
              <form className="sb-account-form" onSubmit={submitProfile}>
                <div>
                  <span className="sb-eyebrow">PROFILE</span>
                  <h2>مشخصات حساب</h2>
                  <p>ایمیل هویت اصلی حساب است؛ سایر اطلاعات را می‌توانید اینجا ویرایش کنید.</p>
                </div>
                <div className="sb-account-form__grid">
                  <label>
                    <span>نام و نام خانوادگی</span>
                    <input autoComplete="name" value={profile.fullName} onChange={(event) => update("fullName", event.target.value)} required />
                  </label>
                  <label>
                    <span>شماره موبایل</span>
                    <input dir="ltr" inputMode="tel" autoComplete="tel" value={profile.phone} onChange={(event) => update("phone", event.target.value)} required />
                  </label>
                  <label>
                    <span>ایمیل</span>
                    <input dir="ltr" value={profile.email} readOnly aria-readonly="true" />
                  </label>
                  <label>
                    <span>کلینیک یا مرکز</span>
                    <input autoComplete="organization" value={profile.clinicName} onChange={(event) => update("clinicName", event.target.value)} />
                  </label>
                  <label>
                    <span>شهر</span>
                    <input autoComplete="address-level2" value={profile.city} onChange={(event) => update("city", event.target.value)} />
                  </label>
                  <label>
                    <span>نوع کاربر</span>
                    <select value={profile.accountType} onChange={(event) => update("accountType", event.target.value)}>
                      <option value="customer">خریدار</option>
                      <option value="clinic">کلینیک / مرکز زیبایی</option>
                      <option value="doctor">پزشک یا فرد واجد صلاحیت</option>
                      <option value="buyer">مسئول خرید</option>
                    </select>
                  </label>
                </div>
                <div className="sb-account-actions">
                  <button type="submit" className="sb-btn sb-btn--dark" disabled={pending}>
                    {pending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  </button>
                  <a className="sb-btn sb-btn--ghost" href={supportLink}>ارتباط با پشتیبانی</a>
                  <button type="button" className="sb-account-inline" onClick={logout} disabled={pending}>
                    خروج از حساب
                  </button>
                </div>
              </form>
            )}

            {mode === "profile" && !user && (
              <div className="sb-account-profile">
                <h2>برای دیدن حساب وارد شوید</h2>
                <p>این بخش فقط بعد از احراز هویت در دسترس است.</p>
                <button type="button" className="sb-btn sb-btn--dark" onClick={() => setMode("login")}>ورود به حساب</button>
              </div>
            )}

            <p className="sb-account-note">
              اطلاعات ورود در مرورگر به‌صورت پروفایل محلی ذخیره نمی‌شود. برای مسائل حساب می‌توانید از <Link href="/contact">پشتیبانی سپید بیوتی</Link> کمک بگیرید.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

async function accountRequest<T>(action: string, body: Record<string, unknown>, method: "POST" | "PATCH" = "POST"): Promise<T> {
  const response = await fetch(`/api/account/auth/${action}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new Error(result.error || "عملیات حساب کاربری انجام نشد.");
  return result;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "عملیات حساب کاربری انجام نشد.";
}

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/api/")) {
    return "/account/profile";
  }
  return value;
}
