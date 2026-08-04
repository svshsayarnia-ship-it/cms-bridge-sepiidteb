import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type StoreProduct = {
  id: number;
  slug: string;
  images?: Array<{
    id: number;
    src: string;
    thumbnail?: string;
    srcset?: string;
    alt?: string;
  }>;
};

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim();

  if (!slug) {
    return Response.json(
      { error: "شناسه محصول ارسال نشده است." },
      { status: 400 },
    );
  }

  try {
    const wordpressUrl = (
      process.env.WORDPRESS_URL || "https://wp.sepiidbeauty.ir"
    ).replace(/\/$/, "");

    const url = new URL(
      `${wordpressUrl}/wp-json/wc/store/v1/products`,
    );

    url.searchParams.set("slug", slug);
    url.searchParams.set("per_page", "1");

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return Response.json(
        { error: `WooCommerce error ${response.status}` },
        { status: 502 },
      );
    }

    const products = (await response.json()) as StoreProduct[];
    const product = products[0];
    const image = product?.images?.[0];

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
            : "دریافت تصویر محصول ناموفق بود.",
      },
      { status: 500 },
    );
  }
}
