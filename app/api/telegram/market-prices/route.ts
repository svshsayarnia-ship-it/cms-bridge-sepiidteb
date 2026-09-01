import {
  getMarketPriceAlertConfig,
  type MarketPriceAlertConfig,
} from "@/app/lib/market-price-alert-config";
import {
  getStorefrontProducts,
  type StorefrontProduct,
} from "@/app/lib/storefront-catalog";
import {
  ensureMarketPriceTelegramWebhook,
  isTelegramWebhookSecretValid,
  sendMarketPriceTelegramMessage,
  type TelegramReplyMarkup,
} from "@/app/lib/market-price-telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAIN_KEYBOARD: TelegramReplyMarkup = {
  keyboard: [
    [{ text: "💰 قیمت محصولات" }, { text: "🔎 جستجوی قیمت" }],
    [{ text: "📡 وضعیت ربات" }, { text: "✅ تست اتصال" }],
    [{ text: "❓ راهنما" }],
  ],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: "نام محصول را هرطور راحتی بنویس…",
};

const PRICE_LIST_MESSAGE_LIMIT = 3500;
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;
const priceFormatter = new Intl.NumberFormat("fa-IR");

let cachedAlertConfig: { value: MarketPriceAlertConfig; expiresAt: number } | null = null;
let pendingAlertConfig: Promise<MarketPriceAlertConfig> | null = null;

type TelegramMessage = {
  text?: string;
  chat?: { id?: number | string };
};

type TelegramUpdate = {
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
};

type ScoredProduct = {
  product: StorefrontProduct;
  score: number;
};

const SEARCH_STOP_WORDS = new Set([
  "قیمت",
  "قیمتش",
  "محصول",
  "محصولات",
  "جنس",
  "لطفا",
  "لطفاً",
  "رو",
  "را",
  "بده",
  "بگو",
  "چند",
  "چنده",
  "میخوام",
  "میخواهم",
  "میخوامش",
  "price",
  "product",
  "please",
]);

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

function normalizeDigits(value: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return value
    .replace(/[۰-۹]/gu, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/gu, (digit) => String(arabic.indexOf(digit)));
}

function normalizeBasic(value: string): string {
  return normalizeDigits(value)
    .trim()
    .toLowerCase()
    .replace(/ي/gu, "ی")
    .replace(/ك/gu, "ک")
    .replace(/ة/gu, "ه")
    .replace(/[\u064b-\u065f\u0670]/gu, "")
    .replace(/[\u200c\u200d\u200e\u200f\u202a-\u202e]/gu, " ")
    .replace(/[ـ_./\\|()[\]{}:;+،,!?؟«»"'`~@#$%^&*=<>-]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function canonicalize(value: string): string {
  return normalizeBasic(value)
    .replace(/فیوژن/gu, " fusion ")
    .replace(/نورامیس/gu, " neuramis ")
    .replace(/نورافیل/gu, " neurafill ")
    .replace(/رووفیل|روفیل/gu, " revofil ")
    .replace(/مزولایک/gu, " mesolike ")
    .replace(/درماهیل/gu, " dermaheal ")
    .replace(/رویتاکر/gu, " revitacare ")
    .replace(/ژنوسیس/gu, " genosys ")
    .replace(/(?:هیر|هير|هر)\s*من/gu, " hair men ")
    .replace(/هیرمن|هيرمن|هرمن/gu, " hair men ")
    .replace(/هیر|هير/gu, " hair ")
    .replace(/(^|\s)اف(?=\s|$)/gu, "$1 f ")
    .replace(/والیوم|ولوم/gu, " volume ")
    .replace(/دیپ/gu, " deep ")
    .replace(/لیدوکائین|لیدوکایین|لیدو/gu, " lido ")
    .replace(/پلاس/gu, " plus ")
    .replace(/اسکین/gu, " skin ")
    .replace(/بوستر/gu, " booster ")
    .replace(/فیلر/gu, " filler ")
    .replace(/بوتاکس/gu, " botox ")
    .replace(/مزوژل/gu, " mesogel ")
    .replace(/\s+/gu, " ")
    .trim();
}

function searchTokens(value: string): string[] {
  const raw = normalizeBasic(value).split(" ");
  const canonical = canonicalize(value).split(" ");
  return Array.from(new Set([...raw, ...canonical]))
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && !SEARCH_STOP_WORDS.has(token));
}

function levenshtein(left: string, right: string): number {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
    }
    for (let index = 0; index < current.length; index += 1) previous[index] = current[index];
  }
  return previous[right.length];
}

