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
const REMOTE_FAILURE_BACKOFF_MS = 10 * 60 * 1000;
let remoteFailureBackoffUntil = 0;

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
  const wooCategories =
    await listCategories({
      requestTimeoutMs: PUBLIC_WOO_TIMEOUT_MS,
      requestMaxAttempts: 1,
    });

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
    ["storefront-categories-v5-fast-public-fallback"],
    {
      // CMS category writes explicitly invalidate this tag. A daily safety
      // refresh still captures direct WooCommerce edits without making a slow
      // origin a 1.5s blocking dependency for the public homepage.
      revalidate: 86_400,
      tags: [
        STOREFRONT_CATEGORIES_TAG,
      ],
    },
  );

export const getStorefrontCategories =
  cache(async () => {
    if (Date.now() < remoteFailureBackoffUntil) {
      return fallbackCategories();
    }

    try {
      const categories = await getCachedStorefrontCategories();
      remoteFailureBackoffUntil = 0;
      return categories;
    } catch (error) {
      // Keep serving the complete checked-in categories immediately while the
      // commerce origin is unhealthy. The longer backoff prevents a burst of
      // cold serverless instances from repeatedly waiting on the same outage.
      remoteFailureBackoffUntil = Date.now() + REMOTE_FAILURE_BACKOFF_MS;
      console.warn("[storefront-categories] WooCommerce unavailable; using fallback", {
        error: error instanceof Error ? error.message : String(error),
        retryAfterMs: REMOTE_FAILURE_BACKOFF_MS,
      });
      return fallbackCategories();
    }
  });

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
