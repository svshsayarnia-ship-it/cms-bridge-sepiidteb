import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath, revalidateTag } from "next/cache";
import { catalogProducts } from "../../../catalog";
import { canonicalStorefrontProductSlug } from "../../../lib/storefront-canonical-product";
import { cmsApiGuard } from "../../../lib/cms-auth";
import type { CmsImage, CmsProduct, CmsProductInput } from "../../../lib/cms-types";
import {
  cardImageRoleToken,
  findPrimaryProductRoleImage,
  findVariantRoleImage,
  roleUploadFileName,
  variantImageRoleToken,
} from "../../../lib/product-image-roles";
import { STOREFRONT_CATALOG_TAG } from "../../../lib/storefront-catalog";
import {
  getProduct,
  updateProduct,
  uploadMedia,
  errorResponse,
  WooCommerceError,
} from "../../../lib/woocommerce";
import { rememberStorefrontProduct } from "../../../lib/storefront-product-snapshots";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

type RestoreRequest = { productId?: unknown; slug?: unknown };

const MIME_TYPES: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function localAssetPath(value: string): string | null {
  const clean = value.trim();
  if (
    (!clean.startsWith("/images/products/") &&
      !clean.startsWith("/images/drive/product-")) ||
    clean.includes("..") ||
    clean.includes("?") ||
    clean.includes("#")
  ) {
    return null;
  }

  const relative = clean.slice(1);
  return path.join(process.cwd(), "public", relative);
}

function legacyAsset(value: string): { filePath: string; fileName: string; mimeType: string } | null {
  const filePath = localAssetPath(value);
  if (!filePath) return null;

  const extension = path.extname(filePath).toLocaleLowerCase("en-US");
  const mimeType = MIME_TYPES[extension];
  if (!mimeType) return null;

  return {
    filePath,
    fileName: path.basename(filePath),
    mimeType,
  };
}

function productInput(product: CmsProduct, images: CmsImage[]): CmsProductInput {
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
    categoryIds: product.categories.map((category) => category.id),
    images,
    expectedModifiedGmt: product.dateModifiedGmt || undefined,
    visualProfile: product.visualProfile,
    visualScale: product.visualScale,
    visualOffsetX: product.visualOffsetX,
    visualOffsetY: product.visualOffsetY,
  };
}

async function uploadLegacyImage(
  value: string,
  token: string,
  alt: string,
): Promise<CmsImage | null> {
  const asset = legacyAsset(value);
  if (!asset) return null;

  let bytes: Buffer;
  try {
    bytes = await fs.readFile(asset.filePath);
  } catch {
    return null;
  }

  if (bytes.length === 0 || bytes.length > 4 * 1024 * 1024) return null;

  const safeBytes = new Uint8Array(bytes.byteLength);
  safeBytes.set(bytes);
  const file = new File(
    [safeBytes.buffer],
    roleUploadFileName(asset.fileName, token),
    { type: asset.mimeType },
  );
  return uploadMedia(file, alt, crypto.randomUUID());
}

export async function POST(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    const input = (await request.json()) as RestoreRequest;
    const productId = Number(input.productId);
    const requestedSlug = text(input.slug);
    if (!Number.isSafeInteger(productId) || productId <= 0 || !requestedSlug) {
      throw new WooCommerceError("محصول انتخاب‌شده برای بازیابی معتبر نیست.", 400, "invalid_restore_product");
    }

    const currentProduct = await getProduct(productId);
    const canonicalSlug = canonicalStorefrontProductSlug(requestedSlug);
    const staticProduct = catalogProducts.find(
      (product) => canonicalStorefrontProductSlug(product.slug) === canonicalSlug,
    );
    if (!staticProduct) {
      throw new WooCommerceError("برای این محصول تصویر نسخهٔ قبلی پیدا نشد.", 404, "legacy_product_not_found");
    }

    const roleSlugs = Array.from(
      new Set([requestedSlug, canonicalSlug, currentProduct.slug].filter(Boolean)),
    );
    const images = [...currentProduct.images];
    const restored: string[] = [];
    const skipped: string[] = [];

    if (findPrimaryProductRoleImage(images, roleSlugs)) {
      skipped.push("card");
    } else {
      const card = await uploadLegacyImage(
        staticProduct.image,
        cardImageRoleToken(canonicalSlug),
        `تصویر اصلی ${currentProduct.name}`,
      );
      if (card) {
        images.push(card);
        restored.push("card");
      }
    }

    for (const variant of staticProduct.variants ?? []) {
      if (findVariantRoleImage(images, roleSlugs, variant.id)) {
        skipped.push(`variant:${variant.id}`);
        continue;
      }

      const image = await uploadLegacyImage(
        variant.image,
        variantImageRoleToken(canonicalSlug, variant.id),
        `تصویر ${variant.nameFa}`,
      );
      if (image) {
        images.push(image);
        restored.push(`variant:${variant.id}`);
      }
    }

    if (restored.length === 0) {
      return Response.json({
        product: currentProduct,
        restored,
        skipped,
        message: "برای این محصول عکس قابل بازیابیِ جدیدی باقی نمانده است.",
      });
    }

    await updateProduct(productId, productInput(currentProduct, images));
    const confirmed = await getProduct(productId);
    await rememberStorefrontProduct(confirmed);
    revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });
    revalidatePath("/shop");
    revalidatePath(`/product/${confirmed.slug}`);

    return Response.json({ product: confirmed, restored, skipped });
  } catch (error) {
    return errorResponse(error);
  }
}
