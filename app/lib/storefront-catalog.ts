import "server-only";

import { connection } from "next/server";
import { cache } from "react";
import {
  catalogCategories,
  catalogProducts,
  getGroupForCategory,
} from "../catalog";
import {
  currentInventoryLegacyAliases,
  isApprovedInventorySlug,
} from "../current-inventory";
import type { Product } from "../data";
import type { CmsProduct } from "./cms-types";
import {
  getEnglishBrandLabel,
  getPublicSourceUrl,
  toPublicCopy,
} from "./public-copy";
import {
  isPublicCmsProduct,
  isPublicImageSrc,
  isPublicStaticProduct,
} from "./public-product";
import { getStorefrontProductSnapshots } from "./storefront-product-snapshots";

const DEFAULT_PRODUCT_IMAGE = "/images/editorial-detail.webp";

export const STOREFRONT_CATALOG_TAG = "storefront-catalog";

export type StorefrontCatalogSource =
  | "price-snapshot"
  | "migration-fallback";

export type StorefrontProduct = Product & {
  wooId: number | null;
  sku: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  manageStock: boolean;
  stockQuantity: number | null;
  stockStatus: CmsProduct["stockStatus"] | "unknown";
  featured: boolean;
  descriptionHtml: string;
  shortDescriptionHtml: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  sourceName: string;
  sourceUrl: string;
  reviewerName: string;
  reviewerRole: string;
  reviewedAt: string;
  visualProfile: CmsProduct["visualProfile"];
  visualScale: number | null;
  visualOffsetX: number;
  visualOffsetY: number;
  dateModifiedGmt: string;
  live: boolean;
};

export type StorefrontCatalog = {
  products: StorefrontProduct[];
  connected: boolean;
  source: StorefrontCatalogSource;
};

function plainText(html: string): string {
  return toPublicCopy(html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/\s+/g, " ")
    .trim());
}

export function isPublicWooProduct(product: CmsProduct): boolean {
  return isPublicCmsProduct(product);
}

function addSkuToSpecs(specs: Array<[string, string]>, sku: string): Array<[string, string]> {
  if (!sku || specs.some(([label]) => label.trim().toLocaleLowerCase("en") === "sku")) return specs;
  return [...specs, ["SKU", sku]];
}

function humanizeStorefrontProduct(product: StorefrontProduct): StorefrontProduct {
  return {
    ...product,
    badge: product.badge ? toPublicCopy(product.badge) : product.badge,
    imageAlt: toPublicCopy(product.imageAlt),
    volume: product.volume ? toPublicCopy(product.volume) : product.volume,
    priceNote: product.priceNote ? toPublicCopy(product.priceNote) : product.priceNote,
    sourceStatus: product.sourceStatus ? toPublicCopy(product.sourceStatus) : product.sourceStatus,
    warning: product.warning ? toPublicCopy(product.warning) : product.warning,
    summary: toPublicCopy(product.summary),
    shortBenefit: toPublicCopy(product.shortBenefit),
    audience: toPublicCopy(product.audience),
    features: product.features.map((item) => toPublicCopy(item)),
    specs: product.specs.map(([label, value]) => [toPublicCopy(label), toPublicCopy(value)] as [string, string]),
    checks: product.checks.map((item) => toPublicCopy(item)),
    faq: product.faq.map((item) => ({
      question: toPublicCopy(item.question),
      answer: toPublicCopy(item.answer),
    })),
    variants: product.variants?.map((variant) => ({
      ...variant,
      label: toPublicCopy(variant.label),
      nameFa: toPublicCopy(variant.nameFa),
      imageAlt: toPublicCopy(variant.imageAlt),
      volume: toPublicCopy(variant.volume),
      summary: toPublicCopy(variant.summary),
      priceNote: variant.priceNote ? toPublicCopy(variant.priceNote) : variant.priceNote,
      features: variant.features.map((item) => toPublicCopy(item)),
      specs: variant.specs.map(([label, value]) => [toPublicCopy(label), toPublicCopy(value)] as [string, string]),
    })),
  };
}

