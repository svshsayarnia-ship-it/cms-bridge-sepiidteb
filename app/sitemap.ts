import type { MetadataRoute } from "next";
import { catalogGroups } from "./catalog";
import { articles, categories } from "./data";
import { getStorefrontCatalog } from "./lib/storefront-catalog";
import { siteOrigin } from "./lib/site-url";

const fallbackLastModified = new Date(
  "2026-08-10",
);

function getProductLastModified(
  dateModifiedGmt: string,
): Date {
  const modified = new Date(
    dateModifiedGmt || "",
  );

  return Number.isNaN(modified.getTime())
    ? fallbackLastModified
    : modified;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/shop",
    "/brands",
    "/guides",
    "/magazine",
    "/professional",
    "/about",
    "/contact",
    "/policies/privacy",
    "/policies/terms",
    "/policies/shipping",
    "/policies/returns",
    "/policies/authenticity",
  ];

  const catalog =
    await getStorefrontCatalog();

  const productRoutes =
    catalog.products.map((product) => ({
      url: `${siteOrigin}/product/${product.slug}`,
          lastModified: product.live
        ? getProductLastModified(
            product.dateModifiedGmt ||
              product.reviewedAt,
          )
        : getProductLastModified(
            product.reviewedAt,
          ),
      changeFrequency:
        "weekly" as const,
      priority: product.live
        ? 0.78
        : 0.75,
    }));

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteOrigin}${route}`,
      lastModified:
        fallbackLastModified,
      changeFrequency:
        route === ""
          ? ("weekly" as const)
          : ("monthly" as const),
      priority:
        route === ""
          ? 1
          : route === "/shop"
            ? 0.9
            : 0.7,
    })),

    ...categories.map((category) => ({
      url: `${siteOrigin}/shop/${category.slug}`,
      lastModified:
        fallbackLastModified,
      changeFrequency:
        "weekly" as const,
      priority: 0.8,
    })),

    ...catalogGroups.map((group) => ({
      url: `${siteOrigin}/shop/group/${group.slug}`,
      lastModified:
        fallbackLastModified,
      changeFrequency:
        "weekly" as const,
      priority: 0.82,
    })),

    ...productRoutes,

    ...articles.map((article) => ({
      url: `${siteOrigin}/magazine/${article.slug}`,
      lastModified: getProductLastModified(
        article.dateModified ||
          article.datePublished ||
          "",
      ),
      changeFrequency:
        "monthly" as const,
      priority: 0.7,
    })),
  ];
}
