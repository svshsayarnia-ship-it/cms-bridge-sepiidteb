import "server-only";

import { revalidateTag } from "next/cache";
import { catalogProducts } from "@/app/catalog";
import {
  canonicalInventorySlug,
  currentInventoryLegacyAliases,
  isApprovedInventorySlug,
} from "@/app/current-inventory";
import type { Product } from "@/app/data";
import type { CmsProduct, CmsProductInput } from "./cms-types";
import { STOREFRONT_CATALOG_TAG } from "./storefront-catalog";
import { rememberStorefrontProducts } from "./storefront-product-snapshots";
import {
  createProductsBatch,
  listCategories,
  listProducts,
} from "./woocommerce";

const AUTO_SYNC_TTL_MS = 5 * 60 * 1000;
const MAX_SYNC_PAGES = 20;
const BATCH_SIZE = 100;

export type InventoryWooSyncResult = {
  checked: number;
  existing: number;
  created: number;
  createdSlugs: string[];
  skippedByTtl: boolean;
};

let lastSuccessfulSyncAt = 0;
let lastSuccessfulResult: InventoryWooSyncResult | null = null;
let syncInFlight: Promise<InventoryWooSyncResult> | null = null;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function approvedCatalogProducts(): Product[] {
  const canonical = new Map<string, Product>();

  for (const product of catalogProducts) {
    if (product.publishedInCatalog === false) continue;
    if (!isApprovedInventorySlug(product.slug)) continue;
    if (Object.hasOwn(currentInventoryLegacyAliases, product.slug)) continue;

    const slug = canonicalInventorySlug(product.slug);
    if (slug !== product.slug) continue;
    if (!canonical.has(slug)) canonical.set(slug, product);
  }

  return [...canonical.values()];
}

async function listAllWooProducts(): Promise<CmsProduct[]> {
  const products: CmsProduct[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await listProducts({
      page,
      perPage: 100,
      status: "all",
      requestTimeoutMs: 30_000,
      requestMaxAttempts: 2,
    });

    products.push(...result.products);
    totalPages = Math.max(1, result.totalPages);
    page += 1;
  } while (page <= totalPages && page <= MAX_SYNC_PAGES);

  return products;
}

function initialDescription(product: Product): string {
  const summary = escapeHtml(product.summary);
  const featureItems = product.features
    .slice(0, 4)
    .map((feature) => `<li>${escapeHtml(feature)}</li>`)
    .join("");

  return featureItems
    ? `<p>${summary}</p><ul>${featureItems}</ul>`
    : `<p>${summary}</p>`;
}

function productToInput(
  product: Product,
  categoryId: number | undefined,
): CmsProductInput {
  const price =
    Number.isSafeInteger(product.priceToman) && Number(product.priceToman) > 0
      ? String(product.priceToman)
      : "";

  const compactSummary = product.summary.trim().slice(0, 155);
  const englishName = product.nameEn.trim();
  const seoTitle = `${product.nameFa}${englishName ? ` (${englishName})` : ""} | سپید بیوتی`;

  return {
    name: product.nameFa,
    slug: product.slug,
    sku: "",
    status: "publish",
    catalogVisibility: "visible",
    featured: false,
    description: initialDescription(product),
    shortDescription: product.summary,
    seoTitle: seoTitle.slice(0, 65),
    metaDescription: compactSummary,
    focusKeyword: product.nameFa,
    sourceName: product.sourceName ?? "Sepiid Beauty inventory",
    sourceUrl: product.sourceUrl ?? "",
    reviewerName: "",
    reviewerRole: "",
    reviewedAt: product.reviewedAt ?? "",
    regularPrice: price,
    salePrice: "",
    manageStock: false,
    stockQuantity: null,
    stockStatus: "instock",
    categoryIds: categoryId ? [categoryId] : [],
    // Local storefront assets cannot be uploaded to WordPress by URL. The
    // storefront keeps using the approved static fallback until an image is
    // explicitly uploaded through CMS.
    images: [],
  };
}

async function performSync(): Promise<InventoryWooSyncResult> {
  const approved = approvedCatalogProducts();
  const [existingProducts, categories] = await Promise.all([
    listAllWooProducts(),
    listCategories({
      requestTimeoutMs: 30_000,
      requestMaxAttempts: 2,
    }),
  ]);

  const existingCanonicalSlugs = new Set(
    existingProducts
      .map((product) => product.slug.trim())
      .filter(Boolean)
      .map(canonicalInventorySlug),
  );

  const categoryIds = new Map(
    categories.map((category) => [category.slug, category.id] as const),
  );

  const missing = approved.filter(
    (product) => !existingCanonicalSlugs.has(product.slug),
  );

  const created: CmsProduct[] = [];
  for (let index = 0; index < missing.length; index += BATCH_SIZE) {
    const batch = missing.slice(index, index + BATCH_SIZE);
    const inputs = batch.map((product) =>
      productToInput(product, categoryIds.get(product.category)),
    );
    created.push(...(await createProductsBatch(inputs)));
  }

  if (created.length > 0) {
    await rememberStorefrontProducts(created);
    revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });
  }

  const result: InventoryWooSyncResult = {
    checked: approved.length,
    existing: approved.length - missing.length,
    created: created.length,
    createdSlugs: created.map((product) => product.slug),
    skippedByTtl: false,
  };

  console.info("[inventory-woo-sync] completed", result);
  return result;
}

export async function syncApprovedInventoryToWoo(options: {
  force?: boolean;
} = {}): Promise<InventoryWooSyncResult> {
  const now = Date.now();

  if (
    !options.force &&
    lastSuccessfulResult &&
    now - lastSuccessfulSyncAt < AUTO_SYNC_TTL_MS
  ) {
    return {
      ...lastSuccessfulResult,
      skippedByTtl: true,
    };
  }

  if (syncInFlight) return syncInFlight;

  syncInFlight = performSync();
  try {
    const result = await syncInFlight;
    lastSuccessfulSyncAt = Date.now();
    lastSuccessfulResult = result;
    return result;
  } finally {
    syncInFlight = null;
  }
}
