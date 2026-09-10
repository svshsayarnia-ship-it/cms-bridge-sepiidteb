import { catalogProducts } from "../../catalog";

export const dynamic = "force-dynamic";

type PublicRoleImage = {
  src: string;
  alt: string;
};

function getVariantImages(slug: string, requestedVariantIds: string[]) {
  const product = catalogProducts.find((item) => item.slug === slug);
  const variants = product?.variants ?? [];
  const defaultVariantId = variants[0]?.id ?? "";
  const requested = new Set(requestedVariantIds);

  return Object.fromEntries(
    variants
      .filter((variant) => variant.id !== defaultVariantId)
      .filter((variant) => !requested.size || requested.has(variant.id))
      .filter((variant) => {
        const image = variant.image?.trim();
        return Boolean(
          image &&
            (variant.imageVerified === true ||
              variant.imageKind === "editorial-family" ||
              variant.imageKind === "market-reference"),
        );
      })
      .map((variant) => [
        variant.id,
        {
          src: variant.image.trim(),
          alt: variant.imageAlt?.trim() || `تصویر ${variant.nameFa}`,
        } satisfies PublicRoleImage,
      ]),
  );
}

/**
 * The product-level image selected in CMS/WooCommerce belongs to the base
 * product/default variant. Sibling variants must keep their own verified media
 * so switching models does not make every variant inherit the same master image.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") ?? "").trim();
  const slugs = Array.from(
    new Set(
      (url.searchParams.get("slugs") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 100),
    ),
  );
  const requestedVariantIds = Array.from(
    new Set(
      (url.searchParams.get("variants") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 100),
    ),
  );

  if (!slug && !slugs.length) {
    return Response.json(
      { cardImage: null, variantImages: {}, cardImages: {} },
      { status: 400 },
    );
  }

  if (slugs.length) {
    return Response.json(
      {
        cardImages: Object.fromEntries(
          slugs.map((requestedSlug) => [requestedSlug, null]),
        ),
      },
      { headers: { "cache-control": "no-store" } },
    );
  }

  return Response.json(
    {
      cardImage: null,
      variantImages: getVariantImages(slug, requestedVariantIds),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
