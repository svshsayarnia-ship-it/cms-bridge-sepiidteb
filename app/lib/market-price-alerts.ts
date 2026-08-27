import type { MarketPricingProposalAlert } from "./market-pricing";

export type MarketPriceAlertDelivery = {
  channel: "telegram" | "email";
  delivered: boolean;
  error?: string;
};

function toman(value: number | null): string {
  return value === null
    ? "ثبت نشده"
    : `${new Intl.NumberFormat("fa-IR").format(value)} تومان`;
}

function cmsUrl(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sepiidbeauty.ir")
    .replace(/\/+$/u, "");
  return `${base}/cms`;
}

function messageFor(alerts: MarketPricingProposalAlert[]): string {
  const lines = alerts.map(({ productName, proposal }) => [
    `• ${productName}`,
    `قیمت فعلی: ${toman(proposal.currentPriceToman)}`,
    `قیمت پیشنهادی: ${toman(proposal.proposedPriceToman)}`,
    `بررسی و تأیید: ${cmsUrl()}`,
  ].join("\n"));
  return `پیشنهاد قیمت جدید سپید بیوتی\n\n${lines.join("\n\n")}`;
}

async function telegram(message: string): Promise<MarketPriceAlertDelivery> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_PRICE_ALERT_CHAT_ID;
  if (!token || !chatId) {
    return { channel: "telegram", delivered: false, error: "Telegram is not configured." };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, disable_web_page_preview: true }),
    });
    if (!response.ok) throw new Error(`Telegram returned ${response.status}`);
    return { channel: "telegram", delivered: true };
  } catch (error) {
    console.error("[market-price-alert] Telegram delivery failed", error);
    return {
      channel: "telegram",
      delivered: false,
      error: error instanceof Error ? error.message : "Telegram delivery failed.",
    };
  }
}

async function email(message: string): Promise<MarketPriceAlertDelivery> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.PRICE_ALERT_EMAIL;
  const sender = process.env.PRICE_ALERT_EMAIL_FROM;
  if (!apiKey || !recipient || !sender) {
    return { channel: "email", delivered: false, error: "Email is not configured." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        subject: "پیشنهاد قیمت جدید در سپید بیوتی",
        text: message,
      }),
    });
    if (!response.ok) throw new Error(`Resend returned ${response.status}`);
    return { channel: "email", delivered: true };
  } catch (error) {
    console.error("[market-price-alert] Email delivery failed", error);
    return {
      channel: "email",
      delivered: false,
      error: error instanceof Error ? error.message : "Email delivery failed.",
    };
  }
}

export async function sendMarketPriceAlerts(
  alerts: MarketPricingProposalAlert[],
): Promise<MarketPriceAlertDelivery[]> {
  if (!alerts.length) return [];
  const message = messageFor(alerts);
  return Promise.all([telegram(message), email(message)]);
}

export async function sendMarketPriceAlertTest(): Promise<MarketPriceAlertDelivery[]> {
  const message = [
    "تست اعلان قیمت سپید بیوتی",
    "",
    "اگر این پیام را دریافت کرده‌اید، اتصال اعلان قیمت این کانال فعال است.",
    `مدیریت قیمت‌ها: ${cmsUrl()}`,
  ].join("\n");
  return Promise.all([telegram(message), email(message)]);
}
