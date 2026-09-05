import "server-only";

import { getCache } from "@vercel/functions";
import type { CmsProduct } from "./cms-types";
import { canonicalizeStorefrontProduct } from "./storefront-canonical-product";

const CACHE_NAMESPACE = "sepiid-storefront";
const PRODUCT_TTL_SECONDS = 60 * 60 * 24 * 30;
const PRODUCT_INDEX_KEY = "products:index";
const PRODUCT_INDEX_NAME = "cms-product-index";
const PRODUCT_INDEX_MAX_ATTEMPTS = 3;
const PUBLIC_CACHE_READ_TIMEOUT_MS = 350;

function productKey(slug: string) {
  return `product:${slug.trim()}`;
}

function productTag(slug: string) {
  return `storefront-product:${slug.trim()}`;
}

function cache() {
  return getCache({ namespace: CACHE_NAMESPACE });
}

// Runtime Cache is an optional freshness layer for public pages. A delayed
// cache-region call must behave as a cache miss, not delay the first byte of
// HTML. Confirmed CMS data is still available from the Next Data Cache and
// checked-in fallback catalogue.
async function readPublicCache(key: string): Promise<unknown> {
  const cacheRead = cache().get(key).catch((error) => {
    console.warn("[storefront-runtime-cache] read failed", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  });
  const timeout = new Promise<undefined>((resolve) => {
    setTimeout(resolve, PUBLIC_CACHE_READ_TIMEOUT_MS);
  });

  return Promise.race([cacheRead, timeout]);
}

function isCmsProduct(value: unknown): value is CmsProduct {
  if (!value || typeof value !== "object") return false;

  const product = value as Partial<CmsProduct>;
  return (
    Number.isSafeInteger(product.id) &&
    typeof product.name === "string" &&
    typeof product.slug === "string" &&
    typeof product.description === "string" &&
    typeof product.shortDescription === "string" &&
    Array.isArray(product.images)
  );
}

function isProductSlugIndex(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((slug) => typeof slug === "string" && Boolean(slug.trim()))
  );
}

function normalizeSlugs(slugs: Iterable<string>) {
  return Array.from(
    new Set(
      Array.from(slugs)
        .map((slug) => slug.trim())
        .filter(Boolean),
    ),
  ).sort();
}

async function getRuntimeStorefrontProductSlugs(): Promise<string[]> {
  try {
    const value = await cache().get(PRODUCT_INDEX_KEY);
    return isProductSlugIndex(value) ? normalizeSlugs(value) : [];
  } catch (error) {
    console.warn("[storefront-runtime-cache] product index read failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

async function getPublicRuntimeStorefrontProductSlugs(): Promise<string[]> {
  const value = await readPublicCache(PRODUCT_INDEX_KEY);
  return isProductSlugIndex(value) ? normalizeSlugs(value) : [];
}

async function ensureRuntimeStorefrontProductSlugs(slugs: string[]) {
  const requiredSlugs = normalizeSlugs(slugs);
  if (requiredSlugs.length === 0) return;

  for (let attempt = 1; attempt <= PRODUCT_INDEX_MAX_ATTEMPTS; attempt += 1) {
    const current = await getRuntimeStorefrontProductSlugs();
    if (requiredSlugs.every((slug) => current.includes(slug))) return;

    const next = normalizeSlugs([...current, ...requiredSlugs]);
    const productCache = cache();
    await productCache.set(PRODUCT_INDEX_KEY, next, {
      ttl: PRODUCT_TTL_SECONDS,
      tags: ["storefront-products", "storefront-product-index"],
      name: PRODUCT_INDEX_NAME,
    });

    const persisted = await productCache.get(PRODUCT_INDEX_KEY);
    if (
      isProductSlugIndex(persisted) &&
      requiredSlugs.every((slug) => persisted.includes(slug))
    ) {
      return;
    }
  }

  throw new Error(
    `فهرست Runtime Cache برای «${requiredSlugs.join("، ")}» تأیید نشد.`,
  );
}

async function forgetRuntimeStorefrontProductSlug(slug: string) {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return;

  for (let attempt = 1; attempt <= PRODUCT_INDEX_MAX_ATTEMPTS; attempt += 1) {
    const current = await getRuntimeStorefrontProductSlugs();
    if (!current.includes(cleanSlug)) return;

    const next = current.filter((item) => item !== cleanSlug);
    const productCache = cache();
    await productCache.set(PRODUCT_INDEX_KEY, next, {
      ttl: PRODUCT_TTL_SECONDS,
      tags: ["storefront-products", "storefront-product-index"],
      name: PRODUCT_INDEX_NAME,
    });

    const persisted = await productCache.get(PRODUCT_INDEX_KEY);
    if (isProductSlugIndex(persisted) && !persisted.includes(cleanSlug)) {
      return;
    }
  }

  throw new Error(`حذف «${cleanSlug}» از فهرست Runtime Cache تأیید نشد.`);
}

export async function getRuntimeStorefrontProduct(
  slug: string,
): Promise<CmsProduct | null> {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return null;

  try {
    const value = await readPublicCache(productKey(cleanSlug));
    return isCmsProduct(value) ? canonicalizeStorefrontProduct(value) : null;
  } catch (error) {
    console.warn("[storefront-runtime-cache] read failed", {
      slug: cleanSlug,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Return every product currently known to the Runtime Cache in this region.
 * The index stores only slugs so the cache never needs one large catalog value.
 * This lets discovery surfaces overlay the exact same fresh product records the
 * PDP reads, while the Next Data Cache remains the cross-request snapshot.
 */
export async function getRuntimeStorefrontProducts(): Promise<CmsProduct[]> {
  const slugs = await getPublicRuntimeStorefrontProductSlugs();
  if (slugs.length === 0) return [];

  const products = await Promise.all(
    slugs.map((slug) => getRuntimeStorefrontProduct(slug)),
  );

  return products.filter((product): product is CmsProduct => Boolean(product));
}

export async function rememberRuntimeStorefrontProducts(products: CmsProduct[]) {
  const validProducts = products.filter((product) => Boolean(product.slug.trim()));
  if (validProducts.length === 0) return;

  await Promise.all(
    validProducts.map(async (product) => {
      const productCache = cache();
      await productCache.set(productKey(product.slug), product, {
        ttl: PRODUCT_TTL_SECONDS,
        tags: ["storefront-products", productTag(product.slug)],
        name: "cms-product",
      });

      // The Runtime Cache client deliberately converts transport failures into
      // cache misses. Read the value back so CMS success always means the
      // storefront can immediately retrieve the exact saved product.
      const persisted = await productCache.get(productKey(product.slug));
      if (
        !isCmsProduct(persisted) ||
        persisted.id !== product.id ||
        persisted.dateModifiedGmt !== product.dateModifiedGmt
      ) {
        throw new Error(
          `ذخیرهٔ اجرایی محصول «${product.slug}» تأیید نشد.`,
        );
      }
    }),
  );

  // Keep a compact slug index so catalog/listing surfaces can read the same
  // fresh Runtime Cache records as product detail pages without scanning keys.
  await ensureRuntimeStorefrontProductSlugs(
    validProducts.map((product) => product.slug),
  );
}

export async function forgetRuntimeStorefrontProduct(slug: string) {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return;

  await cache().delete(productKey(cleanSlug));
  await forgetRuntimeStorefrontProductSlug(cleanSlug);
}
