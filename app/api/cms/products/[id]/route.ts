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

function assertPricePersisted(
  product: Awaited<ReturnType<typeof getProduct>>,
  regularPrice: string,
  salePrice: string,
) {
  if (product.regularPrice !== regularPrice || product.salePrice !== salePrice) {
    throw new WooCommerceError(
      "قیمت در ووکامرس با مقدار ثبت‌شده یکسان نیست؛ ذخیره نهایی تأیید نشد.",
      502,
      "price_persistence_mismatch",
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
    return Response.json({ product: await getProduct(await productId(context)) });
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

    // Read the product back from WooCommerce so the CMS only reports success
    // when the exact price values are persisted in the source of truth.
    const product = await getProduct(id);
    assertPricePersisted(
      product,
      input.regularPrice.trim(),
      input.salePrice.trim(),
    );

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

    invalidatePricePages(product.slug);

    return Response.json({ product });
  } catch (error) {
    return errorResponse(error);
  }
}
