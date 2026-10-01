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
  setProductPricesBatch,
  updateProductPublicationState,
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

export type InventoryAvailabilityRepairResult = {
  checked: number;
  created: number;
  repaired: number;
  createdSlugs: string[];
  repairedSlugs: string[];
};

export async function ensureApprovedInventoryProductsAvailable(
  slugs: string[],
): Promise<InventoryAvailabilityRepairResult> {
  const requested = new Set(
    slugs
      .map((slug) => canonicalInventorySlug(String(slug ?? "").trim()))
      .filter((slug) => isApprovedInventorySlug(slug)),
  );

  if (!requested.size) {
    return {
      checked: 0,
      created: 0,
      repaired: 0,
      createdSlugs: [],
      repairedSlugs: [],
    };
  }

  const approved = approvedCatalogProducts().filter((product) =>
    requested.has(product.slug),
  );
  const [existingProducts, categories] = await Promise.all([
    listAllWooProducts(),
    listCategories({
      requestTimeoutMs: 30_000,
      requestMaxAttempts: 2,
    }),
  ]);

  const existingByExactSlug = new Map(
    existingProducts
      .map((product) => [product.slug.trim(), product] as const)
      .filter(([slug]) => Boolean(slug)),
  );
  const categoryIds = new Map(
    categories.map((category) => [category.slug, category.id] as const),
  );

  const missing: Product[] = [];
  const publicationRepairs: CmsProduct[] = [];
  const missingPriceUpdates: Array<{ id: number; priceToman: number }> = [];
  const generatedDuplicatesToHide: CmsProduct[] = [];

  for (const product of approved) {
    const existing = existingByExactSlug.get(product.slug);
    if (!existing) {
      missing.push(product);
      continue;
    }

    let canonical = existing;
    if (
      existing.status !== "publish" ||
      existing.catalogVisibility === "hidden"
    ) {
      canonical = await updateProductPublicationState(existing.id, {
        status: "publish",
        catalogVisibility: "visible",
      });
      publicationRepairs.push(canonical);
    }

    const currentPrice = Number(
      canonical.salePrice || canonical.regularPrice || canonical.price,
    );
    if (
      (!Number.isFinite(currentPrice) || currentPrice <= 0) &&
      Number.isSafeInteger(product.priceToman) &&
      Number(product.priceToman) > 0
    ) {
      missingPriceUpdates.push({
        id: canonical.id,
        priceToman: Number(product.priceToman),
      });
    }

    const generatedSku = `SPB-${product.slug}`;
    const duplicatePrefix = `${product.slug}-`;
    for (const candidate of existingProducts) {
      if (
        candidate.id === canonical.id ||
        candidate.sku !== generatedSku ||
        !candidate.slug.startsWith(duplicatePrefix)
      ) {
        continue;
      }
      const suffix = candidate.slug.slice(duplicatePrefix.length);
      if (!/^\d+$/u.test(suffix) || Number(suffix) < 2) continue;
      generatedDuplicatesToHide.push(candidate);
    }
  }

  const priced = await setProductPricesBatch(missingPriceUpdates);

  const hiddenDuplicates: CmsProduct[] = [];
  for (const duplicate of generatedDuplicatesToHide) {
    if (
      duplicate.status === "draft" &&
      duplicate.catalogVisibility === "hidden"
    ) {
      continue;
    }
    hiddenDuplicates.push(
      await updateProductPublicationState(duplicate.id, {
        status: "draft",
        catalogVisibility: "hidden",
      }),
    );
  }

  const created: CmsProduct[] = [];
  for (let index = 0; index < missing.length; index += BATCH_SIZE) {
    const batch = missing.slice(index, index + BATCH_SIZE);
    const inputs = batch.map((product) =>
      productToInput(product, categoryIds.get(product.category)),
    );
    created.push(...(await createProductsBatch(inputs)));
  }

  const changed = [
    ...created,
    ...publicationRepairs,
    ...priced,
    ...hiddenDuplicates,
  ];
  if (changed.length > 0) {
    await rememberStorefrontProducts(changed);
    revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });
  }

  const repairedSlugs = Array.from(
    new Set(
      [...publicationRepairs, ...priced, ...hiddenDuplicates].map(
        (product) => product.slug,
      ),
    ),
  );

  const result: InventoryAvailabilityRepairResult = {
    checked: approved.length,
    created: created.length,
    repaired: repairedSlugs.length,
    createdSlugs: created.map((product) => product.slug),
    repairedSlugs,
  };

  console.info("[inventory-woo-sync] availability repaired", result);
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
