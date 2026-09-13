import "server-only";

import { catalogProducts } from "../catalog";
import { WooCommerceError } from "./woocommerce";

export const VARIANT_PRICE_META_KEY = "sepiid_variant_prices";

export type QuickPriceEntityKind =
  | "product"
  | "catalog-variant"
  | "woo-variation";

export type VariantPriceOverride = {
  regularPrice: string;
  salePrice: string;
  updatedAt?: string;
};

export type VariantPriceOverrideMap = Record<string, VariantPriceOverride>;

export type QuickPriceItem = {
  key: string;
  kind: QuickPriceEntityKind;
  productId: number;
  parentId: number | null;
  variantKey: string | null;
  name: string;
  parentName: string;
  slug: string;
  sku: string;
  regularPrice: string;
  salePrice: string;
  price: string;
  sourceLabel: string;
};

type WooMeta = {
  id?: number;
  key?: string;
  value?: unknown;
};

type WooAttribute = {
  id?: number;
  name?: string;
  option?: string;
};

type WooPricingProduct = {
  id?: number;
  name?: string;
  slug?: string;
  sku?: string;
  type?: string;
  status?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  variations?: number[];
  meta_data?: WooMeta[];
  date_modified_gmt?: string;
};

type WooPricingVariation = {
  id?: number;
  parent_id?: number;
  sku?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  attributes?: WooAttribute[];
};

type WooPage<T> = {
  data: T;
  headers: Headers;
};

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function config() {
  const storeUrl = env("WORDPRESS_URL").replace(/\/$/u, "");
  const consumerKey = env("WOOCOMMERCE_CONSUMER_KEY");
  const consumerSecret = env("WOOCOMMERCE_CONSUMER_SECRET");

  if (!storeUrl || !consumerKey || !consumerSecret) {
    throw new WooCommerceError(
      "اتصال WooCommerce برای ویرایش قیمت آماده نیست.",
      503,
      "variant_pricing_not_configured",
    );
  }

  return { storeUrl, consumerKey, consumerSecret };
}

