import { createHash, timingSafeEqual } from "node:crypto";
import { waitUntil } from "@vercel/functions";
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
import { listNewMarketPricingProposalAlerts } from "@/app/lib/market-pricing";
import { sendMarketPriceAlerts } from "@/app/lib/market-price-alerts";
import { runTorobMarketPricingBatch } from "@/app/lib/market-pricing-comprehensive";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FULL_SCAN_BUTTON = "🔄 پایش خودکار قیمت بازار";
const FULL_SCAN_BATCH_SIZE = 4;

const MAIN_KEYBOARD: TelegramReplyMarkup = {
  keyboard: [
    [{ text: "🔎 جستجوی محصول" }, { text: "💰 قیمت محصولات" }],
    [{ text: FULL_SCAN_BUTTON }],
    [{ text: "🗂 دسته‌بندی‌ها" }],
  ],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: "نام محصول را هرطور راحتی بنویس…",
};

const CATEGORY_OPTIONS = [
  { slug: "fillers", label: "💉 فیلرها" },
  { slug: "skin-boosters", label: "✨ مزوژل و اسکین‌بوستر" },
  { slug: "botulinum-toxins", label: "🧊 بوتاکس" },
  { slug: "rejuvenation-cocktails", label: "🌿 کوکتل جوان‌سازی" },
  { slug: "brightening-cocktails", label: "☀️ روشن‌کننده و ضدلک" },
  { slug: "eye-cocktails", label: "👁 دور چشم" },
  { slug: "hair-cocktails", label: "💇 مو و پوست سر" },
  { slug: "hyaluronidase-products", label: "🧬 هیالورونیداز" },
] as const;

const CATEGORY_KEYBOARD: TelegramReplyMarkup = {
  keyboard: [
    [{ text: CATEGORY_OPTIONS[0].label }, { text: CATEGORY_OPTIONS[1].label }],
    [{ text: CATEGORY_OPTIONS[2].label }, { text: CATEGORY_OPTIONS[3].label }],
    [{ text: CATEGORY_OPTIONS[4].label }, { text: CATEGORY_OPTIONS[5].label }],
    [{ text: CATEGORY_OPTIONS[6].label }, { text: CATEGORY_OPTIONS[7].label }],
    [{ text: "⬅️ منوی اصلی" }],
  ],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: "یک دسته را انتخاب کن…",
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
  sepiid_market_scan?: {
    cursor?: number;
    startedAt?: string;
    processed?: number;
    matched?: number;
    unresolved?: number;
    failed?: number;
  };
};

type MarketScanState = {
  cursor: number;
  startedAt: string;
  processed: number;
  matched: number;
  unresolved: number;
  failed: number;
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
  const fieldRepresentations = fields
    .flatMap((field) => [normalizeBasic(field), canonicalize(field)])
    .filter(Boolean);
  const compactQuery = queryRepresentations.map((value) => value.replace(/\s+/gu, ""));
  const compactFields = fieldRepresentations.map((value) => value.replace(/\s+/gu, ""));

  const exactPhrase = compactQuery.some((queryValue) =>
    compactFields.some((field) => field === queryValue),
  );
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
    .sort(
      (left, right) =>
        right.score - left.score || left.product.nameFa.localeCompare(right.product.nameFa, "fa"),
    );

  if (!ranked.length) return [];
  const bestScore = ranked[0].score;
  const relativeFloor = Math.max(
    queryTokens.length === 1 ? 0.62 : 0.56,
    bestScore - (queryTokens.length === 1 ? 0.08 : 0.2),
  );
  return ranked
    .filter(({ score }) => score >= relativeFloor)
    .slice(0, 10)
    .map(({ product }) => product);
}

