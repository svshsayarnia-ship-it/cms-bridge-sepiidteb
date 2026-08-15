import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import type { CmsProduct } from "./cms-types";
import {
  forgetRuntimeStorefrontProduct,
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

export async function getStorefrontProductSnapshots(): Promise<ProductSnapshots> {
  return snapshotCache()();
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
