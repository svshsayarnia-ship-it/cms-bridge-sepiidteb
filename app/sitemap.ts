import type { MetadataRoute } from "next";
import { catalogGroups } from "./catalog";
import { articles, categories, products } from "./data";
import { siteOrigin } from "./lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteOrigin}${route}`,
      lastModified: new Date("2026-07-25"),
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : route === "/shop" ? 0.9 : 0.7,
    })),
    ...categories.map((category) => ({
      url: `${siteOrigin}/shop/${category.slug}`,
      lastModified: new Date("2026-07-25"),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...catalogGroups.map((group) => ({
      url: `${siteOrigin}/shop/group/${group.slug}`,
      lastModified: new Date("2026-07-25"),
      changeFrequency: "weekly" as const,
      priority: 0.82,
    })),
    ...products.map((product) => ({
      url: `${siteOrigin}/product/${product.slug}`,
      lastModified: new Date("2026-07-25"),
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...articles.map((article) => ({
      url: `${siteOrigin}/magazine/${article.slug}`,
      lastModified: new Date("2026-07-25"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