async function wooRequest<T>(
  path: string,
  options: RequestInit = {},
  query?: URLSearchParams,
  timeoutMs = 30_000,
): Promise<WooPage<T>> {
  const { storeUrl, consumerKey, consumerSecret } = config();
  const cleanPath = path.replace(/^\//u, "");
  const url = new URL(`${storeUrl}/wp-json/wc/v3/${cleanPath}`);
  query?.forEach((value, key) => url.searchParams.set(key, value));

  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");
  headers.set("cache-control", "no-cache, no-store, max-age=0");
  headers.set("pragma", "no-cache");

  if (env("WOOCOMMERCE_AUTH_MODE") === "query") {
    url.searchParams.set("consumer_key", consumerKey);
    url.searchParams.set("consumer_secret", consumerSecret);
  } else {
    headers.set(
      "authorization",
      `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
    );
  }

  const method = (options.method ?? "GET").toUpperCase();
  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (method === "GET" || method === "HEAD") {
    url.searchParams.set("_sepiid_cache_bust", String(Date.now()));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!response.ok) {
      const error = body as { message?: string; code?: string } | null;
      throw new WooCommerceError(
        error?.message || `WooCommerce با خطای ${response.status} پاسخ داد.`,
        response.status,
        error?.code || "variant_pricing_woo_error",
      );
    }

    return {
      data: body as T,
      headers: response.headers,
    };
  } catch (error) {
    if (error instanceof WooCommerceError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new WooCommerceError(
        "زمان اتصال به WooCommerce برای قیمت واریانت تمام شد.",
        504,
        "variant_pricing_timeout",
      );
    }
    throw new WooCommerceError(
      error instanceof Error ? error.message : "اتصال به WooCommerce ناموفق بود.",
      502,
      "variant_pricing_connection_failed",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function validId(value: unknown): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function priceString(value: unknown): string {
  const normalized = safeString(value).trim();
  return /^\d+$/u.test(normalized) ? normalized : "";
}

export function parseVariantPriceOverrides(value: unknown): VariantPriceOverrideMap {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  const result: VariantPriceOverrideMap = {};
  for (const [key, raw] of Object.entries(parsed as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const entry = raw as Record<string, unknown>;
    result[key] = {
      regularPrice: priceString(entry.regularPrice),
      salePrice: priceString(entry.salePrice),
      updatedAt: safeString(entry.updatedAt) || undefined,
    };
  }
  return result;
}

function variantPriceMeta(product: WooPricingProduct): {
  meta: WooMeta | null;
  prices: VariantPriceOverrideMap;
} {
  const meta = (product.meta_data ?? []).find(
    (item) => item.key === VARIANT_PRICE_META_KEY,
  ) ?? null;
  return {
    meta,
    prices: parseVariantPriceOverrides(meta?.value),
  };
}

function canonicalCatalogProduct(slug: string) {
  const exact = catalogProducts.find((product) => product.slug === slug);
  if (exact) return exact;
  const withoutDuplicateSuffix = slug.replace(/-\d+$/u, "");
  return catalogProducts.find((product) => product.slug === withoutDuplicateSuffix) ?? null;
}

function parentItem(product: WooPricingProduct): QuickPriceItem | null {
  const id = validId(product.id);
  if (!id) return null;
  const name = safeString(product.name) || `محصول ${id}`;
  const regularPrice = priceString(product.regular_price);
  const salePrice = priceString(product.sale_price);
  return {
    key: `product:${id}`,
    kind: "product",
    productId: id,
    parentId: null,
    variantKey: null,
    name,
    parentName: name,
    slug: safeString(product.slug),
    sku: safeString(product.sku),
    regularPrice,
    salePrice,
    price: salePrice || regularPrice || priceString(product.price),
    sourceLabel: "محصول اصلی",
  };
}

function catalogVariantItems(product: WooPricingProduct): QuickPriceItem[] {
  const parentId = validId(product.id);
  if (!parentId) return [];
  const catalogProduct = canonicalCatalogProduct(safeString(product.slug));
  if (!catalogProduct?.variants?.length) return [];

  const parentName = safeString(product.name) || catalogProduct.nameFa;
  const overrides = variantPriceMeta(product).prices;

  return catalogProduct.variants.map((variant) => {
    const override = overrides[variant.id];
    const regularPrice = override?.regularPrice || String(variant.priceToman || "");
    const salePrice = override?.salePrice || "";
    return {
      key: `catalog-variant:${parentId}:${variant.id}`,
      kind: "catalog-variant" as const,
      productId: parentId,
      parentId,
      variantKey: variant.id,
      name: `${parentName} — ${variant.label}`,
      parentName,
      slug: safeString(product.slug),
      sku: `${safeString(product.sku) || catalogProduct.slug}-${variant.id}`,
      regularPrice,
      salePrice,
      price: salePrice || regularPrice,
      sourceLabel: "واریانت سایت",
    };
  });
}

function variationName(parentName: string, variation: WooPricingVariation): string {
  const attributes = (variation.attributes ?? [])
    .map((attribute) => safeString(attribute.option) || safeString(attribute.name))
    .filter(Boolean)
    .join(" / ");
  const id = validId(variation.id);
  return attributes
    ? `${parentName} — ${attributes}`
    : `${parentName} — واریانت ${id ?? ""}`.trim();
}

async function listWooVariations(product: WooPricingProduct): Promise<QuickPriceItem[]> {
  const parentId = validId(product.id);
  if (!parentId || product.type !== "variable") return [];

  const parentName = safeString(product.name) || `محصول ${parentId}`;
  const items: QuickPriceItem[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await wooRequest<WooPricingVariation[]>(
      `products/${parentId}/variations`,
      {},
      new URLSearchParams({
        page: String(page),
        per_page: "100",
        orderby: "id",
        order: "asc",
        _fields: "id,parent_id,sku,price,regular_price,sale_price,attributes",
      }),
    );
    const rows = Array.isArray(response.data) ? response.data : [];
    for (const variation of rows) {
      const variationId = validId(variation.id);
      if (!variationId) continue;
      const regularPrice = priceString(variation.regular_price);
      const salePrice = priceString(variation.sale_price);
      items.push({
        key: `woo-variation:${parentId}:${variationId}`,
        kind: "woo-variation",
        productId: variationId,
        parentId,
        variantKey: String(variationId),
        name: variationName(parentName, variation),
        parentName,
        slug: safeString(product.slug),
        sku: safeString(variation.sku),
        regularPrice,
        salePrice,
        price: salePrice || regularPrice || priceString(variation.price),
        sourceLabel: "واریانت WooCommerce",
      });
    }
    totalPages = Math.max(
      1,
      Number(response.headers.get("x-wp-totalpages") ?? 1),
    );
    page += 1;
  } while (page <= totalPages && page <= 20);

  return items;
}

async function listWooProductsForQuickPricing(): Promise<WooPricingProduct[]> {
  const products: WooPricingProduct[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await wooRequest<WooPricingProduct[]>(
      "products",
      {},
      new URLSearchParams({
        page: String(page),
        per_page: "100",
        status: "any",
        orderby: "id",
        order: "asc",
        _fields:
          "id,name,slug,sku,type,status,price,regular_price,sale_price,variations,meta_data,date_modified_gmt",
      }),
    );
    if (Array.isArray(response.data)) products.push(...response.data);
    totalPages = Math.max(
      1,
      Number(response.headers.get("x-wp-totalpages") ?? 1),
    );
    page += 1;
  } while (page <= totalPages && page <= 20);

  return products;
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  if (!values.length) return [];
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

export async function listQuickPriceItems(): Promise<QuickPriceItem[]> {
  const products = await listWooProductsForQuickPricing();
  const variationGroups = await mapWithConcurrency(products, 5, async (product) => {
    try {
      return await listWooVariations(product);
    } catch {
      // A malformed variation collection must not make every product disappear
      // from the operator's quick-price screen.
      return [];
    }
  });

  return products.flatMap((product, index) => {
    const parent = parentItem(product);
    return [
      ...(parent ? [parent] : []),
      ...catalogVariantItems(product),
      ...variationGroups[index],
    ];
  });
}

function normalizeManualPrice(value: string): string {
  const normalized = value.replace(/[\s,،]/gu, "").trim();
  if (!normalized) return "";
  if (!/^\d+$/u.test(normalized)) {
    throw new WooCommerceError(
      "قیمت باید فقط شامل عدد باشد.",
      400,
      "invalid_variant_price",
    );
  }
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new WooCommerceError(
      "قیمت معتبر نیست.",
      400,
      "invalid_variant_price",
    );
  }
  return String(parsed);
}

async function getRawProduct(id: number): Promise<WooPricingProduct> {
  const response = await wooRequest<WooPricingProduct>(
    `products/${id}`,
    {},
    new URLSearchParams({
      _fields:
        "id,name,slug,sku,type,status,price,regular_price,sale_price,variations,meta_data,date_modified_gmt",
    }),
  );
  return response.data;
}

async function saveParentPrice(
  id: number,
  regularPrice: string,
  salePrice: string,
): Promise<QuickPriceItem> {
  const response = await wooRequest<WooPricingProduct>(`products/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      regular_price: regularPrice,
      sale_price: salePrice,
    }),
  });
  const item = parentItem(response.data);
  if (!item || item.regularPrice !== regularPrice || item.salePrice !== salePrice) {
    throw new WooCommerceError(
      "ذخیره قیمت محصول در WooCommerce تأیید نشد.",
      502,
      "product_price_persistence_mismatch",
    );
  }
  return item;
}

