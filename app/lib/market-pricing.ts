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
  createProductsBatch,
  getProduct,
  listAllProductsForPricing,
  listCategories,
  listProducts,
  setProductPricesBatch,
  updateProductPricingState,
  WooCommerceError,
} from "./woocommerce";

// A dead market source must not hold an entire operator request for 14 seconds.
// Providers for a product are queried in parallel below, so this is a per-source
// ceiling rather than a cumulative delay.
const FETCH_TIMEOUT_MS = 8_000;
const MIN_VALID_PRICE_TOMAN = 100_000;
const MAX_VALID_PRICE_TOMAN = 1_000_000_000;
const MAX_HISTORY_ITEMS = 30;
// One exact-match source is enough to create a review proposal. The CMS admin
// still decides whether the price is applied to WooCommerce.
const MIN_VALID_SAMPLES = 1;

type MarketPricingScanMode = "review" | "initial-apply";

const PROVIDER_HOSTS: Record<MarketProvider, string[]> = {
  sayancenter: ["sayancenter.com", "www.sayancenter.com"],
  rokateb: ["rokateb.ir", "www.rokateb.ir"],
  torob: ["torob.com", "www.torob.com"],
  emalls: ["emalls.ir", "www.emalls.ir"],
  noavaransalamat: ["noavaransalamat.ir", "www.noavaransalamat.ir"],
};

const AUTO_DISCOVERY_BASE: Partial<Record<MarketProvider, string>> = {
  sayancenter: "https://sayancenter.com",
  rokateb: "https://rokateb.ir",
  noavaransalamat: "https://noavaransalamat.ir",
};

