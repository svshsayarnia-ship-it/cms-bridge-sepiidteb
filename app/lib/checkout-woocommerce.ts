import "server-only";
import { catalogProducts } from "../catalog";
import { parseVariantPriceOverrides, VARIANT_PRICE_META_KEY } from "./variant-pricing";
import { canonicalInventorySlug, currentInventoryLegacyAliases, isApprovedInventorySlug } from "../current-inventory";
import { getRuntimeCheckoutProducts } from "./storefront-runtime-cache";



export type CheckoutLineInput = {
  slug: string;
  quantity: number;
  volume?: string;
  variantId?: string;
};

export type PendingWooOrder = {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  existing: boolean;
  __wooOrder?: {
    id: number;
    number: string;
    status: string;
    total: string;
    currency: string;
    meta_data?: Array<{ key: string; value: unknown }>;
  };
};

type WooMeta = { key: string; value: unknown };
type WooProduct = {
  id: number;
  name: string;
  slug: string;
  status: string;
  price: string;
  regular_price: string;
  sale_price: string;
  meta_data?: WooMeta[];
  date_modified_gmt?: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: "instock" | "outofstock" | "onbackorder" | string;
};

type WooOrder = {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  meta_data?: WooMeta[];
};

const IDEMPOTENCY_META_KEY = "_sepiid_checkout_idempotency_key";
const MAX_LINES = 30;
const MAX_QTY = 20;
const REQUEST_TIMEOUT_MS = 20_000;

export class CheckoutOrderError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "checkout_error",
  ) {
    super(message);
  }
}

function config() {
  const storeUrl = (process.env.WORDPRESS_URL ?? "").trim().replace(/\/$/, "");
  const consumerKey = (process.env.WOOCOMMERCE_CONSUMER_KEY ?? "").trim();
  const consumerSecret = (process.env.WOOCOMMERCE_CONSUMER_SECRET ?? "").trim();

  if (!storeUrl || !consumerKey || !consumerSecret) {
    throw new CheckoutOrderError(
      "اتصال WooCommerce برای ثبت سفارش تنظیم نشده است.",
      503,
      "woocommerce_not_configured",
    );
  }

  const parsed = new URL(storeUrl);
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new CheckoutOrderError(
      "اتصال WooCommerce باید روی HTTPS باشد.",
      503,
      "insecure_woocommerce_url",
    );
  }

  return { storeUrl, consumerKey, consumerSecret };
}

function apiUrl(path: string, query?: URLSearchParams) {
  const { storeUrl, consumerKey, consumerSecret } = config();
  const url = new URL(`${storeUrl}/wp-json/wc/v3/${path.replace(/^\//, "")}`);
  query?.forEach((value, key) => url.searchParams.set(key, value));

  if ((process.env.WOOCOMMERCE_AUTH_MODE ?? "basic") === "query") {
    url.searchParams.set("consumer_key", consumerKey);
    url.searchParams.set("consumer_secret", consumerSecret);
  }
  return url;
}

