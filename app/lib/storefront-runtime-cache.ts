import "server-only";

import { getCache } from "@vercel/functions";
import type { CmsProduct } from "./cms-types";

const CACHE_NAMESPACE = "sepiid-storefront";
const PRODUCT_TTL_SECONDS = 60 * 60 * 24 * 30;
const PRODUCT_INDEX_KEY = "product-index";

function productKey(slug: string) {
  return `product:${slug.trim()}`;
}

function productTag(slug: string) {
  return `storefront-product:${slug.trim()}`;
}

function cache() {
  return getCache({ namespace: CACHE_NAMESPACE });
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

function normalizeSlugs(slugs: string[]) {
  return Array.from(
    new Set(slugs.map((slug) => slug.trim()).filter(Boolean)),
  );
}

async function readProductIndex(): Promise<string[]> {
  try {
    const value = await cache().get(PRODUCT_INDEX_KEY);
    if (!Array.isArray(value)) return [];
    return normalizeSlugs(value.filter((item): item is string => typeof item === "string"));
  } catch (error) {
    console.warn("[storefront-runtime-cache] index read failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

async function writeProductIndex(slugs: string[]) {
  const normalized = normalizeSlugs(slugs);
  await cache().set(PRODUCT_INDEX_KEY, normalized, {
    ttl: PRODUCT_TTL_SECONDS,
    tags: ["storefront-products"],
    name: "cms-product-index",
  });
}

export async function getRuntimeStorefrontProduct(
  slug: string,
): Promise<CmsProduct | null> {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return null;

  try {
    const value = await cache().get(productKey(cleanSlug));
    return isCmsProduct(value) ? value : null;
  } catch (error) {
    console.warn("[storefront-runtime-cache] read failed", {
      slug: cleanSlug,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function getRuntimeStorefrontProducts(
  slugs: string[] = [],
): Promise<CmsProduct[]> {
  const indexedSlugs = await readProductIndex();
  const candidates = normalizeSlugs([...indexedSlugs, ...slugs]);
  if (candidates.length === 0) return [];

  const productCache = cache();
  const products = await Promise.all(
    candidates.map(async (slug) => {
      try {
        const value = await productCache.get(productKey(slug));
        return isCmsProduct(value) ? value : null;
      } catch (error) {
        console.warn("[storefront-runtime-cache] catalog read failed", {
          slug,
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }
    }),
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

  const currentIndex = await readProductIndex();
  await writeProductIndex([
    ...currentIndex,
    ...validProducts.map((product) => product.slug),
  ]);
}

export async function forgetRuntimeStorefrontProduct(slug: string) {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return;

  await cache().delete(productKey(cleanSlug));

  const currentIndex = await readProductIndex();
  if (currentIndex.includes(cleanSlug)) {
    await writeProductIndex(currentIndex.filter((item) => item !== cleanSlug));
  }
}
