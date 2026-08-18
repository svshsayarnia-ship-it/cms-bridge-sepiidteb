import { revalidateTag } from "next/cache";
import { cmsApiGuard } from "@/app/lib/cms-auth";
import { syncApprovedInventoryToWoo } from "@/app/lib/inventory-woo-sync";
import { STOREFRONT_CATALOG_TAG } from "@/app/lib/storefront-catalog";
import { parseProductInput } from "@/app/lib/cms-input";
import {
  createProduct,
  errorResponse,
  listProducts,
} from "@/app/lib/woocommerce";
import {
  rememberStorefrontProduct,
  rememberStorefrontProducts,
} from "@/app/lib/storefront-product-snapshots";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const requestedPage = Number(url.searchParams.get("page") ?? 1);

    // The CMS list is the natural reconciliation point: whenever an editor
    // opens or searches products, approved static inventory is checked against
    // WooCommerce first. Missing canonical products are created once; existing
    // WooCommerce records are intentionally left untouched so CMS edits remain
    // authoritative after initial creation.
    if (requestedPage === 1) {
      try {
        await syncApprovedInventoryToWoo();
      } catch (syncError) {
        // A temporary sync problem must never make the product manager unusable.
        // No success TTL is recorded on failure, so the next page-1 request
        // automatically retries reconciliation.
        console.error("[inventory-woo-sync] automatic sync failed", {
          error:
            syncError instanceof Error
              ? syncError.message
              : String(syncError),
        });
      }
    }

    const result = await listProducts({
      page: requestedPage,
      perPage: Number(url.searchParams.get("perPage") ?? 30),
      search: url.searchParams.get("search") ?? "",
      status: url.searchParams.get("status") ?? "all",
    });

    await rememberStorefrontProducts(result.products);
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    const product = await createProduct(
      parseProductInput(await request.json()),
    );

    await rememberStorefrontProduct(product, { requirePersistence: true });

    revalidateTag(
      STOREFRONT_CATALOG_TAG,
      { expire: 0 },
    );

    return Response.json(
      { product },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
