import { revalidateTag } from "next/cache";
import { catalogProducts } from "../catalog";
import type { CmsProduct } from "./cms-types";
import {
  MARKET_PROVIDER_LABELS,
  MARKET_PROVIDERS,
  type CmsPricingState,
  type MarketPriceHistoryEntry,
  type MarketPriceProposal,
  type MarketPriceSample,
  type MarketProvider,
  type MarketSourceConfig,
} from "./pricing-types";
import { STOREFRONT_CATALOG_TAG } from "./storefront-catalog";
import {
  approveProductPricingProposal,
  getProduct,
  listAllProductsForPricing,
  updateProductPricingState,
  WooCommerceError,
} from "./woocommerce";

const FETCH_TIMEOUT_MS = 14_000;
const MIN_VALID_PRICE_TOMAN = 100_000;
const MAX_VALID_PRICE_TOMAN = 1_000_000_000;
const MAX_HISTORY_ITEMS = 30;
const MIN_VALID_SOURCES = 3;

type MarketPricingScanMode = "review" | "initial-apply";

const PROVIDER_HOSTS: Record<MarketProvider, string[]> = {
  sayancenter: ["sayancenter.com", "www.sayancenter.com"],
  rokateb: ["rokateb.ir", "www.rokateb.ir"],
  torob: ["torob.com", "www.torob.com"],
  digikala: ["digikala.com", "www.digikala.com", "affiliate.digikala.com"],
};

const AUTO_DISCOVERY_BASE: Partial<Record<MarketProvider, string>> = {
  sayancenter: "https://sayancenter.com",
  rokateb: "https://rokateb.ir",
};

// Direct product pages are curated because Torob search pages are not crawled.
// A missing entry is intentional: no automatic match is safer than a wrong pack/model.
const CURATED_TOROB_URLS: Record<string, string> = {
  "alcarisa-family":
    "https://torob.com/p/00687382-3baa-4b79-a4e0-099c7c89673b/الکاریسا/",
  "revofil-ultra":
    "https://torob.com/p/027b7525-a644-4b1d-a045-0576c2b105f6/فیلر-رووفیل-اولترا-1-سی-سی/",
  rabianca:
    "https://torob.com/p/ec05555d-91fc-4b8f-9a4c-fee666242194/بادی-رابیانکا-rabianca-70cc/",
  "eptq-1ml":
    "https://torob.com/p/5f561747-70b4-4d57-bd99-09d2095be1dc/ژل-ای-پی-تی-کیو-eptq-s-100/",
  "neuramis-deep-lidocaine":
    "https://torob.com/p/37037f7f-8f70-4cf0-bafc-78334f5d436c/فیلر-نورامیس-دیپ-لیدوکایین-1-میلی-لیتر/",
  "hyamax-contour":
    "https://torob.com/p/bab3f672-76d8-4766-aa57-3e97307f680a/هایومکس-کانتور-طلایی-hyamax-golden-contour-10-cc/",
  "cg-dimono-ptx":
    "https://torob.com/p/22057a76-63e8-459e-bf23-17731bf9baa3/فیلر-پپتیدی-سی-جی-دیمونو-پی-تی-ایکس/",
  "luxiva-mesogel":
    "https://torob.com/p/41f0173b-3b27-49d6-84ac-67b237825dea/کوکتل-جوانساز-لوکسیوا-16-میلی-لیتر-پک-کامل-4-عددی/",
  perleux:
    "https://torob.com/p/8a06a9e6-c482-46a8-b393-6225d852e6b8/مزوژل-پرلوکس-perleux-دو-سی-سی/",
  "audrey-m":
    "https://torob.com/p/bdba1a9e-d7b5-42b3-aecf-460f3a506af7/فیلر-اودری-ام-10-میل/",
  "inovosense-family":
    "https://torob.com/p/6ffc6b5c-6ffb-4b03-b9bf-124456731f34/ژل-فیلر-اینووسنس-اسمایل-inovosense-smile-اصلی/",
  "dr-cyj-hair-filler":
    "https://torob.com/p/001e63b3-ec6e-4317-96a7-654f6e1f3186/هیرفیلر-دکتر-سی-وای-جی-drcyj-hair-filler/",
  "jalupro-hmw":
    "https://torob.com/p/3e2e5776-d3c1-426d-99ff-fe97207e02ec/مزوژل-جالپرو-کلاسیک-ابی/",
  masport:
    "https://torob.com/p/2ec7d3e5-8274-4357-98f5-f839ea4a53b3/بوتاکس-مسپورت-500-واحد/",
  "dyston-500":
    "https://torob.com/p/59dde102-7ca3-422c-ad56-465733a366a5/بوتاکس-دیستون-500-واحدی-داروخانه-ای/",
  "liporase-1500":
    "https://torob.com/p/b85e4fbb-5a01-48ba-9941-11b7f5cf6f2b/آنزیم-کره-ای-لیپوراز-1500-واحد/",
  "hyalase-1500":
    "https://torob.com/p/fceb5d5f-1d3a-4fcc-a2cc-5f274094fb7d/آنزیم-هیالاز-انگلیسی-1500-واحدی-10-میلی-لیتر/",
};

