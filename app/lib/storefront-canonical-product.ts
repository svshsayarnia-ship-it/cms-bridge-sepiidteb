import type { CmsProduct } from "./cms-types";
import {
  canonicalInventorySlug,
  isApprovedInventorySlug,
} from "../current-inventory";

/**
 * WooCommerce can append -2, -3, ... when an older record still owns the
 * desired slug. Public storefront URLs are owned by the curated catalogue,
 * not by those duplicate CMS suffixes.
 */
export function canonicalStorefrontProductSlug(slug: string): string {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return cleanSlug;

  const explicitAlias = canonicalInventorySlug(cleanSlug);
  if (explicitAlias !== cleanSlug) return explicitAlias;

  const duplicateMatch = cleanSlug.match(/^(.*)-(\d+)$/u);
  if (!duplicateMatch) return cleanSlug;

  const suffix = Number(duplicateMatch[2]);
  const baseSlug = duplicateMatch[1];

  if (
    Number.isInteger(suffix) &&
    suffix >= 2 &&
    suffix <= 20 &&
    isApprovedInventorySlug(baseSlug)
  ) {
    return baseSlug;
  }

  return cleanSlug;
}

export function canonicalizeStorefrontProduct(
  product: CmsProduct,
): CmsProduct {
  const slug = canonicalStorefrontProductSlug(product.slug);
  return slug === product.slug ? product : { ...product, slug };
}
