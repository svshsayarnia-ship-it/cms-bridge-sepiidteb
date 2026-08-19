"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { whatsappHref } from "../data";
import {
  hasPersianKeyboardInput,
  iranMobileValidationMessage,
  isValidIranMobile,
  normalizeIranMobileInput,
  passwordPolicyState,
  toAsciiDigits,
} from "../lib/account-input";
import type { CustomerUser } from "../lib/customer-auth";

type AccountMode = "login" | "register" | "profile" | "forgot";
type OtpPurpose = "login" | "register";

type CustomerProfile = {
  email: string;
  fullName: string;
  phone: string;
  clinicName: string;
  city: string;
  accountType: string;
};

type OtpRequestResult = {
  challenge?: string;
  expiresIn?: number;
  message?: string;
};

type OtpVerifyResult = {
  user?: CustomerUser;
  phoneProof?: string;
  expiresIn?: number;
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [loginChallenge, setLoginChallenge] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [registerChallenge, setRegisterChallenge] = useState("");
  const [registerCode, setRegisterCode] = useState("");
  const [phoneProof, setPhoneProof] = useState("");

  const passwordPolicy = passwordPolicyState(password);
  const passwordHasPersianInput = hasPersianKeyboardInput(password);
  const confirmPasswordHasPersianInput = hasPersianKeyboardInput(confirmPassword);
  const emailHasPersianInput = hasPersianKeyboardInput(profile.email);
  const loginPhoneValid = isValidIranMobile(identifier);
  const registerPhoneValid = isValidIranMobile(profile.phone);
  const loginPhoneError = iranMobileValidationMessage(identifier);
  const registerPhoneError = iranMobileValidationMessage(profile.phone);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

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
    const nextValue = field === "phone" ? normalizeIranMobileInput(value) : value;
    setProfile((current) => ({ ...current, [field]: nextValue }));
    if (field === "phone") {
      setRegisterChallenge("");
      setRegisterCode("");
      setPhoneProof("");
    }
    setMessage("");
  }

  function updateLoginPhone(value: string) {
    setIdentifier(normalizeIranMobileInput(value));
    setLoginChallenge("");
    setLoginCode("");
    setMessage("");
  }

  async function requestOtp(purpose: OtpPurpose) {
    const phone = purpose === "login" ? identifier : profile.phone;
    const valid = purpose === "login" ? loginPhoneValid : registerPhoneValid;
    if (!valid) {
      setMessage("شماره موبایل باید دقیقاً ۱۱ رقم و با 09 شروع شود.");
      return;
    }

    setPending(true);
    setMessage("");
    try {
      const result = await accountRequest<OtpRequestResult>("otp-request", {
        phone,
        purpose,
      });
      if (!result.challenge) throw new Error("درخواست کد کامل نشد. دوباره تلاش کن.");
      if (purpose === "login") {
        setLoginChallenge(result.challenge);
        setLoginCode("");
      } else {
        setRegisterChallenge(result.challenge);
        setRegisterCode("");
        setPhoneProof("");
      }
      setMessage(result.message || "کد یک‌بارمصرف پیامک شد.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  async function verifyLoginOtp(event: FormEvent) {
    event.preventDefault();
    if (!loginPhoneValid) {
      setMessage("شماره موبایل باید دقیقاً ۱۱ رقم و با 09 شروع شود.");
      return;
    }

    setPending(true);
    setMessage("");
    try {
      const result = await accountRequest<OtpVerifyResult>("otp-verify", {
        challenge: loginChallenge,
        code: loginCode,
        purpose: "login",
      });
      if (!result.user) throw new Error("ورود تکمیل نشد. دوباره کد بگیر.");
      setUser(result.user);
      setProfile(profileFromUser(result.user));
      setLoginCode("");
      setLoginChallenge("");
      setMode("profile");
      setMessage("ورود با کد پیامکی با موفقیت انجام شد.");

      const returnTo = safeReturnTo(new URLSearchParams(window.location.search).get("return_to"));
      if (returnTo !== "/account/profile") window.location.assign(returnTo);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  async function verifyRegisterOtp() {
    if (!registerPhoneValid) {
      setMessage("شماره موبایل باید دقیقاً ۱۱ رقم و با 09 شروع شود.");
      return;
    }

    setPending(true);
    setMessage("");
    try {
      const result = await accountRequest<OtpVerifyResult>("otp-verify", {
        challenge: registerChallenge,
        code: registerCode,
        purpose: "register",
      });
      if (!result.phoneProof) throw new Error("تأیید شماره تکمیل نشد. دوباره کد بگیر.");
      setPhoneProof(result.phoneProof);
      setRegisterCode("");
      setMessage("شماره موبایل تأیید شد. حالا می‌توانی عضویت را کامل کنی.");
    } catch (error) {
      setPhoneProof("");
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  async function submitRegister(event: FormEvent) {
    event.preventDefault();
    if (!registerPhoneValid) {
      setMessage("شماره موبایل باید دقیقاً ۱۱ رقم و با 09 شروع شود.");
      return;
    }
    if (!phoneProof) {
      setMessage("قبل از ساخت حساب، شماره موبایل را با کد پیامکی تأیید کن.");
      return;
    }
    if (emailHasPersianInput) {
      setMessage("به نظر می‌رسد کیبورد روی فارسی است. ایمیل را با کیبورد English وارد کن.");
      return;
    }
    if (passwordHasPersianInput || confirmPasswordHasPersianInput) {
      setMessage("به نظر می‌رسد کیبورد روی فارسی است. برای رمز عبور کیبورد را روی English بگذار.");
      return;
    }
    if (!passwordPolicy.valid) {
      setMessage("رمز باید حداقل ۱۰ کاراکتر، شامل حرف انگلیسی و عدد انگلیسی و حداقل سه گروه کاراکتری باشد.");
      return;
    }
    if (!passwordsMatch) {
      setMessage("تکرار رمز عبور با رمز انتخاب‌شده یکسان نیست.");
      return;
    }

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
        phoneProof,
      });
      setUser(result.user);
      setProfile(profileFromUser(result.user));
      setPassword("");
      setConfirmPassword("");
      setPhoneProof("");
      setRegisterChallenge("");
      setMode("profile");
      setMessage("حساب ساخته شد و شماره موبایل به‌صورت یکتا به همین حساب متصل شد.");
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
      const result = await accountRequest<{ user: CustomerUser }>(
        "profile",
        {
          fullName: profile.fullName,
          phone: profile.phone,
          city: profile.city,
          clinicName: profile.clinicName,
          accountType: profile.accountType,
        },
        "PATCH",
      );
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
      const result = await accountRequest<{ message?: string }>("password-request", { identifier });
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
      setConfirmPassword("");
      setLoginChallenge("");
      setRegisterChallenge("");
      setPhoneProof("");
      setMode("login");
      setMessage("از حساب کاربری خارج شدی.");
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
              ورود با کد یک‌بارمصرف پیامکی انجام می‌شود و هر شماره موبایل فقط می‌تواند
              به یک حساب مشتری متصل باشد.
            </p>
          </div>
          <div className="sb-account-status">
            <strong>{user ? user.fullName || user.email : "وارد حساب نشده‌ای"}</strong>
            <span>{user ? user.phone || user.email : "ورود امن با SMS"}</span>
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
            <button type="button" className={mode === "profile" ? "is-active" : ""} onClick={() => setMode(user ? "profile" : "login")}>
              مشخصات کاربر
            </button>
          </aside>

          <div className="sb-account-panel" aria-busy={pending}>
            {message && <p className="sb-account-message" role="status">{message}</p>}

            {mode === "login" && (
              <form className="sb-account-form" onSubmit={verifyLoginOtp}>
                <div>
                  <span className="sb-eyebrow">SMS LOGIN</span>
                  <h2>ورود با کد پیامکی</h2>
                  <p>شماره موبایل حساب را وارد کن؛ ورود فقط با رمز یک‌بارمصرف انجام می‌شود.</p>
                </div>
                <label>
                  <span>شماره موبایل</span>
                  <input
                    dir="ltr"
                    type="tel"
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={11}
                    minLength={11}
                    pattern="09[0-9]{9}"
                    value={identifier}
                    onChange={(event) => updateLoginPhone(event.target.value)}
                    placeholder="09xxxxxxxxx"
                    aria-invalid={identifier.length > 0 && !loginPhoneValid}
                    aria-describedby="login-phone-help"
                    required
                  />
                  <small
                    id="login-phone-help"
                    className={loginPhoneError ? "sb-account-field-error" : "sb-account-field-help"}
                    role={loginPhoneError ? "alert" : undefined}
                  >
                    {loginPhoneError || "شماره باید ۱۱ رقم و با 09 شروع شود."}
                  </small>
                </label>
                {!loginChallenge ? (
                  <button
                    type="button"
                    className="sb-btn sb-btn--dark"
                    disabled={pending || !loginPhoneValid}
                    onClick={() => void requestOtp("login")}
                  >
                    {pending ? "در حال ارسال..." : "دریافت رمز پیامکی"}
                  </button>
                ) : (
                  <>
                    <label>
                      <span>رمز یک‌بارمصرف ۶ رقمی</span>
                      <input
                        dir="ltr"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={loginCode}
                        onChange={(event) => setLoginCode(toAsciiDigits(event.target.value).replace(/\D/g, "").slice(0, 6))}
                        placeholder="------"
                        required
                      />
                    </label>
                    <button type="submit" className="sb-btn sb-btn--dark" disabled={pending || loginCode.length !== 6 || !loginPhoneValid}>
                      {pending ? "در حال تأیید..." : "تأیید کد و ورود"}
                    </button>
                    <button type="button" className="sb-account-inline" disabled={pending} onClick={() => void requestOtp("login")}>
                      ارسال دوباره کد
                    </button>
                  </>
                )}
                <button type="button" className="sb-account-inline" onClick={() => setMode("register")}>
                  هنوز حساب ندارم
                </button>
              </form>
            )}

            {mode === "forgot" && (
              <form className="sb-account-form" onSubmit={submitForgot}>
                <div>
                  <span className="sb-eyebrow">RECOVERY</span>
                  <h2>بازیابی رمز حساب</h2>
                  <p>برای مدیریت رمز WooCommerce، موبایل یا ایمیل حساب را وارد کن.</p>
                </div>
                <label>
                  <span>موبایل یا ایمیل</span>
                  <input dir="ltr" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
                </label>
                <button type="submit" className="sb-btn sb-btn--dark" disabled={pending}>
                  {pending ? "در حال ارسال..." : "ارسال لینک بازیابی"}
                </button>
                <button type="button" className="sb-account-inline" onClick={() => setMode("login")}>بازگشت به ورود پیامکی</button>
              </form>
            )}

            {mode === "register" && (
              <form className="sb-account-form" onSubmit={submitRegister}>
                <div>
                  <span className="sb-eyebrow">VERIFIED REGISTER</span>
                  <h2>ساخت حساب با شماره یکتا</h2>
                  <p>هر شماره فقط یک عضویت دارد و قبل از ساخت حساب باید همان شماره با SMS تأیید شود.</p>
                </div>
                <div className="sb-account-form__grid">
                  <label>
                    <span>نام و نام خانوادگی</span>
                    <input autoComplete="name" value={profile.fullName} onChange={(event) => update("fullName", event.target.value)} required />
                  </label>
                  <label>
                    <span>شماره موبایل</span>
                    <input
                      dir="ltr"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={11}
                      minLength={11}
                      pattern="09[0-9]{9}"
                      value={profile.phone}
                      onChange={(event) => update("phone", event.target.value)}
                      placeholder="09xxxxxxxxx"
                      aria-invalid={profile.phone.length > 0 && !registerPhoneValid}
                      aria-describedby="register-phone-help"
                      required
                    />
                    <small
                      id="register-phone-help"
                      className={registerPhoneError ? "sb-account-field-error" : "sb-account-field-help"}
                      role={registerPhoneError ? "alert" : undefined}
                    >
                      {registerPhoneError || "شماره باید ۱۱ رقم و با 09 شروع شود."}
                    </small>
                  </label>
                  <label>
                    <span>ایمیل</span>
                    <input dir="ltr" type="email" inputMode="email" autoComplete="email" value={profile.email} onChange={(event) => update("email", event.target.value)} required />
                    {emailHasPersianInput && <small className="sb-account-field-error" role="alert">کیبورد روی فارسی است؛ ایمیل را با کیبورد English وارد کن.</small>}
                  </label>
                  <label>
                    <span>رمز حساب</span>
                    <input
                      dir="ltr"
                      type="password"
                      minLength={10}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setMessage("");
                      }}
                      aria-invalid={password.length > 0 && (!passwordPolicy.valid || passwordHasPersianInput)}
                      required
                    />
                    {passwordHasPersianInput && <small className="sb-account-field-error" role="alert">کیبورد روی فارسی است؛ برای رمز کیبورد را روی English بگذار.</small>}
                  </label>
                  <label>
                    <span>تکرار رمز عبور</span>
                    <input
                      dir="ltr"
                      type="password"
                      minLength={10}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setMessage("");
                      }}
                      aria-invalid={confirmPassword.length > 0 && (!passwordsMatch || confirmPasswordHasPersianInput)}
                      required
                    />
                    {confirmPassword.length > 0 && !passwordsMatch && (
                      <small className="sb-account-field-error" role="alert">تکرار رمز عبور با رمز انتخاب‌شده یکسان نیست.</small>
                    )}
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

                {!phoneProof && !registerChallenge && (
                  <button
                    type="button"
                    className="sb-btn sb-btn--ghost"
                    disabled={pending || !registerPhoneValid}
                    onClick={() => void requestOtp("register")}
                  >
                    {pending ? "در حال ارسال..." : "ارسال کد تأیید موبایل"}
                  </button>
                )}

                {!phoneProof && registerChallenge && (
                  <div className="sb-account-form__grid">
                    <label>
                      <span>کد تأیید ۶ رقمی</span>
                      <input
                        dir="ltr"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={registerCode}
                        onChange={(event) => setRegisterCode(toAsciiDigits(event.target.value).replace(/\D/g, "").slice(0, 6))}
                        required
                      />
                    </label>
                    <div className="sb-account-actions">
                      <button type="button" className="sb-btn sb-btn--ghost" disabled={pending || registerCode.length !== 6 || !registerPhoneValid} onClick={() => void verifyRegisterOtp()}>
                        {pending ? "در حال تأیید..." : "تأیید شماره موبایل"}
                      </button>
                      <button type="button" className="sb-account-inline" disabled={pending || !registerPhoneValid} onClick={() => void requestOtp("register")}>
                        ارسال دوباره کد
                      </button>
                    </div>
                  </div>
                )}

                {phoneProof && <p className="sb-account-message" role="status">شماره موبایل تأیید شده است.</p>}
                <p className="sb-account-note">
                  رمز حداقل ۱۰ کاراکتر باشد، حتماً یک حرف انگلیسی و یک عدد انگلیسی داشته باشد و از حداقل سه گروهِ حروف کوچک، حروف بزرگ، عدد یا نشانه تشکیل شود.
                </p>
                {password && !passwordHasPersianInput && (
                  <p className="sb-account-note" aria-live="polite">
                    {passwordPolicy.valid ? "✓ شرایط رمز عبور کامل است." : "شرایط رمز عبور هنوز کامل نشده است."}
                  </p>
                )}
                <button
                  type="submit"
                  className="sb-btn sb-btn--dark"
                  disabled={
                    pending ||
                    !phoneProof ||
                    !registerPhoneValid ||
                    !passwordPolicy.valid ||
                    !passwordsMatch ||
                    passwordHasPersianInput ||
                    confirmPasswordHasPersianInput ||
                    emailHasPersianInput
                  }
                >
                  {pending ? "در حال ساخت حساب..." : "ساخت حساب"}
                </button>
                <button type="button" className="sb-account-inline" onClick={() => setMode("forgot")}>بازیابی رمز حساب</button>
              </form>
            )}

            {mode === "profile" && user && (
              <form className="sb-account-form" onSubmit={submitProfile}>
                <div>
                  <span className="sb-eyebrow">PROFILE</span>
                  <h2>مشخصات حساب</h2>
                  <p>شماره موبایل هویت ورود حساب است و تغییر آن نیاز به تأیید پیامکی دوباره دارد.</p>
                </div>
                <div className="sb-account-form__grid">
                  <label>
                    <span>نام و نام خانوادگی</span>
                    <input autoComplete="name" value={profile.fullName} onChange={(event) => update("fullName", event.target.value)} required />
                  </label>
                  <label>
                    <span>شماره موبایل</span>
                    <input dir="ltr" inputMode="tel" autoComplete="tel" value={profile.phone} readOnly aria-readonly="true" />
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
                  <button type="submit" className="sb-btn sb-btn--dark" disabled={pending}>{pending ? "در حال ذخیره..." : "ذخیره تغییرات"}</button>
                  <a className="sb-btn sb-btn--ghost" href={supportLink}>ارتباط با پشتیبانی</a>
                  <button type="button" className="sb-account-inline" onClick={logout} disabled={pending}>خروج از حساب</button>
                </div>
              </form>
            )}

            {mode === "profile" && !user && (
              <div className="sb-account-profile">
                <h2>برای دیدن حساب وارد شو</h2>
                <p>این بخش فقط بعد از تأیید کد پیامکی در دسترس است.</p>
                <button type="button" className="sb-btn sb-btn--dark" onClick={() => setMode("login")}>ورود با SMS</button>
              </div>
            )}

            <p className="sb-account-note">
              رمز یک‌بارمصرف زمان‌دار است و تعداد درخواست و تلاش برای کد محدود می‌شود. برای مسائل حساب از <Link href="/contact">پشتیبانی سپید بیوتی</Link> کمک بگیر.
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
