import type { ProductVisualProfile } from "../config/visualProfiles";
import type { Product, ProductVariant } from "../data";
import type { CmsProduct } from "./cms-types";
import { isCmsManagedProductImageSrc } from "./product-image";
import {
  getCompactBrandLabel,
  getPublicVolumeLabel,
  toPublicCopy,
} from "./public-copy";

export type PublicVariantStockStatus =
  | "instock"
  | "outofstock"
  | "onbackorder"
  | "unknown";

export type PublicProductVariant = Pick<
  ProductVariant,
  | "id"
  | "label"
  | "nameFa"
  | "nameEn"
  | "image"
  | "imageAlt"
  | "imageVerified"
  | "imageKind"
  | "volume"
  | "priceToman"
> & {
  stockStatus?: PublicVariantStockStatus;
};

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
  | "fallbackImage"
  | "imageAlt"
  | "imageKind"
  | "position"
  | "volume"
  | "shortBenefit"
  | "priceToman"
> & {
  /** Canonical product asset when the product passed through the public mapper. */
  masterImage?: string;
  visualProfile?: ProductVisualProfile;
  visualScale?: number | null;
  visualOffsetX?: number;
  visualOffsetY?: number;
  price?: string;
  regularPrice?: string;
  salePrice?: string;
  stockStatus?: PublicVariantStockStatus;
  /** Minimal public variant data needed for explicit selection on catalogue cards. */
  variants?: PublicProductVariant[];
  /** Volumes of selectable variants, used by catalog package-volume filters. */
  variantVolumes?: Array<string | null | undefined>;
};

const placeholderImagePattern =
  /(?:category-|editorial-detail|placeholder|default-product|product-placeholder)/iu;

export function isPublicImageSrc(value?: string | null): boolean {
  return Boolean(
    value &&
      !placeholderImagePattern.test(value) &&
      isCmsManagedProductImageSrc(value),
  );
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
    | "fallbackImage"
    | "imageAlt"
    | "imageKind"
    | "position"
    | "volume"
    | "shortBenefit"
    | "priceToman"
  > & {
    visualProfile?: ProductVisualProfile;
    visualScale?: number | null;
    visualOffsetX?: number;
    visualOffsetY?: number;
    price?: string;
    regularPrice?: string;
    salePrice?: string;
    stockStatus?: PublicVariantStockStatus;
    variants?: Array<{
      id: string;
      label: string;
      nameFa: string;
      nameEn: string;
      image: string;
      imageAlt: string;
      imageVerified?: boolean;
      imageKind?: "official" | "market-reference" | "editorial-family";
      volume: string;
      priceToman: number;
      stockStatus?: PublicVariantStockStatus;
    }>;
  },
): PublicProduct {
  return {
    slug: product.slug,
    nameFa: product.nameFa,
    nameEn: product.nameEn,
    brand: getCompactBrandLabel(product.brand),
    category: product.category,
    categoryTitle: toPublicCopy(product.categoryTitle),
    badge: product.badge ? toPublicCopy(product.badge) : product.badge,
    image: product.image,
    fallbackImage: product.fallbackImage,
    masterImage: product.image,
    imageAlt: toPublicCopy(product.imageAlt || `تصویر ${product.nameFa}`),
    imageKind: product.imageKind,
    position: product.position,
    volume: product.volume ? getPublicVolumeLabel(product.volume) : product.volume,
    shortBenefit: toPublicCopy(
      product.shortBenefit || `مشخصات، مدل و قیمت ${product.nameFa} را ببینید.`,
    ),
    priceToman: product.priceToman,
    visualProfile: product.visualProfile,
    visualScale: product.visualScale,
    visualOffsetX: product.visualOffsetX,
    visualOffsetY: product.visualOffsetY,
    price: product.price,
    regularPrice: product.regularPrice,
    salePrice: product.salePrice,
    stockStatus: product.stockStatus,
    variants: product.variants?.map((variant) => ({
      id: variant.id,
      label: toPublicCopy(variant.label),
      nameFa: toPublicCopy(variant.nameFa),
      nameEn: toPublicCopy(variant.nameEn),
      image: variant.image,
      imageAlt: toPublicCopy(variant.imageAlt || `تصویر ${variant.nameFa}`),
      imageVerified: variant.imageVerified,
      imageKind: variant.imageKind,
      volume: variant.volume ? getPublicVolumeLabel(variant.volume) : variant.volume,
      priceToman: variant.priceToman,
      stockStatus: variant.stockStatus,
    })),
    variantVolumes: product.variants?.map((variant) => variant.volume),
  };
}

type StaticProductVisibility = Pick<
  Product,
  "publishedInCatalog" | "imageVerified" | "imageKind" | "imageApproved"
> & {
  image?: string | null;
};

/**
 * A CMS product is public when it is explicitly published and visible. Image
 * presence is intentionally not a visibility gate: a product must not vanish
 * from the catalogue just because its CMS image is temporarily empty. The
 * render boundary still rejects every non-CMS image and shows no placeholder.
 */
export function isPublicStaticProduct(
  product: StaticProductVisibility | null | undefined,
): boolean {
  return Boolean(
    product?.publishedInCatalog === true &&
      (product.imageVerified === true ||
      ((product.imageKind === "editorial-family" ||
        product.imageKind === "market-reference") &&
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
      product.catalogVisibility !== "hidden",
  );
}
