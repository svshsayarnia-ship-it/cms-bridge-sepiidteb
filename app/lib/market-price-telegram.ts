import { getMarketPriceAlertConfig } from "@/app/lib/market-price-alert-config";

const DEFAULT_WEBHOOK_URL = "https://www.sepiidbeauty.ir/api/telegram/market-prices";
const TELEGRAM_TIMEOUT_MS = 10_000;

type TelegramWebhookInfo = {
  url?: string;
  pending_update_count?: number;
  last_error_date?: number;
  last_error_message?: string;
};

type TelegramApiResponse<T> = {
  ok?: boolean;
  result?: T;
  description?: string;
};

export type MarketPriceTelegramWebhookStatus = {
  ok: boolean;
  configured: boolean;
  expectedUrl: string;
  currentUrl: string;
  matchesExpected: boolean;
  pendingUpdateCount: number;
  lastErrorDate: number | null;
  lastErrorMessage: string | null;
  repaired: boolean;
  error?: string;
};

function expectedWebhookUrl(): string {
  return (process.env.MARKET_PRICE_TELEGRAM_WEBHOOK_URL ?? DEFAULT_WEBHOOK_URL).trim();
}

function webhookSecret(): string {
  const value = (process.env.MARKET_PRICE_TELEGRAM_WEBHOOK_SECRET ?? "").trim();
  return /^[A-Za-z0-9_-]{1,256}$/u.test(value) ? value : "";
}

async function telegramRequest<T>(
  token: string,
  method: string,
  payload?: Record<string, unknown>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS);
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload ?? {}),
      cache: "no-store",
      signal: controller.signal,
    });
    const body = (await response.json()) as TelegramApiResponse<T>;
    if (!response.ok || !body.ok || body.result === undefined) {
      throw new Error(body.description || `Telegram API ${method} failed with ${response.status}`);
    }
    return body.result;
  } finally {
    clearTimeout(timer);
  }
}

function toStatus(
  info: TelegramWebhookInfo,
  configured: boolean,
  repaired: boolean,
): MarketPriceTelegramWebhookStatus {
  const expectedUrl = expectedWebhookUrl();
  const currentUrl = (info.url ?? "").trim();
  return {
    ok: configured && currentUrl === expectedUrl,
    configured,
    expectedUrl,
    currentUrl,
    matchesExpected: currentUrl === expectedUrl,
    pendingUpdateCount: Number.isFinite(info.pending_update_count) ? Number(info.pending_update_count) : 0,
    lastErrorDate: Number.isFinite(info.last_error_date) ? Number(info.last_error_date) : null,
    lastErrorMessage: info.last_error_message?.trim() || null,
    repaired,
  };
}

export async function ensureMarketPriceTelegramWebhook(): Promise<MarketPriceTelegramWebhookStatus> {
  const expectedUrl = expectedWebhookUrl();
  try {
    const config = await getMarketPriceAlertConfig();
    if (!config.telegramBotToken || !config.telegramChatId) {
      return {
        ok: false,
        configured: false,
        expectedUrl,
        currentUrl: "",
        matchesExpected: false,
        pendingUpdateCount: 0,
        lastErrorDate: null,
        lastErrorMessage: null,
        repaired: false,
        error: "Telegram bot token or chat ID is not configured.",
      };
    }

    let info = await telegramRequest<TelegramWebhookInfo>(config.telegramBotToken, "getWebhookInfo");
    if ((info.url ?? "").trim() === expectedUrl) {
      return toStatus(info, true, false);
    }

    const secret = webhookSecret();
    const payload: Record<string, unknown> = {
      url: expectedUrl,
      allowed_updates: ["message", "edited_message", "channel_post"],
      drop_pending_updates: false,
    };
    if (secret) payload.secret_token = secret;

    await telegramRequest<boolean>(config.telegramBotToken, "setWebhook", payload);
    info = await telegramRequest<TelegramWebhookInfo>(config.telegramBotToken, "getWebhookInfo");
    return toStatus(info, true, true);
  } catch (error) {
    return {
      ok: false,
      configured: false,
      expectedUrl,
      currentUrl: "",
      matchesExpected: false,
      pendingUpdateCount: 0,
      lastErrorDate: null,
      lastErrorMessage: null,
      repaired: false,
      error: error instanceof Error ? error.message : "Telegram webhook check failed.",
    };
  }
}

export async function sendMarketPriceTelegramMessage(
  chatId: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const config = await getMarketPriceAlertConfig();
    if (!config.telegramBotToken) {
      return { ok: false, error: "Telegram bot token is not configured." };
    }
    await telegramRequest<unknown>(config.telegramBotToken, "sendMessage", {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Telegram message failed.",
    };
  }
}

export function isTelegramWebhookSecretValid(request: Request): boolean {
  const secret = webhookSecret();
  if (!secret) return true;
  return request.headers.get("x-telegram-bot-api-secret-token") === secret;
}
