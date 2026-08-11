import type { NextRequest } from "next/server";
import { catalogProducts } from "./app/catalog";

type WooProductProbe = {
  slug?: string;
  status?: string;
  catalog_visibility?: string;
  images?: Array<{ src?: string }>;
};

const staticProducts = new Map(
  catalogProducts.map((product) => [product.slug, product]),
);

function productSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/product\/([^/]+)\/?$/);
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function missingProductResponse(request: NextRequest) {
  const body = `<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>صفحه پیدا نشد | Sepiid Beauty</title>
  </head>
  <body>
    <main>
      <p>404 / PAGE NOT FOUND</p>
      <h1>این محصول در کاتالوگ سپید بیوتی منتشر نشده است.</h1>
      <p>ممکن است صفحه هنوز تصویر قابل انتشار نداشته باشد یا آدرس آن تغییر کرده باشد.</p>
      <a href="/shop">بازگشت به فروشگاه</a>
    </main>
  </body>
</html>`;

  return new Response(request.method === "HEAD" ? null : body, {
    status: 404,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex, nofollow",
      "x-sepiid-product-status": "not-public",
    },
  });
}

async function probeWooProduct(
  slug: string,
): Promise<boolean | null> {
  const storeUrl = (process.env.WORDPRESS_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  const consumerKey = (
    process.env.WOOCOMMERCE_CONSUMER_KEY ?? ""
  ).trim();
  const consumerSecret = (
    process.env.WOOCOMMERCE_CONSUMER_SECRET ?? ""
  ).trim();

  if (!storeUrl || !consumerKey || !consumerSecret) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(`${storeUrl}/wp-json/wc/v3/products`);
  } catch {
    return null;
  }

  url.searchParams.set("slug", slug);
  url.searchParams.set("per_page", "1");
  url.searchParams.set("status", "any");

  const headers = new Headers({ accept: "application/json" });
  if ((process.env.WOOCOMMERCE_AUTH_MODE ?? "basic") === "query") {
    url.searchParams.set("consumer_key", consumerKey);
    url.searchParams.set("consumer_secret", consumerSecret);
  } else {
    headers.set(
      "authorization",
      `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`,
    );
  }

  try {
    const response = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(2_500),
    });

    if (response.status === 401 || response.status === 403) {
      return null;
    }

    if (!response.ok) {
      return response.status >= 500 ? null : false;
    }

    const products = (await response.json()) as WooProductProbe[];
    const [product] = products;

    return Boolean(
      product?.slug === slug &&
        product.status === "publish" &&
        product.catalog_visibility !== "hidden" &&
        product.images?.some((image) => Boolean(image.src)),
    );
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return;
  }

  const slug = productSlugFromPath(request.nextUrl.pathname);
  if (!slug) return;

  const staticProduct = staticProducts.get(slug);
  const hasVerifiedStaticProduct = Boolean(
    staticProduct?.publishedInCatalog === true &&
      (staticProduct.imageVerified === true ||
        (staticProduct.imageKind === "editorial-family" &&
          staticProduct.imageApproved === true)),
  );

  // Verified local products can render from the static fallback without an
  // extra WooCommerce round-trip. Invalid/unknown slugs must be rejected
  // before the App Router can start streaming a 200 response.
  if (hasVerifiedStaticProduct) return;

  const remoteStatus = await probeWooProduct(slug);
  if (remoteStatus === true) return;

  return missingProductResponse(request);
}

export const config = {
  matcher: "/product/:slug",
};
