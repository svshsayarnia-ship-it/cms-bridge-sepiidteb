import { catalogProducts } from "../../catalog";
import type { CmsImage, CmsProduct } from "../../lib/cms-types";
import {
  findPrimaryProductRoleImage,
  findVariantRoleImage,
} from "../../lib/product-image-roles";
import { canonicalStorefrontProductSlug } from "../../lib/storefront-canonical-product";
import { getStorefrontProductSnapshots } from "../../lib/storefront-product-snapshots";

export const dynamic = "force-dynamic";

type PublicRoleImage = {
  src: string;
  alt: string;
};

type ProductSnapshots = Awaited<ReturnType<typeof getStorefrontProductSnapshots>>;

function publicImage(image: CmsImage | null, fallbackAlt: string): PublicRoleImage | null {
  if (!image?.src?.trim()) return null;
  return {
    src: image.src.trim(),
    alt: image.alt?.trim() || fallbackAlt,
  };
}

function resolveSnapshot(
  snapshots: ProductSnapshots,
  requestedSlug: string,
): CmsProduct | null {
  const canonicalSlug = canonicalStorefrontProductSlug(requestedSlug);
  return snapshots[canonicalSlug] ?? snapshots[requestedSlug] ?? null;
}

function variantIdsFor(slug: string, requestedVariantIds: string[]): string[] {
  if (requestedVariantIds.length) return requestedVariantIds;

  const canonicalSlug = canonicalStorefrontProductSlug(slug);
  return (
    catalogProducts.find((product) => product.slug === canonicalSlug)?.variants ?? []
  ).map((variant) => variant.id);
}

function roleSlugs(requestedSlug: string, product: CmsProduct): string[] {
  return Array.from(
    new Set(
      [
        requestedSlug,
        canonicalStorefrontProductSlug(requestedSlug),
        product.slug,
      ]
        .map((slug) => slug.trim())
        .filter(Boolean),
    ),
  );
}

function getRolePayload(
  snapshots: ProductSnapshots,
  requestedSlug: string,
  requestedVariantIds: string[],
) {
  const product = resolveSnapshot(snapshots, requestedSlug);
  if (!product) {
    return {
      cardImage: null,
      variantImages: {} as Record<string, PublicRoleImage>,
    };
  }

  const slugs = roleSlugs(requestedSlug, product);
  const cardImage = publicImage(
    findPrimaryProductRoleImage(product.images, slugs),
    `تصویر ${product.name}`,
  );

  const variantImages = Object.fromEntries(
    variantIdsFor(requestedSlug, requestedVariantIds).flatMap((variantId) => {
      const image = publicImage(
        findVariantRoleImage(product.images, slugs, variantId),
        `تصویر مدل ${variantId} از ${product.name}`,
      );
      return image ? [[variantId, image] as const] : [];
    }),
  );

  return { cardImage, variantImages };
}

/**
 * Public product imagery is CMS-authoritative.
 *
 * This endpoint exposes Sepiid CMS media, with explicit role uploads taking
 * priority. It never exposes a raw WooCommerce URL or a checked-in product
 * photograph. When the explicit CMS Primary slot is empty, the first existing
 * CMS image may act as the base/card visual until a Primary image is uploaded.
 * Exact variant requests still return only that variant's own CMS role media.
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

  const snapshots = await getStorefrontProductSnapshots();

  if (slugs.length) {
    return Response.json(
      {
        cardImages: Object.fromEntries(
          slugs.map((requestedSlug) => [
            requestedSlug,
            getRolePayload(snapshots, requestedSlug, []).cardImage,
          ]),
        ),
      },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const payload = getRolePayload(snapshots, slug, requestedVariantIds);
  return Response.json(payload, {
    headers: { "cache-control": "no-store" },
  });
}
