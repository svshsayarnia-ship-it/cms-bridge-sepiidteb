import "server-only";

export type CheckoutLineInput = {
  slug: string;
  quantity: number;
  volume?: string;
};

export type PendingWooOrder = {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  existing: boolean;
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
    const quantity = Math.trunc(Number(raw.quantity));
    if (!/^[a-z0-9-]{2,160}$/.test(slug) || quantity < 1 || quantity > MAX_QTY) {
      throw new CheckoutOrderError("یکی از اقلام سبد خرید معتبر نیست.", 400, "invalid_cart_line");
    }
    const key = `${slug}::${volume}`;
    const current = combined.get(key);
    const nextQuantity = (current?.quantity ?? 0) + quantity;
    if (nextQuantity > MAX_QTY) {
      throw new CheckoutOrderError("تعداد یکی از محصولات بیش از حد مجاز است.", 400, "invalid_quantity");
    }
    combined.set(key, { slug, volume: volume || undefined, quantity: nextQuantity });
  }
  return [...combined.values()];
}

async function getProductBySlug(slug: string) {
  const products = await wooRequest<WooProduct[]>(
    "products",
    {},
    new URLSearchParams({ slug, per_page: "1", status: "publish" }),
  );
  return products[0] ?? null;
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
    total: order.total,
    currency: order.currency,
    existing,
  };
}

export async function createPendingWooOrder(input: {
  idempotencyKey: string;
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
  const existing = await findExistingOrder(idempotencyKey);
  if (existing) return toResult(existing, true);

  const resolved = await Promise.all(
    lines.map(async (line) => ({ line, product: await getProductBySlug(line.slug) })),
  );

  for (const { line, product } of resolved) {
    if (!product || product.status !== "publish") {
      throw new CheckoutOrderError(
        `محصول «${line.slug}» دیگر قابل سفارش نیست. سبد خرید را تازه کنید.`,
        409,
        "product_unavailable",
      );
    }
    const price = Number(product.sale_price || product.price || product.regular_price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new CheckoutOrderError(
        `قیمت «${product.name}» هنوز قطعی نشده است.`,
        409,
        "price_unavailable",
      );
    }
    if (product.stock_status === "outofstock") {
      throw new CheckoutOrderError(`«${product.name}» ناموجود است.`, 409, "out_of_stock");
    }
    if (
      product.manage_stock &&
      product.stock_quantity !== null &&
      product.stock_quantity < line.quantity
    ) {
      throw new CheckoutOrderError(
        `موجودی «${product.name}» برای تعداد انتخاب‌شده کافی نیست.`,
        409,
        "insufficient_stock",
      );
    }
  }

  const [firstName, ...rest] = fullName.split(" ");
  const lastName = rest.join(" ");
  const customerType = input.customerType === "clinic" ? "clinic" : "consumer";

  const order = await wooRequest<WooOrder>("orders", {
    method: "POST",
    body: JSON.stringify({
      status: "pending",
      set_paid: false,
      billing: {
        first_name: firstName,
        last_name: lastName,
        phone,
      },
      customer_note: note,
      line_items: resolved.map(({ line, product }) => ({
        product_id: product!.id,
        quantity: line.quantity,
        meta_data: line.volume
          ? [{ key: "مدل / حجم انتخابی", value: line.volume }]
          : [],
      })),
      meta_data: [
        { key: IDEMPOTENCY_META_KEY, value: idempotencyKey },
        { key: "_sepiid_checkout_source", value: "nextjs_storefront" },
        { key: "_sepiid_customer_type", value: customerType },
      ],
    }),
  });

  return toResult(order, false);
}
