import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
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
  "a72c2117824532bad288aad386faf5dcf8cc7bd989a815e552821cae417219e8";
const TARGET_SLUG = "liporase-1500";
const TARGET_CATEGORY_SLUG = "hyaluronidase-products";

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

function withoutWooImage(
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
    images: [],
    expectedModifiedGmt: product.dateModifiedGmt || undefined,
  };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [product, categories] = await Promise.all([
      getProductBySlug(TARGET_SLUG, {
        requestTimeoutMs: 30_000,
        requestMaxAttempts: 1,
      }),
      listCategories({
        requestTimeoutMs: 30_000,
        requestMaxAttempts: 1,
      }),
    ]);
    if (!product) throw new Error("Liporase product not found");

    const category = categories.find(
      (item) => item.slug === TARGET_CATEGORY_SLUG,
    );
    if (!category) throw new Error("Hyaluronidase category not found");

    // The current Woo image was produced by the old full-frame CMS workflow.
    // Clear it deliberately so the storefront uses its approved static product
    // cutout while the category-specific visual stage owns the background.
    const updated = await updateProduct(
      product.id,
      withoutWooImage(product, category.id),
    );
    await rememberStorefrontProduct(updated, { requirePersistence: true });

    revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });
    revalidatePath("/", "layout");
    revalidatePath("/shop/hyaluronidase-products");
    revalidatePath(`/product/${TARGET_SLUG}`);

    return Response.json({
      ok: true,
      fallbackUsed: true,
      product: {
        id: updated.id,
        slug: updated.slug,
        category: updated.categories[0] ?? null,
        imageCount: updated.images.length,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Migration failed",
      },
      { status: 500 },
    );
  }
}