function tokenSimilarity(queryToken: string, candidateToken: string): number {
  if (queryToken === candidateToken) return 1;
  if (!queryToken || !candidateToken) return 0;

  const shorter = Math.min(queryToken.length, candidateToken.length);
  if (shorter >= 3 && (queryToken.includes(candidateToken) || candidateToken.includes(queryToken))) {
    return 0.92;
  }

  if (shorter <= 2) return 0;
  const distance = levenshtein(queryToken, candidateToken);
  return Math.max(0, 1 - distance / Math.max(queryToken.length, candidateToken.length));
}

function productSearchFields(product: StorefrontProduct): string[] {
  const variants = product.variants?.flatMap((variant) => [variant.label, variant.nameFa]) ?? [];
  const specs = product.specs?.flatMap(([label, value]) => [label, value]) ?? [];
  return [
    product.nameFa,
    product.nameEn,
    product.brand,
    product.sku,
    product.slug,
    product.categoryTitle,
    product.volume ?? "",
    ...variants,
    ...specs,
  ].filter(Boolean);
}

function productMatchScore(product: StorefrontProduct, query: string): number {
  const queryTokens = searchTokens(query);
  if (!queryTokens.length) return 0;

  const fields = productSearchFields(product);
  const candidateTokens = Array.from(new Set(fields.flatMap(searchTokens)));
  if (!candidateTokens.length) return 0;

  const tokenScores = queryTokens.map((queryToken) =>
    candidateTokens.reduce(
      (best, candidateToken) => Math.max(best, tokenSimilarity(queryToken, candidateToken)),
      0,
    ),
  );
  const average = tokenScores.reduce((sum, score) => sum + score, 0) / tokenScores.length;
  const coverage = tokenScores.filter((score) => score >= 0.68).length / tokenScores.length;
  const strongCoverage = tokenScores.filter((score) => score >= 0.86).length / tokenScores.length;

  const queryRepresentations = [normalizeBasic(query), canonicalize(query)].filter(Boolean);
  const fieldRepresentations = fields.flatMap((field) => [normalizeBasic(field), canonicalize(field)]).filter(Boolean);
  const compactQuery = queryRepresentations.map((value) => value.replace(/\s+/gu, ""));
  const compactFields = fieldRepresentations.map((value) => value.replace(/\s+/gu, ""));

  const exactPhrase = compactQuery.some((queryValue) => compactFields.some((field) => field === queryValue));
  const containedPhrase = compactQuery.some(
    (queryValue) => queryValue.length >= 3 && compactFields.some((field) => field.includes(queryValue)),
  );

  if (exactPhrase) return 1;

  let score = average * 0.58 + coverage * 0.27 + strongCoverage * 0.15;
  if (containedPhrase) score += 0.12;
  return Math.min(1, score);
}

function fuzzyProductMatches(products: StorefrontProduct[], query: string): StorefrontProduct[] {
  const queryTokens = searchTokens(query);
  if (!queryTokens.length) return [];

  const ranked: ScoredProduct[] = products
    .map((product) => ({ product, score: productMatchScore(product, query) }))
    .filter(({ score }) => score >= (queryTokens.length === 1 ? 0.62 : 0.56))
    .sort((left, right) => right.score - left.score || left.product.nameFa.localeCompare(right.product.nameFa, "fa"));

  if (!ranked.length) return [];
  const bestScore = ranked[0].score;
  const relativeFloor = Math.max(queryTokens.length === 1 ? 0.62 : 0.56, bestScore - (queryTokens.length === 1 ? 0.08 : 0.2));
  return ranked.filter(({ score }) => score >= relativeFloor).slice(0, 10).map(({ product }) => product);
}

