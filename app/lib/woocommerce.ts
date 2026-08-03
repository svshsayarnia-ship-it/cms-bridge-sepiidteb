import type {
  CmsCategory,
  CmsConnectionStatus,
  CmsImage,
  CmsProduct,
  CmsProductInput,
  CmsProductsResponse,
} from "./cms-types";

type WooImage = { id: number; src: string; name?: string; alt?: string };
type WooCategoryRef = { id: number; name: string; slug: string };

type WooProduct = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  type: string;
  status: CmsProduct["status"];
  catalog_visibility: CmsProduct["catalogVisibility"];
  featured: boolean;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: CmsProduct["stockStatus"];
  categories: WooCategoryRef[];
  images: WooImage[];
  permalink: string;
  date_modified_gmt: string;
};

type WooCategory = {
  id: number;
  name: string;
  slug: string;
  parent: number;
  image: WooImage | null;
  count: number;
};

type WooRequestResult<T> = {
  data: T;
  headers: Headers;
};

const DEFAULT_WOO_TIMEOUT_MS = 20_000;
const MEDIA_UPLOAD_TIMEOUT_MS = 90_000;

export class WooCommerceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "woocommerce_error",
  ) {
    super(message);
  }
}

function config() {
  const storeUrl = (process.env.WORDPRESS_URL ?? "").trim().replace(/\/$/, "");
  const consumerKey = (process.env.WOOCOMMERCE_CONSUMER_KEY ?? "").trim();
  const consumerSecret = (process.env.WOOCOMMERCE_CONSUMER_SECRET ?? "").trim();

  if (!storeUrl || !consumerKey || !consumerSecret) {
    throw new WooCommerceError(
      "آدرس وردپرس یا کلیدهای WooCommerce در محیط CMS تنظیم نشده‌اند.",
      503,
      "cms_not_configured",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(storeUrl);
  } catch {
    throw new WooCommerceError("WORDPRESS_URL معتبر نیست.", 503, "invalid_store_url");
  }

  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new WooCommerceError(
      "اتصال WooCommerce باید روی HTTPS باشد.",
      503,
      "insecure_store_url",
    );
  }

  return { storeUrl, consumerKey, consumerSecret };
}

