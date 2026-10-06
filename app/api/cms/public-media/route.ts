import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCmsMediaAsset, WooCommerceError } from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public image delivery boundary for CMS-owned media. WordPress credentials
 * and the origin URL stay server-side; the storefront receives same-origin
 * media only.
 */
export async function GET(request: Request) {
  const id = Number(new URL(request.url).searchParams.get("id"));

  if (!Number.isSafeInteger(id) || id <= 0) {
    return Response.json(
      { error: "شناسه تصویر معتبر نیست." },
      { status: 400 },
    );
  }

  try {
    const asset = await getCmsMediaAsset(id);
    if (asset.redirect) {
      // Vercel's image optimizer requires image bytes from local sources;
      // redirects from a local API source cannot be optimized reliably.
      const bytes = await readFile(path.join(process.cwd(), "public", asset.redirect));
      return new Response(new Uint8Array(bytes), {
        headers: {
          "content-type": asset.contentType,
          "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          "x-content-type-options": "nosniff",
        },
      });
    }
    return new Response(asset.body, {
      headers: {
        "content-type": asset.contentType,
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const status = error instanceof WooCommerceError ? error.status : 502;
    return Response.json(
      {
        error: error instanceof Error
          ? error.message
          : "دریافت تصویر CMS ناموفق بود.",
      },
      { status },
    );
  }
}