// Direct product pages are curated because Torob search pages are not crawled.
// A missing entry is intentional: no automatic match is safer than a wrong pack/model.
export const CURATED_TOROB_URLS: Record<string, string> = {
  "arasti-white":
    "https://torob.com/p/de8f3365-d391-499e-9b33-211b08d602a2/فیلر-آراستی-وایت-لیدوکائین/",
  "zishel-rose-glam":
    "https://torob.com/p/4f3a0532-b1f1-4db0-a80f-bfa9d806afac/زیشل-رز-گلم-10cc/",
  "regenfill-deep":
    "https://torob.com/p/a43438bc-8c43-4fdd-9e8a-889e6305268a/رجنفیل-دیپ-11-سی-سی/",
  "regenfill-lido":
    "https://torob.com/p/6d2cfb77-913d-4c65-a463-a1156c295bdc/فیلر-کلاژن-پپتاید-دار-لیدو-رجنفیل-11-سی-سی/",
  "regenfill-volume":
    "https://torob.com/p/ea0b7841-0967-478a-9e47-26ecdc830d69/رجینفیل-والیوم-regenfill-volume-11-cc/",
  "ejal-40":
    "https://torob.com/p/0b0ee99a-1c54-41e8-87c5-6d2ce1764769/مزوژل-ایجال-40-ظرفیت-2-میلی-لیتر/",
  "mesoheal-plus":
    "https://torob.com/p/057f8f99-05bc-4e0e-b15d-770fd82cc8ae/مزوژل-جوانساز-کروفارما-مزوهیل-پلاس/",
  "xitritall-hydro":
    "https://torob.com/p/9036aaf9-4e4a-4b5c-a8d9-44618e0c56d6/زیتریتال-هیدرو-xitritall-hydro/",
  "reyoungel-revital-bioha":
    "https://torob.com/p/afef9bbc-e6f7-48c6-8e97-4b4a34b96761/مزوژل-ریانژل-رویتال-revital-reyoungel/",
  "vitten-hydro-plus":
    "https://torob.com/p/e47e429c-9945-412e-b71e-62a26427999b/کوکتل-ویتن-هیدرو-پلاس-هیالورونیک-اسید/",
  "roytrin-skin-booster":
    "https://torob.com/p/0991aa25-8ca2-476d-96dd-33d0b9cfbeeb/مزوژل-جوانساز-رویترین-اسکین-بوستر/",
  "nabota-150":
    "https://torob.com/p/0f824f27-0891-4ed3-88ef-07d1f83f3474/بوتاکس-نابوتا-150-واحدی/",
  "siax-100":
    "https://torob.com/p/dd0bf9a1-06b6-4ef4-b33c-5dcc29cfb858/بوتاکس-سیاکس-100-کره-100-واحد/",
  "siax-200":
    "https://torob.com/p/b96631a7-4421-4f0b-8e04-a0af6e45ffa0/بوتاکس-سیاکس-200-واحدی-siax-botox/",
  "neuronox-100":
    "https://torob.com/p/cdacb952-3075-4ece-91f4-91668a275fe4/نورونوکس-100/",
  myobloc:
    "https://torob.com/p/c37ebc23-3610-4090-acef-6882614f9866/بوتاکس-مایوبلاک-فرانسه/",
  "fusion-f-lift-face":
    "https://torob.com/p/70b12b34-29e6-46b2-9d9f-04a40549a761/کوکتل-مزوتراپی-جوانساز-فیوژن-f-lift-face/",
  "fusion-f-mesomatrix":
    "https://torob.com/p/a65c5069-de6d-461a-b018-20a7f8b55818/کوکتل-مزوتراپی-f-mesomatrix-حجم-5-میلی-لیتر/",
  "dermaheal-hsr":
    "https://torob.com/p/2a7e9b2b-32a8-48ec-80ea-7327941c796b/کوکتل-جوانسازی-پوست-درماهیل-hsr-حجم-5-میلی-لیتر/",
  "mesolike-top-age-pro":
    "https://torob.com/p/124b03de-2674-4cca-b081-7eb4bad26f8a/کوکتل-جوانساز-مزولایک-top-age-pro/",
  "mesolike-lift":
    "https://torob.com/p/ac6ec775-fff9-4230-be31-a8edd8d438e2/کوکتل-لیفت-مزولایک-حجم-10-میلی-لیتر/",
  "fusion-f-radiance":
    "https://torob.com/p/4cde4ed5-ad5a-48f6-b2da-dce23d76a5c9/کوکتل-مزوتراپی-ضد-لک-و-روشن-کننده-فیوژن-f-radiance/",
  "fusion-f-melaclear":
    "https://torob.com/p/e77d15d3-e8ec-44d4-b4e4-a9a5f781509f/کوکتل-مزوتراپی-فیوژن-ضدلک-شدید-f-melaclear/",
  "fusion-f-vitamin-c":
    "https://torob.com/p/6cb36f5b-5842-4fd7-8e66-3395fc540130/کوکتل-ویتامین-سی-فیوژن-f-vitamin-c/",
  "fusion-f-melirutin":
    "https://torob.com/p/f23e58f4-d324-40d3-af26-1ee1dad77fb7/کوکتل-مزوتراپی-فیوژن-f-melirutin-حجم-10-میل/",
  "revitacare-532":
    "https://torob.com/p/3bf58bc7-ab7e-4710-a633-05a06b08a88c/کوکتل-مزوتراپی-رویتاکر-532-اصل-فرانسه/",
  "mesolike-whitening-shine":
    "https://torob.com/p/02ea88a5-f382-4cb6-9222-00199ff1fbea/کوکتل-روشن-کننده-و-ضد-لک-مزولایک-whitening-shine-حجم-10-میل/",
  "mesolike-glutathione":
    "https://torob.com/p/58a393c4-93fb-4fc6-bbcf-a5181e84e868/کوکتل-گلوتاتیون-مزولایک-10-میلی-لیتر-ضد-لک/",
  "dermaheal-sb":
    "https://torob.com/p/472e87cd-3bef-4c02-891b-a4da3304b074/کوکتل-ضد-لک-و-روشن-کننده-درماهیل-sb-حجم-5-میلی-لیتر/",
  "genosys-sws":
    "https://torob.com/p/6d459935-2447-4cea-a9bc-de3f944175d3/کوکتل-ضد-لک-و-روشن-کننده-ژنوسیس-sws-حجم-2-میلی-لیتر/",
  "fusion-f-hair-men":
    "https://torob.com/p/73201c2d-b796-4519-a2e9-28b582a3dd7b/کوکتل-مزوتراپی-فیوژن-مدل-f-hair-men/",
  "revitacare-haircare":
    "https://torob.com/p/71bdead0-9457-4878-b93a-01859adfd3a1/کوکتل-مزوتراپی-رویتاکر-هیرکر/",
  "dermaheal-hl":
    "https://torob.com/p/dcb7fb9a-5d08-419f-8c68-52bf3bd4347b/کوکتل-تقویت-مو-درماهیل-hl-حجم-5-میلی-لیتر-ضد-ریزش/",
  "mesolike-hair":
    "https://torob.com/p/13f6084b-0904-4336-a335-ee51748aafb2/کوکتل-ضد-ریزش-مو-مزولایک-حجم-10-میلی-لیتر/",
  "mesolike-hair-men":
    "https://torob.com/p/0e85c7a0-501d-4067-88f6-571e887b3f64/کوکتل-مزولایک-هیرمن-مخصوص-آقایان-10-میلی-لیتر/",
  "genosys-hr3":
    "https://torob.com/p/7a628deb-3656-4d32-871d-5212369a61e8/کوکتل-تقویت-و-درمان-ریزش-مو-ژنوسیس-مدل-hr3-حجم-5-میلی-لیتر/",
  "mesolike-dutasteride":
    "https://torob.com/p/508af223-a4ab-4548-a4ce-16ef36cd5b23/کوکتل-دوتاستراید-مزولایک-حجم-10-میلی-لیتر/",
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
  sellerPricesToman: number[];
  inStock: boolean;
};

