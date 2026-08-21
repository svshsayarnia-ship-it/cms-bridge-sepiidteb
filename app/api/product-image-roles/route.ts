import { findCardRoleImage, findVariantRoleImage } from "@/app/lib/product-image-roles";
import { getProductBySlug, WooCommerceError } from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";

function slugCandidates(slug: string): string[] {
  const clean = slug.trim();
  if (!clean) return [];

  const candidates = [clean];
  const duplicate = clean.match(/^(.*)-(\d+)$/u);

  if (duplicate) {
    const suffix = Number(duplicate[2]);
    if (Number.isInteger(suffix) && suffix >= 2 && suffix <= 20) {
      candidates.push(duplicate[1]);
    }
  } else {
    for (let suffix = 2; suffix <= 9; suffix += 1) {
      candidates.push(`${clean}-${suffix}`);
    }
  }

  return Array.from(new Set(candidates));
}

function publicImage(image: { src: string; alt: string } | null) {
  return image?.src
    ? { src: image.src, alt: image.alt }
    : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") ?? "").trim();
  const variantIds = Array.from(
    new Set(
      (url.searchParams.get("variants") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 30),
    ),
  );

  if (!slug) {
    return Response.json(
      { cardImage: null, variantImages: {} },
      { status: 400 },
    );
  }

  try {
    let product = null;

    for (const candidate of slugCandidates(slug)) {
      product = await getProductBySlug(candidate, {
        requestTimeoutMs: 12_000,
        requestMaxAttempts: 1,
      });
      if (product) break;
    }

    if (
      !product ||
      product.status !== "publish" ||
      product.catalogVisibility === "hidden"
    ) {
      return Response.json(
        { cardImage: null, variantImages: {} },
        { headers: { "cache-control": "no-store" } },
      );
    }

    const roleSlugs = [product.slug, slug];
    const cardImage = findCardRoleImage(product.images, roleSlugs);
    const variantImages = Object.fromEntries(
      variantIds.flatMap((variantId) => {
        const image = findVariantRoleImage(
          product.images,
          roleSlugs,
          variantId,
        );
        return image?.src
          ? [[variantId, { src: image.src, alt: image.alt || product.name }]]
          : [];
      }),
    );

    return Response.json(
      {
        cardImage: publicImage(
          cardImage
            ? { src: cardImage.src, alt: cardImage.alt || product.name }
            : null,
        ),
        variantImages,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof WooCommerceError) {
      return Response.json(
        { cardImage: null, variantImages: {} },
        { headers: { "cache-control": "no-store" } },
      );
    }

    throw error;
  }
}
