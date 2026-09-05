import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import type { CmsProduct } from "./cms-types";
import { canonicalizeStorefrontProduct } from "./storefront-canonical-product";
import {
  forgetRuntimeStorefrontProduct,
  getRuntimeStorefrontProducts,
  rememberRuntimeStorefrontProducts,
} from "./storefront-runtime-cache";

const SNAPSHOT_TAG = "storefront-product-snapshots";
const SNAPSHOT_KEY = ["storefront-product-snapshots-v1"];

type ProductSnapshots = Record<string, CmsProduct>;

// The value is set only while a CMS write is warming the Next Data Cache. On
// regular storefront reads the cached value is returned, so no request needs
// to wait for an unreliable WordPress connection.
let snapshotSeed: ProductSnapshots | null = null;

async function snapshotValue(): Promise<ProductSnapshots> {
  return snapshotSeed ?? {};
}

function snapshotCache() {
  return unstable_cache(snapshotValue, SNAPSHOT_KEY, {
    revalidate: false,
    tags: [SNAPSHOT_TAG],
  });
}

function preferNewestProduct(
  current: CmsProduct | undefined,
  candidate: CmsProduct,
): CmsProduct {
  if (!current) return candidate;

  const currentModified = Date.parse(current.dateModifiedGmt || "");
  const candidateModified = Date.parse(candidate.dateModifiedGmt || "");

  if (
    Number.isFinite(candidateModified) &&
    (!Number.isFinite(currentModified) || candidateModified > currentModified)
  ) {
    return candidate;
  }

  if (
    Number.isFinite(currentModified) &&
    Number.isFinite(candidateModified) &&
    currentModified > candidateModified
  ) {
    return current;
  }

  // Equal or legacy timestamps: prefer the Runtime Cache record because it is
  // the value most recently confirmed by a CMS write or a live Woo read.
  return candidate;
}

function canonicalizeSnapshots(snapshots: ProductSnapshots): ProductSnapshots {
  const normalized: ProductSnapshots = {};

  for (const product of Object.values(snapshots)) {
    const canonicalProduct = canonicalizeStorefrontProduct(product);
    const slug = canonicalProduct.slug.trim();
    if (!slug) continue;

    normalized[slug] = preferNewestProduct(normalized[slug], canonicalProduct);
  }

  return normalized;
}

export async function getStorefrontProductSnapshots(): Promise<ProductSnapshots> {
  const [persistedSnapshots, runtimeProducts] = await Promise.all([
    snapshotCache()(),
    getRuntimeStorefrontProducts(),
  ]);

  const canonicalPersistedSnapshots = canonicalizeSnapshots(persistedSnapshots);
  if (runtimeProducts.length === 0) return canonicalPersistedSnapshots;

  const merged: ProductSnapshots = { ...canonicalPersistedSnapshots };
  for (const rawProduct of runtimeProducts) {
    const product = canonicalizeStorefrontProduct(rawProduct);
    const slug = product.slug.trim();
    if (!slug) continue;
    merged[slug] = preferNewestProduct(merged[slug], product);
  }

  return merged;
}

type RememberOptions = {
  requirePersistence?: boolean;
};

export async function rememberStorefrontProduct(
  product: CmsProduct,
  options: RememberOptions = {},
) {
  await rememberStorefrontProducts([product], options);
}

export async function rememberStorefrontProducts(
  products: CmsProduct[],
  { requirePersistence = false }: RememberOptions = {},
) {
  const incoming = Object.fromEntries(
    products
      .map((product) => [product.slug.trim(), product] as const)
      .filter(([slug]) => Boolean(slug)),
  );

  if (Object.keys(incoming).length === 0) return;

  let runtimeSynced = false;
  try {
    await rememberRuntimeStorefrontProducts(Object.values(incoming));
    runtimeSynced = true;
  } catch (error) {
    console.error("[storefront-snapshots] runtime cache write failed", {
      slugs: Object.keys(incoming),
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (requirePersistence && !runtimeSynced) {
    throw new Error(
      `همگام‌سازی فوری ویترین برای «${Object.keys(incoming).join("، ")}» تأیید نشد.`,
    );
  }

  // This read now overlays Runtime Cache values onto the persisted Next Data
  // Cache snapshot. A confirmed CMS image therefore reaches cards, category
  // pages, search and PDP through one product record instead of two diverging
  // cache paths.
  const current = await getStorefrontProductSnapshots();
  snapshotSeed = { ...current, ...incoming };

  try {
    revalidateTag(SNAPSHOT_TAG, { expire: 0 });
    const persisted = await snapshotCache()();
    const failedSlugs = Object.entries(incoming)
      .filter(([slug, product]) => {
        const saved = persisted[slug];
        return !saved || saved.id !== product.id || saved.dateModifiedGmt !== product.dateModifiedGmt;
      })
      .map(([slug]) => slug);

    if (failedSlugs.length > 0) {
      console.warn("[storefront-snapshots] write not confirmed", {
        slugs: failedSlugs,
      });

      if (requirePersistence) {
        throw new Error(
          `ذخیرهٔ Snapshot ویترین برای «${failedSlugs.join("، ")}» تأیید نشد.`,
        );
      }
      return;
    }

    console.info("[storefront-snapshots] write confirmed", {
      count: Object.keys(incoming).length,
      slugs: Object.keys(incoming),
      runtimeSynced,
    });
  } finally {
    snapshotSeed = null;
  }
}

export async function forgetStorefrontProduct(slug: string) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return;

  try {
    await forgetRuntimeStorefrontProduct(normalizedSlug);
  } catch (error) {
    console.error("[storefront-snapshots] runtime cache delete failed", {
      slug: normalizedSlug,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const current = await getStorefrontProductSnapshots();
  if (!current[normalizedSlug]) return;

  const remaining = { ...current };
  delete remaining[normalizedSlug];
  snapshotSeed = remaining;

  try {
    revalidateTag(SNAPSHOT_TAG, { expire: 0 });
    await snapshotCache()();
  } finally {
    snapshotSeed = null;
  }
}
