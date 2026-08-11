import type { Product } from "../data";
import { getCompactBrandLabel } from "./public-copy";

export type PublicCatalogItem = Pick<
  Product,
  | "slug"
  | "nameFa"
  | "nameEn"
  | "category"
  | "categoryTitle"
  | "badge"
  | "image"
  | "imageAlt"
  | "volume"
> & {
  brand: string;
};

function getPublicVolumeLabel(value?: string) {
  if (!value) return undefined;

  const clean = value
    .replace(
      /(?:؛|،)?\s*(?:(?:در|طبق)\s+)?فهرست(?:\s+(?:موجودی|بازار))?.*$/u,
      "",
    )
    .trim();

  return clean || undefined;
}

export function toPublicCatalogItem(product: Product): PublicCatalogItem {
  return {
    slug: product.slug,
    nameFa: product.nameFa,
    nameEn: product.nameEn,
    brand: getCompactBrandLabel(product.brand),
    category: product.category,
    categoryTitle: product.categoryTitle,
    badge: product.badge,
    image: product.image,
    imageAlt: product.imageAlt,
    volume: getPublicVolumeLabel(product.volume),
  };
}
