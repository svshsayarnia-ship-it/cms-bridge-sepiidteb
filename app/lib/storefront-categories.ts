import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import { catalogCategories } from "../catalog";
import type { Category } from "../data";
import { listCategories } from "./woocommerce";

export const STOREFRONT_CATEGORIES_TAG =
  "storefront-categories";
// Category edits are tag-invalidated after a confirmed CMS write. Public pages
// already have a complete checked-in fallback, so a slow WordPress origin must
// never dominate storefront TTFB just to refresh category labels/images.
const PUBLIC_WOO_TIMEOUT_MS = 350;

export type StorefrontCategory =
  Category & {
    wooId: number | null;
    live: boolean;
  };

function mapFallbackCategory(
  category: Category,
): StorefrontCategory {
  return {
    ...category,
    wooId: null,
    live: false,
  };
}

function fallbackCategories(): StorefrontCategory[] {
  return catalogCategories.map(
    mapFallbackCategory,
  );
}

async function loadStorefrontCategories(): Promise<
  StorefrontCategory[]
> {
  let wooCategories;
  try {
    wooCategories = await listCategories({
      requestTimeoutMs: PUBLIC_WOO_TIMEOUT_MS,
      requestMaxAttempts: 1,
    });
  } catch (error) {
    // The fallback is a valid storefront state, not an exceptional response.
    // Return it from inside unstable_cache so one failed origin probe is shared
    // across cold serverless instances instead of repeated per request.
    console.warn("[storefront-categories] WooCommerce unavailable; caching fallback", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fallbackCategories();
  }

  const wooBySlug = new Map(
    wooCategories.map((category) => [
      category.slug,
      category,
    ]),
  );

  return catalogCategories.map(
    (fallback) => {
      const live =
        wooBySlug.get(fallback.slug);

      if (!live) {
        return mapFallbackCategory(
          fallback,
        );
      }

      return {
        ...fallback,

        title:
          live.name.trim() ||
          fallback.title,

        description:
          live.description.trim() ||
          fallback.description,

        image:
          live.image?.src ||
          fallback.image,

        wooId: live.id,
        live: true,
      };
    },
  );
}

const getCachedStorefrontCategories =
  unstable_cache(
    loadStorefrontCategories,
    ["storefront-categories-v6-cache-valid-fallback"],
    {
      // CMS category writes explicitly invalidate this tag. A daily safety
      // refresh still captures direct WooCommerce edits. If WordPress is down,
      // the complete fallback itself is cached rather than turning every cold
      // instance into another origin timeout.
      revalidate: 86_400,
      tags: [
        STOREFRONT_CATEGORIES_TAG,
      ],
    },
  );

export const getStorefrontCategories =
  cache(getCachedStorefrontCategories);

export async function getStorefrontCategoryBySlug(
  slug: string,
): Promise<StorefrontCategory | null> {
  const categories =
    await getStorefrontCategories();

  return (
    categories.find(
      (category) =>
        category.slug === slug.trim(),
    ) ?? null
  );
}
