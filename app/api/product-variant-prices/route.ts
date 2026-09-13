import { catalogProducts } from "@/app/catalog";
import { getCatalogVariantPriceOverrides } from "@/app/lib/variant-pricing";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") ?? "").trim();
  const catalogProduct = catalogProducts.find((product) => product.slug === slug);

  if (!catalogProduct?.variants?.length) {
    return Response.json(
      { prices: {} },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const saved = await getCatalogVariantPriceOverrides(slug);
  const allowed = new Set(catalogProduct.variants.map((variant) => variant.id));
  const prices = Object.fromEntries(
    Object.entries(saved).filter(([variantId]) => allowed.has(variantId)),
  );

  return Response.json(
    { prices },
    { headers: { "cache-control": "no-store" } },
  );
}
