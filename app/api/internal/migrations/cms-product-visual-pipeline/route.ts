import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import type { CmsCategory, CmsImage, CmsProduct, CmsProductInput } from "@/app/lib/cms-types";
import { normalizeCmsProductImage } from "@/app/lib/product-image-normalizer";
import { STOREFRONT_CATALOG_TAG } from "@/app/lib/storefront-catalog";
import { rememberStorefrontProduct } from "@/app/lib/storefront-product-snapshots";
import {
  getProductBySlug,
  listCategories,
  updateProduct,
  uploadMedia,
  WooCommerceError,
} from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const EXPECTED_TOKEN_HASH =
  "a72c2117824532bad288aad386faf5dcf8cc7bd989a815e552821cae417219e8";
const TARGET_CATEGORY_SLUG = "hyaluronidase-products";
const TARGET_CATEGORY_NAME = "آنزیم‌های هیالورونیداز";
const TARGET_SLUGS = ["liporase-1500", "hyalase-1500"] as const;
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

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
    throw new WooCommerceError(
      "WooCommerce configuration is incomplete",
      503,
      "cms_not_configured",
    );
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
        "محصولات هیالورونیداز حرفه‌ای؛ هویت بصری این دسته در Sepiid Beauty توسط storefront مدیریت می‌شود.",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Unable to create WooCommerce category (${response.status}): ${detail}`,
    );
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

function productInput(
  product: CmsProduct,
  categoryId: number,
  images: CmsImage[],
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
    images,
    expectedModifiedGmt: product.dateModifiedGmt || undefined,
  };
}

async function normalizedImages(product: CmsProduct) {
  const current = product.images.find((image) => Boolean(image.src));
  if (!current) {
    return {
      images: [] as CmsImage[],
      normalized: false,
      removalRatio: 0,
    };
  }

  if (current.src.includes("sepiid-cutout-")) {
    return {
      images: product.images,
      normalized: false,
      removalRatio: 0,
    };
  }

  const response = await fetch(current.src, {
    cache: "no-store",
    headers: { accept: "image/*" },
  });
  if (!response.ok) {
    throw new Error(
      `Unable to fetch ${product.slug} image (${response.status})`,
    );
  }

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength <= 0 || bytes.byteLength > MAX_SOURCE_BYTES) {
    throw new Error(`Unexpected ${product.slug} image size: ${bytes.byteLength}`);
  }

  const type = response.headers.get("content-type")?.split(";", 1)[0] || "image/webp";
  const filename =
    new URL(current.src).pathname.split("/").pop() || `${product.slug}.webp`;
  const source = new File([bytes], filename, { type });
  const normalized = await normalizeCmsProductImage(source);
  const uploaded = await uploadMedia(
    normalized.file,
    current.alt || product.name,
    crypto.randomUUID(),
  );

  return {
    images: [
      {
        ...uploaded,
        alt: current.alt || uploaded.alt || product.name,
      },
    ],
    normalized: true,
    removalRatio: normalized.removalRatio,
  };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
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

      const normalized = await normalizedImages(current);
      const updated = await updateProduct(
        current.id,
        productInput(current, targetCategory.id, normalized.images),
      );
      await rememberStorefrontProduct(updated, { requirePersistence: true });

      results.push({
        slug,
        id: updated.id,
        updated: true,
        category: updated.categories[0] ?? null,
        image: updated.images[0]?.src ?? null,
        normalizedImage: normalized.normalized,
        removalRatio: normalized.removalRatio,
      });
    }

    revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });
    revalidatePath("/", "layout");
    revalidatePath("/shop/hyaluronidase-products");
    for (const slug of TARGET_SLUGS) {
      revalidatePath(`/product/${slug}`);
    }

    return Response.json({
      ok: true,
      category: {
        id: targetCategory.id,
        slug: targetCategory.slug,
        name: targetCategory.name,
      },
      results,
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
