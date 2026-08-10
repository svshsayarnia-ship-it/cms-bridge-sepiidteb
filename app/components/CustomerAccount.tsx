"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { whatsappHref } from "../data";

type AccountMode = "login" | "register" | "profile" | "edit";
type CustomerType = "clinic" | "doctor" | "buyer" | "customer";

type CustomerProfile = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  clinicName: string;
  city: string;
  customerType: CustomerType;
  dateCreated: string | null;
};

type RegistrationForm = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  clinicName: string;
  city: string;
  customerType: CustomerType;
};

type LoginForm = {
  identifier: string;
  password: string;
};

const emptyRegistration: RegistrationForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  clinicName: "",
  city: "",
  customerType: "clinic",
};

const emptyLogin: LoginForm = {
  identifier: "",
  password: "",
};

const customerTypeLabels: Record<CustomerType, string> = {
  clinic: "کلینیک / مرکز زیبایی",
  doctor: "پزشک یا فرد واجد صلاحیت",
  buyer: "مسئول خرید",
  customer: "خریدار / سایر",
};

function profileToRegistration(profile: CustomerProfile): RegistrationForm {
  return {
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    password: "",
    clinicName: profile.clinicName,
    city: profile.city,
    customerType: profile.customerType,
  };
}

async function readResponse(response: Response) {
  const data = (await response.json().catch(() => null)) as
    | { profile?: CustomerProfile; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.error || "ارتباط با حساب کاربری انجام نشد.");
  }

  return data;
}

