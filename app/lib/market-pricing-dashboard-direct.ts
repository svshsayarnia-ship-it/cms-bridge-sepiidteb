import type {
  MarketPricingDashboard,
  MarketPricingProduct,
} from "./market-pricing";
import { parsePricingState } from "./pricing-types";
import { WooCommerceError } from "./woocommerce";

type WooMeta = {
  key?: string;
  value?: unknown;
};

type WooPricingProduct = {
  id?: number;
  name?: string;
  slug?: string;
  sku?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  meta_data?: WooMeta[];
};

type WooPage<T> = {
  data: T;
  headers: Headers;
};

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function config() {
  const storeUrl = env("WORDPRESS_URL").replace(/\/$/u, "");
  const consumerKey = env("WOOCOMMERCE_CONSUMER_KEY");
  const consumerSecret = env("WOOCOMMERCE_CONSUMER_SECRET");

  if (!storeUrl || !consumerKey || !consumerSecret) {
    throw new WooCommerceError(
      "اتصال WooCommerce برای مدیریت قیمت آماده نیست.",
      503,
      "pricing_dashboard_not_configured",
    );
  }

  return { storeUrl, consumerKey, consumerSecret };
}

function pricingMeta(product: WooPricingProduct): string {
  const value = (product.meta_data ?? []).find(
    (item) => item.key === "sepiid_market_pricing",
  )?.value;
  return typeof value === "string" ? value : "";
}

function mapPricingProduct(product: WooPricingProduct): MarketPricingProduct | null {
  const id = Number(product.id);
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  return {
    id,
    name: typeof product.name === "string" ? product.name : `محصول ${id}`,
    slug: typeof product.slug === "string" ? product.slug : "",
    sku: typeof product.sku === "string" ? product.sku : "",
    price: typeof product.price === "string" ? product.price : "",
    regularPrice:
      typeof product.regular_price === "string" ? product.regular_price : "",
    salePrice: typeof product.sale_price === "string" ? product.sale_price : "",
    pricing: parsePricingState(pricingMeta(product)),
  };
}

async function wooPage(
  page: number,
  status: "publish" = "publish",
): Promise<WooPage<WooPricingProduct[]>> {
  const { storeUrl, consumerKey, consumerSecret } = config();
  const url = new URL(`${storeUrl}/wp-json/wc/v3/products`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", "100");
  url.searchParams.set("status", status);
  url.searchParams.set("orderby", "id");
  url.searchParams.set("order", "asc");
  url.searchParams.set(
    "_fields",
    "id,name,slug,sku,price,regular_price,sale_price,meta_data",
  );
  url.searchParams.set("_sepiid_cache_bust", `${Date.now()}-${page}`);

  const headers = new Headers({
    accept: "application/json",
    "cache-control": "no-cache, no-store, max-age=0",
    pragma: "no-cache",
  });

  if (env("WOOCOMMERCE_AUTH_MODE") === "query") {
    url.searchParams.set("consumer_key", consumerKey);
    url.searchParams.set("consumer_secret", consumerSecret);
  } else {
    headers.set(
      "authorization",
      `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers,
      signal: controller.signal,
    });
    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!response.ok) {
      const error = body as { message?: string; code?: string } | null;
      throw new WooCommerceError(
        error?.message || `WooCommerce با خطای ${response.status} پاسخ داد.`,
        response.status,
        error?.code || "pricing_dashboard_woo_error",
      );
    }

    if (!Array.isArray(body)) {
      throw new WooCommerceError(
        "پاسخ فهرست محصولات WooCommerce معتبر نیست.",
        502,
        "pricing_dashboard_invalid_response",
      );
    }

    return {
      data: body as WooPricingProduct[],
      headers: response.headers,
    };
  } catch (error) {
    if (error instanceof WooCommerceError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new WooCommerceError(
        "زمان دریافت محصولات برای مدیریت قیمت تمام شد.",
        504,
        "pricing_dashboard_timeout",
      );
    }
    throw new WooCommerceError(
      error instanceof Error ? error.message : "دریافت محصولات برای مدیریت قیمت ناموفق بود.",
      502,
      "pricing_dashboard_connection_failed",
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function listPublishedProducts(): Promise<MarketPricingProduct[]> {
  const products: MarketPricingProduct[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await wooPage(page);
    products.push(
      ...response.data.flatMap((product) => {
        const mapped = mapPricingProduct(product);
        return mapped ? [mapped] : [];
      }),
    );
    totalPages = Math.max(
      1,
      Number(response.headers.get("x-wp-totalpages") ?? 1),
    );
    page += 1;
  } while (page <= totalPages && page <= 20);

  return products;
}

export async function getMarketPricingDashboardDirect(): Promise<MarketPricingDashboard> {
  const products = await listPublishedProducts();
  return {
    products,
    editableProducts: products,
    generatedAt: new Date().toISOString(),
  };
}
