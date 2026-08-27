"use client";

import { useEffect, useState } from "react";

type AlertStatus = {
  telegramConfigured: boolean;
  telegramChatId: string;
  emailConfigured: boolean;
  emailRecipient: string;
  emailFrom: string;
};

type AlertDelivery = {
  channel: "telegram" | "email";
  delivered: boolean;
  error?: string;
};

type ApiError = { error?: string };

async function jsonRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store" });
  const body = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) throw new Error(body.error || `خطای ${response.status}`);
  return body;
}

function deliveryText(deliveries: AlertDelivery[]): string {
  return deliveries
    .map((delivery) => {
      const label = delivery.channel === "telegram" ? "تلگرام" : "ایمیل";
      if (delivery.delivered) return `${label}: ارسال شد`;
      if (delivery.error?.includes("not configured")) return `${label}: تنظیم نشده`;
      return `${label}: ناموفق`;
    })
    .join("، ");
}

export function PricingAlertSettings() {
  const [status, setStatus] = useState<AlertStatus | null>(null);
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const next = await jsonRequest<AlertStatus>("/api/cms/pricing/alerts");
    setStatus(next);
    setTelegramChatId(next.telegramChatId);
    setEmailRecipient(next.emailRecipient);
    setEmailFrom(next.emailFrom);
  }

  useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "دریافت تنظیمات اعلان ناموفق بود.");
    });
  }, []);

  async function save() {
    setBusy("save");
    setError("");
    setNotice("");
    try {
      const next = await jsonRequest<AlertStatus>("/api/cms/pricing/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          telegramBotToken,
          telegramChatId,
          resendApiKey,
          emailRecipient,
          emailFrom,
        }),
      });
      setStatus(next);
      setTelegramBotToken("");
      setResendApiKey("");
      setNotice("تنظیمات اعلان با رمزگذاری ذخیره شد.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "ذخیره تنظیمات اعلان ناموفق بود.");
    } finally {
      setBusy("");
    }
  }

  async function test() {
    setBusy("test");
    setError("");
    setNotice("");
    try {
      const result = await jsonRequest<{ deliveries: AlertDelivery[] }>("/api/cms/pricing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "test-alert" }),
      });
      setNotice(`نتیجه تست: ${deliveryText(result.deliveries)}.`);
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "تست اعلان ناموفق بود.");
    } finally {
      setBusy("");
    }
  }

  return (
    <details className="spb-pricing-panel" open>
      <summary>
        <span>تنظیم اعلان قیمت</span>
        <b>
          {status?.telegramConfigured ? "تلگرام ✓" : "تلگرام —"} / {status?.emailConfigured ? "ایمیل ✓" : "ایمیل —"}
        </b>
      </summary>
      <div className="spb-pricing-source-editor">
        <p className="spb-pricing-empty">
          اطلاعات حساس در GitHub ذخیره نمی‌شوند؛ پس از ذخیره، مقدار توکن‌ها دوباره نمایش داده نمی‌شود.
        </p>

        {error && <div className="spb-cms-alert is-error">{error}</div>}
        {notice && <div className="spb-cms-alert is-success">{notice}</div>}

        <div className="spb-source-grid">
          <div className="spb-source-card">
            <strong>تلگرام</strong>
            <label>
              <span>Bot Token</span>
              <input
                type="password"
                dir="ltr"
                autoComplete="new-password"
                value={telegramBotToken}
                placeholder={status?.telegramConfigured ? "ذخیره شده؛ برای تغییر مقدار جدید وارد کن" : "توکن ربات تلگرام"}
                onChange={(event) => setTelegramBotToken(event.target.value)}
              />
            </label>
            <label>
              <span>Chat ID</span>
              <input
                dir="ltr"
                value={telegramChatId}
                placeholder="Chat ID"
                onChange={(event) => setTelegramChatId(event.target.value)}
              />
            </label>
          </div>

          <div className="spb-source-card">
            <strong>ایمیل با Resend</strong>
            <label>
              <span>Resend API Key</span>
              <input
                type="password"
                dir="ltr"
                autoComplete="new-password"
                value={resendApiKey}
                placeholder={status?.emailConfigured ? "ذخیره شده؛ برای تغییر مقدار جدید وارد کن" : "re_..."}
                onChange={(event) => setResendApiKey(event.target.value)}
              />
            </label>
            <label>
              <span>ایمیل دریافت‌کننده</span>
              <input
                type="email"
                dir="ltr"
                value={emailRecipient}
                placeholder="you@example.com"
                onChange={(event) => setEmailRecipient(event.target.value)}
              />
            </label>
            <label>
              <span>ایمیل فرستنده</span>
              <input
                type="email"
                dir="ltr"
                value={emailFrom}
                placeholder="alerts@your-domain.com"
                onChange={(event) => setEmailFrom(event.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="spb-pricing-source-editor__footer">
          <div>
            <strong>زمان‌بندی: ۹:۰۰ و ۱۵:۰۰ به وقت ایران</strong>
            <span>اجرای خودکار از GitHub Actions انجام می‌شود.</span>
          </div>
          <div className="spb-pricing-manager__actions">
            <button
              type="button"
              className="spb-button is-primary"
              disabled={Boolean(busy)}
              onClick={() => void save()}
            >
              {busy === "save" ? "در حال ذخیره..." : "ذخیره تنظیمات اعلان"}
            </button>
            <button
              type="button"
              className="spb-button is-secondary"
              disabled={Boolean(busy)}
              onClick={() => void test()}
            >
              {busy === "test" ? "در حال تست..." : "ارسال پیام تست"}
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}
