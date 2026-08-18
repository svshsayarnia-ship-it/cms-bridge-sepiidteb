import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import type { CmsImage, CmsProduct, CmsProductInput } from "@/app/lib/cms-types";
import { normalizeCmsProductImage } from "@/app/lib/product-image-normalizer";
import { STOREFRONT_CATALOG_TAG } from "@/app/lib/storefront-catalog";
import { rememberStorefrontProduct } from "@/app/lib/storefront-product-snapshots";
import {
  getProductBySlug,
  listCategories,
  updateProduct,
  uploadMedia,
} from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

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

function withImages(
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

    const sourceImage = product.images.find((image) => Boolean(image.src));
    if (!sourceImage) {
      const updated = await updateProduct(
        product.id,
        withImages(product, category.id, []),
      );
      await rememberStorefrontProduct(updated, { requirePersistence: true });
      return Response.json({
        ok: true,
        fallbackUsed: true,
        product: {
          id: updated.id,
          slug: updated.slug,
          category: updated.categories[0] ?? null,
          image: null,
        },
      });
    }

    const response = await fetch(sourceImage.src, {
      cache: "no-store",
      headers: { accept: "image/*" },
    });
    if (!response.ok) {
      throw new Error(`Unable to fetch Liporase image (${response.status})`);
    }

    const bytes = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type")?.split(";", 1)[0] || "image/webp";
    const filename =
      new URL(sourceImage.src).pathname.split("/").pop() || "liporase.webp";
    const normalized = await normalizeCmsProductImage(
      new File([bytes], filename, { type: contentType }),
    );

    let images: CmsImage[] = [];
    let fallbackUsed = !normalized.validatedCutout;

    if (normalized.validatedCutout) {
      const uploaded = await uploadMedia(
        normalized.file,
        sourceImage.alt || product.name,
        crypto.randomUUID(),
      );
      images = [
        {
          ...uploaded,
          alt: sourceImage.alt || uploaded.alt || product.name,
        },
      ];
      fallbackUsed = false;
    }

    // If the current photo cannot be confidently isolated, deliberately clear
    // Woo media. The storefront then falls back to its approved static cutout
    // while the category stage remains the sole owner of visual identity.
    const updated = await updateProduct(
      product.id,
      withImages(product, category.id, images),
    );
    await rememberStorefrontProduct(updated, { requirePersistence: true });

    revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });
    revalidatePath("/", "layout");
    revalidatePath("/shop/hyaluronidase-products");
    revalidatePath(`/product/${TARGET_SLUG}`);

    return Response.json({
      ok: true,
      fallbackUsed,
      product: {
        id: updated.id,
        slug: updated.slug,
        category: updated.categories[0] ?? null,
        image: updated.images[0]?.src ?? null,
      },
      normalization: {
        validatedCutout: normalized.validatedCutout,
        removedBackground: normalized.removedBackground,
        removalRatio: normalized.removalRatio,
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