const STOP_WORDS = new Set([
  "خرید",
  "قیمت",
  "محصول",
  "اصل",
  "اصلی",
  "اورجینال",
  "دارای",
  "مدل",
  "ژل",
  "فیلر",
  "مزوژل",
  "کوکتل",
  "بوتاکس",
  "تومان",
  "the",
  "with",
  "for",
]);

type StoreApiProduct = {
  name?: string;
  permalink?: string;
  is_purchasable?: boolean;
  is_in_stock?: boolean;
  prices?: {
    price?: string;
    currency_code?: string;
    currency_minor_unit?: number;
  };
};

type ParsedPage = {
  name: string;
  pricesToman: number[];
  inStock: boolean;
};

export type MarketPricingProduct = Pick<
  CmsProduct,
  "id" | "name" | "slug" | "sku" | "price" | "regularPrice" | "salePrice" | "pricing"
>;

export type MarketPricingDashboard = {
  products: MarketPricingProduct[];
  generatedAt: string;
};

export type MarketPricingScanSummary = {
  startedAt: string;
  finishedAt: string;
  checkedProducts: number;
  proposalsCreated: number;
  pricesApplied: number;
  insufficientProducts: number;
  failedProducts: number;
  skippedProducts: number;
};

function toLatinDigits(value: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return value
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)));
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function normalizeName(value: string): string {
  return toLatinDigits(stripTags(value))
    .toLocaleLowerCase("fa")
    .replace(/[ك]/g, "ک")
    .replace(/[يى]/g, "ی")
    .replace(/[^\p{L}\p{N}.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameTokens(value: string): Set<string> {
  return new Set(
    normalizeName(value)
      .split(" ")
      .filter((token) => token.length >= 2 && !STOP_WORDS.has(token)),
  );
}

function matchScore(expected: string, actual: string): number {
  const first = nameTokens(expected);
  const second = nameTokens(actual);
  if (!first.size || !second.size) return 0;
  let matches = 0;
  for (const token of first) {
    if (second.has(token)) matches += 1;
  }
  return matches / Math.min(first.size, second.size);
}

function volumes(value: string): number[] {
  const normalized = normalizeName(value).replace(/سی\s*سی/gu, "ml");
  return Array.from(
    normalized.matchAll(/(\d+(?:\.\d+)?)\s*(?:ml|میلی\s*لیتر)/giu),
    (match) => Number(match[1]),
  ).filter((volume) => Number.isFinite(volume));
}

function compatibleVolume(expected: string, actual: string): boolean {
  const expectedVolumes = volumes(expected);
  const actualVolumes = volumes(actual);
  if (!expectedVolumes.length || !actualVolumes.length) return true;
  return expectedVolumes.some((volume) => actualVolumes.includes(volume));
}

function expectedMarketIdentity(product: CmsProduct): string {
  const catalogProduct = catalogProducts.find((item) => item.slug === product.slug);
  return [
    product.name,
    catalogProduct?.nameEn,
    catalogProduct?.volume,
    catalogProduct?.priceNote,
  ]
    .filter(Boolean)
    .join(" ");
}

function isValidPrice(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= MIN_VALID_PRICE_TOMAN &&
    value <= MAX_VALID_PRICE_TOMAN
  );
}

function priceToToman(
  rawValue: unknown,
  currency = "IRT",
  minorUnit = 0,
): number | null {
  const normalized = toLatinDigits(String(rawValue ?? ""))
    .replace(/[٬،,\s]/g, "")
    .replace(/٫/g, ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  let value = parsed / 10 ** Math.max(0, minorUnit);
  if (currency.toUpperCase() === "IRR") value /= 10;
  const rounded = Math.round(value);
  return isValidPrice(rounded) ? rounded : null;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function roundMarketPrice(value: number): number {
  return Math.round(value / 10_000) * 10_000;
}

function walkJson(value: unknown, visit: (item: Record<string, unknown>) => void) {
  if (Array.isArray(value)) {
    value.forEach((item) => walkJson(item, visit));
    return;
  }
  if (!value || typeof value !== "object") return;
  const object = value as Record<string, unknown>;
  visit(object);
  Object.values(object).forEach((item) => walkJson(item, visit));
}

function jsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/giu;
  for (const match of html.matchAll(pattern)) {
    try {
      blocks.push(JSON.parse(decodeHtml(match[1]).trim()));
    } catch {
      // Invalid third-party JSON-LD is ignored; other fallbacks remain available.
    }
  }
  return blocks;
}

function extractPage(html: string): ParsedPage {
  const prices: number[] = [];
  let name = "";
  let inStock = true;
  let structuredAvailabilityFound = false;
  const productObjects: Record<string, unknown>[] = [];

  for (const block of jsonLdBlocks(html)) {
    walkJson(block, (item) => {
      const type = String(item["@type"] ?? "").toLocaleLowerCase("en");
      if (type.includes("product")) productObjects.push(item);
    });
  }

  const primaryProduct = productObjects[0];
  if (primaryProduct) {
    if (typeof primaryProduct.name === "string") {
      name = stripTags(primaryProduct.name);
    }
    walkJson(primaryProduct.offers, (item) => {
      const type = String(item["@type"] ?? "").toLocaleLowerCase("en");
      if (type.includes("offer") || "price" in item || "lowPrice" in item) {
        const currency = String(item.priceCurrency ?? item.currency ?? "IRT");
        for (const candidate of [item.price, item.lowPrice]) {
          const price = priceToToman(candidate, currency);
          if (price) prices.push(price);
        }
        if (item.availability) {
          structuredAvailabilityFound = true;
          if (String(item.availability).includes("OutOfStock")) inStock = false;
        }
      }
    });
  }

  if (!name) {
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/iu)?.[1];
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/iu)?.[1];
    name = stripTags(h1 || title || "");
  }

  if (!prices.length) {
    const contentPricePattern = /(?:itemprop=["']price["'][^>]*content|property=["']product:price:amount["'][^>]*content)=["']([^"']+)["']/giu;
    for (const match of html.matchAll(contentPricePattern)) {
      const price = priceToToman(match[1], "IRT");
      if (price) prices.push(price);
    }
  }

  if (!prices.length) {
    const h1Index = html.search(/<h1\b/iu);
    let priceScope = h1Index >= 0 ? html.slice(h1Index) : html;
    const cutoffs = [
      priceScope.search(/محصولات\s+(?:مشابه|مرتبط)/iu),
      priceScope.search(/related\s+products/iu),
      priceScope.search(/<footer\b/iu),
    ].filter((index) => index > 0);
    if (cutoffs.length) priceScope = priceScope.slice(0, Math.min(...cutoffs));
    const text = toLatinDigits(stripTags(priceScope));
    const tomanPattern = /([0-9][0-9.,٬،٫\s]{3,18})\s*تومان/giu;
    for (const match of text.matchAll(tomanPattern)) {
      const price = priceToToman(match[1], "IRT");
      if (price) prices.push(price);
    }
  }

  if (!structuredAvailabilityFound) {
    const h1Index = html.search(/<h1\b/iu);
    const availabilityScope = stripTags(
      h1Index >= 0 ? html.slice(h1Index, h1Index + 20_000) : html.slice(0, 20_000),
    );
    inStock = !/OutOfStock|ناموجود|اتمام موجودی/iu.test(availabilityScope);
  }

  return {
    name,
    pricesToman: [...new Set(prices)].sort((a, b) => a - b),
    inStock,
  };
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "user-agent":
          "SepiidBeautyPriceMonitor/1.0 (+https://www.sepiidbeauty.ir/contact)",
      },
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`منبع با خطای ${response.status} پاسخ داد.`);
    }
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function validateSourceUrl(provider: MarketProvider, value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("آدرس منبع باید HTTPS باشد.");
  if (!PROVIDER_HOSTS[provider].includes(url.hostname.toLocaleLowerCase("en"))) {
    throw new Error(`آدرس واردشده متعلق به ${MARKET_PROVIDER_LABELS[provider]} نیست.`);
  }
  return url.toString();
}

