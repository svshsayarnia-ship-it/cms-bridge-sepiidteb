export const dynamic = "force-dynamic";

/**
 * Storefront product imagery is intentionally local-only.
 *
 * This compatibility endpoint remains because older client components still
 * ask for role imagery, but it never reads or returns WooCommerce/WordPress
 * media. Returning null keeps those clients stable while enforcing the visual
 * rule centrally: category artwork + checked-in local cutouts only.
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
