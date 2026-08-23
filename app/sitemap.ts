import type { MetadataRoute } from "next";
import { catalogGroups } from "./catalog";
import {
  brandPages,
  concerns,
  guides,
} from "./content-architecture";
import { categories } from "./data";
import { getManagedArticles, getSitePresentation } from "./lib/site-presentation";
import { getCompactBrandLabel } from "./lib/public-copy";
import { getStorefrontCatalog } from "./lib/storefront-catalog";
import { siteOrigin } from "./lib/site-url";

// Update only after a substantive public-site change; do not use deployment time\n// so sitemap lastmod remains a truthful freshness signal.\nconst fallbackLastModified = new Date(\n  "2026-08-23T00:00:00.000Z",\n);

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
  const managedArticles = getManagedArticles(await getSitePresentation());
  const staticRoutes = [
    "",
    "/shop",
    "/brands",
    "/guides",
    "/magazine",
    "/professional",
    "/about",
    "/contact",
    "/faq",
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

  const categoryRoutes = categories.filter(
    (category) =>
      catalog.products.some(
        (product) => product.category === category.slug,
      ),
  );

  const groupRoutes = catalogGroups.filter((group) =>
    catalog.products.some((product) =>
      group.categorySlugs.includes(product.category),
    ),
  );

  const brandRoutes = brandPages.filter((brand) => {
    if (!brand.indexable) return false;

    const productCount = catalog.products.filter((product) => {
      const label = getCompactBrandLabel(product.brand);
      return brand.matchers.includes(label);
    }).length;

    return productCount >= brand.minProductCount;
  });

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

    ...categoryRoutes.map((category) => ({
      url: `${siteOrigin}/shop/${category.slug}`,
      lastModified:
        fallbackLastModified,
      changeFrequency:
        "weekly" as const,
      priority: 0.8,
    })),

    ...groupRoutes.map((group) => ({
      url: `${siteOrigin}/shop/group/${group.slug}`,
      lastModified:
        fallbackLastModified,
      changeFrequency:
        "weekly" as const,
      priority: 0.82,
    })),

    ...productRoutes,

    ...brandRoutes.map((brand) => ({
      url: `${siteOrigin}/brands/${brand.slug}`,
      lastModified: fallbackLastModified,
      changeFrequency: "weekly" as const,
      priority: 0.76,
    })),

    ...guides
      .filter((guide) => guide.indexable)
      .map((guide) => ({
        url: `${siteOrigin}/guides/${guide.slug}`,
        lastModified: fallbackLastModified,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),

    ...concerns
      .filter((concern) => concern.indexable)
      .map((concern) => ({
        url: `${siteOrigin}/concerns/${concern.slug}`,
        lastModified: fallbackLastModified,
        changeFrequency: "monthly" as const,
        priority: 0.72,
      })),

    ...managedArticles.map((article) => ({
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