async function sampleFromUrl(
  product: CmsProduct,
  source: MarketSourceConfig,
): Promise<MarketPriceSample> {
  if (source.provider === "digikala" && process.env.DIGIKALA_PRICE_ACCESS_ENABLED !== "true") {
    throw new Error("دسترسی رسمی API یا افیلیت دیجی‌کالا هنوز فعال نشده است.");
  }

  const url = validateSourceUrl(source.provider, source.url);
  const page = extractPage(await fetchText(url));
  if (!page.name || !page.pricesToman.length) {
    throw new Error("نام یا قیمت معتبر از صفحه محصول استخراج نشد.");
  }
  const expectedIdentity = expectedMarketIdentity(product);
  const score = matchScore(expectedIdentity, page.name);
  if (score < 0.34 || !compatibleVolume(expectedIdentity, page.name)) {
    throw new Error("مدل یا حجم محصول با صفحه منبع تطبیق ندارد.");
  }
  if (!page.inStock) throw new Error("محصول در این منبع ناموجود است.");

  return {
    provider: source.provider,
    sourceLabel: MARKET_PROVIDER_LABELS[source.provider],
    url,
    productName: page.name,
    priceToman: Math.round(median(page.pricesToman)),
    checkedAt: new Date().toISOString(),
    inStock: true,
    matchScore: score,
  };
}

