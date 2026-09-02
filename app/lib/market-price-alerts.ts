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

// Telegram text messages cap at 4096 characters; keep headroom for Unicode and future copy changes.
const TELEGRAM_SAFE_MESSAGE_LENGTH = 3_600;

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

function alertBlock({ productName, proposal }: MarketPricingProposalAlert): string {
  return [
    `• ${productName}`,
    `قیمت فعلی: ${toman(proposal.currentPriceToman)}`,
    `قیمت معتبر بازار: ${toman(proposal.proposedPriceToman)}`,
    `بازه معتبر: ${toman(proposal.verifiedMinPriceToman)} تا ${toman(proposal.verifiedMaxPriceToman)}`,
    `اطمینان بازار: ${proposal.marketConfidenceScore}٪`,
    `نمونه معتبر: ${proposal.verifiedSampleCount} از ${proposal.observedSampleCount}`,
    `قیمت مشکوک حذف‌شده: ${proposal.suspiciousSampleCount}`,
    `بررسی و تأیید: ${cmsUrl()}`,
  ].join("\n");
}

function messageFor(alerts: MarketPricingProposalAlert[]): string {
  return `پیشنهاد قیمت جدید سپید بیوتی\n\n${alerts.map(alertBlock).join("\n\n")}`;
}

function telegramMessagesFor(alerts: MarketPricingProposalAlert[]): string[] {
  const header = "پیشنهاد قیمت جدید سپید بیوتی";
  const chunks: string[] = [];
  let current = header;

  for (const alert of alerts) {
    const block = alertBlock(alert);
    const next = `${current}\n\n${block}`;
    if (next.length <= TELEGRAM_SAFE_MESSAGE_LENGTH) {
      current = next;
      continue;
    }
    if (current !== header) chunks.push(current);
    current = `${header}\n\n${block}`;
  }

  if (current !== header) chunks.push(current);
  return chunks;
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
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`Telegram returned ${response.status}${detail ? `: ${detail}` : ""}`);
    }
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

async function telegramBatch(
  messages: string[],
  config: ResolvedAlertConfig,
): Promise<MarketPriceAlertDelivery> {
  for (let index = 0; index < messages.length; index += 1) {
    const delivery = await telegram(messages[index], config);
    if (!delivery.delivered) {
      return {
        channel: "telegram",
        delivered: false,
        error: `بخش ${index + 1} از ${messages.length}: ${delivery.error ?? "Telegram delivery failed."}`,
      };
    }
  }
  return { channel: "telegram", delivered: true };
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
  const fullMessage = messageFor(alerts);
  const telegramMessages = telegramMessagesFor(alerts);
  const config = await resolvedConfig();
  return Promise.all([
    telegramBatch(telegramMessages, config),
    email(fullMessage, config),
  ]);
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
  const message = priceChangeMessage(alert);
  return Promise.all([telegram(message, config), email(message, config)]);
}
