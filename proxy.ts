import type { NextRequest } from "next/server";
import {
  catalogCategories,
  catalogGroups,
  catalogProducts,
} from "./app/catalog";
import { isApprovedInventorySlug } from "./app/current-inventory";
import { articles } from "./app/data";
import { isPublicStaticProduct } from "./app/lib/public-product";

type WooProductProbe = {
  slug?: string;
  status?: string;
  catalog_visibility?: string;
  images?: Array<{ src?: string }>;
};

type SitePresentationProbe = {
  presentation?: {
    articles?: Array<{ slug?: string; status?: string }>;
  } | null;
};

type StaticRouteRule = {
  pattern: RegExp;
  allowedSlugs: Set<string>;
  fallbackHref: string;
  label: string;
};

const staticProducts = new Map(
  catalogProducts.map((product) => [product.slug, product]),
);

const publicArticleSlugs = new Set(
  articles.map((article) => article.slug),
);

const publicCategorySlugs = new Set([
  ...catalogCategories.map((category) => category.slug),
  // Compatibility alias handled by the category page and redirected to the
  // high-volume filter on the canonical fillers URL.
  "body-fillers",
]);

const publicGroupSlugs = new Set(
  catalogGroups.map((group) => group.slug),
);

// These route families are intentionally editorial/static. Keep the proxy
// allowlist aligned with the indexable routes emitted by sitemap.ts so an
// arbitrary slug is rejected before App Router streaming can turn it into a
// soft 404. Adding a new public brand/guide/concern therefore remains an
// explicit publishing decision in code.
const publicBrandSlugs = new Set([
  "neuramis",
  "fusion",
]);

const publicGuideSlugs = new Set([
  "botulinum-toxin",
  "dermal-fillers",
  "mesogels-skin-boosters",
  "product-authenticity",
  "hair-mesotherapy",
]);

const publicConcernSlugs = new Set([
  "hair-loss",
  "skin-rejuvenation",
  "hyperpigmentation",
  "under-eye",
  "dynamic-wrinkles",
  "volume-loss",
]);

const publicPolicySlugs = new Set([
  "privacy",
  "terms",
  "shipping",
  "returns",
  "authenticity",
]);

const staticRouteRules: StaticRouteRule[] = [
  {
    pattern: /^\/shop\/group\/([^/]+)\/?$/,
    allowedSlugs: publicGroupSlugs,
    fallbackHref: "/shop",
    label: "این گروه محصول",
  },
  {
    pattern: /^\/shop\/([^/]+)\/?$/,
    allowedSlugs: publicCategorySlugs,
    fallbackHref: "/shop",
    label: "این دسته‌بندی",
  },
  {
    pattern: /^\/brands\/([^/]+)\/?$/,
    allowedSlugs: publicBrandSlugs,
    fallbackHref: "/brands",
    label: "این صفحه برند",
  },
  {
    pattern: /^\/guides\/([^/]+)\/?$/,
    allowedSlugs: publicGuideSlugs,
    fallbackHref: "/guides",
    label: "این راهنما",
  },
  {
    pattern: /^\/concerns\/([^/]+)\/?$/,
    allowedSlugs: publicConcernSlugs,
    fallbackHref: "/guides",
    label: "این مسیر نیاز",
  },
  {
    pattern: /^\/policies\/([^/]+)\/?$/,
    allowedSlugs: publicPolicySlugs,
    fallbackHref: "/",
    label: "این صفحه سیاست",
  },
];

function decodeSlug(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function productSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/product\/([^/]+)\/?$/);
  return match ? decodeSlug(match[1]) : null;
}

function articleSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/magazine\/([^/]+)\/?$/);
  return match ? decodeSlug(match[1]) : null;
}

