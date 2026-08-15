import { revalidatePath, revalidateTag } from "next/cache";
import { cmsApiGuard } from "@/app/lib/cms-auth";
import { STOREFRONT_CATALOG_TAG } from "@/app/lib/storefront-catalog";
import { parseProductInput } from "@/app/lib/cms-input";
import {
  errorResponse,
  getProduct,
  trashProduct,
  updateProduct,
  WooCommerceError,
} from "@/app/lib/woocommerce";
import {
  forgetStorefrontProduct,
  rememberStorefrontProduct,
} from "@/app/lib/storefront-product-snapshots";

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

function invalidatePricePages(slug: string) {
  revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/shop");
  if (slug) revalidatePath(`/product/${slug}`);
}

export async function GET(request: Request, context: Context) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    const product = await getProduct(await productId(context));
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
    const input = parseProductInput(
      await request.json(),
    );

    const updatedProduct = await updateProduct(
      id,
      input,
    );

    // Read the product back from WooCommerce so success means every editor
    // field, not only price, was persisted by the source of truth.
    const product = await getProduct(id);
    assertProductPersisted(product, input);

    await rememberStorefrontProduct(product);

    invalidatePricePages(product.slug || updatedProduct.slug);

    return Response.json({ product });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    const product = await trashProduct(
      await productId(context),
    );

    await forgetStorefrontProduct(product.slug);
    invalidatePricePages(product.slug);

    return Response.json({ product });
  } catch (error) {
    return errorResponse(error);
  }
}
