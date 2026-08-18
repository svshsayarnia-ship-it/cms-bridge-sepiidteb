import { revalidatePath, revalidateTag } from "next/cache";
import { cmsApiGuard } from "@/app/lib/cms-auth";
import type { CmsImage, CmsProduct, CmsProductInput } from "@/app/lib/cms-types";
import { parseProductInput } from "@/app/lib/cms-input";
import { cleanupDetachedCmsMedia } from "@/app/lib/managed-media";
import { STOREFRONT_CATALOG_TAG } from "@/app/lib/storefront-catalog";
import {
  forgetStorefrontProduct,
  getStorefrontProductSnapshots,
  rememberStorefrontProduct,
} from "@/app/lib/storefront-product-snapshots";
import {
  errorResponse,
  getProduct,
  trashProduct,
  updateProduct,
  WooCommerceError,
} from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

async function productId(context: Context): Promise<number> {
  const { id } = await context.params;
  const value = Number(id);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new WooCommerceError("شناسه محصول معتبر نیست.", 400, "invalid_product_id");
  }
  return value;
}

function comparableHtml(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sameNumberSet(first: number[], second: number[]) {
  if (first.length !== second.length) return false;
  const values = new Set(first);
  return second.every((value) => values.has(value));
}

function sameImageList(savedImages: CmsImage[], requestedImages: CmsImage[]) {
  if (savedImages.length !== requestedImages.length) return false;

  return requestedImages.every((image, index) => {
    const savedImage = savedImages[index];
    if (!savedImage) return false;

    return image.id > 0
      ? savedImage.id === image.id
      : savedImage.src === image.src;
  });
}

function removedAttachmentIds(product: CmsProduct, input: CmsProductInput) {
  const requestedIds = new Set(
    input.images
      .map((image) => image.id)
      .filter((id) => Number.isSafeInteger(id) && id > 0),
  );

  return product.images
    .map((image) => image.id)
    .filter(
      (id) => Number.isSafeInteger(id) && id > 0 && !requestedIds.has(id),
    );
}

function assertProductPersisted(
  product: Awaited<ReturnType<typeof getProduct>>,
  input: ReturnType<typeof parseProductInput>,
) {
  const checks: Array<[string, boolean]> = [
    ["نام محصول", product.name === input.name],
    ["نامک", product.slug === input.slug.trim()],
    ["وضعیت انتشار", product.status === input.status],
    ["نمایش در فروشگاه", product.catalogVisibility === input.catalogVisibility],
    ["توضیح کوتاه", comparableHtml(product.shortDescription) === comparableHtml(input.shortDescription)],
    ["توضیحات کامل", comparableHtml(product.description) === comparableHtml(input.description)],
    ["عنوان سئو", product.seoTitle === input.seoTitle],
    ["توضیحات متا", product.metaDescription === input.metaDescription],
    ["کلمه کلیدی", product.focusKeyword === input.focusKeyword],
    ["نام منبع", product.sourceName === input.sourceName],
    ["لینک منبع", product.sourceUrl === input.sourceUrl],
    ["قیمت عادی", product.regularPrice === input.regularPrice.trim()],
    ["قیمت فروش", product.salePrice === input.salePrice.trim()],
    [
      "دسته‌بندی",
      sameNumberSet(
        product.categories.map((category) => category.id),
        input.categoryIds,
      ),
    ],
    ["تصاویر", sameImageList(product.images, input.images)],
  ];

  const mismatchedFields = checks
    .filter(([, matches]) => !matches)
    .map(([field]) => field);

  if (mismatchedFields.length > 0) {
    throw new WooCommerceError(
      `وردپرس مقدار ذخیره‌شده را برای این بخش‌ها تأیید نکرد: ${mismatchedFields.join("، ")}.`,
      502,
      "product_persistence_mismatch",
    );
  }
}

function currentProductWithImages(
  product: CmsProduct,
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
    categoryIds: product.categories.map((category) => category.id),
    images,
    expectedModifiedGmt: product.dateModifiedGmt || undefined,
  };
}

function invalidatePricePages(...slugs: string[]) {
  revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/shop");

  for (const slug of new Set(slugs.map((value) => value.trim()).filter(Boolean))) {
    revalidatePath(`/product/${slug}`);
  }
}

async function forgetStaleSnapshotsForProduct(product: CmsProduct) {
  const snapshots = await getStorefrontProductSnapshots();
  const staleSlugs = Object.entries(snapshots)
    .filter(
      ([slug, snapshot]) =>
        snapshot.id === product.id && slug !== product.slug,
    )
    .map(([slug]) => slug);

  for (const slug of staleSlugs) {
    await forgetStorefrontProduct(slug);
  }
}

export async function GET(request: Request, context: Context) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    const product = await getProduct(await productId(context));
    await forgetStaleSnapshotsForProduct(product);
    await rememberStorefrontProduct(product, { requirePersistence: true });
    return Response.json({ product });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, context: Context) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    const id = await productId(context);
    const rawInput = (await request.json()) as Record<string, unknown>;
    const parsedInput = parseProductInput(rawInput);
    const currentProduct = await getProduct(id);

    // The CMS media workflow intentionally omits expectedModifiedGmt. Treat
    // that request as an image-only write: rebuild every non-image field from
    // the current WooCommerce record. The images array itself is authoritative:
    // WooCommerce must end with exactly the images currently present in CMS.
    const isImageOnlyWrite =
      Array.isArray(rawInput.images) &&
      !Object.prototype.hasOwnProperty.call(rawInput, "expectedModifiedGmt");

    const input = isImageOnlyWrite
      ? currentProductWithImages(currentProduct, parsedInput.images)
      : parsedInput;
    const removedImages = removedAttachmentIds(currentProduct, input);

    const updatedProduct = await updateProduct(id, input);

    // Read the product back from WooCommerce so success means every persisted
    // field, including exact image order/count, was confirmed by the source.
    const product = await getProduct(id);
    assertProductPersisted(product, input);

    if (currentProduct.slug !== product.slug) {
      await forgetStorefrontProduct(currentProduct.slug);
    }
    await forgetStaleSnapshotsForProduct(product);
    await rememberStorefrontProduct(product, { requirePersistence: true });

    // Once the authoritative CMS list is persisted and the attachment is no
    // longer referenced by this product, remove the detached WordPress media.
    // The bridge protects attachments that are still shared elsewhere.
    await cleanupDetachedCmsMedia(removedImages, {
      ownerType: "product",
      ownerId: product.id,
    });

    invalidatePricePages(
      currentProduct.slug,
      product.slug || updatedProduct.slug,
    );

    return Response.json({
      product,
      writeScope: isImageOnlyWrite ? "images" : "product",
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    const id = await productId(context);
    const currentProduct = await getProduct(id);
    const attachmentIds = currentProduct.images
      .map((image) => image.id)
      .filter((imageId) => Number.isSafeInteger(imageId) && imageId > 0);

    const product = await trashProduct(id);

    await forgetStorefrontProduct(currentProduct.slug);
    if (product.slug !== currentProduct.slug) {
      await forgetStorefrontProduct(product.slug);
    }

    // A trashed product no longer belongs in the CMS-driven storefront. Delete
    // its media when WordPress confirms the attachment is not shared elsewhere.
    await cleanupDetachedCmsMedia(attachmentIds, {
      ownerType: "product",
      ownerId: product.id,
    });

    invalidatePricePages(currentProduct.slug, product.slug);

    return Response.json({ product });
  } catch (error) {
    return errorResponse(error);
  }
}
