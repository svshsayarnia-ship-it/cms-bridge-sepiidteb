import { getMarketPriceAlertConfig } from "@/app/lib/market-price-alert-config";
import {
  getMarketPricingDashboard,
  type MarketPricingProduct,
} from "@/app/lib/market-pricing";
import {
  ensureMarketPriceTelegramWebhook,
  isTelegramWebhookSecretValid,
  sendMarketPriceTelegramMessage,
  type TelegramReplyMarkup,
} from "@/app/lib/market-price-telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAIN_KEYBOARD: TelegramReplyMarkup = {
  keyboard: [
    [{ text: "💰 قیمت محصولات" }, { text: "🔎 جستجوی قیمت" }],
    [{ text: "📡 وضعیت ربات" }, { text: "✅ تست اتصال" }],
    [{ text: "❓ راهنما" }],
  ],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: "نام محصول یا دستور را وارد کنید…",
};

const PRICE_LIST_MESSAGE_LIMIT = 3500;
const priceFormatter = new Intl.NumberFormat("fa-IR");

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

function commandArgument(text: string): string {
  return text.trim().replace(/^\S+\s*/u, "").trim();
}

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ي/gu, "ی")
    .replace(/ك/gu, "ک")
    .replace(/[\u200c\u200f\u202a-\u202e]/gu, " ")
    .replace(/\s+/gu, " ");
}