export type MarketPricingProduct = Pick<
  CmsProduct,
  "id" | "name" | "slug" | "sku" | "price" | "regularPrice" | "salePrice" | "pricing"
>;

export type MarketPricingDashboard = {
  products: MarketPricingProduct[];
  editableProducts: MarketPricingProduct[];
  generatedAt: string;
};

export type MarketPricingScanSummary = {
  startedAt: string;
  finishedAt: string;
  catalogProductsAdded: number;
  baselinePricesApplied: number;
  checkedProducts: number;
  proposalsCreated: number;
  pricesApplied: number;
  insufficientProducts: number;
  failedProducts: number;
  skippedProducts: number;
};

export type MarketPricingProposalAlert = {
  productName: string;
  proposal: MarketPriceProposal;
};

async function synchronizeCatalogProductsForPricing(): Promise<{
  products: CmsProduct[];
  added: number;
  baselinePricesApplied: number;
}> {
  const existing = await listAllProductsForPricing();
  const catalogBySlug = new Map(
    catalogProducts.map((product) => [product.slug, product]),
  );
  const missingPriceUpdates = existing.flatMap((product) => {
    const baselinePrice = catalogBySlug.get(product.slug)?.priceToman;
    return !currentPrice(product) && baselinePrice
      ? [{ id: product.id, priceToman: baselinePrice }]
      : [];
  });
  const priceUpdates = await setProductPricesBatch(missingPriceUpdates);
  const updatedById = new Map(
    priceUpdates.map((product) => [product.id, product]),
  );
  const pricedExisting = existing.map(
    (product) => updatedById.get(product.id) ?? product,
  );
  const existingSlugs = new Set(existing.map((product) => product.slug));
  const missing = catalogProducts.filter(
    (product) =>
      product.publishedInCatalog !== false &&
      !existingSlugs.has(product.slug),
  );

  if (!missing.length) {
    if (priceUpdates.length) {
      revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });
    }
    return {
      products: pricedExisting,
      added: 0,
      baselinePricesApplied: priceUpdates.length,
    };
  }

  const categories = await listCategories({
    requestTimeoutMs: 30_000,
    requestMaxAttempts: 3,
  });
  const categoryIds = new Map(
    categories.map((category) => [category.slug, category.id]),
  );
  const created = await createProductsBatch(
    missing.map((product) => ({
      name: product.nameFa,
      slug: product.slug,
      sku: `SPB-${product.slug}`,
      status: "publish" as const,
      catalogVisibility: "visible" as const,
      featured: false,
      description: product.summary,
      shortDescription: product.shortBenefit,
      seoTitle: `خرید ${product.nameFa} | قیمت و مشخصات`,
      metaDescription: product.summary,
      focusKeyword: product.nameFa,
      sourceName: product.sourceName ?? "",
      sourceUrl: product.sourceUrl ?? "",
      reviewerName: "",
      reviewerRole: "",
      reviewedAt: product.reviewedAt ?? "",
      regularPrice: product.priceToman ? String(product.priceToman) : "",
      salePrice: "",
      manageStock: false,
      stockQuantity: null,
      stockStatus: "instock" as const,
      categoryIds: categoryIds.has(product.category)
        ? [categoryIds.get(product.category)!]
        : [],
      images: [],
    })),
  );

  revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });
  return {
    products: [...pricedExisting, ...created],
    added: created.length,
    baselinePricesApplied: priceUpdates.length,
  };
}

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

