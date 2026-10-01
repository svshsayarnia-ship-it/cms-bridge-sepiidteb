import "server-only";

import crypto from "node:crypto";

type WooMeta = { key: string; value: unknown };
type WooOrder = {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  transaction_id?: string;
  meta_data?: WooMeta[];
};

type AbanInvoice = {
  invoice_id?: string;
  order_id?: string;
  amount_rial?: number;
  payable_rial?: number;
  payment_url?: string;
  status?: string;
  verified?: boolean;
  paid_at?: string;
};

type AbanErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type AbanWebhookPayload = {
  event?: string;
  invoice_id?: string;
  order_id?: string;
  amount_rial?: number;
  payable_rial?: number;
  status?: string;
  paid_at?: string;
  is_test?: boolean;
  metadata?: Record<string, unknown>;
};

const CHECKOUT_IDEMPOTENCY_META_KEY = "_sepiid_checkout_idempotency_key";
const CHECKOUT_SOURCE_META_KEY = "_sepiid_checkout_source";
const ABAN_INVOICE_META_KEY = "_sepiid_aban_invoice_id";
const ABAN_PAYABLE_META_KEY = "_sepiid_aban_payable_rial";
const ABAN_PAID_INVOICE_META_KEY = "_sepiid_aban_paid_invoice_id";
const REQUEST_TIMEOUT_MS = 15_000;
const CANONICAL_CALLBACK = "https://sepiidbeauty.ir/api/payment/aban/callback";
const DEFAULT_API_BASE = "https://abangateway.ir";
const PAYMENT_ORIGIN = "https://abangateway.ir";

export class AbanGatewayError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
    public readonly code = "aban_gateway_error",
  ) {
    super(message);
  }
}

function wooConfig() {
  const storeUrl = (process.env.WORDPRESS_URL ?? "").trim().replace(/\/$/, "");
  const consumerKey = (process.env.WOOCOMMERCE_CONSUMER_KEY ?? "").trim();
  const consumerSecret = (process.env.WOOCOMMERCE_CONSUMER_SECRET ?? "").trim();

  if (!storeUrl || !consumerKey || !consumerSecret) {
    throw new AbanGatewayError(
      "اتصال WooCommerce برای پرداخت تنظیم نشده است.",
      503,
      "woocommerce_not_configured",
    );
  }

  return { storeUrl, consumerKey, consumerSecret };
}

