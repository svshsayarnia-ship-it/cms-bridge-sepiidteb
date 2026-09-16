import { getStorefrontCatalog } from "@/app/lib/storefront-catalog";
import { toPublicProduct } from "@/app/lib/public-product";
import { getCatalogVariantPriceOverrides } from "@/app/lib/variant-pricing";

export const dynamic = "force-dynamic";

const maxProducts = 12;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slugs = Array.from(
    new Set(
      (url.searchParams.get("slugs") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).slice(0, maxProducts);

  if (!slugs.length) {
    return Response.json(
      { products: {} },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const { products } = await getStorefrontCatalog();
  const allowed = new Set(slugs);
  const matches = products.filter((product) => allowed.has(product.slug));

  const entries = await Promise.all(
    matches.map(async (product) => {
      const publicProduct = toPublicProduct(product);
      let priceOverrides: Awaited<ReturnType<typeof getCatalogVariantPriceOverrides>> = {};

      try {
        priceOverrides = await getCatalogVariantPriceOverrides(product.slug);
      } catch {
        // The carousel can still use catalogue prices when a live override is
        // temporarily unavailable. The existing product page remains the final
        // source of truth for checkout-time pricing.
      }

      const variants = (publicProduct.variants ?? []).map((variant) => {
        const override = priceOverrides[variant.id];
        const cataloguePrice = variant.priceToman ? String(variant.priceToman) : "";

        return {
          ...variant,
          regularPrice: override?.regularPrice || cataloguePrice,
          salePrice: override?.salePrice || "",
        };
      });

      return [product.slug, { variants }] as const;
    }),
  );

  return Response.json(
    { products: Object.fromEntries(entries) },
    { headers: { "cache-control": "no-store" } },
  );
}