export function CustomerAccount({ initialMode = "login" }: { initialMode?: AccountMode }) {
  const [mode, setMode] = useState<AccountMode>(initialMode);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [login, setLogin] = useState<LoginForm>(emptyLogin);
  const [registration, setRegistration] =
    useState<RegistrationForm>(emptyRegistration);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/account/profile", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401) {
          if (active) setMode(initialMode === "profile" ? "login" : initialMode);
          return;
        }

        const data = await readResponse(response);
        if (!active || !data?.profile) return;

        setProfile(data.profile);
        setRegistration(profileToRegistration(data.profile));
        setMode("profile");
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "اتصال به حساب کاربری انجام نشد.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [initialMode]);

  const supportLink = useMemo(() => {
    const current = profile ?? {
      fullName: registration.fullName,
      phone: registration.phone,
      clinicName: registration.clinicName,
      city: registration.city,
    };
    const text = [
      "سلام، برای حساب کاربری سپید بیوتی نیاز به بررسی دارم.",
      current.fullName && `نام: ${current.fullName}`,
      current.phone && `شماره: ${current.phone}`,
      current.clinicName && `کلینیک/مرکز: ${current.clinicName}`,
      current.city && `شهر: ${current.city}`,
    ]
      .filter(Boolean)
      .join("\n");
    return whatsappHref(text);
  }, [profile, registration]);

  function updateLogin(field: keyof LoginForm, value: string) {
    setLogin((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function updateRegistration(field: keyof RegistrationForm, value: string) {
    setRegistration((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  async function submitLogin(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/account/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(login),
      });
      const data = await readResponse(response);
      if (!data?.profile) throw new Error("پروفایل مشتری دریافت نشد.");

      setProfile(data.profile);
      setRegistration(profileToRegistration(data.profile));
      setLogin(emptyLogin);
      setMode("profile");
      setMessage("با موفقیت وارد حساب شدی.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "ورود به حساب انجام نشد.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitRegister(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/account/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(registration),
      });
      const data = await readResponse(response);
      if (!data?.profile) throw new Error("پروفایل مشتری دریافت نشد.");

      setProfile(data.profile);
      setRegistration(profileToRegistration(data.profile));
      setMode("profile");
      setMessage("حساب کاربری با موفقیت ساخته شد.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "ثبت‌نام انجام نشد.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitProfileUpdate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: registration.fullName,
          clinicName: registration.clinicName,
          city: registration.city,
          customerType: registration.customerType,
        }),
      });
      const data = await readResponse(response);
      if (!data?.profile) throw new Error("پروفایل مشتری دریافت نشد.");

      setProfile(data.profile);
      setRegistration(profileToRegistration(data.profile));
      setMode("profile");
      setMessage("تغییرات حساب ذخیره شد.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "ویرایش حساب انجام نشد.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/account/logout", { method: "POST" });
      await readResponse(response);
      setProfile(null);
      setRegistration(emptyRegistration);
      setLogin(emptyLogin);
      setMode("login");
      setMessage("از حساب کاربری خارج شدی.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "خروج از حساب انجام نشد.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main id="main-content" className="sb-account-page">
        <section className="sb-section">
          <div className="sb-shell sb-account-panel" aria-live="polite">
            <p className="sb-account-message">در حال بررسی حساب کاربری…</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main id="main-content" className="sb-account-page">
      <section className="sb-account-hero">
        <div className="sb-shell sb-account-hero__grid">
          <div>
            <span className="sb-eyebrow">CUSTOMER ACCOUNT</span>
            <h1>حساب مشتریان سپید بیوتی</h1>
            <p>
              مشخصات، استعلام‌ها و سوابق خریدت را با یک پروفایل واحد مدیریت کن.
            </p>
          </div>
          <div className="sb-account-status">
            <strong>{profile ? profile.fullName : "ورود امن مشتریان"}</strong>
            <span>{profile ? profile.phone : "متصل به حساب WooCommerce"}</span>
          </div>
        </div>
      </section>

      <section className="sb-section">
        <div className="sb-shell sb-account-layout">
          <aside className="sb-account-side" aria-label="بخش‌های حساب کاربری">
            {!profile && (
              <>
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
              </>
            )}
            {profile && (
              <>
                <button
                  type="button"
                  className={mode === "profile" ? "is-active" : ""}
                  onClick={() => setMode("profile")}
                >
                  مشخصات من
                </button>
                <button
                  type="button"
                  className={mode === "edit" ? "is-active" : ""}
                  onClick={() => setMode("edit")}
                >
                  ویرایش مشخصات
                </button>
              </>
            )}
          </aside>

          <div className="sb-account-panel">
            {message && (
              <p className="sb-account-message" role="status" aria-live="polite">
                {message}
              </p>
            )}

            {!profile && mode === "login" && (
              <form className="sb-account-form" onSubmit={submitLogin}>
                <div>
                  <span className="sb-eyebrow">LOGIN</span>
                  <h2>ورود به حساب</h2>
                  <p>با شماره موبایل یا ایمیل و رمز عبور وارد شو.</p>
                </div>
                <label>
                  <span>شماره موبایل یا ایمیل</span>
                  <input
                    dir="ltr"
                    autoComplete="username"
                    value={login.identifier}
                    onChange={(event) =>
                      updateLogin("identifier", event.target.value)
                    }
                    placeholder="09xxxxxxxxx"
                    required
                  />
                </label>
                <label>
                  <span>رمز عبور</span>
                  <input
                    dir="ltr"
                    type="password"
                    autoComplete="current-password"
                    value={login.password}
                    onChange={(event) =>
                      updateLogin("password", event.target.value)
                    }
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="sb-btn sb-btn--dark"
                  disabled={busy}
                >
                  {busy ? "در حال ورود…" : "ورود"}
                </button>
                <button
                  type="button"
                  className="sb-account-inline"
                  onClick={() => setMode("register")}
                  disabled={busy}
                >
                  هنوز حساب ندارم
                </button>
              </form>
            )}

            {!profile && mode === "register" && (
              <form className="sb-account-form" onSubmit={submitRegister}>
                <div>
                  <span className="sb-eyebrow">REGISTER</span>
                  <h2>ساخت حساب کاربری</h2>
                  <p>
                    اطلاعات اصلی را یک‌بار ثبت کن تا استعلام‌ها و سفارش‌های آینده
                    به همین حساب متصل شوند.
                  </p>
                </div>
                <div className="sb-account-form__grid">
                  <label>
                    <span>نام و نام خانوادگی</span>
                    <input
                      autoComplete="name"
                      value={registration.fullName}
                      onChange={(event) =>
                        updateRegistration("fullName", event.target.value)
                      }
                      required
                    />
                  </label>
                  <label>
                    <span>شماره موبایل</span>
                    <input
                      dir="ltr"
                      inputMode="tel"
                      autoComplete="tel"
                      value={registration.phone}
                      onChange={(event) =>
                        updateRegistration("phone", event.target.value)
                      }
                      placeholder="09xxxxxxxxx"
                      required
                    />
                  </label>
                  <label>
                    <span>ایمیل</span>
                    <input
                      dir="ltr"
                      type="email"
                      autoComplete="email"
                      value={registration.email}
                      onChange={(event) =>
                        updateRegistration("email", event.target.value)
                      }
                      required
                    />
                  </label>
                  <label>
                    <span>رمز عبور</span>
                    <input
                      dir="ltr"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      value={registration.password}
                      onChange={(event) =>
                        updateRegistration("password", event.target.value)
                      }
                      required
                    />
                  </label>
                  <label>
                    <span>کلینیک یا مرکز</span>
                    <input
                      autoComplete="organization"
                      value={registration.clinicName}
                      onChange={(event) =>
                        updateRegistration("clinicName", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    <span>شهر</span>
                    <input
                      autoComplete="address-level2"
                      value={registration.city}
                      onChange={(event) =>
                        updateRegistration("city", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    <span>نوع مشتری</span>
                    <select
                      value={registration.customerType}
                      onChange={(event) =>
                        updateRegistration(
                          "customerType",
                          event.target.value as CustomerType,
                        )
                      }
                    >
                      {Object.entries(customerTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="submit"
                  className="sb-btn sb-btn--dark"
                  disabled={busy}
                >
                  {busy ? "در حال ساخت حساب…" : "ساخت حساب"}
                </button>
                <button
                  type="button"
                  className="sb-account-inline"
                  onClick={() => setMode("login")}
                  disabled={busy}
                >
                  قبلاً حساب ساخته‌ام
                </button>
              </form>
            )}

            {profile && mode === "profile" && (
              <div className="sb-account-profile">
                <div>
                  <span className="sb-eyebrow">PROFILE</span>
                  <h2>مشخصات من</h2>
                  <p>این اطلاعات به حساب مشتری WooCommerce متصل است.</p>
                </div>
                <dl>
                  <div>
                    <dt>نام</dt>
                    <dd>{profile.fullName || "ثبت نشده"}</dd>
                  </div>
                  <div>
                    <dt>موبایل</dt>
                    <dd dir="ltr">{profile.phone || "ثبت نشده"}</dd>
                  </div>
                  <div>
                    <dt>ایمیل</dt>
                    <dd dir="ltr">{profile.email || "ثبت نشده"}</dd>
                  </div>
                  <div>
                    <dt>کلینیک / مرکز</dt>
                    <dd>{profile.clinicName || "ثبت نشده"}</dd>
                  </div>
                  <div>
                    <dt>شهر</dt>
                    <dd>{profile.city || "ثبت نشده"}</dd>
                  </div>
                  <div>
                    <dt>نوع مشتری</dt>
                    <dd>{customerTypeLabels[profile.customerType]}</dd>
                  </div>
                </dl>
                <div className="sb-account-actions">
                  <button
                    type="button"
                    className="sb-btn sb-btn--dark"
                    onClick={() => setMode("edit")}
                  >
                    ویرایش مشخصات
                  </button>
                  <a className="sb-btn sb-btn--ghost" href={supportLink}>
                    ارتباط با پشتیبانی
                  </a>
                  <button
                    type="button"
                    className="sb-account-inline"
                    onClick={() => void logout()}
                    disabled={busy}
                  >
                    {busy ? "در حال خروج…" : "خروج از حساب"}
                  </button>
                </div>
              </div>
            )}

            {profile && mode === "edit" && (
              <form className="sb-account-form" onSubmit={submitProfileUpdate}>
                <div>
                  <span className="sb-eyebrow">EDIT PROFILE</span>
                  <h2>ویرایش مشخصات</h2>
                  <p>
                    برای حفظ امنیت حساب، تغییر شماره موبایل یا ایمیل از مسیر
                    پشتیبانی انجام می‌شود.
                  </p>
                </div>
                <div className="sb-account-form__grid">
                  <label>
                    <span>نام و نام خانوادگی</span>
                    <input
                      autoComplete="name"
                      value={registration.fullName}
                      onChange={(event) =>
                        updateRegistration("fullName", event.target.value)
                      }
                      required
                    />
                  </label>
                  <label>
                    <span>کلینیک یا مرکز</span>
                    <input
                      autoComplete="organization"
                      value={registration.clinicName}
                      onChange={(event) =>
                        updateRegistration("clinicName", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    <span>شهر</span>
                    <input
                      autoComplete="address-level2"
                      value={registration.city}
                      onChange={(event) =>
                        updateRegistration("city", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    <span>نوع مشتری</span>
                    <select
                      value={registration.customerType}
                      onChange={(event) =>
                        updateRegistration(
                          "customerType",
                          event.target.value as CustomerType,
                        )
                      }
                    >
                      {Object.entries(customerTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="sb-account-actions">
                  <button
                    type="submit"
                    className="sb-btn sb-btn--dark"
                    disabled={busy}
                  >
                    {busy ? "در حال ذخیره…" : "ذخیره تغییرات"}
                  </button>
                  <button
                    type="button"
                    className="sb-btn sb-btn--ghost"
                    onClick={() => {
                      setRegistration(profileToRegistration(profile));
                      setMode("profile");
                      setMessage("");
                    }}
                    disabled={busy}
                  >
                    انصراف
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