function staticRouteFromPath(pathname: string) {
  for (const rule of staticRouteRules) {
    const match = pathname.match(rule.pattern);
    if (!match) continue;

    return {
      rule,
      slug: decodeSlug(match[1]),
    };
  }

  return null;
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

function missingArticleResponse(request: NextRequest) {
  const body = `<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>مقاله پیدا نشد | Sepiid Beauty</title>
  </head>
  <body>
    <main>
      <p>404 / PAGE NOT FOUND</p>
      <h1>این مقاله در مجله سپید بیوتی منتشر نشده است.</h1>
      <p>ممکن است آدرس مقاله تغییر کرده باشد یا محتوا دیگر منتشر نباشد.</p>
      <a href="/magazine">بازگشت به مجله سپید</a>
    </main>
  </body>
</html>`;

  return new Response(request.method === "HEAD" ? null : body, {
    status: 404,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex, nofollow",
      "x-sepiid-article-status": "not-public",
    },
  });
}

function missingStaticRouteResponse(
  request: NextRequest,
  rule: StaticRouteRule,
) {
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
      <h1>${rule.label} در سپید بیوتی منتشر نشده است.</h1>
      <p>ممکن است آدرس تغییر کرده باشد یا این مسیر دیگر عمومی نباشد.</p>
      <a href="${rule.fallbackHref}">بازگشت به مسیر اصلی</a>
    </main>
  </body>
</html>`;

  return new Response(request.method === "HEAD" ? null : body, {
    status: 404,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex, nofollow",
      "x-sepiid-route-status": "not-public",
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

async function probePublishedArticle(
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
    url = new URL(`${storeUrl}/wp-json/wc/v3/sepiid-site-presentation`);
  } catch {
    return null;
  }

  const headers = new Headers({
    accept: "application/json",
    "cache-control": "no-cache, no-store, max-age=0",
  });
  if ((process.env.WOOCOMMERCE_AUTH_MODE ?? "basic") === "query") {
    url.searchParams.set("consumer_key", consumerKey);
    url.searchParams.set("consumer_secret", consumerSecret);
  } else {
    headers.set(
      "authorization",
      `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`,
    );
  }
  url.searchParams.set("_sepiid_cache_bust", String(Date.now()));

  try {
    const response = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (response.status === 401 || response.status === 403) {
      return null;
    }
    if (!response.ok) {
      return response.status >= 500 ? null : false;
    }

    const payload = (await response.json()) as SitePresentationProbe;
    const remoteArticles = payload.presentation?.articles;
    if (!Array.isArray(remoteArticles)) return null;

    return remoteArticles.some(
      (article) => article.slug === slug && article.status !== "draft",
    );
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return;
  }

  const articleSlug = articleSlugFromPath(request.nextUrl.pathname);
  if (articleSlug) {
    if (publicArticleSlugs.has(articleSlug)) return;

    const remoteStatus = await probePublishedArticle(articleSlug);
    // On a temporary WordPress/auth failure, let App Router make the final
    // decision instead of turning a valid CMS article into a hard 404.
    if (remoteStatus !== false) return;

    return missingArticleResponse(request);
  }

  const staticRoute = staticRouteFromPath(request.nextUrl.pathname);
  if (staticRoute) {
    if (
      !staticRoute.slug ||
      !staticRoute.rule.allowedSlugs.has(staticRoute.slug)
    ) {
      return missingStaticRouteResponse(request, staticRoute.rule);
    }
    return;
  }

  const slug = productSlugFromPath(request.nextUrl.pathname);
  if (!slug) return;

  // SepiidTeb is temporarily the inventory source of truth. A legacy static
  // seed or a still-published WooCommerce row must never make an unapproved
  // product URL public again.
  if (!isApprovedInventorySlug(slug)) {
    return missingProductResponse(request);
  }

  const staticProduct = staticProducts.get(slug);

  // Keep proxy visibility in lockstep with the App Router. Approved local
  // market-reference images are valid public product images too, so they must
  // not be rejected before the product page gets a chance to render.
  if (isPublicStaticProduct(staticProduct)) return;

  const remoteStatus = await probeWooProduct(slug);
  if (remoteStatus === true) return;

  return missingProductResponse(request);
}

export const config = {
  matcher: [
    "/product/:slug",
    "/magazine/:slug",
    "/shop/:category",
    "/shop/group/:group",
    "/brands/:slug",
    "/guides/:slug",
    "/concerns/:slug",
    "/policies/:slug",
  ],
};