function apiUrl(path: string, query?: URLSearchParams): URL {
  const { storeUrl, consumerKey, consumerSecret } = config();
  const cleanPath = path.replace(/^\//, "");
  const url = new URL(`${storeUrl}/wp-json/wc/v3/${cleanPath}`);

  if (query) {
    query.forEach((value, key) => url.searchParams.set(key, value));
  }

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
  timeoutMs = DEFAULT_WOO_TIMEOUT_MS,
): Promise<WooRequestResult<T>> {
  const { consumerKey, consumerSecret } = config();
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (!isFormData && options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  headers.set("accept", "application/json");

  if ((process.env.WOOCOMMERCE_AUTH_MODE ?? "basic") !== "query") {
    headers.set("authorization", `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl(path, query), {
      ...options,
      headers,
      signal: controller.signal,
      cache: "no-store",
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
      throw new WooCommerceError(
        error?.message || `WooCommerce با خطای ${response.status} پاسخ داد.`,
        response.status,
        error?.code,
      );
    }

    return { data: data as T, headers: response.headers };
  } catch (error) {
    if (error instanceof WooCommerceError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
  throw new WooCommerceError(
    path === "sepiid-media"
      ? "آپلود تصویر در وردپرس بیش از حد طول کشید. تصویر را سبک‌تر کن یا دوباره تلاش کن."
      : "زمان اتصال به وردپرس تمام شد.",
    504,
    "woo_timeout",
  );
}
    throw new WooCommerceError(
      error instanceof Error ? error.message : "اتصال به وردپرس ناموفق بود.",
      502,
      "woo_connection_failed",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function mapImage(image: WooImage): CmsImage {
  return {
    id: image.id,
    src: image.src,
    name: image.name ?? "",
    alt: image.alt ?? "",
  };
}

function mapProduct(product: WooProduct): CmsProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    type: product.type,
    status: product.status,
    catalogVisibility: product.catalog_visibility,
    featured: product.featured,
    description: product.description,
    shortDescription: product.short_description,
    price: product.price,
    regularPrice: product.regular_price,
    salePrice: product.sale_price,
    manageStock: product.manage_stock,
    stockQuantity: product.stock_quantity,
    stockStatus: product.stock_status,
    categories: product.categories,
    images: product.images.map(mapImage),
    permalink: product.permalink,
    dateModifiedGmt: product.date_modified_gmt,
  };
}

function productPayload(input: CmsProductInput) {
  return {
    name: input.name.trim(),
    slug: input.slug.trim(),
    sku: input.sku.trim(),
    status: input.status,
    catalog_visibility: input.catalogVisibility,
    featured: input.featured,
    description: input.description,
    short_description: input.shortDescription,
    regular_price: input.regularPrice.trim(),
    sale_price: input.salePrice.trim(),
    manage_stock: input.manageStock,
    stock_quantity: input.manageStock ? input.stockQuantity : null,
    stock_status: input.stockStatus,
    categories: input.categoryIds.map((id) => ({ id })),
    images: input.images.map((image) =>
      image.id > 0 ? { id: image.id } : { src: image.src, alt: image.alt },
    ),
  };
}

export async function listProducts(params: {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
}): Promise<CmsProductsResponse> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.max(1, Math.min(100, params.perPage ?? 30));
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    orderby: "modified",
    order: "desc",
    status: params.status && params.status !== "all" ? params.status : "any",
  });
  if (params.search?.trim()) query.set("search", params.search.trim());

  const response = await wooRequest<WooProduct[]>("products", {}, query);
  return {
    products: response.data.map(mapProduct),
    page,
    total: Number(response.headers.get("x-wp-total") ?? response.data.length),
    totalPages: Number(response.headers.get("x-wp-totalpages") ?? 1),
  };
}

export async function getProduct(id: number): Promise<CmsProduct> {
  const response = await wooRequest<WooProduct>(`products/${id}`);
  return mapProduct(response.data);
}

export async function getProductBySlug(slug: string): Promise<CmsProduct | null> {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return null;

  const response = await wooRequest<WooProduct[]>(
    "products",
    {},
    new URLSearchParams({
      slug: cleanSlug,
      per_page: "1",
      status: "any",
    }),
  );

  const [product] = response.data;
  return product ? mapProduct(product) : null;
}

async function assertUniqueSku(sku: string, currentId?: number) {
  if (!sku.trim()) return;
  const query = new URLSearchParams({ sku: sku.trim(), per_page: "10" });
  const response = await wooRequest<WooProduct[]>("products", {}, query);
  const conflict = response.data.find((product) => product.id !== currentId);
  if (conflict) {
    throw new WooCommerceError(
      `SKU «${sku}» قبلاً برای محصول «${conflict.name}» استفاده شده است.`,
      409,
      "duplicate_sku",
    );
  }
}

export async function createProduct(input: CmsProductInput): Promise<CmsProduct> {
  if (!input.name.trim()) {
    throw new WooCommerceError("نام محصول الزامی است.", 400, "missing_name");
  }
  await assertUniqueSku(input.sku);
  const response = await wooRequest<WooProduct>("products", {
    method: "POST",
    body: JSON.stringify(productPayload(input)),
  });
  return mapProduct(response.data);
}

export async function updateProduct(
  id: number,
  input: CmsProductInput,
): Promise<CmsProduct> {
  if (!input.name.trim()) {
    throw new WooCommerceError("نام محصول الزامی است.", 400, "missing_name");
  }

  const current = await getProduct(id);
  if (
    input.expectedModifiedGmt &&
    current.dateModifiedGmt !== input.expectedModifiedGmt
  ) {
    throw new WooCommerceError(
      "این محصول بعد از باز شدن فرم در وردپرس تغییر کرده است. صفحه را تازه‌سازی کن.",
      409,
      "edit_conflict",
    );
  }

  await assertUniqueSku(input.sku, id);
  const response = await wooRequest<WooProduct>(`products/${id}`, {
    method: "PUT",
    body: JSON.stringify(productPayload(input)),
  });
  return mapProduct(response.data);
}

export async function trashProduct(id: number): Promise<CmsProduct> {
  const response = await wooRequest<WooProduct>(
    `products/${id}`,
    { method: "DELETE" },
    new URLSearchParams({ force: "false" }),
  );
  return mapProduct(response.data);
}

export async function listCategories(): Promise<CmsCategory[]> {
  const response = await wooRequest<WooCategory[]>(
    "products/categories",
    {},
    new URLSearchParams({ per_page: "100", hide_empty: "false", orderby: "name" }),
  );
  return response.data.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent: category.parent,
    image: category.image ? mapImage(category.image) : null,
    count: category.count,
  }));
}

export async function uploadMedia(file: File, alt: string): Promise<CmsImage> {
  const form = new FormData();
  form.set("file", file, file.name);
  form.set("alt", alt);
  const response = await wooRequest<WooImage>(
    "sepiid-media",
    {
      method: "POST",
      body: form,
    },
    undefined,
    MEDIA_UPLOAD_TIMEOUT_MS,
  );
  return mapImage(response.data);
}

export async function connectionStatus(): Promise<CmsConnectionStatus> {
  const { storeUrl } = config();
  let productCount: number | null = null ;
  let connectionProblem: WooCommerceError | null = null;

  try {
    const products = await wooRequest<Array<Pick<WooProduct, "id">>>(
      "products",
      {},
      new URLSearchParams({
        per_page: "1",
        status: "any",
        _fields: "id",
      }),
      12_000,
    );
    productCount = Number(products.headers.get("x-wp-total") ?? products.data.length);
  } catch (error) {
    connectionProblem =
      error instanceof WooCommerceError
        ? error
        : new WooCommerceError("اتصال به WooCommerce ناموفق بود.", 502);
  }

  let bridgeVersion: string | null = null;
  let mediaUploadReady = false;
  if (!connectionProblem) {
    try {
      const bridge = await wooRequest<{ version: string; media_upload: boolean }>(
        "sepiid-bridge/health",
        {},
        undefined,
        8_000,
      );
      bridgeVersion = bridge.data.version;
      mediaUploadReady = bridge.data.media_upload;
    } catch (error) {
      if (!(error instanceof WooCommerceError) || error.status !== 404) {
        mediaUploadReady = false;
      }
    }
  }

  return {
    connected: !connectionProblem,
    storeUrl,
    productCount,
    bridgeVersion,
    mediaUploadReady,
    message: connectionProblem?.message,
    code: connectionProblem?.code,
  };
}

export function errorResponse(error: unknown): Response {
  if (error instanceof WooCommerceError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }
  return Response.json(
    { error: error instanceof Error ? error.message : "خطای پیش‌بینی‌نشده" },
    { status: 500 },
  );
}
