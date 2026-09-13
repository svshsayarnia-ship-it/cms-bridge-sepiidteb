import { revalidatePath, revalidateTag } from "next/cache";
import { cmsApiGuard } from "@/app/lib/cms-auth";
import { STOREFRONT_CATALOG_TAG } from "@/app/lib/storefront-catalog";
import {
  getProduct,
  errorResponse,
  WooCommerceError,
} from "@/app/lib/woocommerce";
import { rememberStorefrontProduct } from "@/app/lib/storefront-product-snapshots";
import {
  listQuickPriceItems,
  saveQuickPrice,
  type QuickPriceEntityKind,
} from "@/app/lib/variant-pricing";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function entityKind(value: unknown): QuickPriceEntityKind {
  if (
    value === "product" ||
    value === "catalog-variant" ||
    value === "woo-variation"
  ) {
    return value;
  }
  throw new WooCommerceError(
    "نوع ردیف قیمت معتبر نیست.",
    400,
    "invalid_quick_price_kind",
  );
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function GET(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    return Response.json({
      items: await listQuickPriceItems(),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      kind?: unknown;
      productId?: unknown;
      parentId?: unknown;
      variantKey?: unknown;
      regularPrice?: unknown;
      salePrice?: unknown;
    };

    const kind = entityKind(body.kind);
    const productId = Number(body.productId);
    const parentId =
      body.parentId === null || body.parentId === undefined
        ? null
        : Number(body.parentId);

    const item = await saveQuickPrice({
      kind,
      productId,
      parentId,
      variantKey: stringValue(body.variantKey) || null,
      regularPrice: stringValue(body.regularPrice),
      salePrice: stringValue(body.salePrice),
    });

    // Keep the public product snapshot warm for parent/simple product reads.
    // Catalog-variant prices themselves are read from the dedicated variant
    // meta endpoint, while this guarantees that ordinary product prices do not
    // become stale after using the same quick editor.
    const storefrontProductId =
      kind === "product" ? item.productId : item.parentId;
    if (storefrontProductId) {
      try {
        const product = await getProduct(storefrontProductId);
        await rememberStorefrontProduct(product, { requirePersistence: true });
      } catch (snapshotError) {
        console.warn("[variant-pricing] storefront snapshot refresh failed", {
          productId: storefrontProductId,
          error:
            snapshotError instanceof Error
              ? snapshotError.message
              : String(snapshotError),
        });
      }
    }

    revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });
    revalidatePath("/", "layout");
    revalidatePath("/shop");
    if (item.slug) revalidatePath(`/product/${item.slug}`);

    return Response.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}
