export const dynamic = "force-dynamic";

/**
 * Legacy compatibility endpoint for older product-card clients.
 *
 * Primary product imagery now comes from the storefront product snapshot,
 * where an image explicitly selected in CMS/WooCommerce is authoritative.
 * Returning null here prevents this deprecated role layer from overriding that
 * source of truth while keeping older callers stable.
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
    { cardImage: null, variantImages: {} },
    { headers: { "cache-control": "no-store" } },
  );
}
