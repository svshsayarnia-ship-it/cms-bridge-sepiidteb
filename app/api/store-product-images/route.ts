type StoreProduct = {
  id: number;
  slug: string;
  images?: Array<{
    id: number;
    src: string;
    alt?: string;
  }>;
};

type LiveProductImage = {
  image: string | null;
  alt: string;
};

export const revalidate = 300;

export async function GET() {
  try {
    const wordpressUrl = (
      process.env.WORDPRESS_URL || "https://wp.sepiidbeauty.ir"
    ).replace(/\/$/, "");

    const url = new URL(
      `${wordpressUrl}/wp-json/wc/store/v1/products`,
    );

    url.searchParams.set("per_page", "100");

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
      next: {
        revalidate: 300,
      },
    });

    if (!response.ok) {
      return Response.json(
        {
          error: `WooCommerce error ${response.status}`,
          images: {},
        },
        { status: 502 },
      );
    }

    const products = (await response.json()) as StoreProduct[];

    const images: Record<string, LiveProductImage> = {};

    for (const product of products) {
      const image = product.images?.[0];

      images[product.slug] = {
        image: image?.src || null,
        alt: image?.alt || "",
      };
    }

    return Response.json(
      { images },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "دریافت تصاویر محصولات ناموفق بود.",
        images: {},
      },
      { status: 500 },
    );
  }
}
