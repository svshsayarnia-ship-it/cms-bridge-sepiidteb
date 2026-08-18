import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import type { CmsProduct, CmsProductInput } from "@/app/lib/cms-types";
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

  const categories = await listCategories({
    requestTimeoutMs: 30_000,
    requestMaxAttempts: 1,
  });
  const targetCategory = categories.find(
    (category) => category.slug === TARGET_CATEGORY_SLUG,
  );

  if (!targetCategory) {
    return Response.json(
      { ok: false, error: `Missing category: ${TARGET_CATEGORY_SLUG}` },
      { status: 409 },
    );
  }

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
