import type { MetadataRoute } from "next";
import { catalogGroups } from "./catalog";
import { articles, categories, products } from "./data";
import type { CmsProduct } from "./lib/cms-types";
import { siteOrigin } from "./lib/site-url";
import { listProducts } from "./lib/woocommerce";

const fallbackLastModified = new Date("2026-07-25");

function getCmsLastModified(
  product: CmsProduct,
): Date {
  const modified = new Date(
    product.dateModifiedGmt || "",
  );

  return Number.isNaN(modified.getTime())
    ? fallbackLastModified
    : modified;
}

async function getWooProductsForSitemap(): Promise<{
  connected: boolean;
  products: CmsProduct[];
}> {
  const collectedProducts: CmsProduct[] = [];

  try {
    let page = 1;
    let totalPages = 1;

    do {
      const response = await listProducts({
        page,
        perPage: 100,
        status: "all",
      });

      collectedProducts.push(
        ...response.products,
      );

      totalPages = Math.max(
        1,
        response.totalPages,
      );

      page += 1;
    } while (page <= totalPages);

    return {
      connected: true,
      products: collectedProducts,
    };
  } catch {
    return {
      connected: false,
      products: [],
    };
  }
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

  const wooResult =
    await getWooProductsForSitemap();

  const wooProductsBySlug = new Map(
    wooResult.products.map((product) => [
      product.slug,
      product,
    ]),
  );

  const publicWooProducts = Array.from(
    new Map(
      wooResult.products
        .filter(
          (product) =>
            product.slug &&
            product.status === "publish" &&
            product.catalogVisibility !==
              "hidden",
        )
        .map((product) => [
          product.slug,
          product,
        ]),
    ).values(),
  );

  const productRoutes =
    wooResult.connected
      ? [
          ...products
            .filter(
              (product) =>
                !wooProductsBySlug.has(
                  product.slug,
                ),
            )
            .map((product) => ({
              url: `${siteOrigin}/product/${product.slug}`,
              lastModified:
                fallbackLastModified,
              changeFrequency:
                "weekly" as const,
              priority: 0.75,
            })),

          ...publicWooProducts.map(
            (product) => ({
              url: `${siteOrigin}/product/${product.slug}`,
              lastModified:
                getCmsLastModified(product),
              changeFrequency:
                "weekly" as const,
              priority: 0.78,
            }),
          ),
        ]
      : products.map((product) => ({
          url: `${siteOrigin}/product/${product.slug}`,
          lastModified:
            fallbackLastModified,
          changeFrequency:
            "weekly" as const,
          priority: 0.75,
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
      lastModified:
        fallbackLastModified,
      changeFrequency:
        "monthly" as const,
      priority: 0.7,
    })),
  ];
}