function mapWooProduct(product: CmsProduct, fallback?: Product): StorefrontProduct {
  const primaryCategory = product.categories?.[0];
  const sourceCategorySlug = primaryCategory?.slug || fallback?.category || "products";
  const categorySlug = sourceCategorySlug === "body-fillers" ? "fillers" : sourceCategorySlug;
  const categoryTitle =
    (sourceCategorySlug === "body-fillers"
      ? catalogCategories.find((item) => item.slug === "fillers")?.title
      : primaryCategory?.name) || fallback?.categoryTitle || "محصولات";
  const group = getGroupForCategory(categorySlug);

  const verifiedFallbackImage =
    fallback?.imageVerified === true && isPublicImageSrc(fallback.image)
      ? { src: fallback.image, alt: fallback.imageAlt ?? "" }
      : null;
  const liveImage = product.images?.find((image) => Boolean(image.src)) ?? verifiedFallbackImage;
  const descriptionText = plainText(product.shortDescription || product.description || "");
  const summary = descriptionText || fallback?.summary || "اگر درباره مدل، حجم یا بسته این محصول سؤال دارید، قبل از سفارش از تیم سپید بپرسید.";
  const specs = addSkuToSpecs([...(fallback?.specs ?? [])], product.sku);
  const livePrice = Number(product.salePrice || product.regularPrice || product.price);
  const priceToman = Number.isSafeInteger(livePrice) && livePrice > 0
    ? livePrice
    : fallback?.priceToman;

  return {
    slug: fallback?.slug || product.slug,
    nameFa: product.name || fallback?.nameFa || product.slug,
    nameEn: fallback?.nameEn ?? "",
    brand: getEnglishBrandLabel(product.brands?.[0]?.name || fallback?.brand || "") || fallback?.brand || "",
    category: categorySlug,
    categoryTitle,
    group: fallback?.group || group?.slug,
    groupTitle: fallback?.groupTitle || group?.title,
    badge: product.featured ? "منتخب" : fallback?.badge,
    image: liveImage?.src || fallback?.image || DEFAULT_PRODUCT_IMAGE,
    imageAlt: liveImage?.alt || fallback?.imageAlt || `تصویر ${product.name}`,
    imageVerified: Boolean(liveImage?.src) || Boolean(fallback?.imageVerified),
    imageKind: liveImage?.src ? "official" : fallback?.imageKind,
    imageApproved: Boolean(liveImage?.src) || Boolean(fallback?.imageApproved),
    position: fallback?.position || "50%",
    volume: fallback?.volume,
    priceToman,
    priceNote: fallback?.priceNote,
    sourceStatus: fallback?.sourceStatus || toPublicCopy(product.sourceName) || "اطلاعات این محصول قبل از سفارش دوباره بررسی می‌شود",
    warning: fallback?.warning,
    summary,
    shortBenefit: fallback?.shortBenefit || summary,
    audience: fallback?.audience || "پزشکان و کلینیک‌ها",
    features: fallback?.features ?? [],
    specs,
    checks: fallback?.checks ?? ["نام محصول، بسته‌بندی، تاریخ و بچ‌کد پیش از مصرف بررسی شود."],
    faq: fallback?.faq ?? [],
    publishedInCatalog: fallback?.publishedInCatalog,
    wooId: product.id,
    sku: product.sku,
    price: product.price,
    regularPrice: product.regularPrice,
    salePrice: product.salePrice,
    manageStock: product.manageStock,
    stockQuantity: product.stockQuantity,
    stockStatus: product.stockStatus,
    featured: product.featured,
    descriptionHtml: product.description,
    shortDescriptionHtml: product.shortDescription,
    seoTitle: product.seoTitle,
    metaDescription: product.metaDescription,
    focusKeyword: product.focusKeyword,
    sourceName: fallback?.sourceName || toPublicCopy(product.sourceName) || "",
    sourceUrl: getPublicSourceUrl(product.sourceUrl) || fallback?.sourceUrl || "",
    reviewerName: product.reviewerName,
    reviewerRole: product.reviewerRole,
    reviewedAt: product.reviewedAt || fallback?.reviewedAt || "",
    visualProfile: product.visualProfile,
    visualScale: product.visualScale,
    visualOffsetX: product.visualOffsetX,
    visualOffsetY: product.visualOffsetY,
    variants: fallback?.variants,
    dateModifiedGmt: product.dateModifiedGmt,
    live: true,
  };
}

function mapFallbackProduct(product: Product): StorefrontProduct {
  return {
    ...product,
    wooId: null,
    sku: "",
    price: "",
    regularPrice: "",
    salePrice: "",
    manageStock: false,
    stockQuantity: null,
    stockStatus: "unknown",
    featured: false,
    descriptionHtml: "",
    shortDescriptionHtml: "",
    seoTitle: "",
    metaDescription: "",
    focusKeyword: "",
    sourceName: product.sourceName ?? "",
    sourceUrl: product.sourceUrl ?? "",
    reviewerName: "",
    reviewerRole: "",
    reviewedAt: product.reviewedAt ?? "",
    visualProfile: "default",
    visualScale: null,
    visualOffsetX: 0,
    visualOffsetY: 0,
    dateModifiedGmt: "",
    live: false,
  };
}

