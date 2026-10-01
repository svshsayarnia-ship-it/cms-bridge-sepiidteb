import { ensureApprovedInventoryProductsAvailable } from "@/app/lib/inventory-woo-sync";
import { listProducts } from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function inspect() {
  const result = await listProducts({
    page: 1,
    perPage: 100,
    status: "all",
    requestTimeoutMs: 30000,
    requestMaxAttempts: 2,
  });
  return result.products
    .filter((product) => product.slug.startsWith("fusion-f-vitamin-c"))
    .map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      status: product.status,
      catalogVisibility: product.catalogVisibility,
      price: product.price,
      regularPrice: product.regularPrice,
      salePrice: product.salePrice,
      stockStatus: product.stockStatus,
    }));
}

export async function GET() {
  const before = await inspect();
  const repair = await ensureApprovedInventoryProductsAvailable([
    "fusion-f-vitamin-c",
  ]);
  const after = await inspect();
  return Response.json({ ok: true, before, repair, after });
}
