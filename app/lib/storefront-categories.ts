import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import { catalogCategories } from "../catalog";
import type { Category } from "../data";
import { listCategories } from "./woocommerce";

export const STOREFRONT_CATEGORIES_TAG =
  "storefront-categories";
const PUBLIC_WOO_TIMEOUT_MS = 6_000;

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

async function loadStorefrontCategories(): Promise<
  StorefrontCategory[]
> {
  try {
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
  } catch {
    return catalogCategories.map(
      mapFallbackCategory,
    );
  }
}

const getCachedStorefrontCategories =
  unstable_cache(
    loadStorefrontCategories,
    ["storefront-categories-v3"],
    {
      revalidate: 300,
      tags: [
        STOREFRONT_CATEGORIES_TAG,
      ],
    },
  );

export const getStorefrontCategories =
  cache(
    getCachedStorefrontCategories,
  );

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
