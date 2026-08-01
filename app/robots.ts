import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap:
      "https://sepiid-beauty-home.svshsayarnia.chatgpt.site/sitemap.xml",
  };
}

