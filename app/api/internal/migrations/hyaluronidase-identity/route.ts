import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import type { CmsCategory, CmsProduct, CmsProductInput } from "@/app/lib/cms-types";
import { STOREFRONT_CATALOG_TAG } from "@/app/lib/storefront-catalog";
import { rememberStorefrontProduct } from "@/app/lib/storefront-product-snapshots";
import {
  getProductBySlug,
  listCategories,
  updateProduct,
} from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";

const EXPECTED_TOKEN_HASH =
  "80554717abbd7b162787aa61c0f3fd401e2110da575cad43fa0403ee08ee2338";
const TARGET_CATEGORY_SLUG = "hyaluronidase-products";
const TARGET_CATEGORY_NAME = "آنزیم‌های هیالورونیداز";
const TARGET_SLUGS = ["liporase-1500", "hyalase-1500"] as const;

function isAuthorized(request: Request) {
  const url = new URL(request.url);
  const token =
    request.headers.get("x-sepiid-migration-token") ||
    url.searchParams.get("token") ||
    "";
  const actual = Buffer.from(
    createHash("sha256").update(token).digest("hex"),
    "utf8",
  );
  const expected = Buffer.from(EXPECTED_TOKEN_HASH, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function ensureTargetCategory(): Promise<CmsCategory> {
  const categories = await listCategories({
    requestTimeoutMs: 30_000,
    requestMaxAttempts: 1,
  });
  const existing = categories.find(
    (category) => category.slug === TARGET_CATEGORY_SLUG,
  );
  if (existing) return existing;

  const storeUrl = (process.env.WORDPRESS_URL ?? "").trim().replace(/\/$/, "");
  const consumerKey = (process.env.WOOCOMMERCE_CONSUMER_KEY ?? "").trim();
  const consumerSecret = (process.env.WOOCOMMERCE_CONSUMER_SECRET ?? "").trim();
  if (!storeUrl || !consumerKey || !consumerSecret) {
    throw new Error("WooCommerce configuration is incomplete");
  }

  const response = await fetch(`${storeUrl}/wp-json/wc/v3/products/categories`, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: TARGET_CATEGORY_NAME,
      slug: TARGET_CATEGORY_SLUG,
      description:
        "محصولات هیالورونیداز حرفه‌ای؛ دسته کاتالوگی هماهنگ با Sepiid Beauty.",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Unable to create WooCommerce category (${response.status}): ${detail}`);
  }

  const category = (await response.json()) as {
    id: number;
    name: string;
    slug: string;
    description?: string;
    parent?: number;
    image?: { id: number; src: string; name?: string; alt?: string } | null;
    count?: number;
  };

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    parent: category.parent ?? 0,
    image: category.image
      ? {
          id: category.image.id,
          src: category.image.src,
          name: category.image.name ?? "",
          alt: category.image.alt ?? "",
        }
      : null,
    count: category.count ?? 0,
  };
}

function buildIdentityInput(
  product: CmsProduct,
  categoryId: number,
): CmsProductInput {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    status: product.status,
    catalogVisibility: product.catalogVisibility,
    featured: product.featured,
    description: product.description,
    shortDescription: product.shortDescription,
    seoTitle: product.seoTitle,
    metaDescription: product.metaDescription,
    focusKeyword: product.focusKeyword,
    sourceName: product.sourceName,
    sourceUrl: product.sourceUrl,
    reviewerName: product.reviewerName,
    reviewerRole: product.reviewerRole,
    reviewedAt: product.reviewedAt,
    regularPrice: product.regularPrice || product.price,
    salePrice: product.salePrice,
    manageStock: product.manageStock,
    stockQuantity: product.stockQuantity,
    stockStatus: product.stockStatus,
    categoryIds: [categoryId],
    // Product photography is owned by the storefront catalog for this category.
    // Clearing legacy Woo media prevents a second baked-in background from
    // sitting on top of the shared hyaluronidase visual stage.
    images: [],
    expectedModifiedGmt: product.dateModifiedGmt,
  };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const targetCategory = await ensureTargetCategory();
  const results = [];
  for (const slug of TARGET_SLUGS) {
    const current = await getProductBySlug(slug, {
      requestTimeoutMs: 30_000,
      requestMaxAttempts: 1,
    });

    if (!current) {
      results.push({ slug, updated: false, error: "Product not found" });
      continue;
    }

    const alreadyNormalized =
      current.categories.length === 1 &&
      current.categories[0]?.slug === TARGET_CATEGORY_SLUG &&
      current.images.length === 0;

    if (alreadyNormalized) {
      results.push({
        slug,
        id: current.id,
        updated: false,
        alreadyNormalized: true,
        categories: current.categories,
        imageCount: current.images.length,
      });
      continue;
    }

    const updated = await updateProduct(
      current.id,
      buildIdentityInput(current, targetCategory.id),
    );
    await rememberStorefrontProduct(updated, { requirePersistence: true });

    results.push({
      slug,
      id: updated.id,
      updated: true,
      categories: updated.categories,
      imageCount: updated.images.length,
    });
  }

  revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });

  return Response.json({
    ok: true,
    category: {
      id: targetCategory.id,
      slug: targetCategory.slug,
      name: targetCategory.name,
    },
    results,
  });
}
