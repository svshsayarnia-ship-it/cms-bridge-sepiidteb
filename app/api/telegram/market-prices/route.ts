import { getMarketPriceAlertConfig } from "@/app/lib/market-price-alert-config";
import {
  ensureMarketPriceTelegramWebhook,
  isTelegramWebhookSecretValid,
  sendMarketPriceTelegramMessage,
} from "@/app/lib/market-price-telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type TelegramMessage = {
  text?: string;
  chat?: { id?: number | string };
};

type TelegramUpdate = {
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
};

function telegramMessage(update: TelegramUpdate): TelegramMessage | null {
  return update.message ?? update.edited_message ?? update.channel_post ?? null;
}

function commandName(text: string): string {
  const first = text.trim().split(/\s+/u)[0] ?? "";
  return first.toLowerCase().replace(/@[^\s]+$/u, "");
}

function helpText(): string {
  return [
    "ربات پایش قیمت سپید بیوتی فعال است.",
    "",
    "/status — وضعیت وب‌هوک و پایش خودکار",
    "/ping — تست اتصال ربات",
    "/help — راهنما",
    "",
    "اسکن قیمت بازار به‌صورت زمان‌بندی‌شده انجام می‌شود و تغییرات مهم از مسیر اعلان‌های قیمت ارسال می‌شوند.",
  ].join("\n");
}

export async function GET() {
  const webhook = await ensureMarketPriceTelegramWebhook();
  return Response.json(
    {
      ok: true,
      service: "sepiid-market-price-telegram",
      endpoint: "/api/telegram/market-prices",
      automaticScan: {
        enabled: true,
        schedule: "17 5,17 * * *",
        runner: "github-actions-oidc",
      },
      webhook,
    },
    {
      status: 200,
      headers: { "cache-control": "no-store" },
    },
  );
}

export async function POST(request: Request) {
  if (!isTelegramWebhookSecretValid(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return Response.json({ ok: true, ignored: true, reason: "invalid-json" });
  }

  const message = telegramMessage(update);
  const incomingChatId = message?.chat?.id;
  const text = message?.text?.trim() ?? "";
  if (incomingChatId === undefined || !text) {
    return Response.json({ ok: true, ignored: true, reason: "unsupported-update" });
  }

  try {
    const config = await getMarketPriceAlertConfig();
    if (!config.telegramBotToken || !config.telegramChatId) {
      return Response.json({ ok: true, ignored: true, reason: "telegram-not-configured" });
    }

    if (String(incomingChatId) !== config.telegramChatId) {
      return Response.json({ ok: true, ignored: true, reason: "chat-not-authorized" });
    }

    const command = commandName(text);
    let reply = "";
    if (command === "/start" || command === "/help") {
      reply = helpText();
    } else if (command === "/ping") {
      reply = "اتصال ربات سپید بیوتی برقرار است ✅";
    } else if (command === "/status") {
      const webhook = await ensureMarketPriceTelegramWebhook();
      reply = webhook.ok
        ? "پایش خودکار قیمت و وب‌هوک تلگرام فعال‌اند ✅"
        : `پایش زمان‌بندی‌شده فعال است؛ وضعیت وب‌هوک نیاز به بررسی دارد: ${webhook.error || webhook.lastErrorMessage || "نامشخص"}`;
    } else {
      return Response.json({ ok: true, ignored: true, reason: "unknown-command" });
    }

    const delivery = await sendMarketPriceTelegramMessage(config.telegramChatId, reply);
    if (!delivery.ok) {
      console.error("[telegram-market-prices] reply failed", delivery.error);
    }
    return Response.json({ ok: true, handled: true, delivered: delivery.ok });
  } catch (error) {
    console.error("[telegram-market-prices] update handling failed", error);
    return Response.json({ ok: true, handled: false, error: "update-handling-failed" });
  }
}
