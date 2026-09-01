import type { MetadataRoute } from "next";
import { siteOrigin } from "./lib/site-url";

const privateRoutes = ["/api/", "/cms/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privateRoutes,
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: privateRoutes,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: privateRoutes,
      },
    ],
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