function discoveryQuery(product: CmsProduct): string {
  const normalized = stripTags(expectedMarketIdentity(product))
    .replace(/[|()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.slice(0, 72);
}

async function discoverWooStoreSample(
  product: CmsProduct,
  provider: MarketProvider,
): Promise<{ source: MarketSourceConfig; sample: MarketPriceSample } | null> {
  const base = AUTO_DISCOVERY_BASE[provider];
  if (!base) return null;
  const url = new URL("/wp-json/wc/store/v1/products", base);
  url.searchParams.set("search", discoveryQuery(product));
  url.searchParams.set("per_page", "12");
  const raw = await fetchText(url.toString());
  const products = JSON.parse(raw) as StoreApiProduct[];
  if (!Array.isArray(products)) return null;

  const ranked = products
    .map((candidate) => ({
      candidate,
      score: matchScore(expectedMarketIdentity(product), candidate.name ?? ""),
    }))
    .filter(
      ({ candidate, score }) =>
        score >= 0.5 &&
        compatibleVolume(expectedMarketIdentity(product), candidate.name ?? "") &&
        candidate.is_in_stock !== false &&
        candidate.is_purchasable !== false &&
        Boolean(candidate.permalink),
    )
    .sort((first, second) => second.score - first.score);

  const best = ranked[0];
  if (!best?.candidate.prices?.price || !best.candidate.permalink) return null;
  const price = priceToToman(
    best.candidate.prices.price,
    best.candidate.prices.currency_code,
    best.candidate.prices.currency_minor_unit,
  );
  if (!price) return null;

  const source: MarketSourceConfig = {
    provider,
    url: validateSourceUrl(provider, best.candidate.permalink),
    enabled: true,
    discovered: true,
  };
  return {
    source,
    sample: {
      provider,
      sourceLabel: MARKET_PROVIDER_LABELS[provider],
      url: source.url,
      productName: best.candidate.name ?? product.name,
      priceToman: price,
      checkedAt: new Date().toISOString(),
      inStock: true,
      matchScore: best.score,
    },
  };
}

function currentPrice(product: CmsProduct): number | null {
  const value = Number(product.salePrice || product.regularPrice || product.price);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

function supersededHistory(state: CmsPricingState, decidedAt: string): MarketPriceHistoryEntry[] {
  const next = [...state.history];
  if (state.proposal) {
    next.unshift({
      id: state.proposal.id,
      createdAt: state.proposal.createdAt,
      proposedPriceToman: state.proposal.proposedPriceToman,
      currentPriceToman: state.proposal.currentPriceToman,
      sampleCount: state.proposal.samples.length,
      decision: "superseded",
      decidedAt,
    });
  }
  return next.slice(0, MAX_HISTORY_ITEMS);
}

async function scanProduct(
  product: CmsProduct,
  mode: MarketPricingScanMode,
): Promise<"proposal" | "applied" | "insufficient" | "failed" | "skipped"> {
  const checkedAt = new Date().toISOString();
  const sources = product.pricing.sources.map((source) => ({ ...source }));
  const samples: MarketPriceSample[] = [];
  const errors: string[] = [];

  for (const provider of MARKET_PROVIDERS) {
    const source = sources.find((item) => item.provider === provider);
    if (!source?.enabled) continue;

    try {
      if (!source.url && provider === "torob" && CURATED_TOROB_URLS[product.slug]) {
        source.url = CURATED_TOROB_URLS[product.slug];
        source.discovered = true;
      }
      if (!source.url && AUTO_DISCOVERY_BASE[provider]) {
        const discovered = await discoverWooStoreSample(product, provider);
        if (!discovered) {
          errors.push(`${MARKET_PROVIDER_LABELS[provider]}: تطبیق خودکار پیدا نشد`);
          continue;
        }
        Object.assign(source, discovered.source);
        samples.push(discovered.sample);
        continue;
      }
      if (!source.url) continue;
      samples.push(await sampleFromUrl(product, source));
    } catch (error) {
      errors.push(
        `${MARKET_PROVIDER_LABELS[provider]}: ${
          error instanceof Error ? error.message : "خطای نامشخص"
        }`,
      );
    }
  }

  if (!samples.length && !sources.some((source) => source.url) && !errors.length) {
    return "skipped";
  }

  const unique = Array.from(
    new Map(samples.map((sample) => [sample.provider, sample])).values(),
  );
  const center = unique.length ? median(unique.map((sample) => sample.priceToman)) : 0;
  const included = unique.filter(
    (sample) => sample.priceToman >= center * 0.65 && sample.priceToman <= center * 1.55,
  );
  const excluded = unique.filter((sample) => !included.includes(sample));
  const oldHistory = supersededHistory(product.pricing, checkedAt);

  if (included.length < MIN_VALID_SOURCES) {
    await updateProductPricingState(product.id, {
      ...product.pricing,
      sources,
      proposal: null,
      history: oldHistory,
      lastCheckedAt: checkedAt,
      lastStatus: errors.length && !included.length ? "error" : "insufficient",
      lastMessage:
        included.length > 0
          ? `فقط ${included.length} قیمت معتبر پیدا شد؛ حداقل ${MIN_VALID_SOURCES} منبع لازم است.`
          : errors.slice(0, 3).join(" | ") || "قیمت معتبر کافی پیدا نشد.",
    });
    return errors.length && !included.length ? "failed" : "insufficient";
  }

  const rawAverage = included.reduce((sum, sample) => sum + sample.priceToman, 0) / included.length;
  const proposed = roundMarketPrice(rawAverage);
  const activePrice = currentPrice(product);

  if (activePrice === proposed) {
    await updateProductPricingState(product.id, {
      ...product.pricing,
      sources,
      proposal: null,
      history: oldHistory,
      lastCheckedAt: checkedAt,
      initialAppliedAt:
        mode === "initial-apply" && !product.pricing.initialAppliedAt
          ? checkedAt
          : product.pricing.initialAppliedAt,
      lastStatus: "insufficient",
      lastMessage: "قیمت فعلی با میانگین معتبر بازار برابر است؛ تغییری لازم نیست.",
    });
    return "insufficient";
  }

  const proposal: MarketPriceProposal = {
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: checkedAt,
    currentPriceToman: activePrice,
    proposedPriceToman: proposed,
    rawAverageToman: Math.round(rawAverage),
    samples: included,
    excludedSamples: excluded,
    note:
      excluded.length > 0
        ? `${excluded.length} قیمت پرت از میانگین حذف شد.`
        : "میانگین از قیمت‌های معتبر و غیرتکراری محاسبه شد.",
  };

  if (mode === "initial-apply" && !product.pricing.initialAppliedAt) {
    const pricing: CmsPricingState = {
      ...product.pricing,
      sources,
      proposal: null,
      history: [
        {
          id: proposal.id,
          createdAt: proposal.createdAt,
          proposedPriceToman: proposal.proposedPriceToman,
          currentPriceToman: proposal.currentPriceToman,
          sampleCount: proposal.samples.length,
          decision: "initial_applied" as const,
          decidedAt: checkedAt,
        },
        ...oldHistory,
      ].slice(0, MAX_HISTORY_ITEMS),
      lastCheckedAt: checkedAt,
      initialAppliedAt: checkedAt,
      lastStatus: "approved",
      lastMessage: `قیمت اولیه با مجوز مدیر از میانگین ${included.length} منبع معتبر اعمال شد.`,
    };
    await approveProductPricingProposal(product.id, proposed, pricing);
    revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });
    return "applied";
  }

  await updateProductPricingState(product.id, {
    ...product.pricing,
    sources,
    proposal,
    history: oldHistory,
    lastCheckedAt: checkedAt,
    lastStatus: "pending",
    lastMessage: `پیشنهاد جدید از ${included.length} منبع معتبر آماده تأیید است.`,
  });
  return "proposal";
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(values[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => worker()),
  );
  return results;
}

export async function getMarketPricingDashboard(): Promise<MarketPricingDashboard> {
  const products = await listAllProductsForPricing();
  return {
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: product.price,
      regularPrice: product.regularPrice,
      salePrice: product.salePrice,
      pricing: product.pricing,
    })),
    generatedAt: new Date().toISOString(),
  };
}

