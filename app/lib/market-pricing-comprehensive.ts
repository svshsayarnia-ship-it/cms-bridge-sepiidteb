import { catalogProducts } from "../catalog";
import type { CmsProduct } from "./cms-types";
import { CURATED_TOROB_URLS } from "./market-pricing";
import { verifyMarketSamples } from "./market-price-verification";
import {
  MARKET_PROVIDER_LABELS,
  type MarketPriceHistoryEntry,
  type MarketPriceProposal,
  type MarketPriceSample,
  type MarketProvider,
  type MarketSourceConfig,
} from "./pricing-types";
import {
  listAllProductsForPricing,
  updateProductPricingState,
} from "./woocommerce";

const TOROB_SEARCH_URL = "https://api.torob.com/v4/base-product/search/";
const TOROB_SELLERS_URL = "https://api.torob.com/v4/base-product/sellers/";
const FETCH_TIMEOUT_MS = 7_000;
const MIN_VALID_PRICE_TOMAN = 100_000;
const MAX_VALID_PRICE_TOMAN = 1_000_000_000;
const MAX_TOROB_SELLERS = 5;
const MAX_DISCOVERY_QUERIES = 3;
const MAX_HISTORY_ITEMS = 30;
const DEFAULT_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 12;

type CuratedDirectSource = {
  url: string;
  label: string;
  expectedName: string;
};

const CURATED_DIRECT_SOURCES: Record<string, CuratedDirectSource> = {
  "ejal-40": {
    url: "https://tebsoo.co/product/%D9%85%D8%B2%D9%88%DA%98%D9%84-%D8%A7%D8%AC%D8%A7%D9%84/",
    label: "طب‌سو",
    expectedName: "مزوژل اجال Ejal 40 2ml",
  },
  perleux: {
    url: "https://tebsoo.co/product/perleux/",
    label: "طب‌سو",
    expectedName: "مزو ژل پرلوکس Perleux 2ml",
  },
  "audrey-m": {
    url: "https://mesotop.com/product/%DA%98%D9%84-%D8%A7%D9%88%D8%AF%D8%B1%DB%8C-10-%D8%B3%DB%8C-%D8%B3%DB%8C-%D9%85%D8%AF%D9%84-%D8%A7%D9%85/",
    label: "Mesotop",
    expectedName: "ژل اودری ام Audrey M 10ml",
  },
  "siax-100": {
    url: "https://capsoll.ir/product/%D8%A8%D9%88%D8%AA%D8%A7%DA%A9%D8%B3-%D8%B3%DB%8C%D8%A7%DA%A9%D8%B3/",
    label: "کپسول",
    expectedName: "بوتاکس سیاکس Siax 100U",
  },
};


type WooMarketStore = {
  provider: Extract<MarketProvider, "sayancenter" | "rokateb" | "noavaransalamat">;
  baseUrl: string;
};

const WOO_MARKET_STORES: WooMarketStore[] = [
  { provider: "sayancenter", baseUrl: "https://sayancenter.com" },
  { provider: "rokateb", baseUrl: "https://rokateb.ir" },
  { provider: "noavaransalamat", baseUrl: "https://noavaransalamat.ir" },
];

type WooStoreProduct = {
  name?: string;
  permalink?: string;
  is_in_stock?: boolean;
  is_purchasable?: boolean;
  prices?: {
    price?: string;
    currency_code?: string;
    currency_minor_unit?: number;
  };
};

const GENERIC_TOKENS = new Set([
  "خرید",
  "قیمت",
  "محصول",
  "محصولات",
  "اصل",
  "اصلی",
  "اورجینال",
  "مدل",
  "ژل",
  "فیلر",
  "مزوژل",
  "کوکتل",
  "بوتاکس",
  "تومان",
  "filler",
  "mesogel",
  "cocktail",
  "botox",
  "product",
  "the",
  "with",
  "for",
]);

type TorobSearchCandidate = {
  random_key?: string;
  name1?: string;
  name2?: string;
  price?: number | string | null;
  min_price?: number | string | null;
  web_client_absolute_url?: string;
  is_adv?: boolean;
  availability?: boolean;
  stock_status?: string;
};

type TorobSearchResponse = {
  results?: TorobSearchCandidate[];
};

