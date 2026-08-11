import type { Product, ProductVariant } from "../data";

export type ProductSchemaOptions = {
  product: Product;
  siteOrigin: string;
  brandName: string;
  description: string;
  image: string;
  liveSku?: string;
  schemaPrice?: string | null;
  schemaAvailability: string;
};

function absoluteUrl(siteOrigin: string, value: string) {
  return value.startsWith("http") ? value : `${siteOrigin}${value}`;
}

function schemaIdentifier(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function variantUrl(siteOrigin: string, slug: string, variantId: string) {
  return `${siteOrigin}/product/${slug}?variant=${encodeURIComponent(variantId)}`;
}

function variantPriceIrr(variant: ProductVariant) {
  if (!variant.priceToman || variant.priceToman <= 0) return null;
  return String(Math.round(variant.priceToman * 10));
}

function canUseSizeDimension(variants: ProductVariant[]) {
  const values = variants.map((variant) => variant.volume?.trim() ?? "");
  return values.every(Boolean) && new Set(values).size === variants.length;
}

function publicVariantDescription(variant: ProductVariant, fallback: string) {
  const parts = [variant.nameFa.trim(), variant.volume?.trim()].filter(Boolean);
  return parts.length ? parts.join("، ") : fallback;
}

export function buildProductStructuredData({
  product,
  siteOrigin,
  brandName,
  description,
  image,
  liveSku,
  schemaPrice,
  schemaAvailability,
}: ProductSchemaOptions) {
  const baseUrl = `${siteOrigin}/product/${product.slug}`;
  const variants = product.variants ?? [];

  if (variants.length > 1) {
    const productGroupID = `SB-${schemaIdentifier(product.slug)}`;
    const useSizeDimension = canUseSizeDimension(variants);

    return {
      "@context": "https://schema.org",
      "@type": "ProductGroup",
      "@id": `${baseUrl}#product-group`,
      name: product.nameFa,
      alternateName: product.nameEn,
      description,
      url: baseUrl,
      brand: {
        "@type": "Brand",
        name: brandName,
      },
      productGroupID,
      ...(useSizeDimension
        ? { variesBy: ["https://schema.org/size"] }
        : {}),
      hasVariant: variants.map((variant) => {
        const url = variantUrl(siteOrigin, product.slug, variant.id);
        const price = variantPriceIrr(variant);
        const sku = `SB-${schemaIdentifier(product.slug)}-${schemaIdentifier(variant.id)}`;

        return {
          "@type": "Product",
          "@id": `${url}#product`,
          name: variant.nameFa,
          alternateName: variant.nameEn,
          description: publicVariantDescription(variant, description),
          image: absoluteUrl(siteOrigin, variant.image),
          url,
          sku,
          inProductGroupWithID: productGroupID,
          ...(useSizeDimension && variant.volume
            ? { size: variant.volume }
            : {}),
          additionalProperty: {
            "@type": "PropertyValue",
            name: "مدل",
            value: variant.label,
          },
          ...(price
            ? {
                offers: {
                  "@type": "Offer",
                  url,
                  price,
                  priceCurrency: "IRR",
                  itemCondition: "https://schema.org/NewCondition",
                },
              }
            : {}),
        };
      }),
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameFa,
    alternateName: product.nameEn,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    category: product.categoryTitle,
    description,
    image: absoluteUrl(siteOrigin, image),
    url: baseUrl,
    audience: {
      "@type": "Audience",
      audienceType: product.audience,
    },
    sku: liveSku || undefined,
    ...(schemaPrice
      ? {
          offers: {
            "@type": "Offer",
            url: baseUrl,
            price: schemaPrice,
            priceCurrency: "IRR",
            availability: schemaAvailability,
            itemCondition: "https://schema.org/NewCondition",
          },
        }
      : {}),
  };
}
