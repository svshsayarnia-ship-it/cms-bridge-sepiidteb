import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import type { CmsProduct } from "./cms-types";

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

export async function rememberStorefrontProduct(product: CmsProduct) {
  await rememberStorefrontProducts([product]);
}

export async function rememberStorefrontProducts(products: CmsProduct[]) {
  const incoming = Object.fromEntries(
    products
      .map((product) => [product.slug.trim(), product] as const)
      .filter(([slug]) => Boolean(slug)),
  );

  if (Object.keys(incoming).length === 0) return;

  const current = await getStorefrontProductSnapshots();
  snapshotSeed = { ...current, ...incoming };

  try {
    revalidateTag(SNAPSHOT_TAG, { expire: 0 });
    await snapshotCache()();
  } finally {
    snapshotSeed = null;
  }
}

export async function forgetStorefrontProduct(slug: string) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return;

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