type TorobSeller = {
  price?: number | string | null;
  shop_name?: string;
  shop_name2?: string;
  name?: string;
  availability?: boolean;
  is_available?: boolean;
  stock_status?: string;
};

type TorobSellerResponse = {
  results?: TorobSeller[];
};

type RankedTorobCandidate = {
  candidate: TorobSearchCandidate;
  name: string;
  score: number;
};

type ProductScanResult = {
  slug: string;
  status:
    | "proposal"
    | "same-proposal"
    | "market-equal"
    | "unresolved"
    | "failed";
};

export type TorobMarketPricingBatchSummary = {
  startedAt: string;
  finishedAt: string;
  cursor: number;
  limit: number;
  totalProducts: number;
  processedProducts: number;
  nextCursor: number | null;
  matchedProducts: number;
  proposalsCreated: number;
  sameProposalProducts: number;
  marketEqualProducts: number;
  unresolvedProducts: number;
  failedProducts: number;
  matchedSlugs: string[];
  unresolvedSlugs: string[];
};

function toLatinDigits(value: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return value
    .replace(/[۰-۹]/gu, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/gu, (digit) => String(arabic.indexOf(digit)));
}

function normalizeBasic(value: string): string {
  return toLatinDigits(value)
    .toLowerCase()
    .replace(/ي|ى/gu, "ی")
    .replace(/ك/gu, "ک")
    .replace(/ة/gu, "ه")
    .replace(/[\u064b-\u065f\u0670]/gu, "")
    .replace(/[\u200c\u200d\u200e\u200f\u202a-\u202e]/gu, " ")
    .replace(/[^\p{L}\p{N}.]+/gu, " ")
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
    .replace(/ایجال/gu, " ejal ")
    .replace(/نابوتا/gu, " nabota ")
    .replace(/نورونوکس/gu, " neuronox ")
    .replace(/دیسپورت/gu, " dysport ")
    .replace(/هیرمن|هيرمن|هرمن/gu, " hair men ")
    .replace(/(?:هیر|هير|هر)\s*من/gu, " hair men ")
    .replace(/هیر|هير/gu, " hair ")
    .replace(/(^|\s)اف(?=\s|$)/gu, "$1 f ")
    .replace(/والیوم|ولوم/gu, " volume ")
    .replace(/دیپ/gu, " deep ")
    .replace(/لیدوکائین|لیدوکایین|لیدو/gu, " lido ")
    .replace(/پلاس/gu, " plus ")
    .replace(/اسکین/gu, " skin ")
    .replace(/بوستر/gu, " booster ")
    .replace(/رادیانس/gu, " radiance ")
    .replace(/ملیراتین|ملیروتین/gu, " melirutin ")
    .replace(/ویتامین\s*سی/gu, " vitamin c ")
    .replace(/دور\s*چشم/gu, " eye contour ")
    .replace(/لیفت\s*فیس|لیفت\s*صورت/gu, " lift face ")
    .replace(/\s+/gu, " ")
    .trim();
}

function tokens(value: string): string[] {
  return canonicalize(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && !GENERIC_TOKENS.has(token));
}

function levenshtein(left: string, right: string): number {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitution,
      );
    }
    for (let index = 0; index < current.length; index += 1) previous[index] = current[index];
  }
  return previous[right.length];
}

function tokenSimilarity(left: string, right: string): number {
  if (left === right) return 1;
  const shorter = Math.min(left.length, right.length);
  if (shorter >= 3 && (left.includes(right) || right.includes(left))) return 0.92;
  if (shorter <= 2) return 0;
  const distance = levenshtein(left, right);
  return Math.max(0, 1 - distance / Math.max(left.length, right.length));
}

function textMatchScore(expected: string, actual: string): number {
  const expectedTokens = tokens(expected);
  const actualTokens = tokens(actual);
  if (!expectedTokens.length || !actualTokens.length) return 0;

  const tokenScores = expectedTokens.map((expectedToken) =>
    actualTokens.reduce(
      (best, actualToken) => Math.max(best, tokenSimilarity(expectedToken, actualToken)),
      0,
    ),
  );
  const average = tokenScores.reduce((sum, score) => sum + score, 0) / tokenScores.length;
  const coverage = tokenScores.filter((score) => score >= 0.72).length / tokenScores.length;
  const strong = tokenScores.filter((score) => score >= 0.9).length / tokenScores.length;

  const compactExpected = canonicalize(expected).replace(/\s+/gu, "");
  const compactActual = canonicalize(actual).replace(/\s+/gu, "");
  let score = average * 0.56 + coverage * 0.28 + strong * 0.16;
  if (compactExpected && compactActual.includes(compactExpected)) score += 0.12;
  return Math.min(1, score);
}

