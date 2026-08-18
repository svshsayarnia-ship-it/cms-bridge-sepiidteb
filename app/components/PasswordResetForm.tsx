"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function PasswordResetForm({ login, resetKey }: { login: string; resetKey: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    if (!login || !resetKey) {
      setMessage("لینک بازیابی کامل نیست. دوباره درخواست بازیابی رمز بدهید.");
      return;
    }
    if (password !== confirmation) {
      setMessage("تکرار رمز با رمز جدید یکسان نیست.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/account/auth/password-reset", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ login, key: resetKey, password }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) throw new Error(result.error || "تغییر رمز انجام نشد.");

      setPassword("");
      setConfirmation("");
      setSuccess(true);
      setMessage(result.message || "رمز با موفقیت تغییر کرد.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تغییر رمز انجام نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main id="main-content" className="sb-account-page">
      <section className="sb-account-hero">
        <div className="sb-shell sb-account-hero__grid">
          <div>
            <span className="sb-eyebrow">PASSWORD RECOVERY</span>
            <h1>انتخاب رمز جدید</h1>
            <p>رمز جدید فقط از مسیر امن حساب سپید بیوتی به WordPress ارسال می‌شود و نشست‌های قبلی حساب باطل می‌شوند.</p>
          </div>
        </div>
      </section>

      <section className="sb-section">
        <div className="sb-shell sb-account-layout">
          <div className="sb-account-panel">
            {message && <p className="sb-account-message" role="status">{message}</p>}

            {success ? (
              <div className="sb-account-profile">
                <h2>رمز تغییر کرد</h2>
                <p>برای امنیت، دوباره با رمز جدید وارد حساب شوید.</p>
                <Link className="sb-btn sb-btn--dark" href="/account/login">ورود به حساب</Link>
              </div>
            ) : (
              <form className="sb-account-form" onSubmit={submit}>
                <label>
                  <span>رمز جدید</span>
                  <input
                    dir="ltr"
                    type="password"
                    minLength={10}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>تکرار رمز جدید</span>
                  <input
                    dir="ltr"
                    type="password"
                    minLength={10}
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    required
                  />
                </label>
                <p className="sb-account-note">حداقل ۱۰ کاراکتر و ترکیبی از حداقل سه گروهِ حروف کوچک، حروف بزرگ، عدد یا نشانه.</p>
                <button type="submit" className="sb-btn sb-btn--dark" disabled={pending}>
                  {pending ? "در حال تغییر رمز..." : "ذخیره رمز جدید"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