function wooApiUrl(path: string) {
  const { storeUrl, consumerKey, consumerSecret } = wooConfig();
  const url = new URL(storeUrl + "/wp-json/wc/v3/" + path.replace(/^\//, ""));
  if ((process.env.WOOCOMMERCE_AUTH_MODE ?? "basic") === "query") {
    url.searchParams.set("consumer_key", consumerKey);
    url.searchParams.set("consumer_secret", consumerSecret);
  }
  return url;
}

async function wooRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { consumerKey, consumerSecret } = wooConfig();
  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");
  headers.set("cache-control", "no-cache, no-store, max-age=0");
  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if ((process.env.WOOCOMMERCE_AUTH_MODE ?? "basic") !== "query") {
    headers.set(
      "authorization",
      "Basic " + Buffer.from(consumerKey + ":" + consumerSecret).toString("base64"),
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(wooApiUrl(path), {
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
      throw new AbanGatewayError(
        error?.message || "WooCommerce با خطای " + response.status + " پاسخ داد.",
        response.status,
        error?.code || "woocommerce_payment_error",
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof AbanGatewayError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AbanGatewayError(
        "زمان اتصال به WooCommerce برای پرداخت تمام شد.",
        504,
        "woocommerce_payment_timeout",
      );
    }
    throw new AbanGatewayError(
      "اتصال به WooCommerce برای پرداخت ناموفق بود.",
      502,
      "woocommerce_payment_connection_failed",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function readAbanApiToken() {
  // Keep the canonical uppercase name, while accepting the already-configured
  // production key created with lowercase letters in Vercel.
  return (
    process.env.ABAN_API_TOKEN ??
    process.env["aban_api_token"] ??
    ""
  ).trim();
}

function gatewayConfig() {
  const token = readAbanApiToken();
  const callback = (process.env.ABAN_CALLBACK_URL ?? CANONICAL_CALLBACK).trim();
  const base = (process.env.ABAN_BASE_URL ?? DEFAULT_API_BASE).trim().replace(/\/$/, "");

  // Starting and verifying an Aban payment only requires the API token.
  // The webhook signing secret is intentionally validated only when an
  // incoming webhook is processed. Requiring both here incorrectly forced
  // checkout to fall back to the legacy gateway when only the webhook
  // secret was missing, even though Aban's payment API was ready.
  if (!token) {
    throw new AbanGatewayError(
      "توکن API آبان هنوز روی سرور فعال نشده است.",
      503,
      "gateway_not_configured",
    );
  }

  let callbackUrl: URL;
  let apiBase: URL;
  try {
    callbackUrl = new URL(callback);
    apiBase = new URL(base);
  } catch {
    throw new AbanGatewayError(
      "تنظیمات آدرس درگاه آبان معتبر نیست.",
      503,
      "invalid_gateway_config",
    );
  }

  if (callbackUrl.protocol !== "https:" || callbackUrl.hostname !== "sepiidbeauty.ir") {
    throw new AbanGatewayError(
      "آدرس Callback آبان باید روی دامنه اصلی سپید بیوتی باشد.",
      503,
      "invalid_gateway_callback_domain",
    );
  }

  if (
    apiBase.protocol !== "https:" ||
    apiBase.hostname !== "abangateway.ir"
  ) {
    throw new AbanGatewayError(
      "آدرس API آبان معتبر نیست.",
      503,
      "invalid_gateway_api_domain",
    );
  }

  return {
    token,
    callback: callbackUrl.toString(),
    base: apiBase.toString().replace(/\/$/, ""),
  };
}

export function isAbanConfigured() {
  return Boolean(readAbanApiToken());
}

export function isAbanWebhookConfigured() {
  return Boolean((process.env.ABAN_WEBHOOK_SECRET ?? "").trim());
}

function firstMetaString(order: WooOrder, key: string) {
  const value = order.meta_data?.find((meta) => meta.key === key)?.value;
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function amountInRial(order: WooOrder) {
  const total = Number(order.total);
  if (!Number.isFinite(total) || total <= 0) {
    throw new AbanGatewayError(
      "مبلغ سفارش برای پرداخت معتبر نیست.",
      409,
      "invalid_order_amount",
    );
  }

  const currency = String(order.currency ?? "").toUpperCase();
  const rial = currency === "IRR" ? total : currency === "IRT" ? total * 10 : NaN;
  const amount = Math.round(rial);

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new AbanGatewayError(
      "واحد پول سفارش با درگاه آبان سازگار نیست.",
      409,
      "unsupported_order_currency",
    );
  }

  return amount;
}

async function getOrder(orderId: number) {
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    throw new AbanGatewayError("شناسه سفارش معتبر نیست.", 400, "invalid_order_id");
  }

  const order = await wooRequest<WooOrder>("orders/" + orderId);
  if (firstMetaString(order, CHECKOUT_SOURCE_META_KEY) !== "nextjs_storefront") {
    throw new AbanGatewayError(
      "این سفارش متعلق به مسیر پرداخت سایت نیست.",
      403,
      "invalid_order_source",
    );
  }
  return order;
}

export async function getStoredAbanInvoiceId(orderId: number) {
  const order = await getOrder(orderId);
  const invoiceId = firstMetaString(order, ABAN_INVOICE_META_KEY);
  return /^inv_[A-Za-z0-9_-]+$/.test(invoiceId) ? invoiceId : "";
}

function errorMessage(code: string, fallback = "آبان درخواست پرداخت را نپذیرفت.") {
  switch (code) {
    case "insufficient_fee_wallet":
      return "کیف پول کارمزد آبان موجودی کافی ندارد.";
    case "no_card_registered":
      return "کارت دریافت وجه در حساب آبان فعال نشده است.";
    case "capacity_full":
      return "ظرفیت پرداخت هم‌زمان این کارت موقتاً تکمیل است؛ کمی بعد دوباره تلاش کنید.";
    case "amount_not_allowed":
      return "مبلغ سفارش خارج از بازه مجاز آبان است.";
    case "unsafe_callback_url":
      return "آدرس بازگشت آبان پذیرفته نشد.";
    case "invoice_expired":
      return "مهلت این پرداخت تمام شده است.";
    case "not_yet_paid":
      return "پرداخت هنوز توسط آبان تأیید نشده است.";
    case "invoice_not_found":
      return "فاکتور آبان پیدا نشد.";
    case "already_verified":
      return "پرداخت قبلاً تأیید شده است.";
    default:
      return fallback;
  }
}

async function abanRequest<T>(
  path: string,
  options: RequestInit = {},
  allowedStatuses: number[] = [],
): Promise<{ response: Response; data: T | AbanErrorPayload | null }> {
  const { token, base } = gatewayConfig();
  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");
  headers.set("authorization", "Bearer " + token);
  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      base + "/api/v1/" + path.replace(/^\//, ""),
      {
        ...options,
        headers,
        cache: "no-store",
        signal: controller.signal,
      },
    );
    const text = await response.text();
    let data: T | AbanErrorPayload | null = null;

    if (text) {
      try {
        data = JSON.parse(text) as T | AbanErrorPayload;
      } catch {
        data = null;
      }
    }

    if (!response.ok && !allowedStatuses.includes(response.status)) {
      const error = data as AbanErrorPayload | null;
      const code = String(error?.error?.code ?? "http_" + response.status);
      throw new AbanGatewayError(
        errorMessage(code, error?.error?.message || "آبان پاسخ معتبر نداد."),
        response.status >= 500 ? 502 : response.status,
        code,
      );
    }

    return { response, data };
  } catch (error) {
    if (error instanceof AbanGatewayError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AbanGatewayError(
        "زمان اتصال به آبان تمام شد. دوباره تلاش کنید.",
        504,
        "gateway_timeout",
      );
    }
    throw new AbanGatewayError(
      "اتصال به آبان برقرار نشد. دوباره تلاش کنید.",
      502,
      "gateway_connection_failed",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function validatePaymentUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new AbanGatewayError(
      "آدرس صفحه پرداخت آبان معتبر نیست.",
      502,
      "invalid_payment_url",
    );
  }

  if (
    url.protocol !== "https:" ||
    !["abangateway.ir", "www.abangateway.ir"].includes(url.hostname)
  ) {
    throw new AbanGatewayError(
      "آدرس صفحه پرداخت خارج از دامنه رسمی آبان است.",
      502,
      "invalid_payment_domain",
    );
  }

  return url.toString();
}

async function storeInvoice(order: WooOrder, invoiceId: string, payableRial: number) {
  await wooRequest<WooOrder>("orders/" + order.id, {
    method: "PUT",
    body: JSON.stringify({
      meta_data: [
        { key: ABAN_INVOICE_META_KEY, value: invoiceId },
        { key: ABAN_PAYABLE_META_KEY, value: String(payableRial) },
      ],
    }),
  });
}

async function markOrderPaid(order: WooOrder, invoiceId: string, paidAt?: string) {
  if (
    ["processing", "completed"].includes(order.status) &&
    firstMetaString(order, ABAN_PAID_INVOICE_META_KEY) === invoiceId
  ) {
    return order;
  }

  return wooRequest<WooOrder>("orders/" + order.id, {
    method: "PUT",
    body: JSON.stringify({
      set_paid: true,
      transaction_id: invoiceId,
      meta_data: [
        { key: ABAN_PAID_INVOICE_META_KEY, value: invoiceId },
        ...(paidAt ? [{ key: "_sepiid_aban_paid_at", value: paidAt }] : []),
      ],
    }),
  });
}

export async function createAbanPayment(input: {
  orderId: number;
  idempotencyKey: string;
}) {
  const idempotencyKey = String(input.idempotencyKey ?? "").trim();
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(idempotencyKey)) {
    throw new AbanGatewayError(
      "شناسه پرداخت معتبر نیست.",
      400,
      "invalid_payment_token",
    );
  }

  const order = await getOrder(Number(input.orderId));
  if (firstMetaString(order, CHECKOUT_IDEMPOTENCY_META_KEY) !== idempotencyKey) {
    throw new AbanGatewayError(
      "اجازه پرداخت این سفارش تأیید نشد.",
      403,
      "payment_token_mismatch",
    );
  }

  if (["processing", "completed"].includes(order.status)) {
    throw new AbanGatewayError(
      "این سفارش قبلاً پرداخت شده است.",
      409,
      "order_already_paid",
    );
  }

  if (!["pending", "failed", "on-hold"].includes(order.status)) {
    throw new AbanGatewayError(
      "وضعیت این سفارش برای پرداخت مناسب نیست.",
      409,
      "order_not_payable",
    );
  }

  const existingInvoice = firstMetaString(order, ABAN_INVOICE_META_KEY);
  if (/^inv_[A-Za-z0-9_-]+$/.test(existingInvoice)) {
    try {
      const { data } = await abanRequest<AbanInvoice>(
        "invoices/" + encodeURIComponent(existingInvoice),
      );
      const existing = data as AbanInvoice | null;
      const existingStatus = String(existing?.status ?? "");
      const existingUrl = String(existing?.payment_url ?? "");
      const existingPayable = Number(existing?.payable_rial);

      if (
        ["pending", "partially_paid"].includes(existingStatus) &&
        existingUrl &&
        Number.isSafeInteger(existingPayable) &&
        existingPayable > 0
      ) {
        return {
          invoiceId: existingInvoice,
          url: validatePaymentUrl(existingUrl),
          payableRial: existingPayable,
        };
      }

      if (existingStatus === "paid") {
        await verifyAbanInvoice({
          invoiceId: existingInvoice,
          orderId: order.id,
        });
        return {
          invoiceId: existingInvoice,
          url: existingUrl
            ? validatePaymentUrl(existingUrl)
            : PAYMENT_ORIGIN + "/pay/" + encodeURIComponent(existingInvoice),
          payableRial:
            existingPayable ||
            Number(firstMetaString(order, ABAN_PAYABLE_META_KEY)) ||
            amountInRial(order),
        };
      }

      // expired/cancelled invoices must not trap a retry on an unusable page.
      // Continue below and create a fresh invoice for the same WooCommerce order.
    } catch (error) {
      if (
        !(error instanceof AbanGatewayError) ||
        !["invoice_not_found", "http_404"].includes(error.code)
      ) {
        throw error;
      }
      // If the old invoice no longer exists at Aban, create a new one below.
    }
  }

  const { callback } = gatewayConfig();
  const callbackUrl = new URL(callback);
  callbackUrl.searchParams.set("order", String(order.id));
  const amountRial = amountInRial(order);
  const { data } = await abanRequest<AbanInvoice>("invoices", {
    method: "POST",
    body: JSON.stringify({
      amount_rial: amountRial,
      order_id: String(order.id),
      callback_url: callbackUrl.toString(),
      description: "پرداخت سفارش #" + (order.number || order.id) + " سپید بیوتی",
      metadata: {
        store: "sepiidbeauty.ir",
        woo_order_id: order.id,
      },
      expiry_minutes: 30,
    }),
  });

  const invoice = data as AbanInvoice | null;
  const invoiceId = String(invoice?.invoice_id ?? "").trim();
  const paymentUrl = String(invoice?.payment_url ?? "").trim();
  const payableRial = Number(invoice?.payable_rial);

  if (
    !/^inv_[A-Za-z0-9_-]+$/.test(invoiceId) ||
    !Number.isSafeInteger(payableRial) ||
    payableRial <= 0 ||
    !paymentUrl
  ) {
    throw new AbanGatewayError(
      "پاسخ ساخت فاکتور آبان کامل نبود.",
      502,
      "invalid_create_response",
    );
  }

  const safeUrl = validatePaymentUrl(paymentUrl);
  await storeInvoice(order, invoiceId, payableRial);

  return {
    invoiceId,
    url: safeUrl,
    payableRial,
  };
}

export async function verifyAbanInvoice(input: {
  invoiceId: string;
  orderId: number;
}) {
  const invoiceId = String(input.invoiceId ?? "").trim();
  if (!/^inv_[A-Za-z0-9_-]+$/.test(invoiceId)) {
    throw new AbanGatewayError(
      "شناسه فاکتور آبان معتبر نیست.",
      400,
      "invalid_invoice_id",
    );
  }

  const order = await getOrder(Number(input.orderId));
  if (firstMetaString(order, ABAN_INVOICE_META_KEY) !== invoiceId) {
    throw new AbanGatewayError(
      "فاکتور آبان با سفارش مطابقت ندارد.",
      403,
      "invoice_order_mismatch",
    );
  }

  if (
    ["processing", "completed"].includes(order.status) &&
    firstMetaString(order, ABAN_PAID_INVOICE_META_KEY) === invoiceId
  ) {
    return {
      ok: true as const,
      orderId: order.id,
      orderNumber: order.number || String(order.id),
      invoiceId,
      alreadyVerified: true,
    };
  }

  const { response, data } = await abanRequest<AbanInvoice>(
    "invoices/" + encodeURIComponent(invoiceId) + "/verify",
    { method: "POST" },
    [409],
  );

  if (response.status === 409) {
    const error = data as AbanErrorPayload | null;
    const code = String(error?.error?.code ?? "conflict");
    if (code !== "already_verified") {
      throw new AbanGatewayError(
        errorMessage(code, error?.error?.message || "فاکتور آبان قابل تأیید نیست."),
        409,
        code,
      );
    }

    await markOrderPaid(order, invoiceId);
    return {
      ok: true as const,
      orderId: order.id,
      orderNumber: order.number || String(order.id),
      invoiceId,
      alreadyVerified: true,
    };
  }

  const verified = data as AbanInvoice | null;
  if (!verified?.verified) {
    throw new AbanGatewayError(
      "آبان پرداخت را تأیید نکرد.",
      502,
      "verify_failed",
    );
  }

  if (
    String(verified.order_id ?? "") &&
    String(verified.order_id) !== String(order.id)
  ) {
    throw new AbanGatewayError(
      "شناسه سفارش در پاسخ آبان مطابقت ندارد.",
      403,
      "verify_order_mismatch",
    );
  }

  await markOrderPaid(order, invoiceId, verified.paid_at);

  return {
    ok: true as const,
    orderId: order.id,
    orderNumber: order.number || String(order.id),
    invoiceId,
    alreadyVerified: false,
  };
}

export function verifyAbanWebhookSignature(rawBody: string, signature: string) {
  const webhookSecret = (process.env.ABAN_WEBHOOK_SECRET ?? "").trim();
  const given = String(signature ?? "").trim().toLowerCase();

  // A missing signing secret must never block payment creation or the
  // browser return flow. It only disables webhook acceptance until the
  // secret is configured.
  if (!webhookSecret || !/^[a-f0-9]{64}$/.test(given)) return false;

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(Buffer.from(rawBody, "utf8"))
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(given, "hex"),
  );
}

export function parseAbanWebhook(rawBody: string): AbanWebhookPayload {
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new AbanGatewayError(
      "بدنه وبهوک آبان JSON معتبر نیست.",
      400,
      "invalid_webhook_json",
    );
  }

  if (!payload || typeof payload !== "object") {
    throw new AbanGatewayError(
      "بدنه وبهوک آبان معتبر نیست.",
      400,
      "invalid_webhook_payload",
    );
  }

  return payload as AbanWebhookPayload;
}

export const abanMetaKeys = {
  invoice: ABAN_INVOICE_META_KEY,
  paidInvoice: ABAN_PAID_INVOICE_META_KEY,
} as const;