function numberValue(value: string): number | null {
  const parsed = Number(value.replace(/,/gu, "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toman(value: number | null): string {
  return value ? `${priceFormatter.format(Math.round(value))} تومان` : "قیمت در حال بررسی";
}

function activeProductPrice(product: StorefrontProduct): number | null {
  return (
    (Number.isFinite(product.priceToman) && Number(product.priceToman) > 0
      ? Number(product.priceToman)
      : null) ??
    numberValue(product.salePrice) ??
    numberValue(product.price) ??
    numberValue(product.regularPrice)
  );
}

function welcomeText(): string {
  return [
    "سلام 👋 خوش اومدی به ربات قیمت سپید بیوتی",
    "",
    "اینجا می‌تونی خیلی سریع قیمت محصولات تخصصی زیبایی رو پیدا کنی:",
    "🔎 اسم محصول رو حتی با فاصله متفاوت یا غلط املایی جزئی بنویس",
    "💰 لیست قیمت همه محصولات رو ببین",
    `🔄 با «${FULL_SCAN_BUTTON}» قیمت بازار همه محصولات رو دوباره بررسی کن`,
    "🗂 از دسته‌بندی‌ها مستقیم به قیمت‌های همون گروه برو",
    "",
    "مثال: «فیوژن F هرمن»، «نورمیس دیپ» یا «Revofil»",
    "",
    "یکی از گزینه‌های پایین رو انتخاب کن یا همین الان اسم محصول رو بفرست.",
  ].join("\n");
}

function compactProductLine(product: StorefrontProduct): string {
  return `• ${product.nameFa}\n  ${toman(activeProductPrice(product))}`;
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
  const lines = [`💰 ${product.nameFa}`];

  if (product.nameEn && normalizeBasic(product.nameEn) !== normalizeBasic(product.nameFa)) {
    lines.push(product.nameEn);
  }
  lines.push(`قیمت فعلی: ${toman(active)}`);
  if (sale && regular && sale !== regular) {
    lines.push(`قیمت عادی: ${toman(regular)}`, `قیمت فروش ویژه: ${toman(sale)}`);
  }
  if (product.categoryTitle) lines.push(`دسته: ${product.categoryTitle}`);
  if (modifiedAt) lines.push(`آخرین بروزرسانی: ${modifiedAt}`);
  return lines.join("\n");
}

function chunkPriceList(products: StorefrontProduct[], title: string): string[] {
  if (!products.length) return ["در این بخش هنوز محصول قابل‌نمایشی پیدا نشد."];

  const messages: string[] = [];
  let current = `${title}\n\n`;
  for (const product of products) {
    const line = compactProductLine(product);
    if (current.length + line.length + 2 > PRICE_LIST_MESSAGE_LIMIT) {
      messages.push(current.trim());
      current = `${title} · ادامه\n\n`;
    }
    current += `${line}\n\n`;
  }
  current += "برای جزئیات فقط اسم محصول رو بفرست؛ لازم نیست املای دقیق باشه.";
  messages.push(current.trim());
  return messages;
}

async function priceReplies(query?: string): Promise<string[]> {
  try {
    const products = (await getStorefrontProducts()).sort((a, b) =>
      a.nameFa.localeCompare(b.nameFa, "fa"),
    );
    if (!query) return chunkPriceList(products, "💰 لیست قیمت محصولات سپید بیوتی");

    const matches = fuzzyProductMatches(products, query);
    if (!matches.length) {
      return [
        `برای «${query}» نتیجه مطمئنی پیدا نکردم. یک بخش دیگه از اسم، برند یا مدل رو هم بنویس؛ لازم نیست املای دقیق باشه.`,
      ];
    }
    return matches.map(detailedProductText);
  } catch (error) {
    console.error("[telegram-market-prices] loading fast product snapshot failed", error);
    return ["دریافت قیمت‌ها موقتاً با خطا روبه‌رو شد. چند لحظه بعد دوباره امتحان کن."];
  }
}

async function categoryMenuText(): Promise<string> {
  const products = await getStorefrontProducts();
  const lines = ["🗂 دسته‌بندی محصولات", "", "یک دسته رو انتخاب کن:"];
  for (const option of CATEGORY_OPTIONS) {
    const count = products.filter((product) => product.category === option.slug).length;
    lines.push(`${option.label} · ${priceFormatter.format(count)} محصول`);
  }
  return lines.join("\n");
}

async function categoryPriceReplies(slug: string, label: string): Promise<string[]> {
  const products = (await getStorefrontProducts())
    .filter((product) => product.category === slug)
    .sort((a, b) => a.nameFa.localeCompare(b.nameFa, "fa"));
  return chunkPriceList(products, `${label} · قیمت‌ها`);
}

function categoryFromInput(value: string): (typeof CATEGORY_OPTIONS)[number] | null {
  const normalized = normalizeBasic(value);
  return CATEGORY_OPTIONS.find((option) => normalizeBasic(option.label) === normalized) ?? null;
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

function safeScanState(value: TelegramUpdate["sepiid_market_scan"]): MarketScanState | null {
  if (!value || !value.startedAt || !Number.isFinite(Date.parse(value.startedAt))) return null;
  const number = (input: unknown) =>
    Number.isSafeInteger(input) && Number(input) >= 0 ? Number(input) : 0;
  return {
    cursor: number(value.cursor),
    startedAt: new Date(value.startedAt).toISOString(),
    processed: number(value.processed),
    matched: number(value.matched),
    unresolved: number(value.unresolved),
    failed: number(value.failed),
  };
}

function internalScanToken(botToken: string): string {
  return createHash("sha256")
    .update(`sepiid-market-scan-v1:${botToken}`)
    .digest("hex");
}

function validInternalScanRequest(request: Request, botToken: string): boolean {
  const received = request.headers.get("x-sepiid-market-scan-token") ?? "";
  const expected = internalScanToken(botToken);
  if (received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

function telegramEndpoint(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sepiidbeauty.ir")
    .replace(/\/+$/u, "");
  return `${base}/api/telegram/market-prices`;
}

async function sendBotText(config: MarketPriceAlertConfig, text: string): Promise<void> {
  const delivery = await sendMarketPriceTelegramMessage(config.telegramChatId, text, {
    botToken: config.telegramBotToken,
    replyMarkup: MAIN_KEYBOARD,
  });
  if (!delivery.ok) {
    console.error("[telegram-market-scan] progress delivery failed", delivery.error);
  }
}

async function continueMarketScan(
  state: MarketScanState,
  config: MarketPriceAlertConfig,
): Promise<void> {
  try {
    const summary = await runTorobMarketPricingBatch(state.cursor, FULL_SCAN_BATCH_SIZE);
    const next: MarketScanState = {
      cursor: summary.nextCursor ?? state.cursor + summary.processedProducts,
      startedAt: state.startedAt,
      processed: state.processed + summary.processedProducts,
      matched: state.matched + summary.matchedProducts,
      unresolved: state.unresolved + summary.unresolvedProducts,
      failed: state.failed + summary.failedProducts,
    };

    if (summary.nextCursor !== null) {
      const response = await fetch(telegramEndpoint(), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-sepiid-market-scan-token": internalScanToken(config.telegramBotToken),
          ...(process.env.MARKET_PRICE_TELEGRAM_WEBHOOK_SECRET
            ? {
                "x-telegram-bot-api-secret-token":
                  process.env.MARKET_PRICE_TELEGRAM_WEBHOOK_SECRET,
              }
            : {}),
        },
        body: JSON.stringify({ sepiid_market_scan: next }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Market scan continuation returned ${response.status}`);
      return;
    }

    const alerts = await listNewMarketPricingProposalAlerts(state.startedAt);
    await sendMarketPriceAlerts(alerts);
    await sendBotText(
      config,
      [
        "✅ پایش خودکار قیمت بازار کامل شد",
        "",
        `محصولات بررسی‌شده: ${priceFormatter.format(next.processed)}`,
        `قیمت معتبر پیدا شد: ${priceFormatter.format(next.matched)}`,
        `نیازمند بررسی دوباره: ${priceFormatter.format(next.unresolved)}`,
        `خطای موقت: ${priceFormatter.format(next.failed)}`,
        `پیشنهاد قیمت جدید: ${priceFormatter.format(alerts.length)}`,
        "",
        alerts.length
          ? "پیشنهادهای قیمت بازار در پیام‌های بعدی/قبلی همین گفتگو ارسال شدند."
          : "قیمت پیشنهادی جدیدی نسبت به آخرین پایش پیدا نشد.",
      ].join("\n"),
    );

    const currentPrices = await priceReplies();
    for (const message of currentPrices) await sendBotText(config, message);
  } catch (error) {
    console.error("[telegram-market-scan] batch failed", error);
    await sendBotText(
      config,
      "پایش قیمت بازار در این مرحله با خطای موقت روبه‌رو شد. دوباره دکمه پایش را بزن تا از ابتدا تلاش شود.",
    );
  }
}

export async function GET() {
  const webhook = await ensureMarketPriceTelegramWebhook();
  return Response.json(
    {
      ok: true,
      service: "sepiid-market-price-telegram",
      endpoint: "/api/telegram/market-prices",
      capabilities: [
        "fast-price-snapshot",
        "fuzzy-product-search",
        "categories",
        "clean-user-menu",
        "on-demand-full-market-scan",
      ],
      automaticScan: {
        enabled: true,
        schedule: "30 5,11 * * *",
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

  if (update.sepiid_market_scan) {
    const config = await getFastAlertConfig();
    const state = safeScanState(update.sepiid_market_scan);
    if (!state || !config.telegramBotToken || !validInternalScanRequest(request, config.telegramBotToken)) {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    waitUntil(continueMarketScan(state, config));
    return Response.json({ ok: true, accepted: true, cursor: state.cursor });
  }

  const message = telegramMessage(update);
  const incomingChatId = message?.chat?.id;
  const text = message?.text?.trim() ?? "";
  if (incomingChatId === undefined || !text) {
    return Response.json({ ok: true, ignored: true, reason: "unsupported-update" });
  }

  try {
    const configPromise = getFastAlertConfig();
    const command = commandName(text);
    const normalized = normalizeBasic(text);
    const category = categoryFromInput(text);

    let repliesPromise: Promise<string[]>;
    let replyMarkup: TelegramReplyMarkup = MAIN_KEYBOARD;

    if (
      command === "/start" ||
      command === "/help" ||
      normalized === normalizeBasic("⬅️ منوی اصلی")
    ) {
      repliesPromise = Promise.resolve([welcomeText()]);
    } else if (
      command === "/categories" ||
      normalized === normalizeBasic("🗂 دسته‌بندی‌ها")
    ) {
      repliesPromise = categoryMenuText().then((value) => [value]);
      replyMarkup = CATEGORY_KEYBOARD;
    } else if (category) {
      repliesPromise = categoryPriceReplies(category.slug, category.label);
    } else if (
      command === "/prices" ||
      normalized === normalizeBasic("💰 قیمت محصولات") ||
      normalized === "قیمت محصولات" ||
      normalized === "لیست قیمت"
    ) {
      repliesPromise = priceReplies();
    } else if (normalized === normalizeBasic(FULL_SCAN_BUTTON)) {
      repliesPromise = Promise.resolve([
        "🔄 پایش قیمت بازار همه محصولات شروع شد.\n\nربات محصولات را مرحله‌به‌مرحله از منابع بازار بررسی می‌کند و نتیجه کامل را بعد از پایان همین‌جا می‌فرستد. لازم نیست صفحه را باز نگه داری.",
      ]);
    } else if (normalized === normalizeBasic("🔎 جستجوی محصول")) {
      repliesPromise = Promise.resolve([
        "🔎 اسم محصول رو بفرست. می‌تونی فارسی یا انگلیسی بنویسی و لازم نیست فاصله‌ها یا املای اسم کاملاً دقیق باشه.",
      ]);
    } else if (command === "/price") {
      const query = commandArgument(text);
      repliesPromise = query
        ? priceReplies(query)
        : Promise.resolve([
            "بعد از /price بخشی از اسم محصول رو بنویس؛ مثلاً: /price فیوژن هرمن",
          ]);
    } else if (command === "/ping") {
      repliesPromise = Promise.resolve(["اتصال ربات برقرار است ✅"]);
    } else if (command === "/status") {
      repliesPromise = ensureMarketPriceTelegramWebhook().then((webhook) => [
        webhook.ok ? "پایش قیمت و وب‌هوک فعال‌اند ✅" : "وضعیت وب‌هوک نیاز به بررسی دارد.",
      ]);
    } else if (command.startsWith("/")) {
      repliesPromise = Promise.resolve([welcomeText()]);
    } else {
      repliesPromise = priceReplies(text);
    }

    const [config, replies] = await Promise.all([configPromise, repliesPromise]);
    if (!config.telegramBotToken || !config.telegramChatId) {
      return Response.json({ ok: true, ignored: true, reason: "telegram-not-configured" });
    }
    if (String(incomingChatId) !== config.telegramChatId) {
      return Response.json({ ok: true, ignored: true, reason: "chat-not-authorized" });
    }

    let delivered = true;
    for (let index = 0; index < replies.length; index += 1) {
      const delivery = await sendMarketPriceTelegramMessage(
        config.telegramChatId,
        replies[index],
        {
          botToken: config.telegramBotToken,
          replyMarkup: index === replies.length - 1 ? replyMarkup : undefined,
        },
      );
      if (!delivery.ok) {
        delivered = false;
        console.error("[telegram-market-prices] reply failed", delivery.error);
      }
    }

    if (normalized === normalizeBasic(FULL_SCAN_BUTTON)) {
      waitUntil(
        continueMarketScan(
          {
            cursor: 0,
            startedAt: new Date().toISOString(),
            processed: 0,
            matched: 0,
            unresolved: 0,
            failed: 0,
          },
          config,
        ),
      );
    }

    return Response.json({ ok: true, handled: true, delivered, messageCount: replies.length });
  } catch (error) {
    console.error("[telegram-market-prices] update handling failed", error);
    return Response.json({ ok: true, handled: false, error: "update-handling-failed" });
  }
}