async function wooRequest<T>(
  path: string,
  options: RequestInit = {},
  query?: URLSearchParams,
): Promise<T> {
  const { consumerKey, consumerSecret } = config();
  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");
  headers.set("cache-control", "no-cache, no-store, max-age=0");

  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if ((process.env.WOOCOMMERCE_AUTH_MODE ?? "basic") !== "query") {
    headers.set(
      "authorization",
      `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(apiUrl(path, query), {
      ...options,
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const error = data as { message?: string; code?: string } | null;
      throw new CheckoutOrderError(
        error?.message || `WooCommerce با خطای ${response.status} پاسخ داد.`,
        response.status,
        error?.code || "woocommerce_checkout_error",
      );
    }
    return data as T;
  } catch (error) {
    if (error instanceof CheckoutOrderError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new CheckoutOrderError(
        "زمان اتصال به WooCommerce تمام شد. سفارش ثبت نشد و هیچ پرداختی انجام نشده است.",
        504,
        "woocommerce_timeout",
      );
    }
    throw new CheckoutOrderError(
      "اتصال به WooCommerce برای ثبت سفارش ناموفق بود.",
      502,
      "woocommerce_connection_failed",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeDigits(value: string) {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return value
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)));
}

function normalizePhone(value: string) {
  let phone = normalizeDigits(value).replace(/[^0-9+]/g, "");
  if (phone.startsWith("+98")) phone = `0${phone.slice(3)}`;
  if (phone.startsWith("0098")) phone = `0${phone.slice(4)}`;
  if (phone.startsWith("98") && phone.length === 12) phone = `0${phone.slice(2)}`;
  return phone;
}

function sanitizeLines(lines: CheckoutLineInput[]) {
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > MAX_LINES) {
    throw new CheckoutOrderError("سبد خرید معتبر نیست.", 400, "invalid_cart");
  }

  const combined = new Map<string, CheckoutLineInput>();
  for (const raw of lines) {
    const slug = String(raw.slug ?? "").trim();
    const volume = String(raw.volume ?? "").trim().slice(0, 120);
    const variantId = String(raw.variantId ?? "").trim().slice(0, 120);
    const quantity = Math.trunc(Number(raw.quantity));
    if (!/^[a-z0-9-]{2,160}$/.test(slug) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
      throw new CheckoutOrderError("یکی از اقلام سبد خرید معتبر نیست.", 400, "invalid_cart_line");
    }
    const key = `${slug}::${variantId || volume || "default"}`;
    const current = combined.get(key);
    const nextQuantity = (current?.quantity ?? 0) + quantity;
    if (nextQuantity > MAX_QTY) {
      throw new CheckoutOrderError("تعداد یکی از محصولات بیش از حد مجاز است.", 400, "invalid_quantity");
    }
    combined.set(key, { slug, volume: volume || undefined, variantId: variantId || undefined, quantity: nextQuantity });
  }
  return [...combined.values()];
}

function candidateSlugs(slug: string) {
  const canonical = canonicalInventorySlug(slug);
  const bases = [canonical, ...Object.entries(currentInventoryLegacyAliases)
    .filter(([, target]) => target === canonical).map(([alias]) => alias)];
  return isApprovedInventorySlug(canonical)
    ? bases.flatMap((base) => [base, ...Array.from({ length: 19 }, (_, index) => `${base}-${index + 2}`)])
    : [slug];
}

async function getProductsBySlugs(slugs: string[]) {
  const uniqueSlugs = [...new Set(slugs)];
  // CMS stores duplicate records under their real Woo slug (e.g. -2).
  // Resolve all accepted keys before reading fresh prices from WooCommerce.
  const snapshots = await getRuntimeCheckoutProducts(uniqueSlugs);
  const ids = new Map<string, number>();
  for (const slug of uniqueSlugs) {
    const allowed = new Set(candidateSlugs(slug));
    const candidates = snapshots.filter((product) => product && (
      allowed.has(product.slug) || canonicalInventorySlug(product.slug) === canonicalInventorySlug(slug)
    ));
    candidates.sort((a, b) => (Date.parse(b!.dateModifiedGmt || "") || 0) - (Date.parse(a!.dateModifiedGmt || "") || 0));
    const id = Number(candidates[0]?.id);
    if (Number.isSafeInteger(id) && id > 0) ids.set(slug, id);
  }
  const fields = "id,name,slug,status,price,regular_price,sale_price,meta_data,date_modified_gmt,manage_stock,stock_quantity,stock_status";
  const included = ids.size ? await wooRequest<WooProduct[]>("products", {}, new URLSearchParams({ include: [...new Set(ids.values())].join(","), per_page: "100", status: "publish", _fields: fields })) : [];
  const result = new Map<string, WooProduct | null>();
  for (const [slug, id] of ids) {
    const allowed = new Set(candidateSlugs(slug));
    result.set(slug, included.find((product) => product.id === id && allowed.has(product.slug)) ?? null);
  }
  const missing = uniqueSlugs.filter((slug) => !result.get(slug));
  if (missing.length) {
    // A cold/missing cache must still find canonical aliases and duplicate
    // Woo slugs. Scan paginated, narrow REST records without mutating products.
    const products: WooProduct[] = [];
    for (let page = 1; page <= 20; page++) {
      const batch = await wooRequest<WooProduct[]>("products", {}, new URLSearchParams({ page: String(page), per_page: "100", status: "publish", _fields: fields }));
      products.push(...batch);
      if (batch.length < 100) break;
      if (page === 20) throw new CheckoutOrderError("فهرست محصولات کامل دریافت نشد؛ دوباره تلاش کنید.", 502, "catalog_incomplete");
    }
    for (const slug of missing) {
      const allowed = new Set(candidateSlugs(slug));
      const candidates = products.filter((product) => allowed.has(product.slug));
      candidates.sort((a, b) => (Date.parse(b.date_modified_gmt || "") || 0) - (Date.parse(a.date_modified_gmt || "") || 0));
      result.set(slug, candidates[0] ?? null);
    }
  }
  return result;
}

function linePriceToman(line: CheckoutLineInput, product: WooProduct) {
  const catalog = catalogProducts.find((item) => item.slug === canonicalInventorySlug(line.slug));
  const variants = catalog?.variants ?? [];
  if (!line.variantId) {
    if (variants.length && line.volume) {
      const matching = variants.filter((variant) => variant.volume === line.volume);
      if (matching.length !== 1) throw new CheckoutOrderError("مدل کالا را دوباره از صفحه محصول انتخاب کنید.", 409, "variant_required");
      line.variantId = matching[0].id;
    } else {
      return Number(product.price || product.regular_price);
    }
  }
  const variant = variants.find((item) => item.id === line.variantId);
  if (!variant) throw new CheckoutOrderError("مدل انتخابی کالا معتبر نیست؛ دوباره آن را انتخاب کنید.", 409, "invalid_variant");
  const overrides = parseVariantPriceOverrides(product.meta_data?.find((meta) => meta.key === VARIANT_PRICE_META_KEY)?.value);
  const saved = overrides[variant.id];
  return saved ? Number(saved.salePrice || saved.regularPrice) : Number(variant.priceToman);
}

async function resolveCheckoutLines(lines: CheckoutLineInput[]) {
  const productBySlug = await getProductsBySlugs(lines.map((line) => line.slug));
  return lines.map((line) => {
    const product = productBySlug.get(line.slug) ?? null;
    const key = `${line.slug}::${line.variantId || line.volume || "default"}`;
    const priceToman = product ? linePriceToman(line, product) : NaN;
    return { line, product, key, priceToman };
  });
}

export async function getCheckoutQuote(rawLines: CheckoutLineInput[]) {
  const lines = sanitizeLines(rawLines);
  const resolved = await resolveCheckoutLines(lines);
  return resolved.map(({ line, product, key, priceToman }) => {
    if (!product || product.status !== "publish" || product.stock_status === "outofstock" || !Number.isSafeInteger(priceToman) || priceToman <= 0) {
      throw new CheckoutOrderError("قیمت یا موجودی یکی از کالاها تغییر کرده است. سبد خرید را بررسی کنید.", 409, "quote_unavailable");
    }
    return { slug: line.slug, key, priceToman };
  });
}

async function findExistingOrder(idempotencyKey: string) {
  const after = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
  const orders = await wooRequest<WooOrder[]>(
    "orders",
    {},
    new URLSearchParams({
      status: "any",
      per_page: "100",
      orderby: "date",
      order: "desc",
      after,
      _fields: "id,number,status,total,currency,meta_data",
    }),
  );

  return orders.find((order) =>
    order.meta_data?.some(
      (meta) => meta.key === IDEMPOTENCY_META_KEY && meta.value === idempotencyKey,
    ),
  ) ?? null;
}

function toResult(order: WooOrder, existing: boolean): PendingWooOrder {
  return {
    id: order.id,
    number: order.number || String(order.id),
    status: order.status,
    total: order.currency === "IRR" ? String(Number(order.total) / 10) : order.total,
    currency: order.currency === "IRR" ? "IRT" : order.currency,
    existing,
    __wooOrder: order,
  };
}

export async function createPendingWooOrder(input: {
  idempotencyKey: string;
  retry?: boolean;
  expectedSubtotal?: number;
  fullName: string;
  phone: string;
  customerType?: "consumer" | "clinic";
  note?: string;
  lines: CheckoutLineInput[];
}) {
  const idempotencyKey = String(input.idempotencyKey ?? "").trim();
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(idempotencyKey)) {
    throw new CheckoutOrderError("شناسه ثبت سفارش معتبر نیست.", 400, "invalid_idempotency_key");
  }

  const fullName = String(input.fullName ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const phone = normalizePhone(String(input.phone ?? ""));
  const note = String(input.note ?? "").trim().slice(0, 1000);
  if (fullName.length < 3) {
    throw new CheckoutOrderError("نام و نام خانوادگی را کامل وارد کنید.", 400, "invalid_name");
  }
  if (!/^09\d{9}$/.test(phone)) {
    throw new CheckoutOrderError("شماره موبایل معتبر نیست.", 400, "invalid_phone");
  }

  const lines = sanitizeLines(input.lines);
  const [existing, resolved] = await Promise.all([
    input.retry ? findExistingOrder(idempotencyKey) : Promise.resolve(null),
    resolveCheckoutLines(lines),
  ]);

  const aggregateQuantityByProduct = new Map<
    number,
    { product: WooProduct; quantity: number }
  >();

  for (const { line, product } of resolved) {
    if (!product) continue;
    const current = aggregateQuantityByProduct.get(product.id);
    aggregateQuantityByProduct.set(product.id, {
      product,
      quantity: (current?.quantity ?? 0) + line.quantity,
    });
  }

  for (const { product, quantity } of aggregateQuantityByProduct.values()) {
    if (
      product.manage_stock &&
      product.stock_quantity !== null &&
      product.stock_quantity < quantity
    ) {
      throw new CheckoutOrderError(
        `موجودی «${product.name}» برای مجموع تعداد انتخاب‌شده کافی نیست.`,
        409,
        "insufficient_stock",
      );
    }
  }

  for (const { line, product, priceToman } of resolved) {
    if (!product || product.status !== "publish") {
      throw new CheckoutOrderError(
        `محصول «${line.slug}» دیگر قابل سفارش نیست. سبد خرید را تازه کنید.`,
        409,
        "product_unavailable",
      );
    }
    const price = priceToman;
    if (!Number.isSafeInteger(price) || price <= 0) {
      throw new CheckoutOrderError(
        `قیمت «${product.name}» هنوز قطعی نشده است.`,
        409,
        "price_unavailable",
      );
    }
    if (product.stock_status === "outofstock") {
      throw new CheckoutOrderError(`«${product.name}» ناموجود است.`, 409, "out_of_stock");
    }
  }

  const subtotal = resolved.reduce((sum, { line, priceToman }) => sum + priceToman * line.quantity, 0);
  if (input.expectedSubtotal !== undefined && input.expectedSubtotal !== subtotal) {
    throw new CheckoutOrderError("قیمت سبد تغییر کرده است؛ قیمت تازه را بررسی کنید و دوباره پرداخت را بزنید.", 409, "price_changed");
  }
  if (existing) {
    const existingToman = existing.currency === "IRR" ? Number(existing.total) / 10 : existing.currency === "IRT" ? Number(existing.total) : NaN;
    if (existingToman !== subtotal) {
      throw new CheckoutOrderError("مبلغ سفارش قبلی با قیمت امروز یکسان نیست؛ دوباره پرداخت را بزنید تا سفارش با مبلغ تازه ساخته شود.", 409, "order_price_changed");
    }
    return toResult(existing, true);
  }

  const [firstName, ...rest] = fullName.split(" ");
  const lastName = rest.join(" ");
  const customerType = input.customerType === "clinic" ? "clinic" : "consumer";

  const order = await wooRequest<WooOrder>("orders", {
    method: "POST",
    body: JSON.stringify({
      status: "pending",
      currency: "IRR",
      set_paid: false,
      billing: {
        first_name: firstName,
        last_name: lastName,
        phone,
      },
      customer_note: note,
      line_items: resolved.map(({ line, product, priceToman }) => ({
        product_id: product!.id,
        quantity: line.quantity,
        subtotal: String(priceToman * line.quantity * 10),
        total: String(priceToman * line.quantity * 10),
        meta_data: [
          ...(line.volume ? [{ key: "مدل / حجم انتخابی", value: line.volume }] : []),
          ...(line.variantId ? [{ key: "_sepiid_variant_id", value: line.variantId }] : []),
        ],
      })),
      meta_data: [
        { key: IDEMPOTENCY_META_KEY, value: idempotencyKey },
        { key: "_sepiid_checkout_source", value: "nextjs_storefront" },
        { key: "_sepiid_customer_type", value: customerType },
      ],
    }),
  }, new URLSearchParams({ _fields: "id,number,status,total,currency,meta_data" }));

  return toResult(order, false);
}
