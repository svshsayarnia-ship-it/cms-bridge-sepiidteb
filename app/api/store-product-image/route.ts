import { NextRequest } from "next/server";
import { getStorefrontProductSnapshots } from "@/app/lib/storefront-product-snapshots";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim();

  if (!slug) {
    return Response.json(
      { error: "شناسه محصول ارسال نشده است." },
      { status: 400 },
    );
  }

  try {
    const product = (await getStorefrontProductSnapshots())[slug];
    const image = product?.images?.find((item) => Boolean(item.src));

    return Response.json(
      {
        found: Boolean(product),
        image: image?.src || null,
        alt: image?.alt || "",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "دریافت تصویر CMS ناموفق بود.",
      },
      { status: 500 },
    );
  }
}