function catalogProductForPricing(product: CmsProduct) {
  const exact = catalogProducts.find((item) => item.slug === product.slug);
  if (exact) return exact;

  // WooCommerce can reserve an older slug and append -2, -3, ... to the live product.
  // Treat that suffix as a storage alias only when the base slug exists in our catalog.
  const duplicate = product.slug.match(/^(.*)-(\d+)$/u);
  if (!duplicate) return undefined;
  const suffix = Number(duplicate[2]);
  if (!Number.isInteger(suffix) || suffix < 2 || suffix > 20) return undefined;
  return catalogProducts.find((item) => item.slug === duplicate[1]);
}

function canonicalMarketProductSlug(product: CmsProduct): string {
  return catalogProductForPricing(product)?.slug ?? product.slug;
}

function expectedMarketIdentity(product: CmsProduct): string {
  const catalogProduct = catalogProductForPricing(product);
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
  const sellerPrices: number[] = [];
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

  const sellerHeadingIndex = html.search(/فروشنده(?:‌|\s)*ها/iu);
  if (sellerHeadingIndex >= 0) {
    let sellerScope = html.slice(sellerHeadingIndex, sellerHeadingIndex + 180_000);
    const sellerCutoff = sellerScope.search(/لیست\s+تغییرات\s+قیمت/iu);
    if (sellerCutoff > 0) sellerScope = sellerScope.slice(0, sellerCutoff);
    const sellerText = toLatinDigits(stripTags(sellerScope));
    const sellerPricePattern = /([0-9][0-9.,٬،٫\s]{3,18})\s*تومان/giu;
    for (const match of sellerText.matchAll(sellerPricePattern)) {
      const price = priceToToman(match[1], "IRT");
      if (price) sellerPrices.push(price);
      if (sellerPrices.length >= 8) break;
    }
  }

  return {
    name,
    pricesToman: [...new Set(prices)].sort((a, b) => a - b),
    sellerPricesToman: sellerPrices,
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
): Promise<MarketPriceSample[]> {
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

  const checkedAt = new Date().toISOString();
  const offerPrices =
    source.provider === "torob" && page.sellerPricesToman.length >= MIN_VALID_SAMPLES
      ? page.sellerPricesToman.slice(0, 4)
      : [Math.round(median(page.pricesToman))];

  return offerPrices.map((priceToman, index) => ({
    provider: source.provider,
    sourceLabel:
      source.provider === "torob" && offerPrices.length > 1
        ? `${MARKET_PROVIDER_LABELS[source.provider]} · فروشنده ${index + 1}`
        : MARKET_PROVIDER_LABELS[source.provider],
    url,
    productName: page.name,
    priceToman,
    checkedAt,
    inStock: true,
    matchScore: score,
  }));
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

  await Promise.all(MARKET_PROVIDERS.map(async (provider) => {
    const source = sources.find((item) => item.provider === provider);
    if (!source?.enabled) return;

    try {
      const canonicalSlug = canonicalMarketProductSlug(product);
      if (!source.url && provider === "torob" && CURATED_TOROB_URLS[canonicalSlug]) {
        source.url = CURATED_TOROB_URLS[canonicalSlug];
        source.discovered = true;
      }
      if (!source.url && AUTO_DISCOVERY_BASE[provider]) {
        const discovered = await discoverWooStoreSample(product, provider);
        if (!discovered) {
          errors.push(`${MARKET_PROVIDER_LABELS[provider]}: تطبیق خودکار پیدا نشد`);
          return;
        }
        Object.assign(source, discovered.source);
        samples.push(discovered.sample);
        return;
      }
      if (!source.url) return;
      samples.push(...(await sampleFromUrl(product, source)));
    } catch (error) {
      errors.push(
        `${MARKET_PROVIDER_LABELS[provider]}: ${
          error instanceof Error ? error.message : "خطای نامشخص"
        }`,
      );
    }
  }));

  if (!samples.length && !sources.some((source) => source.url) && !errors.length) {
    return "skipped";
  }

  const unique = Array.from(
    new Map(
      samples.map((sample) => [
        `${sample.provider}:${sample.sourceLabel}:${sample.priceToman}`,
        sample,
      ]),
    ).values(),
  );
  const center = unique.length ? median(unique.map((sample) => sample.priceToman)) : 0;
  const included = unique.filter(
    (sample) => sample.priceToman >= center * 0.65 && sample.priceToman <= center * 1.55,
  );
  const excluded = unique.filter((sample) => !included.includes(sample));
  const oldHistory = supersededHistory(product.pricing, checkedAt);

  if (included.length < MIN_VALID_SAMPLES) {
    await updateProductPricingState(product.id, {
      ...product.pricing,
      sources,
      proposal: null,
      history: oldHistory,
      lastCheckedAt: checkedAt,
      lastStatus: errors.length && !included.length ? "error" : "insufficient",
      lastMessage:
        included.length > 0
          ? "قیمت معتبر از منبع انتخاب‌شده پیدا شد، اما برای ساخت پیشنهاد کافی نبود."
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

  // Keep a pending proposal when a later scan reaches the same proposed price.
  // Otherwise both external channels would receive the same alert on every run.
  if (product.pricing.proposal?.proposedPriceToman === proposed) {
    await updateProductPricingState(product.id, {
      ...product.pricing,
      sources,
      lastCheckedAt: checkedAt,
      lastStatus: "pending",
      lastMessage: "پیشنهاد قبلی هنوز معتبر است؛ قیمت پیشنهادی تغییری نکرده است.",
    });
    return "skipped";
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
        : "میانگین از قیمت‌های معتبر فروشنده‌ها محاسبه شد.",
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
      lastMessage: `قیمت اولیه با مجوز مدیر از میانگین ${included.length} قیمت فروشنده معتبر اعمال شد.`,
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
    lastMessage: `پیشنهاد جدید بر اساس ${included.length} قیمت معتبر آماده تأیید است.`,
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

function toMarketPricingProduct(product: CmsProduct): MarketPricingProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price,
    regularPrice: product.regularPrice,
    salePrice: product.salePrice,
    pricing: product.pricing,
  };
}

async function listAllProductsForManualPriceEditing(): Promise<CmsProduct[]> {
  const products: CmsProduct[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await listProducts({
      page,
      perPage: 100,
      status: "all",
      requestTimeoutMs: 30_000,
      requestMaxAttempts: 3,
    });
    products.push(...response.products);
    totalPages = Math.max(1, response.totalPages);
    page += 1;
  } while (page <= totalPages && page <= 20);

  return products;
}

export async function getMarketPricingDashboard(): Promise<MarketPricingDashboard> {
  const [products, editableProducts] = await Promise.all([
    listAllProductsForPricing(),
    listAllProductsForManualPriceEditing(),
  ]);

  return {
    products: products.map(toMarketPricingProduct),
    editableProducts: editableProducts.map(toMarketPricingProduct),
    generatedAt: new Date().toISOString(),
  };
}

export async function runMarketPricingScan(
  mode: MarketPricingScanMode = "review",
): Promise<MarketPricingScanSummary> {
  const startedAt = new Date().toISOString();
  const synchronized = await synchronizeCatalogProductsForPricing();
  const products = synchronized.products;
  // Six products × parallel providers keeps the scan well inside the function
  // window while remaining polite to WooCommerce and third-party stores.
  const results = await mapWithConcurrency(products, 6, async (product) => {
    try {
      return await scanProduct(product, mode);
    } catch {
      return "failed" as const;
    }
  });

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    catalogProductsAdded: synchronized.added,
    baselinePricesApplied: synchronized.baselinePricesApplied,
    checkedProducts: results.filter((result) => result !== "skipped").length,
    proposalsCreated: results.filter((result) => result === "proposal").length,
    pricesApplied: results.filter((result) => result === "applied").length,
    insufficientProducts: results.filter((result) => result === "insufficient").length,
    failedProducts: results.filter((result) => result === "failed").length,
    skippedProducts: results.filter((result) => result === "skipped").length,
  };
}

export async function listNewMarketPricingProposalAlerts(
  startedAt: string,
): Promise<MarketPricingProposalAlert[]> {
  const products = await listAllProductsForPricing();
  return products.flatMap((product) => {
    const proposal = product.pricing.proposal;
    if (!proposal || proposal.createdAt < startedAt) return [];
    return [{ productName: product.name, proposal }];
  });
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
        enabled: true,
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
