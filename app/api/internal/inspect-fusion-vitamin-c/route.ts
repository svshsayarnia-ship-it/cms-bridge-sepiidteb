import { listProducts } from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const result = await listProducts({
    page: 1,
    perPage: 100,
    status: "all",
    requestTimeoutMs: 30000,
    requestMaxAttempts: 2,
  });
  const products = result.products
    .filter((product) =>
      product.slug.includes("fusion-f-vitamin-c") ||
      product.name.toLowerCase().includes("vitamin c") ||
      product.name.includes("ویتامین"),
    )
    .map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      status: product.status,
      catalogVisibility: product.catalogVisibility,
      price: product.price,
      regularPrice: product.regularPrice,
      salePrice: product.salePrice,
      manageStock: product.manageStock,
      stockQuantity: product.stockQuantity,
      stockStatus: product.stockStatus,
      modified: product.dateModifiedGmt,
    }));
  return Response.json({ ok: true, products });
}