function catalogProductFor(product: CmsProduct) {
  const exact = catalogProducts.find((item) => item.slug === product.slug);
  if (exact) return exact;

  // WooCommerce appends -2, -3, ... when an older slug is still reserved.
  // Treat that suffix as a storage alias, never as part of a model number.
  const duplicate = product.slug.match(/^(.*)-(\d+)$/u);
  if (!duplicate) return undefined;
  const suffix = Number(duplicate[2]);
  if (!Number.isInteger(suffix) || suffix < 2 || suffix > 20) return undefined;
  return catalogProducts.find((item) => item.slug === duplicate[1]);
}

function canonicalProductSlug(product: CmsProduct): string {
  return catalogProductFor(product)?.slug ?? product.slug;
}

function identityFields(product: CmsProduct): string[] {
  const catalogProduct = catalogProductFor(product);
  return [
    product.name,
    catalogProduct?.nameEn ?? "",
    [catalogProduct?.brand, catalogProduct?.nameEn].filter(Boolean).join(" "),
    canonicalProductSlug(product).replace(/-/gu, " "),
  ].filter((value) => value.trim().length > 0);
}

function modelNumbers(product: CmsProduct): string[] {
  const catalogProduct = catalogProductFor(product);
  return Array.from(
    new Set(
      [product.name, catalogProduct?.nameEn ?? "", canonicalProductSlug(product)]
        .flatMap((value) => normalizeBasic(value).match(/\d+(?:\.\d+)?/gu) ?? []),
    ),
  );
}

function actualNumbers(value: string): string[] {
  return normalizeBasic(value).match(/\d+(?:\.\d+)?/gu) ?? [];
}

function numbersCompatible(product: CmsProduct, actual: string): boolean {
  const expected = modelNumbers(product);
  if (!expected.length) return true;
  const actualSet = new Set(actualNumbers(actual));
  return expected.every((number) => actualSet.has(number));
}

function volumes(value: string): number[] {
  const normalized = canonicalize(value).replace(/سی\s*سی/gu, "ml");
  return Array.from(
    normalized.matchAll(/(\d+(?:\.\d+)?)\s*(?:ml|میلی\s*لیتر)/giu),
    (match) => Number(match[1]),
  ).filter((volume) => Number.isFinite(volume));
}

function volumeCompatible(product: CmsProduct, actual: string): boolean {
  const expectedVolume = catalogProductFor(product)?.volume ?? "";
  const expected = volumes(expectedVolume);
  const found = volumes(actual);
  if (!expected.length || !found.length) return true;
  return expected.some((volume) => found.includes(volume));
}

function fusionModelCompatible(product: CmsProduct, actual: string): boolean {
  const match = canonicalProductSlug(product).match(/^fusion-f-(.+)$/u);
  if (!match) return true;
  const expectedModel = match[1].split("-").filter(Boolean);
  const actualTokens = new Set(tokens(actual));
  if (!expectedModel.every((token) => actualTokens.has(token))) return false;
  if (match[1] === "hair" && actualTokens.has("men")) return false;
  return true;
}

function candidateScore(product: CmsProduct, actual: string): number {
  if (!numbersCompatible(product, actual)) return 0;
  if (!volumeCompatible(product, actual)) return 0;
  if (!fusionModelCompatible(product, actual)) return 0;
  return Math.max(...identityFields(product).map((field) => textMatchScore(field, actual)), 0);
}

