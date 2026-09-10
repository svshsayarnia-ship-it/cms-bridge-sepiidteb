import { getStorefrontProductSnapshots } from "@/app/lib/storefront-product-snapshots";

type LiveProductImage = {
  image: string | null;
  alt: string;
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await getStorefrontProductSnapshots();
    const images: Record<string, LiveProductImage> = {};

    for (const product of Object.values(products)) {
      const image = product.images?.find((item) => Boolean(item.src));

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
            : "دریافت تصاویر CMS ناموفق بود.",
        images: {},
      },
      { status: 500 },
    );
  }
}