export async function runMarketPricingScan(
  mode: MarketPricingScanMode = "review",
): Promise<MarketPricingScanSummary> {
  const startedAt = new Date().toISOString();
  const products = await listAllProductsForPricing();
  const results = await mapWithConcurrency(products, 3, async (product) => {
    try {
      return await scanProduct(product, mode);
    } catch {
      return "failed" as const;
    }
  });

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    checkedProducts: results.filter((result) => result !== "skipped").length,
    proposalsCreated: results.filter((result) => result === "proposal").length,
    pricesApplied: results.filter((result) => result === "applied").length,
    insufficientProducts: results.filter((result) => result === "insufficient").length,
    failedProducts: results.filter((result) => result === "failed").length,
    skippedProducts: results.filter((result) => result === "skipped").length,
  };
}

export function normalizeSourceConfigs(value: unknown): MarketSourceConfig[] {
  if (!Array.isArray(value)) {
    throw new WooCommerceError("فهرست منابع معتبر نیست.", 400, "invalid_market_sources");
  }
  const byProvider = new Map<MarketProvider, MarketSourceConfig>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const source = item as Partial<MarketSourceConfig>;
    if (!MARKET_PROVIDERS.includes(source.provider as MarketProvider)) continue;
    const provider = source.provider as MarketProvider;
    const url = typeof source.url === "string" ? source.url.trim() : "";
    byProvider.set(provider, {
      provider,
      url: url ? validateSourceUrl(provider, url) : "",
      enabled: source.enabled !== false,
      discovered: false,
    });
  }
  return MARKET_PROVIDERS.map(
    (provider) =>
      byProvider.get(provider) ?? {
        provider,
        url: "",
        enabled: provider !== "digikala",
      },
  );
}