function publicFallbackForProduct(
  product: CmsProduct,
  fallbackBySlug: Map<string, Product>,
): Product | undefined {
  const exact = fallbackBySlug.get(product.slug);
  if (exact) return exact;

  // WooCommerce appends -2, -3, ... when a historical slug is still occupied.
  // Resolve only a plausible duplicate suffix and only when that canonical
  // catalog slug actually exists. Do not strip arbitrary model numbers such as
  // neuronox-100 or dyston-500.
  const duplicateMatch = product.slug.match(/^(.*)-(\d+)$/u);
  if (!duplicateMatch) return undefined;

  const suffix = Number(duplicateMatch[2]);
  if (!Number.isInteger(suffix) || suffix < 2 || suffix > 20) {
    return undefined;
  }

  return fallbackBySlug.get(duplicateMatch[1]);
}

function preferSnapshot(
  current: StorefrontProduct | undefined,
  candidate: StorefrontProduct,
): StorefrontProduct {
  if (!current) return candidate;

  const currentModified = Date.parse(current.dateModifiedGmt || "");
  const candidateModified = Date.parse(candidate.dateModifiedGmt || "");

  if (
    Number.isFinite(candidateModified) &&
    (!Number.isFinite(currentModified) || candidateModified > currentModified)
  ) {
    return candidate;
  }

  if (
    Number.isFinite(currentModified) &&
    Number.isFinite(candidateModified) &&
    candidateModified < currentModified
  ) {
    return current;
  }

  // If legacy snapshots lack reliable modification timestamps, prefer the one
  // carrying a real CMS/Woo image over a static fallback. This prevents an old
  // slug alias with no media from replacing the current CMS photograph.
  const currentHasCmsImage = current.imageKind === "official";
  const candidateHasCmsImage = candidate.imageKind === "official";
  if (candidateHasCmsImage !== currentHasCmsImage) {
    return candidateHasCmsImage ? candidate : current;
  }

  return candidate;
}

async function loadStorefrontCatalog(): Promise<StorefrontCatalog> {
  await connection();

  // SepiidTeb is the temporary source of truth for which product families may
  // appear publicly. Keep the large legacy catalog intact for migration and
  // content references, but never let an old Woo snapshot or legacy seed leak
  // an unapproved product back into the storefront.
  const approvedCatalogProducts = catalogProducts.filter((product) =>
    isApprovedInventorySlug(product.slug),
  );
  const fallbackBySlug = new Map(
    approvedCatalogProducts.map((product) => [product.slug, product]),
  );
  const snapshots = await getStorefrontProductSnapshots();
  const mappedSnapshots = Object.values(snapshots)
    .filter((product) => {
      const fallback = publicFallbackForProduct(product, fallbackBySlug);
      return isPublicWooProduct(product) ||
        (Boolean(product.slug) && product.status === "publish" && product.catalogVisibility !== "hidden" && isPublicStaticProduct(fallback));
    })
    .map((product) => mapWooProduct(product, publicFallbackForProduct(product, fallbackBySlug)))
    .filter((product) => !Object.hasOwn(currentInventoryLegacyAliases, product.slug))
    .filter((product) => isApprovedInventorySlug(product.slug));

  const snapshotBySlug = new Map<string, StorefrontProduct>();
  for (const product of mappedSnapshots) {
    snapshotBySlug.set(
      product.slug,
      preferSnapshot(snapshotBySlug.get(product.slug), product),
    );
  }
  const snapshotProducts = Array.from(snapshotBySlug.values());
  const snapshotSlugs = new Set(snapshotProducts.map((product) => product.slug));
  const fallbackProducts = approvedCatalogProducts
    .filter((product) => isPublicStaticProduct(product) && !snapshotSlugs.has(product.slug))
    .map(mapFallbackProduct);

  const products = Array.from(
    new Map([...snapshotProducts, ...fallbackProducts].map((product) => [product.slug, product])).values(),
  ).map(humanizeStorefrontProduct);

  if (snapshotProducts.length > 0) {
    return {
      products,
      connected: true,
      source: "price-snapshot",
    };
  }

  return {
    products,
    connected: false,
    source: "migration-fallback",
  };
}

// Public rendering intentionally performs no WooCommerce network request.
// Confirmed CMS writes populate the storefront snapshot and invalidate affected
// routes; if WordPress is slow or unavailable, the public site still renders
// immediately from the last confirmed snapshot plus the local migration data.
export const getStorefrontCatalog = cache(loadStorefrontCatalog);

export async function getStorefrontProducts(): Promise<StorefrontProduct[]> {
  const catalog = await getStorefrontCatalog();
  return catalog.products;
}

export async function getStorefrontProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  const products = await getStorefrontProducts();
  return products.find((product) => product.slug === slug.trim()) ?? null;
}