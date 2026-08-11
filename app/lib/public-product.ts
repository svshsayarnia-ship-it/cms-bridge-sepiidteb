import type { Product } from "../data";
import type { CmsProduct } from "./cms-types";
import { getCompactBrandLabel } from "./public-copy";

export type PublicProduct = Pick<
  Product,
  | "slug"
  | "nameFa"
  | "nameEn"
  | "brand"
  | "category"
  | "categoryTitle"
  | "badge"
  | "image"
  | "imageAlt"
  | "imageKind"
  | "position"
  | "volume"
  | "shortBenefit"
>;

const placeholderImagePattern =
  /(?:category-|editorial-detail|placeholder|default-product|product-placeholder)/iu;

export function isPublicImageSrc(value?: string | null): boolean {
  return Boolean(value && !placeholderImagePattern.test(value));
}

export function toPublicProduct(
  product: Pick<
    Product,
    | "slug"
    | "nameFa"
    | "nameEn"
    | "brand"
    | "category"
    | "categoryTitle"
    | "badge"
    | "image"
    | "imageAlt"
    | "imageKind"
    | "position"
    | "volume"
    | "shortBenefit"
  >,
): PublicProduct {
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
    imageKind: product.imageKind,
    position: product.position,
    volume: product.volume,
    shortBenefit: product.shortBenefit,
  };
}

type StaticProductVisibility = Pick<
  Product,
  "publishedInCatalog" | "imageVerified" | "imageKind" | "imageApproved"
> & {
  image?: string | null;
};

/**
 * A product is public only when it is explicitly published and has either an
 * exact verified image or an approved editorial-family image. Category
 * placeholders must never make a product indexable or appear in the store.
 */
export function isPublicStaticProduct(
  product: StaticProductVisibility | null | undefined,
): boolean {
  return Boolean(
    product?.publishedInCatalog === true &&
      (product.imageVerified === true ||
        (product.imageKind === "editorial-family" &&
          product.imageApproved === true)) &&
      isPublicImageSrc(product.image),
  );
}

export function hasPublicCmsImage(
  product: Pick<CmsProduct, "images"> | null | undefined,
): boolean {
  return Boolean(
    product?.images?.some((image) => isPublicImageSrc(image.src)),
  );
}

export function isPublicCmsProduct(
  product: Pick<
    CmsProduct,
    "slug" | "status" | "catalogVisibility" | "images"
  > | null | undefined,
): boolean {
  return Boolean(
    product?.slug &&
      product.status === "publish" &&
      product.catalogVisibility !== "hidden" &&
      hasPublicCmsImage(product),
  );
}
