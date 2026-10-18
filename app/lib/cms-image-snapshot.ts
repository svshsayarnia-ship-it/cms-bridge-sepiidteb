import "server-only";

import snapshot from "./cms-image-snapshot.json";
import type { CmsImage } from "./cms-types";
import { canonicalStorefrontProductSlug } from "./storefront-canonical-product";

type ImageProduct = { slug: string; name: string; images: CmsImage[] };

// Attachment IDs and role metadata read from the live CMS, never substitute
// photographs. Only used when no newer CMS product record is available. This
// lets the first HTML response include the same image that the role API uses.
const products = new Map<string, ImageProduct>();
for (const product of snapshot.products) {
  const slug = canonicalStorefrontProductSlug(product.slug);
  const current = products.get(slug);
  const ids = new Set(current?.images.map((image) => image.id) ?? []);
  products.set(slug, {
    slug,
    name: current?.name ?? product.name,
    images: [...(current?.images ?? []), ...product.images.filter((image) => !ids.has(image.id))],
  });
}

export function getConfirmedCmsImageProduct(slug: string) {
  return products.get(canonicalStorefrontProductSlug(slug)) ?? null;
}

export function getConfirmedCmsImageAsset(id: number) {
  return (snapshot.assets as Record<string, { sourceUrl: string; contentType: string }>)[String(id)] ?? null;
}