async function saveWooVariationPrice(
  parentId: number,
  variationId: number,
  regularPrice: string,
  salePrice: string,
): Promise<QuickPriceItem> {
  const parent = await getRawProduct(parentId);
  const response = await wooRequest<WooPricingVariation>(
    `products/${parentId}/variations/${variationId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        regular_price: regularPrice,
        sale_price: salePrice,
      }),
    },
  );
  const saved = response.data;
  if (
    priceString(saved.regular_price) !== regularPrice ||
    priceString(saved.sale_price) !== salePrice
  ) {
    throw new WooCommerceError(
      "ذخیره قیمت واریانت WooCommerce تأیید نشد.",
      502,
      "variation_price_persistence_mismatch",
    );
  }
  const parentName = safeString(parent.name) || `محصول ${parentId}`;
  return {
    key: `woo-variation:${parentId}:${variationId}`,
    kind: "woo-variation",
    productId: variationId,
    parentId,
    variantKey: String(variationId),
    name: variationName(parentName, saved),
    parentName,
    slug: safeString(parent.slug),
    sku: safeString(saved.sku),
    regularPrice,
    salePrice,
    price: salePrice || regularPrice || priceString(saved.price),
    sourceLabel: "واریانت WooCommerce",
  };
}

async function saveCatalogVariantPrice(
  parentId: number,
  variantKey: string,
  regularPrice: string,
  salePrice: string,
): Promise<QuickPriceItem> {
  const parent = await getRawProduct(parentId);
  const catalogProduct = canonicalCatalogProduct(safeString(parent.slug));
  const variant = catalogProduct?.variants?.find((item) => item.id === variantKey);
  if (!catalogProduct || !variant) {
    throw new WooCommerceError(
      "این واریانت در کاتالوگ سپید بیوتی تعریف نشده است.",
      404,
      "catalog_variant_not_found",
    );
  }

  const currentMeta = variantPriceMeta(parent);
  const nextPrices: VariantPriceOverrideMap = {
    ...currentMeta.prices,
    [variantKey]: {
      regularPrice,
      salePrice,
      updatedAt: new Date().toISOString(),
    },
  };

  const metaPayload = {
    ...(currentMeta.meta?.id ? { id: currentMeta.meta.id } : {}),
    key: VARIANT_PRICE_META_KEY,
    value: JSON.stringify(nextPrices),
  };

  const response = await wooRequest<WooPricingProduct>(`products/${parentId}`, {
    method: "PUT",
    body: JSON.stringify({ meta_data: [metaPayload] }),
  });
  const persisted = variantPriceMeta(response.data).prices[variantKey];
  if (
    !persisted ||
    persisted.regularPrice !== regularPrice ||
    persisted.salePrice !== salePrice
  ) {
    throw new WooCommerceError(
      "ذخیره قیمت واریانت سایت در WooCommerce تأیید نشد.",
      502,
      "catalog_variant_price_persistence_mismatch",
    );
  }

  const parentName = safeString(response.data.name) || catalogProduct.nameFa;
  return {
    key: `catalog-variant:${parentId}:${variantKey}`,
    kind: "catalog-variant",
    productId: parentId,
    parentId,
    variantKey,
    name: `${parentName} — ${variant.label}`,
    parentName,
    slug: safeString(response.data.slug),
    sku: `${safeString(response.data.sku) || catalogProduct.slug}-${variantKey}`,
    regularPrice,
    salePrice,
    price: salePrice || regularPrice,
    sourceLabel: "واریانت سایت",
  };
}

export async function saveQuickPrice(input: {
  kind: QuickPriceEntityKind;
  productId: number;
  parentId?: number | null;
  variantKey?: string | null;
  regularPrice: string;
  salePrice: string;
}): Promise<QuickPriceItem> {
  const productId = validId(input.productId);
  if (!productId) {
    throw new WooCommerceError("شناسه محصول معتبر نیست.", 400, "invalid_product_id");
  }
  const regularPrice = normalizeManualPrice(input.regularPrice);
  const salePrice = normalizeManualPrice(input.salePrice);

  if (input.kind === "product") {
    return saveParentPrice(productId, regularPrice, salePrice);
  }

  const parentId = validId(input.parentId);
  if (!parentId) {
    throw new WooCommerceError("شناسه محصول والد معتبر نیست.", 400, "invalid_parent_id");
  }

  if (input.kind === "woo-variation") {
    return saveWooVariationPrice(parentId, productId, regularPrice, salePrice);
  }

  const variantKey = safeString(input.variantKey).trim();
  if (!variantKey) {
    throw new WooCommerceError("شناسه واریانت معتبر نیست.", 400, "invalid_variant_key");
  }
  return saveCatalogVariantPrice(
    parentId,
    variantKey,
    regularPrice,
    salePrice,
  );
}

function slugCandidates(slug: string): string[] {
  const clean = slug.trim();
  if (!clean) return [];
  const candidates = [clean];
  if (!/-\d+$/u.test(clean)) {
    for (let suffix = 2; suffix <= 9; suffix += 1) {
      candidates.push(`${clean}-${suffix}`);
    }
  }
  return candidates;
}

export async function getCatalogVariantPriceOverrides(
  slug: string,
): Promise<VariantPriceOverrideMap> {
  const candidates = slugCandidates(slug);
  if (!candidates.length) return {};

  const results = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        const response = await wooRequest<WooPricingProduct[]>(
          "products",
          {},
          new URLSearchParams({
            slug: candidate,
            status: "any",
            per_page: "10",
            _fields: "id,slug,meta_data,date_modified_gmt",
          }),
          12_000,
        );
        return Array.isArray(response.data) ? response.data : [];
      } catch {
        return [];
      }
    }),
  );

  const products = results.flat();
  const newest = products.sort((a, b) => {
    const aTime = Date.parse(safeString(a.date_modified_gmt));
    const bTime = Date.parse(safeString(b.date_modified_gmt));
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  })[0];

  return newest ? variantPriceMeta(newest).prices : {};
}
