import type { MarketPricingProposalAlert } from "./market-pricing";
import { getMarketPriceAlertConfig } from "./market-price-alert-config";

export type MarketPriceAlertDelivery = {
  channel: "telegram" | "email";
  delivered: boolean;
  error?: string;
};

export type MarketPriceChangeAlert = {
  productName: string;
  productSlug: string;
  previousRegularPriceToman: number | null;
  previousSalePriceToman: number | null;
  regularPriceToman: number | null;
  salePriceToman: number | null;
  reason: "manual" | "approved-proposal";
};

type ResolvedAlertConfig = {
  telegramBotToken: string;
  telegramChatId: string;
  resendApiKey: string;
  emailRecipient: string;
  emailFrom: string;
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

function priceChangeMessage(alert: MarketPriceChangeAlert): string {
  const previous = alert.previousSalePriceToman ?? alert.previousRegularPriceToman;
  const current = alert.salePriceToman ?? alert.regularPriceToman;
  const reason = alert.reason === "manual" ? "تغییر دستی در پنل" : "تأیید پیشنهاد قیمت";

  return [
    "قیمت محصول سپید بیوتی به‌روزرسانی شد",
    "",
    `محصول: ${alert.productName}`,
    `روش تغییر: ${reason}`,
    `قیمت قبلی: ${toman(previous)}`,
    `قیمت جدید: ${toman(current)}`,
    `مشاهده محصول: ${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sepiidbeauty.ir").replace(/\/+$/u, "")}/product/${alert.productSlug}`,
  ].join("\n");
}

async function resolvedConfig(): Promise<ResolvedAlertConfig> {
  let stored: Awaited<ReturnType<typeof getMarketPriceAlertConfig>> | null = null;
  try {
    stored = await getMarketPriceAlertConfig();
  } catch (error) {
    console.warn("[market-price-alert] Stored alert config unavailable", error);
  }

  return {
    telegramBotToken: (process.env.TELEGRAM_BOT_TOKEN ?? "").trim() || stored?.telegramBotToken || "",
    telegramChatId:
      (process.env.TELEGRAM_PRICE_ALERT_CHAT_ID ?? "").trim() || stored?.telegramChatId || "",
    resendApiKey: (process.env.RESEND_API_KEY ?? "").trim() || stored?.resendApiKey || "",
    emailRecipient: (process.env.PRICE_ALERT_EMAIL ?? "").trim() || stored?.emailRecipient || "",
    emailFrom: (process.env.PRICE_ALERT_EMAIL_FROM ?? "").trim() || stored?.emailFrom || "",
  };
}

async function telegram(
  message: string,
  config: ResolvedAlertConfig,
): Promise<MarketPriceAlertDelivery> {
  const token = config.telegramBotToken;
  const chatId = config.telegramChatId;
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

async function email(
  message: string,
  config: ResolvedAlertConfig,
): Promise<MarketPriceAlertDelivery> {
  const apiKey = config.resendApiKey;
  const recipient = config.emailRecipient;
  const sender = config.emailFrom;
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
  const config = await resolvedConfig();
  return Promise.all([telegram(message, config), email(message, config)]);
}

export async function sendMarketPriceAlertTest(): Promise<MarketPriceAlertDelivery[]> {
  const message = [
    "تست اعلان قیمت سپید بیوتی",
    "",
    "اگر این پیام را دریافت کرده‌اید، اتصال اعلان قیمت این کانال فعال است.",
    `مدیریت قیمت‌ها: ${cmsUrl()}`,
  ].join("\n");
  const config = await resolvedConfig();
  return Promise.all([telegram(message, config), email(message, config)]);
}

export async function sendMarketPriceChangeAlert(
  alert: MarketPriceChangeAlert,
): Promise<MarketPriceAlertDelivery[]> {
  const config = await resolvedConfig();
  return Promise.all([telegram(priceChangeMessage(alert), config), email(priceChangeMessage(alert), config)]);
}
