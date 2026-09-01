import { catalogProducts } from "../catalog";
import type { CmsProduct } from "./cms-types";
import {
  runMarketPricingScan,
  type MarketPricingScanSummary,
} from "./market-pricing";
import {
  MARKET_PROVIDER_LABELS,
  type MarketPriceProposal,
  type MarketPriceSample,
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

type SupplementalResult =
  | "proposal"
  | "matched-no-change"
  | "not-found"
  | "failed";

export type ComprehensiveMarketPricingScanSummary = MarketPricingScanSummary & {
  torobSupplement: {
    attemptedProducts: number;
    matchedProducts: number;
    proposalsCreated: number;
    matchedWithoutChange: number;
    unresolvedProducts: number;
    failedProducts: number;
  };
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
  return catalogProducts.find((item) => item.slug === product.slug);
}

function identityFields(product: CmsProduct): string[] {
  const catalogProduct = catalogProductFor(product);
  return [
    product.name,
    catalogProduct?.nameEn ?? "",
    [catalogProduct?.brand, catalogProduct?.nameEn].filter(Boolean).join(" "),
    product.slug.replace(/-/gu, " "),
  ].filter((value) => value.trim().length > 0);
}

function modelNumbers(product: CmsProduct): string[] {
  const catalogProduct = catalogProductFor(product);
  return Array.from(
    new Set(
      [product.name, catalogProduct?.nameEn ?? "", product.slug]
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
  const match = product.slug.match(/^fusion-f-(.+)$/u);
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
    product.slug.replace(/-/gu, " "),
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

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
        "user-agent": "Mozilla/5.0 (compatible; SepiidBeautyPriceMonitor/2.0)",
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
      // Fall through and build the canonical product URL from random_key.
    }
  }

  const key = candidate.random_key?.trim();
  if (!key || !/^[a-z0-9-]{12,}$/iu.test(key)) return null;
  const slug = encodeURIComponent((candidate.name2 || candidate.name1 || "product").trim().replace(/\s+/gu, "-"));
  return `https://torob.com/p/${key}/${slug}/`;
}

function candidateAvailable(candidate: TorobSearchCandidate): boolean {
  if (candidate.is_adv === true || candidate.availability === false) return false;
  const stock = normalizeBasic(candidate.stock_status ?? "");
  return !/(out|ناموجود|unavailable)/u.test(stock);
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
      // Search-card price is still a useful fallback when seller listing is unavailable.
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

function marketProposal(
  product: CmsProduct,
  samples: MarketPriceSample[],
  checkedAt: string,
): MarketPriceProposal | null {
  if (!samples.length) return null;
  const center = median(samples.map((sample) => sample.priceToman));
  const included = samples.filter(
    (sample) => sample.priceToman >= center * 0.65 && sample.priceToman <= center * 1.55,
  );
  if (!included.length) return null;
  const excluded = samples.filter((sample) => !included.includes(sample));
  const rawAverage = included.reduce((sum, sample) => sum + sample.priceToman, 0) / included.length;
  const proposed = Math.round(rawAverage / 10_000) * 10_000;
  return {
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: checkedAt,
    currentPriceToman: currentPrice(product),
    proposedPriceToman: proposed,
    rawAverageToman: Math.round(rawAverage),
    samples: included,
    excludedSamples: excluded,
    note:
      excluded.length > 0
        ? `${excluded.length} قیمت پرت ترب از محاسبه کنار گذاشته شد.`
        : `میانگین از ${included.length} قیمت معتبر ترب محاسبه شد.`,
  };
}

async function supplementProductWithTorob(product: CmsProduct): Promise<SupplementalResult> {
  try {
    const ranked = await discoverTorobCandidate(product);
    if (!ranked) return "not-found";
    const { sourceUrl, samples } = await torobSamples(product, ranked);
    if (!samples.length) return "not-found";

    const checkedAt = new Date().toISOString();
    const proposal = marketProposal(product, samples, checkedAt);
    if (!proposal) return "not-found";
    const sources = updateTorobSource(product.pricing.sources, sourceUrl);

    if (proposal.currentPriceToman === proposal.proposedPriceToman) {
      await updateProductPricingState(product.id, {
        ...product.pricing,
        sources,
        proposal: null,
        lastCheckedAt: checkedAt,
        lastStatus: "insufficient",
        lastMessage: `قیمت فعلی با میانگین ${proposal.samples.length} قیمت معتبر ترب برابر است؛ تغییر لازم نیست.`,
      });
      return "matched-no-change";
    }

    await updateProductPricingState(product.id, {
      ...product.pricing,
      sources,
      proposal,
      lastCheckedAt: checkedAt,
      lastStatus: "pending",
      lastMessage: `پیشنهاد قیمت با کشف خودکار ${proposal.samples.length} فروشنده معتبر در ترب آماده تأیید است.`,
    });
    return "proposal";
  } catch (error) {
    console.error("[market-pricing] Torob supplemental discovery failed", {
      slug: product.slug,
      error: error instanceof Error ? error.message : String(error),
    });
    return "failed";
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

function needsSupplement(product: CmsProduct, startedAt: string): boolean {
  if (product.pricing.proposal) return false;
  const checkedThisRun = product.pricing.lastCheckedAt >= startedAt;
  if (
    checkedThisRun &&
    product.pricing.lastStatus === "insufficient" &&
    /برابر است|تغییری لازم نیست/u.test(product.pricing.lastMessage)
  ) {
    return false;
  }
  return true;
}

export async function runComprehensiveMarketPricingScan(): Promise<ComprehensiveMarketPricingScanSummary> {
  const base = await runMarketPricingScan();
  const products = await listAllProductsForPricing();
  const targets = products.filter((product) => needsSupplement(product, base.startedAt));
  const results = await mapWithConcurrency(targets, 4, supplementProductWithTorob);

  const proposalsCreated = results.filter((result) => result === "proposal").length;
  const matchedWithoutChange = results.filter((result) => result === "matched-no-change").length;
  const unresolvedProducts = results.filter((result) => result === "not-found").length;
  const failedProducts = results.filter((result) => result === "failed").length;

  return {
    ...base,
    finishedAt: new Date().toISOString(),
    torobSupplement: {
      attemptedProducts: targets.length,
      matchedProducts: proposalsCreated + matchedWithoutChange,
      proposalsCreated,
      matchedWithoutChange,
      unresolvedProducts,
      failedProducts,
    },
  };
}
