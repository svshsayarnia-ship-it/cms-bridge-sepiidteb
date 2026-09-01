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
import { articlePath } from "./lib/article-url";
import { getStorefrontCatalog } from "./lib/storefront-catalog";
import { siteOrigin } from "./lib/site-url";

// Keep static sitemap URLs fresh when a release changes their indexable content.
// Product and editorial URLs retain their own source dates below.
const staticContentLastModified = new Date("2026-09-01T00:00:00.000Z");

function getProductLastModified(
  dateModifiedGmt: string,
): Date | undefined {
  const modified = new Date(
    dateModifiedGmt || "",
  );

  return Number.isNaN(modified.getTime())
    ? undefined
    : modified;
}

function sitemapEntry(
  url: string,
  dateModifiedGmt?: string,
) {
  const lastModified = dateModifiedGmt
    ? getProductLastModified(dateModifiedGmt)
    : undefined;

  return lastModified
    ? { url, lastModified }
    : { url };
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
      ...sitemapEntry(
        `${siteOrigin}/product/${product.slug}`,
        product.live
          ? product.dateModifiedGmt || product.reviewedAt
          : product.reviewedAt,
      ),
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
      lastModified: staticContentLastModified,
    })),

    ...categoryRoutes.map((category) => ({
      url: `${siteOrigin}/shop/${category.slug}`,
      lastModified: staticContentLastModified,
    })),

    ...groupRoutes.map((group) => ({
      url: `${siteOrigin}/shop/group/${group.slug}`,
      lastModified: staticContentLastModified,
    })),

    ...productRoutes,

    ...brandRoutes.map((brand) => ({
      url: `${siteOrigin}/brands/${brand.slug}`,
      lastModified: staticContentLastModified,
    })),

    ...guides
      .filter((guide) => guide.indexable)
      .map((guide) => ({
        url: `${siteOrigin}/guides/${guide.slug}`,
        lastModified: staticContentLastModified,
      })),

    ...concerns
      .filter((concern) => concern.indexable)
      .map((concern) => ({
        url: `${siteOrigin}/concerns/${concern.slug}`,
        lastModified: staticContentLastModified,
      })),

    ...managedArticles.map((article) => ({
      ...sitemapEntry(
        `${siteOrigin}${articlePath(article.slug)}`,
        article.dateModified || article.datePublished || "",
      ),
    })),
  ];
}