function numberValue(value: string): number | null {
  const parsed = Number(value.replace(/,/gu, "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toman(value: number | null): string {
  return value ? `${priceFormatter.format(Math.round(value))} تومان` : "بدون قیمت ثبت‌شده";
}

function activeProductPrice(product: StorefrontProduct): number | null {
  return (
    (Number.isFinite(product.priceToman) && Number(product.priceToman) > 0 ? Number(product.priceToman) : null) ??
    numberValue(product.salePrice) ??
    numberValue(product.price) ??
    numberValue(product.regularPrice)
  );
}

function helpText(): string {
  return [
    "ربات قیمت سپید بیوتی آماده است ✅",
    "",
    "💰 قیمت محصولات — نمایش لیست قیمت فعلی محصولات",
    "🔎 جستجوی قیمت — نام محصول را هرطور راحتی بنویس؛ لازم نیست املای دقیق باشد.",
    "",
    "/prices — لیست قیمت محصولات",
    "/price نورامیس — جستجوی قیمت یک محصول",
    "/status — وضعیت وب‌هوک و پایش خودکار",
    "/ping — تست اتصال ربات",
    "",
    "مثال: «فیوژن F هرمن»، «فیوژن اف هیر من»، «Fusion F Hair Men» و شکل‌های نزدیک به آن، همگی با جستجوی هوشمند بررسی می‌شوند.",
  ].join("\n");
}

function compactProductLine(product: StorefrontProduct): string {
  return `• ${product.nameFa}\n  قیمت فعلی: ${toman(activeProductPrice(product))}`;
}

function formatModifiedAt(value: string | null | undefined): string | null {
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

function detailedProductText(product: StorefrontProduct): string {
  const active = activeProductPrice(product);
  const regular = numberValue(product.regularPrice);
  const sale = numberValue(product.salePrice);
  const modifiedAt = formatModifiedAt(product.dateModifiedGmt);
  const lines = [`💰 ${product.nameFa}`, `قیمت فعلی: ${toman(active)}`];

  if (product.nameEn && normalizeBasic(product.nameEn) !== normalizeBasic(product.nameFa)) {
    lines.splice(1, 0, product.nameEn);
  }
  if (sale && regular && sale !== regular) {
    lines.push(`قیمت عادی: ${toman(regular)}`, `قیمت فروش ویژه: ${toman(sale)}`);
  }
  if (modifiedAt) lines.push(`آخرین بروزرسانی ثبت‌شده: ${modifiedAt}`);
  if (product.sku) lines.push(`SKU: ${product.sku}`);
  return lines.join("\n");
}

function chunkPriceList(products: StorefrontProduct[]): string[] {
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
  current += "برای جزئیات فقط نام محصول را بفرست؛ حتی اگر املایش دقیق نباشد.";
  messages.push(current.trim());
  return messages;
}

async function priceReplies(query?: string): Promise<string[]> {
  try {
    const products = (await getStorefrontProducts()).sort((a, b) => a.nameFa.localeCompare(b.nameFa, "fa"));
    if (!query) return chunkPriceList(products);

    const matches = fuzzyProductMatches(products, query);
    if (!matches.length) {
      return [
        `برای «${query}» نتیجه مطمئنی پیدا نکردم. یک بخش دیگر از نام، برند یا مدل را هم بنویس؛ لازم نیست املای دقیق باشد.`,
      ];
    }

    return matches.map(detailedProductText);
  } catch (error) {
    console.error("[telegram-market-prices] loading fast product snapshot failed", error);
    return ["دریافت قیمت محصولات موقتاً با خطا روبه‌رو شد. چند لحظه بعد دوباره امتحان کن."];
  }
}

async function getFastAlertConfig(): Promise<MarketPriceAlertConfig> {
  const now = Date.now();
  if (cachedAlertConfig && cachedAlertConfig.expiresAt > now) return cachedAlertConfig.value;
  if (pendingAlertConfig) return pendingAlertConfig;

  pendingAlertConfig = getMarketPriceAlertConfig()
    .then((value) => {
      cachedAlertConfig = { value, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
      return value;
    })
    .finally(() => {
      pendingAlertConfig = null;
    });
  return pendingAlertConfig;
}

export async function GET() {
  const webhook = await ensureMarketPriceTelegramWebhook();
  return Response.json(
    {
      ok: true,
      service: "sepiid-market-price-telegram",
      endpoint: "/api/telegram/market-prices",
      capabilities: ["fast-price-snapshot", "fuzzy-product-search", "prices", "status", "ping"],
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

  const command = commandName(text);
  const normalized = normalizeBasic(text);
  const isPriceList =
    command === "/prices" ||
    normalized === normalizeBasic("💰 قیمت محصولات") ||
    normalized === "قیمت محصولات" ||
    normalized === "لیست قیمت";
  const isPriceSearch = command === "/price" || (!command.startsWith("/") && normalized !== normalizeBasic("🔎 جستجوی قیمت"));
  const priceQuery = command === "/price" ? commandArgument(text) : text;
  const prefetchedPriceReplies = isPriceList
    ? priceReplies()
    : isPriceSearch && priceQuery
      ? priceReplies(priceQuery)
      : null;

  try {
    const config = await getFastAlertConfig();
    if (!config.telegramBotToken || !config.telegramChatId) {
      return Response.json({ ok: true, ignored: true, reason: "telegram-not-configured" });
    }

    if (String(incomingChatId) !== config.telegramChatId) {
      return Response.json({ ok: true, ignored: true, reason: "chat-not-authorized" });
    }

    let replies: string[] = [];
    if (
      command === "/start" ||
      command === "/help" ||
      normalized === normalizeBasic("❓ راهنما")
    ) {
      replies = [helpText()];
    } else if (
      command === "/ping" ||
      normalized === normalizeBasic("✅ تست اتصال")
    ) {
      replies = ["اتصال ربات سپید بیوتی برقرار است ✅"];
    } else if (
      command === "/status" ||
      normalized === normalizeBasic("📡 وضعیت ربات")
    ) {
      const webhook = await ensureMarketPriceTelegramWebhook();
      replies = [
        webhook.ok
          ? "پایش خودکار قیمت و وب‌هوک تلگرام فعال‌اند ✅"
          : `پایش زمان‌بندی‌شده فعال است؛ وضعیت وب‌هوک نیاز به بررسی دارد: ${webhook.error || webhook.lastErrorMessage || "نامشخص"}`,
      ];
    } else if (isPriceList) {
      replies = await prefetchedPriceReplies!;
    } else if (normalized === normalizeBasic("🔎 جستجوی قیمت")) {
      replies = ["نام محصول را هرطور راحتی بنویس؛ فاصله، نیم‌فاصله، فارسی/انگلیسی و غلط املایی جزئی را جستجوی هوشمند تحمل می‌کند."];
    } else if (command === "/price") {
      replies = priceQuery
        ? await prefetchedPriceReplies!
        : ["بعد از /price بخشی از نام محصول را بنویس؛ مثلاً: /price فیوژن هرمن"];
    } else if (command.startsWith("/")) {
      replies = [helpText()];
    } else {
      replies = await prefetchedPriceReplies!;
    }

    let delivered = true;
    for (let index = 0; index < replies.length; index += 1) {
      const delivery = await sendMarketPriceTelegramMessage(
        config.telegramChatId,
        replies[index],
        {
          botToken: config.telegramBotToken,
          replyMarkup: index === replies.length - 1 ? MAIN_KEYBOARD : undefined,
        },
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