function discoveryQueries(product: CmsProduct): string[] {
  const catalogProduct = catalogProductFor(product);
  const queries = [
    catalogProduct?.nameEn ?? "",
    product.name,
    canonicalProductSlug(product).replace(/-/gu, " "),
    [catalogProduct?.brand, catalogProduct?.nameEn].filter(Boolean).join(" "),
  ];
  const seen = new Set<string>();
  return queries
    .map((query) => query.replace(/\s+/gu, " ").trim())
    .filter((query) => {
      const key = canonicalize(query);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_DISCOVERY_QUERIES);
}

function parseToman(value: unknown): number | null {
  const normalized = toLatinDigits(String(value ?? ""))
    .replace(/[^0-9.]/gu, "")
    .trim();
  const parsed = Number(normalized);
  const rounded = Math.round(parsed);
  return Number.isFinite(rounded) &&
    rounded >= MIN_VALID_PRICE_TOMAN &&
    rounded <= MAX_VALID_PRICE_TOMAN
    ? rounded
    : null;
}

function wooStorePrice(
  value: unknown,
  currency = "IRT",
  minorUnit = 0,
): number | null {
  const normalized = toLatinDigits(String(value ?? ""))
    .replace(/[٬،,\s]/gu, "")
    .replace(/٫/gu, ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  let amount = parsed / 10 ** Math.max(0, minorUnit);
  if (currency.toUpperCase() === "IRR") amount /= 10;
  const rounded = Math.round(amount);
  return rounded >= MIN_VALID_PRICE_TOMAN && rounded <= MAX_VALID_PRICE_TOMAN
    ? rounded
    : null;
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "accept-language": "fa-IR,fa;q=0.9,en-US;q=0.7,en;q=0.6",
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
        "accept-language": "fa-IR,fa;q=0.9,en-US;q=0.7,en;q=0.6",
        referer: "https://torob.com/",
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function discoverWooMarketSample(
  product: CmsProduct,
  store: WooMarketStore,
): Promise<{ provider: MarketProvider; sourceUrl: string; sample: MarketPriceSample } | null> {
  // Search Persian storefront name first, then canonical English/model identity if needed.
  const queries = [product.name, ...discoveryQueries(product)].filter(Boolean).slice(0, 2);
  const candidates = new Map<string, { item: WooStoreProduct; score: number }>();

  for (const query of queries) {
    try {
      const url = new URL("/wp-json/wc/store/v1/products", store.baseUrl);
      url.searchParams.set("search", query);
      url.searchParams.set("per_page", "12");
      const response = await fetchJson<WooStoreProduct[]>(url.toString());
      if (!Array.isArray(response)) continue;
      for (const item of response) {
        const name = item.name?.trim() ?? "";
        const permalink = item.permalink?.trim() ?? "";
        if (!name || !permalink || item.is_in_stock === false || item.is_purchasable === false) continue;
        const score = candidateScore(product, name);
        if (score < 0.62) continue;
        const previous = candidates.get(permalink);
        if (!previous || score > previous.score) candidates.set(permalink, { item, score });
      }
      const bestNow = [...candidates.values()].sort((a, b) => b.score - a.score)[0];
      if (bestNow?.score && bestNow.score >= 0.9) break;
    } catch {
      // One store/query failing must not block the other independent market sources.
    }
  }

  const ranked = [...candidates.values()].sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best?.item.permalink || !best.item.prices?.price) return null;
  const second = ranked[1];
  if (second && best.score < 0.86 && second.score >= best.score - 0.045) return null;

  const priceToman = wooStorePrice(
    best.item.prices.price,
    best.item.prices.currency_code,
    best.item.prices.currency_minor_unit,
  );
  if (!priceToman) return null;

  return {
    provider: store.provider,
    sourceUrl: best.item.permalink,
    sample: {
      provider: store.provider,
      sourceLabel: MARKET_PROVIDER_LABELS[store.provider],
      url: best.item.permalink,
      productName: best.item.name ?? product.name,
      priceToman,
      checkedAt: new Date().toISOString(),
      inStock: true,
      matchScore: best.score,
      sellerName: MARKET_PROVIDER_LABELS[store.provider],
    },
  };
}

function candidateName(candidate: TorobSearchCandidate): string {
  return [candidate.name1, candidate.name2].filter(Boolean).join(" ").trim();
}

function candidateWebUrl(candidate: TorobSearchCandidate): string | null {
  const raw = candidate.web_client_absolute_url?.trim();
  if (raw) {
    try {
      const url = new URL(raw, "https://torob.com");
      if (url.protocol === "https:" && ["torob.com", "www.torob.com"].includes(url.hostname)) {
        return url.toString();
      }
    } catch {
      // Build a canonical Torob URL from random_key below.
    }
  }

  const key = candidate.random_key?.trim();
  if (!key || !/^[a-z0-9-]{12,}$/iu.test(key)) return null;
  return `https://torob.com/p/${key}/`;
}

function candidateAvailable(candidate: TorobSearchCandidate): boolean {
  if (candidate.is_adv === true || candidate.availability === false) return false;
  const stock = normalizeBasic(candidate.stock_status ?? "");
  return !/(out|ناموجود|unavailable)/u.test(stock);
}

function curatedTorobCandidate(product: CmsProduct): RankedTorobCandidate | null {
  const url = CURATED_TOROB_URLS[canonicalProductSlug(product)];
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const key = parsed.pathname.match(/^\/p\/([^/]+)/u)?.[1]?.trim();
    if (!key) return null;
    return {
      candidate: {
        random_key: key,
        web_client_absolute_url: url,
        availability: true,
      },
      name: product.name,
      score: 1,
    };
  } catch {
    return null;
  }
}

async function discoverTorobCandidate(product: CmsProduct): Promise<RankedTorobCandidate | null> {
  const candidates = new Map<string, RankedTorobCandidate>();

  for (const query of discoveryQueries(product)) {
    const url = new URL(TOROB_SEARCH_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("page", "0");
    url.searchParams.set("size", "12");
    url.searchParams.set("source", "torob_search");

    let response: TorobSearchResponse;
    try {
      response = await fetchJson<TorobSearchResponse>(url.toString());
    } catch {
      continue;
    }

    for (const candidate of Array.isArray(response.results) ? response.results : []) {
      if (!candidateAvailable(candidate) || !candidateWebUrl(candidate)) continue;
      const name = candidateName(candidate);
      if (!name) continue;
      const score = candidateScore(product, name);
      if (score < 0.58) continue;
      const key = candidate.random_key || candidateWebUrl(candidate) || name;
      const previous = candidates.get(key);
      if (!previous || score > previous.score) candidates.set(key, { candidate, name, score });
    }

    const currentBest = [...candidates.values()].sort((a, b) => b.score - a.score)[0];
    if (currentBest?.score && currentBest.score >= 0.9) break;
  }

  const ranked = [...candidates.values()].sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score < 0.62) return null;
  const second = ranked[1];
  if (second && best.score < 0.86 && second.score >= best.score - 0.045) return null;
  return best;
}

function sellerAvailable(seller: TorobSeller): boolean {
  if (seller.availability === false || seller.is_available === false) return false;
  const stock = normalizeBasic(seller.stock_status ?? "");
  return !/(out|ناموجود|unavailable)/u.test(stock);
}

async function torobSamples(
  product: CmsProduct,
  ranked: RankedTorobCandidate,
): Promise<{ sourceUrl: string; samples: MarketPriceSample[] }> {
  const sourceUrl = candidateWebUrl(ranked.candidate)!;
  const checkedAt = new Date().toISOString();
  const samples: MarketPriceSample[] = [];
  const key = ranked.candidate.random_key?.trim();

  if (key) {
    try {
      const url = new URL(TOROB_SELLERS_URL);
      url.searchParams.set("prk", key);
      url.searchParams.set("page", "0");
      url.searchParams.set("size", String(MAX_TOROB_SELLERS));
      const response = await fetchJson<TorobSellerResponse>(url.toString());
      for (const seller of Array.isArray(response.results) ? response.results : []) {
        if (!sellerAvailable(seller)) continue;
        const priceToman = parseToman(seller.price);
        if (!priceToman) continue;
        const sellerName = seller.shop_name || seller.shop_name2 || seller.name;
        samples.push({
          provider: "torob",
          sourceLabel: sellerName
            ? `${MARKET_PROVIDER_LABELS.torob} · ${sellerName}`
            : `${MARKET_PROVIDER_LABELS.torob} · فروشنده ${samples.length + 1}`,
          url: sourceUrl,
          productName: ranked.name,
          priceToman,
          checkedAt,
          inStock: true,
          matchScore: ranked.score,
        });
        if (samples.length >= MAX_TOROB_SELLERS) break;
      }
    } catch {
      // Search-card price is the fallback when the seller listing is unavailable.
    }
  }

  if (!samples.length) {
    const fallbackPrice = parseToman(ranked.candidate.price ?? ranked.candidate.min_price);
    if (fallbackPrice) {
      samples.push({
        provider: "torob",
        sourceLabel: MARKET_PROVIDER_LABELS.torob,
        url: sourceUrl,
        productName: ranked.name,
        priceToman: fallbackPrice,
        checkedAt,
        inStock: true,
        matchScore: ranked.score,
      });
    }
  }

  return { sourceUrl, samples };
}

function stripHtml(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&nbsp;|&#160;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;|&#34;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/\s+/gu, " ")
    .trim();
}

function directPriceNumber(value: string): number | null {
  const normalized = toLatinDigits(value)
    .replace(/[٬،,\/\s]/gu, "")
    .replace(/\.(?=\d{3}(?:\D|$))/gu, "")
    .replace(/[^0-9.]/gu, "")
    .trim();
  const parsed = Math.round(Number(normalized));
  return Number.isFinite(parsed) &&
    parsed >= MIN_VALID_PRICE_TOMAN &&
    parsed <= MAX_VALID_PRICE_TOMAN
    ? parsed
    : null;
}

function directPagePrice(html: string): number | null {
  const visible: number[] = [];
  const h1Index = html.search(/<h1\b/iu);
  const scope = h1Index >= 0 ? html.slice(h1Index, h1Index + 45_000) : html.slice(0, 45_000);
  for (const match of stripHtml(scope).matchAll(/([۰-۹٠-٩0-9][۰-۹٠-٩0-9.,٬،\/\s]{3,20})\s*(?:تومان|تومن)/giu)) {
    const value = directPriceNumber(match[1] ?? "");
    if (value) visible.push(value);
  }
  if (visible.length) return Math.min(...visible);

  const structured: number[] = [];
  for (const match of html.matchAll(/"price"\s*:\s*"?([۰-۹٠-٩0-9][۰-۹٠-٩0-9.,٬،\/\s]{2,20})"?/giu)) {
    const value = directPriceNumber(match[1] ?? "");
    if (value) structured.push(value);
  }
  if (!structured.length) return null;
  const minimum = Math.min(...structured);
  return minimum > 20_000_000 ? Math.round(minimum / 10) : minimum;
}

function directPageName(html: string): string {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]{0,600}?)<\/h1>/iu)?.[1];
  if (h1) return stripHtml(h1);
  const title = html.match(/<title\b[^>]*>([\s\S]{0,600}?)<\/title>/iu)?.[1];
  return title ? stripHtml(title) : "";
}

