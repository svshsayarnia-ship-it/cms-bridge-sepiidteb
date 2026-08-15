import "server-only";

import { connection } from "next/server";
import { cache } from "react";
import {
  catalogCategories,
  catalogProducts,
  getGroupForCategory,
} from "../catalog";
import { currentInventoryLegacyAliases } from "../current-inventory";
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
import { listStorefrontProducts } from "./woocommerce";

const PRODUCTS_PER_PAGE = 100;
const MAX_CATALOG_PAGES = 500;
const PUBLIC_WOO_TIMEOUT_MS = 12_000;
const DEFAULT_PRODUCT_IMAGE = "/images/editorial-detail.webp";

export const STOREFRONT_CATALOG_TAG = "storefront-catalog";

export type StorefrontCatalogSource = "woocommerce" | "migration-fallback";

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
  const liveImage = verifiedFallbackImage ?? product.images?.find((image) => Boolean(image.src));
  const descriptionText = plainText(product.shortDescription || product.description || "");
  const summary = descriptionText || fallback?.summary || "اطلاعات تکمیلی این محصول هنگام استعلام ارائه می‌شود.";
  const specs = addSkuToSpecs([...(fallback?.specs ?? [])], product.sku);

  return {
    slug: product.slug,
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
    priceToman: fallback?.priceToman,
    priceNote: fallback?.priceNote,
    sourceStatus: fallback?.sourceStatus || toPublicCopy(product.sourceName) || "اطلاعات محصول در زمان استعلام بازبینی می‌شود",
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
    dateModifiedGmt: "",
    live: false,
  };
}

async function fetchAllWooProducts(): Promise<CmsProduct[]> {
  const products: CmsProduct[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await listStorefrontProducts({
      page,
      perPage: PRODUCTS_PER_PAGE,
      requestTimeoutMs: PUBLIC_WOO_TIMEOUT_MS,
    });
    products.push(...response.products);
    totalPages = Math.max(1, response.totalPages);
    if (totalPages > MAX_CATALOG_PAGES) throw new Error("WooCommerce catalog pagination exceeded the safe limit.");
    page += 1;
  } while (page <= totalPages);
  return products;
}

async function loadStorefrontCatalog(): Promise<StorefrontCatalog> {
  await connection();

  const fallbackBySlug = new Map(catalogProducts.map((product) => [product.slug, product]));
  try {
    const wooProducts = await fetchAllWooProducts();
    const mappedProducts = wooProducts
      .filter((product) => {
        const fallback = fallbackBySlug.get(product.slug);
        return isPublicWooProduct(product) ||
          (Boolean(product.slug) && product.status === "publish" && product.catalogVisibility !== "hidden" && isPublicStaticProduct(fallback));
      })
      .filter((product) => !Object.hasOwn(currentInventoryLegacyAliases, product.slug))
      .map((product) => mapWooProduct(product, fallbackBySlug.get(product.slug)));

    const publicWooSlugs = new Set(mappedProducts.map((product) => product.slug));
    const publishedCodeProducts = catalogProducts
      .filter((product) => isPublicStaticProduct(product) && !publicWooSlugs.has(product.slug))
      .map(mapFallbackProduct);
    const uniqueProducts = Array.from(new Map([...mappedProducts, ...publishedCodeProducts].map((product) => [product.slug, product])).values());

    return { products: uniqueProducts, connected: true, source: "woocommerce" };
  } catch (error) {
    console.error(
      "[storefront-catalog] WooCommerce load failed; using migration fallback.",
      error,
    );
    return {
      products: catalogProducts.filter((product) => isPublicStaticProduct(product)).map(mapFallbackProduct),
      connected: false,
      source: "migration-fallback",
    };
  }
}

// IMPORTANT: prices must not be served from a 5-minute persistent cache.
// Quick Price Edit writes directly to WooCommerce; the storefront must read the
// current WooCommerce price on the next request. React cache still deduplicates
// repeated reads within the same server render.
export const getStorefrontCatalog = cache(loadStorefrontCatalog);

export async function getStorefrontProducts(): Promise<StorefrontProduct[]> {
  const catalog = await getStorefrontCatalog();
  return catalog.products;
}

export async function getStorefrontProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  const products = await getStorefrontProducts();
  return products.find((product) => product.slug === slug.trim()) ?? null;
}