export async function saveMarketSources(
  productId: number,
  value: unknown,
): Promise<MarketPricingProduct> {
  const product = await getProduct(productId);
  const updated = await updateProductPricingState(productId, {
    ...product.pricing,
    sources: normalizeSourceConfigs(value),
  });
  return updated;
}

function decisionHistory(
  proposal: MarketPriceProposal,
  decision: "approved" | "rejected",
): MarketPriceHistoryEntry {
  return {
    id: proposal.id,
    createdAt: proposal.createdAt,
    proposedPriceToman: proposal.proposedPriceToman,
    currentPriceToman: proposal.currentPriceToman,
    sampleCount: proposal.samples.length,
    decision,
    decidedAt: new Date().toISOString(),
  };
}

export async function approveMarketProposal(
  productId: number,
  proposalId: string,
): Promise<MarketPricingProduct> {
  const product = await getProduct(productId);
  const proposal = product.pricing.proposal;
  if (!proposal || proposal.id !== proposalId) {
    throw new WooCommerceError(
      "این پیشنهاد دیگر معتبر نیست؛ فهرست را تازه‌سازی کنید.",
      409,
      "stale_market_proposal",
    );
  }
  const pricing: CmsPricingState = {
    ...product.pricing,
    proposal: null,
    history: [decisionHistory(proposal, "approved"), ...product.pricing.history].slice(
      0,
      MAX_HISTORY_ITEMS,
    ),
    lastStatus: "approved",
    lastMessage: "قیمت پیشنهادی با تأیید مدیر روی محصول اعمال شد.",
  };
  const updated = await approveProductPricingProposal(
    productId,
    proposal.proposedPriceToman,
    pricing,
  );
  revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });
  return updated;
}

export async function rejectMarketProposal(
  productId: number,
  proposalId: string,
): Promise<MarketPricingProduct> {
  const product = await getProduct(productId);
  const proposal = product.pricing.proposal;
  if (!proposal || proposal.id !== proposalId) {
    throw new WooCommerceError(
      "این پیشنهاد دیگر معتبر نیست؛ فهرست را تازه‌سازی کنید.",
      409,
      "stale_market_proposal",
    );
  }
  return updateProductPricingState(productId, {
    ...product.pricing,
    proposal: null,
    history: [decisionHistory(proposal, "rejected"), ...product.pricing.history].slice(
      0,
      MAX_HISTORY_ITEMS,
    ),
    lastStatus: "rejected",
    lastMessage: "پیشنهاد قیمت توسط مدیر رد شد.",
  });
}