async function directMarketSample(
  product: CmsProduct,
): Promise<{ sourceUrl: string; sample: MarketPriceSample } | null> {
  const source = CURATED_DIRECT_SOURCES[canonicalProductSlug(product)];
  if (!source) return null;
  try {
    const html = await fetchText(source.url);
    const pageName = directPageName(html);
    const identity = pageName || source.expectedName;
    const score = candidateScore(product, `${identity} ${source.expectedName}`);
    if (score < 0.62) return null;
    const priceToman = directPagePrice(html);
    if (!priceToman) return null;
    return {
      sourceUrl: source.url,
      sample: {
        provider: "direct",
        sourceLabel: `${MARKET_PROVIDER_LABELS.direct} · ${source.label}`,
        url: source.url,
        productName: identity,
        priceToman,
        checkedAt: new Date().toISOString(),
        inStock: true,
        matchScore: Math.min(1, score),
      },
    };
  } catch {
    return null;
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function currentPrice(product: CmsProduct): number | null {
  const value = Number(product.salePrice || product.regularPrice || product.price);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

function updateProviderSource(
  sources: MarketSourceConfig[],
  provider: MarketProvider,
  sourceUrl: string,
): MarketSourceConfig[] {
  const next = sources.map((source) => ({ ...source }));
  const existing = next.find((source) => source.provider === provider);
  if (existing) {
    existing.url = sourceUrl;
    existing.enabled = true;
    existing.discovered = true;
  } else {
    next.push({ provider, url: sourceUrl, enabled: true, discovered: true });
  }
  return next;
}

function updateTorobSource(
  sources: MarketSourceConfig[],
  sourceUrl: string,
): MarketSourceConfig[] {
  const next = sources.map((source) => ({ ...source }));
  const torob = next.find((source) => source.provider === "torob");
  if (torob) {
    if (!torob.url || torob.discovered) {
      torob.url = sourceUrl;
      torob.discovered = true;
    }
    torob.enabled = true;
  } else {
    next.push({ provider: "torob", url: sourceUrl, enabled: true, discovered: true });
  }
  return next;
}

function updateDirectSource(
  sources: MarketSourceConfig[],
  sourceUrl: string,
): MarketSourceConfig[] {
  const next = sources.map((source) => ({ ...source }));
  const direct = next.find((source) => source.provider === "direct");
  if (direct) {
    direct.url = sourceUrl;
    direct.enabled = true;
    direct.discovered = true;
  } else {
    next.push({ provider: "direct", url: sourceUrl, enabled: true, discovered: true });
  }
  return next;
}

function supersededHistory(product: CmsProduct, decidedAt: string): MarketPriceHistoryEntry[] {
  const history = [...product.pricing.history];
  const previous = product.pricing.proposal;
  if (previous) {
    history.unshift({
      id: previous.id,
      createdAt: previous.createdAt,
      proposedPriceToman: previous.proposedPriceToman,
      currentPriceToman: previous.currentPriceToman,
      sampleCount: previous.samples.length,
      decision: "superseded",
      decidedAt,
    });
  }
  return history.slice(0, MAX_HISTORY_ITEMS);
}

function verifiedMarketProposal(
  product: CmsProduct,
  samples: MarketPriceSample[],
  checkedAt: string,
): { proposal: MarketPriceProposal | null; snapshot: ReturnType<typeof verifyMarketSamples>["snapshot"] } {
  const verification = verifyMarketSamples({
    slug: canonicalProductSlug(product),
    samples,
    checkedAt,
    currentPriceToman: currentPrice(product),
  });
  const proposed = verification.verifiedMarketPriceToman;
  if (!proposed || !verification.verifiedSamples.length) {
    return { proposal: null, snapshot: verification.snapshot };
  }
  const snapshot = verification.snapshot;
  return {
    snapshot,
    proposal: {
      id: crypto.randomUUID(),
      status: "pending",
      createdAt: checkedAt,
      currentPriceToman: currentPrice(product),
      proposedPriceToman: proposed,
      rawAverageToman: Math.round(
        verification.rawWeightedMarketPriceToman ?? proposed,
      ),
      samples: verification.verifiedSamples,
      excludedSamples: verification.excludedSamples,
      note: snapshot.summary,
      observedMinPriceToman: snapshot.observedMinPriceToman,
      observedMaxPriceToman: snapshot.observedMaxPriceToman,
      verifiedMinPriceToman: snapshot.verifiedMinPriceToman,
      verifiedMaxPriceToman: snapshot.verifiedMaxPriceToman,
      verifiedMedianToman: snapshot.verifiedMarketPriceToman,
      marketConfidenceScore: snapshot.confidenceScore,
      observedSampleCount: snapshot.observedSampleCount,
      verifiedSampleCount: snapshot.verifiedSampleCount,
      suspiciousSampleCount: snapshot.suspiciousSampleCount,
      trustedSellerCount: snapshot.trustedSellerCount,
      authenticityRisk: snapshot.authenticityRisk,
    },
  };
}

async function markUnresolved(
  product: CmsProduct,
  checkedAt: string,
  snapshot?: ReturnType<typeof verifyMarketSamples>["snapshot"],
): Promise<void> {
  await updateProductPricingState(product.id, {
    ...product.pricing,
    lastMarketSnapshot: snapshot ?? product.pricing.lastMarketSnapshot,
    lastCheckedAt: checkedAt,
    lastStatus: product.pricing.proposal ? "pending" : "insufficient",
    lastMessage: snapshot?.observedSampleCount
      ? snapshot.summary
      : product.pricing.proposal
        ? "در این نوبت قیمت معتبر جدید در منابع بازار پیدا نشد؛ پیشنهاد قبلی حفظ شد."
        : "در این نوبت قیمت معتبر محصول در منابع بازار پیدا نشد؛ در اسکن بعدی دوباره تلاش می‌شود.",
  });
}

async function scanProductMarket(product: CmsProduct): Promise<ProductScanResult> {
  const checkedAt = new Date().toISOString();
  try {
    let sources = product.pricing.sources;
    const samples: MarketPriceSample[] = [];

    const ranked = curatedTorobCandidate(product) ?? (await discoverTorobCandidate(product));
    if (ranked) {
      const torob = await torobSamples(product, ranked);
      samples.push(...torob.samples);
      if (torob.samples.length) sources = updateTorobSource(sources, torob.sourceUrl);
    }

    const independent = await Promise.all(
      WOO_MARKET_STORES.map((store) => discoverWooMarketSample(product, store)),
    );
    for (const result of independent) {
      if (!result) continue;
      samples.push(result.sample);
      sources = updateProviderSource(sources, result.provider, result.sourceUrl);
    }

    const direct = await directMarketSample(product);
    if (direct) {
      samples.push(direct.sample);
      sources = updateDirectSource(sources, direct.sourceUrl);
    }

    const verification = verifiedMarketProposal(product, samples, checkedAt);
    const proposal = verification.proposal;
    if (!proposal) {
      await markUnresolved(product, checkedAt, verification.snapshot);
      return { slug: product.slug, status: "unresolved" };
    }

    if (proposal.currentPriceToman === proposal.proposedPriceToman) {
      await updateProductPricingState(product.id, {
        ...product.pricing,
        sources,
        proposal: null,
        lastMarketSnapshot: verification.snapshot,
        history: supersededHistory(product, checkedAt),
        lastCheckedAt: checkedAt,
        lastStatus: "insufficient",
        lastMessage: `قیمت فعلی با قیمت معتبر وزن‌دار بازار (${proposal.samples.length} نمونه) برابر است؛ تغییر لازم نیست.`,
      });
      return { slug: product.slug, status: "market-equal" };
    }

    if (product.pricing.proposal?.proposedPriceToman === proposal.proposedPriceToman) {
      await updateProductPricingState(product.id, {
        ...product.pricing,
        sources,
        lastMarketSnapshot: verification.snapshot,
        lastCheckedAt: checkedAt,
        lastStatus: "pending",
        lastMessage: `پیشنهاد قبلی با ${proposal.samples.length} قیمت معتبر بازار دوباره تأیید شد.`,
      });
      return { slug: product.slug, status: "same-proposal" };
    }

    await updateProductPricingState(product.id, {
      ...product.pricing,
      sources,
      proposal,
      lastMarketSnapshot: verification.snapshot,
      history: supersededHistory(product, checkedAt),
      lastCheckedAt: checkedAt,
      lastStatus: "pending",
      lastMessage: `قیمت معتبر بازار با اطمینان ${proposal.marketConfidenceScore}٪ و ${proposal.samples.length} نمونه آماده تأیید است.`,
    });
    return { slug: product.slug, status: "proposal" };
  } catch (error) {
    console.error("[market-pricing] Product market scan failed", {
      slug: product.slug,
      error: error instanceof Error ? error.message : String(error),
    });
    return { slug: product.slug, status: "failed" };
  }
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

function safeCursor(value: number): number {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function safeLimit(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) return DEFAULT_BATCH_SIZE;
  return Math.min(MAX_BATCH_SIZE, value);
}

export async function runTorobMarketPricingBatch(
  cursorInput = 0,
  limitInput = DEFAULT_BATCH_SIZE,
): Promise<TorobMarketPricingBatchSummary> {
  const startedAt = new Date().toISOString();
  const cursor = safeCursor(cursorInput);
  const limit = safeLimit(limitInput);
  const products = (await listAllProductsForPricing()).sort((a, b) => a.id - b.id);
  const batch = products.slice(cursor, cursor + limit);
  // Each product fans out to several remote market sources plus WooCommerce.
  // Production stability: keep concurrency conservative so a slow upstream does not
  // consume the whole serverless request budget or overwhelm WordPress.
  const results = await mapWithConcurrency(batch, 2, scanProductMarket);
  const nextCursor = cursor + batch.length < products.length ? cursor + batch.length : null;
  const matched = results.filter((result) =>
    ["proposal", "same-proposal", "market-equal"].includes(result.status),
  );
  const unresolved = results.filter((result) => result.status === "unresolved");

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    cursor,
    limit,
    totalProducts: products.length,
    processedProducts: batch.length,
    nextCursor,
    matchedProducts: matched.length,
    proposalsCreated: results.filter((result) => result.status === "proposal").length,
    sameProposalProducts: results.filter((result) => result.status === "same-proposal").length,
    marketEqualProducts: results.filter((result) => result.status === "market-equal").length,
    unresolvedProducts: unresolved.length,
    failedProducts: results.filter((result) => result.status === "failed").length,
    matchedSlugs: matched.map((result) => result.slug),
    unresolvedSlugs: unresolved.map((result) => result.slug),
  };
}
