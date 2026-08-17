import type { Metadata } from "next";
import { canonicalizePublicProductPath } from "./public-product-url";

export const defaultSocialImage =
  "/images/drive/hero-rejuvenation.webp";

type SeoMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export function toMetaDescription(
  value: string,
  maxLength = 160,
): string {
  const normalized = value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const shortened = normalized.slice(
    0,
    maxLength - 1,
  );
  const lastSpace = shortened.lastIndexOf(" ");

  return `${shortened.slice(
    0,
    lastSpace > maxLength * 0.7
      ? lastSpace
      : undefined,
  )}…`;
}

export function buildSeoMetadata({
  title,
  description: rawDescription,
  path,
  image = defaultSocialImage,
  imageAlt = "Sepiid Beauty",
  type = "website",
  publishedTime,
  modifiedTime,
}: SeoMetadataOptions): Metadata {
  const description = toMetaDescription(
    rawDescription,
  );
  const canonicalPath = canonicalizePublicProductPath(path);

  const sharedOpenGraph = {
    title,
    description,
    url: canonicalPath,
    locale: "fa_IR",
    siteName: "Sepiid Beauty",
    images: [
      {
        url: image,
        alt: imageAlt,
      },
    ],
  };

  const openGraph: Metadata["openGraph"] =
    type === "article"
      ? {
          ...sharedOpenGraph,
          type: "article",
          publishedTime,
          modifiedTime,
          authors: ["Sepiid Beauty"],
        }
      : {
          ...sharedOpenGraph,
          type: "website",
        };

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