function numberValue(value: string): number | null {
  const parsed = Number(value.replace(/,/gu, "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toman(value: number | null): string {
  return value ? `${priceFormatter.format(Math.round(value))} تومان` : "بدون قیمت ثبت‌شده";
}

function activeProductPrice(product: MarketPricingProduct): number | null {
  return (
    numberValue(product.price) ??
    numberValue(product.salePrice) ??
    numberValue(product.regularPrice)
  );
}

function helpText(): string {
  return [
    "ربات قیمت سپید بیوتی آماده است ✅",
    "",
    "💰 قیمت محصولات — نمایش لیست قیمت فعلی محصولات",
    "🔎 جستجوی قیمت — بعدش فقط نام محصول را بفرست؛ مثلاً «نورامیس»",
    "",
    "/prices — لیست قیمت محصولات",
    "/price نورامیس — جستجوی قیمت یک محصول",
    "/status — وضعیت وب‌هوک و پایش خودکار",
    "/ping — تست اتصال ربات",
    "/help — راهنما",
    "",
    "می‌توانی بدون دستور هم فقط نام محصول، برند یا SKU را بفرستی تا قیمتش را پیدا کنم.",
  ].join("\n");
}

function productMatches(product: MarketPricingProduct, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  return [product.name, product.sku, product.slug]
    .map(normalizeSearchText)
    .some((value) => value.includes(normalizedQuery));
}

function compactProductLine(product: MarketPricingProduct): string {
  const active = toman(activeProductPrice(product));
  const proposed = product.pricing.proposal?.proposedPriceToman;
  const market = proposed ? ` | پیشنهاد بازار: ${toman(proposed)}` : "";
  return `• ${product.name}\n  قیمت فعلی: ${active}${market}`;
}

function formatCheckedAt(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function detailedProductText(product: MarketPricingProduct): string {
  const active = activeProductPrice(product);
  const regular = numberValue(product.regularPrice);
  const sale = numberValue(product.salePrice);
  const proposal = product.pricing.proposal;
  const checkedAt = formatCheckedAt(product.pricing.lastCheckedAt);
  const lines = [
    `💰 ${product.name}`,
    `قیمت فعلی فروشگاه: ${toman(active)}`,
  ];

  if (sale && regular && sale !== regular) {
    lines.push(`قیمت عادی: ${toman(regular)}`, `قیمت فروش ویژه: ${toman(sale)}`);
  }
  if (proposal) {
    lines.push(
      `📊 پیشنهاد فعلی بازار: ${toman(proposal.proposedPriceToman)}`,
      `منابع معتبر این پیشنهاد: ${priceFormatter.format(proposal.samples.length)}`,
    );
  }
  if (checkedAt) lines.push(`آخرین پایش: ${checkedAt}`);
  if (product.sku) lines.push(`SKU: ${product.sku}`);
  return lines.join("\n");
}

function chunkPriceList(products: MarketPricingProduct[]): string[] {
  if (!products.length) return ["هیچ محصولی برای نمایش قیمت پیدا نشد."];

  const messages: string[] = [];
  let current = "💰 لیست قیمت فعلی محصولات سپید بیوتی\n\n";
  for (const product of products) {
    const line = compactProductLine(product);
    if (current.length + line.length + 2 > PRICE_LIST_MESSAGE_LIMIT) {
      messages.push(current.trim());
      current = "💰 ادامه لیست قیمت\n\n";
    }
    current += `${line}\n\n`;
  }
  current += "برای جزئیات، فقط نام محصول را بفرست؛ مثلاً: نورامیس";
  messages.push(current.trim());
  return messages;
}

async function priceReplies(query?: string): Promise<string[]> {
  try {
    const dashboard = await getMarketPricingDashboard();
    const products = dashboard.products
      .filter((product) => (query ? productMatches(product, query) : true))
      .sort((a, b) => a.name.localeCompare(b.name, "fa"));

    if (!query) return chunkPriceList(products);
    if (!products.length) {
      return [
        `محصولی برای «${query}» پیدا نکردم.\nنام کوتاه‌تر، برند یا SKU را امتحان کن؛ مثلاً «نورامیس» یا «Revofil».`,
      ];
    }

    const visible = products.slice(0, 12);
    const replies = visible.map(detailedProductText);
    if (products.length > visible.length) {
      replies.push(
        `${priceFormatter.format(products.length - visible.length)} نتیجه دیگر هم وجود دارد. عبارت دقیق‌تری بفرست تا نتیجه محدودتر شود.`,
      );
    }
    return replies;
  } catch (error) {
    console.error("[telegram-market-prices] loading product prices failed", error);
    return ["دریافت قیمت محصولات موقتاً با خطا روبه‌رو شد. چند لحظه بعد دوباره امتحان کن."];
  }
}

export async function GET() {
  const webhook = await ensureMarketPriceTelegramWebhook();
  return Response.json(
    {
      ok: true,
      service: "sepiid-market-price-telegram",
      endpoint: "/api/telegram/market-prices",
      capabilities: ["prices", "product-search", "status", "ping"],
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
    const normalized = normalizeSearchText(text);
    let replies: string[] = [];

    if (
      command === "/start" ||
      command === "/help" ||
      normalized === normalizeSearchText("❓ راهنما")
    ) {
      replies = [helpText()];
    } else if (
      command === "/ping" ||
      normalized === normalizeSearchText("✅ تست اتصال")
    ) {
      replies = ["اتصال ربات سپید بیوتی برقرار است ✅"];
    } else if (
      command === "/status" ||
      normalized === normalizeSearchText("📡 وضعیت ربات")
    ) {
      const webhook = await ensureMarketPriceTelegramWebhook();
      replies = [
        webhook.ok
          ? "پایش خودکار قیمت و وب‌هوک تلگرام فعال‌اند ✅"
          : `پایش زمان‌بندی‌شده فعال است؛ وضعیت وب‌هوک نیاز به بررسی دارد: ${webhook.error || webhook.lastErrorMessage || "نامشخص"}`,
      ];
    } else if (
      command === "/prices" ||
      normalized === normalizeSearchText("💰 قیمت محصولات") ||
      normalized === "قیمت محصولات" ||
      normalized === "لیست قیمت"
    ) {
      replies = await priceReplies();
    } else if (normalized === normalizeSearchText("🔎 جستجوی قیمت")) {
      replies = ["نام محصول، برند یا SKU را بفرست؛ مثلاً «نورامیس» یا «Revofil». قیمت فعلی و اگر موجود باشد پیشنهاد بازار را نمایش می‌دهم."];
    } else if (command === "/price") {
      const query = commandArgument(text);
      replies = query
        ? await priceReplies(query)
        : ["بعد از /price نام محصول را بنویس؛ مثلاً: /price نورامیس"];
    } else if (command.startsWith("/")) {
      replies = [helpText()];
    } else {
      replies = await priceReplies(text);
    }

    let delivered = true;
    for (let index = 0; index < replies.length; index += 1) {
      const delivery = await sendMarketPriceTelegramMessage(
        config.telegramChatId,
        replies[index],
        index === replies.length - 1 ? { replyMarkup: MAIN_KEYBOARD } : {},
      );
      if (!delivery.ok) {
        delivered = false;
        console.error("[telegram-market-prices] reply failed", delivery.error);
      }
    }

    return Response.json({ ok: true, handled: true, delivered, messageCount: replies.length });
  } catch (error) {
    console.error("[telegram-market-prices] update handling failed", error);
    return Response.json({ ok: true, handled: false, error: "update-handling-failed" });
  }
}
