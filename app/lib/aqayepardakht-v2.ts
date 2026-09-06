import "server-only";

type WooMeta = { key: string; value: unknown };
type WooOrder = {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  transaction_id?: string;
  billing?: { phone?: string };
  meta_data?: WooMeta[];
};

type GatewayResponse = {
  status?: string;
  transid?: string;
  code?: string | number;
  message?: string;
};

const CHECKOUT_IDEMPOTENCY_META_KEY = "_sepiid_checkout_idempotency_key";
const CHECKOUT_SOURCE_META_KEY = "_sepiid_checkout_source";
const GATEWAY_TRANSIDS_META_KEY = "_sepiid_aqayepardakht_transids";
const GATEWAY_PAID_TRANSID_META_KEY = "_sepiid_aqayepardakht_paid_transid";
const REQUEST_TIMEOUT_MS = 15_000;
const CANONICAL_CALLBACK = "https://sepiidbeauty.ir/api/payment/aqayepardakht/callback";
const API_BASE = "https://panel.aqayepardakht.ir/api/v2";
const STARTPAY_BASE = "https://panel.aqayepardakht.ir/startpay/";
const STARTPAY_SANDBOX_BASE = "https://panel.aqayepardakht.ir/startpay/sandbox/";
const STOREFRONT_ORIGIN = "https://sepiidbeauty.ir";

export class AqayePardakhtError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
    public readonly code = "aqayepardakht_error",
  ) {
    super(message);
  }
}

function wooConfig() {
  const storeUrl = (process.env.WORDPRESS_URL ?? "").trim().replace(/\/$/, "");
  const consumerKey = (process.env.WOOCOMMERCE_CONSUMER_KEY ?? "").trim();
  const consumerSecret = (process.env.WOOCOMMERCE_CONSUMER_SECRET ?? "").trim();
  if (!storeUrl || !consumerKey || !consumerSecret) {
    throw new AqayePardakhtError(
      "اتصال WooCommerce برای پرداخت تنظیم نشده است.",
      503,
      "woocommerce_not_configured",
    );
  }
  return { storeUrl, consumerKey, consumerSecret };
}

function wooApiUrl(path: string) {
  const { storeUrl, consumerKey, consumerSecret } = wooConfig();
  const url = new URL(`${storeUrl}/wp-json/wc/v3/${path.replace(/^\//, "")}`);
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
  if (options.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  if ((process.env.WOOCOMMERCE_AUTH_MODE ?? "basic") !== "query") {
    headers.set(
      "authorization",
      `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
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
      throw new AqayePardakhtError(
        error?.message || `WooCommerce با خطای ${response.status} پاسخ داد.`,
        response.status,
        error?.code || "woocommerce_payment_error",
      );
    }
    return data as T;
  } catch (error) {
    if (error instanceof AqayePardakhtError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AqayePardakhtError(
        "زمان اتصال به WooCommerce برای پرداخت تمام شد.",
        504,
        "woocommerce_payment_timeout",
      );
    }
    throw new AqayePardakhtError(
      "اتصال به WooCommerce برای پرداخت ناموفق بود.",
      502,
      "woocommerce_payment_connection_failed",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function gatewayConfig() {
  const mode = (process.env.AQAYEPARDAKHT_MODE ?? "production").trim().toLowerCase();
  const sandbox = mode === "sandbox";
  const pin = sandbox ? "sandbox" : (process.env.AQAYEPARDAKHT_PIN ?? "").trim();
  const callback = (process.env.AQAYEPARDAKHT_CALLBACK_URL ?? CANONICAL_CALLBACK).trim();

  if (!pin) {
    throw new AqayePardakhtError(
      "درگاه پرداخت هنوز روی سرور فعال نشده است.",
      503,
      "gateway_not_configured",
    );
  }

  let callbackUrl: URL;
  try {
    callbackUrl = new URL(callback);
  } catch {
    throw new AqayePardakhtError(
      "آدرس بازگشت درگاه معتبر نیست.",
      503,
      "invalid_gateway_callback",
    );
  }
  if (callbackUrl.protocol !== "https:" || callbackUrl.hostname !== "sepiidbeauty.ir") {
    throw new AqayePardakhtError(
      "آدرس بازگشت درگاه باید روی دامنه اصلی سپید بیوتی باشد.",
      503,
      "invalid_gateway_callback_domain",
    );
  }

  return { pin, sandbox, callback: callbackUrl.toString() };
}

export function isAqayePardakhtConfigured() {
  const mode = (process.env.AQAYEPARDAKHT_MODE ?? "production").trim().toLowerCase();
  return mode === "sandbox" || Boolean((process.env.AQAYEPARDAKHT_PIN ?? "").trim());
}

function metaValues(order: WooOrder, key: string) {
  return (order.meta_data ?? []).filter((meta) => meta.key === key).map((meta) => meta.value);
}

function firstMetaString(order: WooOrder, key: string) {
  const value = metaValues(order, key)[0];
  return typeof value === "string" ? value : "";
}

function readTransidHistory(order: WooOrder) {
  const result = new Set<string>();
  for (const value of metaValues(order, GATEWAY_TRANSIDS_META_KEY)) {
    if (Array.isArray(value)) {
      for (const entry of value) if (typeof entry === "string" && entry) result.add(entry);
      continue;
    }
    if (typeof value !== "string" || !value) continue;
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        for (const entry of parsed) if (typeof entry === "string" && entry) result.add(entry);
      } else {
        result.add(value);
      }
    } catch {
      result.add(value);
    }
  }
  return [...result];
}

function amountInToman(order: WooOrder) {
  const total = Number(order.total);
  if (!Number.isFinite(total) || total <= 0) {
    throw new AqayePardakhtError("مبلغ سفارش برای پرداخت معتبر نیست.", 409, "invalid_order_amount");
  }
  const currency = String(order.currency ?? "").toUpperCase();
  const toman = currency === "IRR" ? total / 10 : currency === "IRT" ? total : NaN;
  if (!Number.isFinite(toman)) {
    throw new AqayePardakhtError(
      "واحد پول سفارش با درگاه پرداخت سازگار نیست.",
      409,
      "unsupported_order_currency",
    );
  }
  const amount = Math.round(toman);
  if (amount < 1_000 || amount > 400_000_000) {
    throw new AqayePardakhtError(
      "مبلغ سفارش خارج از بازه مجاز درگاه است.",
      409,
      "gateway_amount_out_of_range",
    );
  }
  return amount;
}

function gatewayErrorMessage(code: string) {
  switch (code) {
    case "-1": return "مبلغ پرداخت ارسال نشده است.";
    case "-2": return "پین درگاه ارسال نشده است.";
    case "-3": return "آدرس بازگشت درگاه ارسال نشده است.";
    case "-4": return "مبلغ پرداخت معتبر نیست.";
    case "-5": return "مبلغ خارج از بازه مجاز آقای پرداخت است.";
    case "-6": return "پین درگاه آقای پرداخت معتبر نیست.";
    case "-7": return "شناسه تراکنش ارسال نشده است.";
    case "-8": return "تراکنش مورد نظر در آقای پرداخت پیدا نشد.";
    case "-9": return "پین درگاه با تراکنش مطابقت ندارد.";
    case "-10": return "مبلغ سفارش با مبلغ تراکنش مطابقت ندارد.";
    case "-11": return "درگاه آقای پرداخت هنوز تأیید نشده یا غیرفعال است.";
    case "-12": return "امکان ارسال درخواست برای این پذیرنده وجود ندارد.";
    case "-13": return "شماره کارت مجاز معتبر نیست.";
    case "-14": return "درگاه روی سایت دیگری در حال استفاده است.";
    case "-15": return "دامنه Callback با دامنه تأییدشده درگاه مطابقت ندارد.";
    case "-16": return "Referrer درخواست برای درگاه معتبر نیست.";
    case "-17": return "روش Callback باید GET یا POST باشد.";
    case "0": return "پرداخت انجام نشد.";
    default: return "آقای پرداخت درخواست را نپذیرفت.";
  }
}

async function gatewayRequest(path: "create" | "verify", body: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE}/${path}`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        origin: STOREFRONT_ORIGIN,
        referer: `${STOREFRONT_ORIGIN}/checkout`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await response.text();
    let data: GatewayResponse | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as GatewayResponse;
      } catch {
        data = null;
      }
    }

    if (data?.status === "error" || (response.status === 422 && data?.code !== undefined)) {
      const gatewayCode = String(data?.code ?? "unknown");
      console.error("[aqayepardakht] gateway rejected request", {
        path,
        httpStatus: response.status,
        gatewayCode,
        gatewayMessage: typeof data?.message === "string" ? data.message.slice(0, 180) : "",
      });
      throw new AqayePardakhtError(
        gatewayErrorMessage(gatewayCode),
        502,
        `gateway_api_${gatewayCode}`,
      );
    }

    if (!response.ok || !data) {
      console.error("[aqayepardakht] invalid gateway response", {
        path,
        httpStatus: response.status,
        responseType: response.headers.get("content-type") ?? "",
        bodyPreview: text.slice(0, 180),
      });
      throw new AqayePardakhtError(
        "درگاه پرداخت پاسخ معتبر نداد. دوباره تلاش کنید.",
        502,
        "gateway_unavailable",
      );
    }

    return data;
  } catch (error) {
    if (error instanceof AqayePardakhtError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AqayePardakhtError(
        "زمان اتصال به درگاه پرداخت تمام شد. دوباره تلاش کنید.",
        504,
        "gateway_timeout",
      );
    }
    throw new AqayePardakhtError(
      "اتصال به درگاه پرداخت برقرار نشد. دوباره تلاش کنید.",
      502,
      "gateway_connection_failed",
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function getOrder(orderId: number) {
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    throw new AqayePardakhtError("شناسه سفارش معتبر نیست.", 400, "invalid_order_id");
  }
  const order = await wooRequest<WooOrder>(`orders/${orderId}`);
  if (firstMetaString(order, CHECKOUT_SOURCE_META_KEY) !== "nextjs_storefront") {
    throw new AqayePardakhtError("این سفارش متعلق به مسیر پرداخت سایت نیست.", 403, "invalid_order_source");
  }
  return order;
}

async function rememberTransid(order: WooOrder, transid: string) {
  const history = [...new Set([...readTransidHistory(order), transid])].slice(-10);
  await wooRequest<WooOrder>(`orders/${order.id}`, {
    method: "PUT",
    body: JSON.stringify({
      meta_data: [{ key: GATEWAY_TRANSIDS_META_KEY, value: JSON.stringify(history) }],
    }),
  });
}

export async function createAqayePardakhtPayment(input: { orderId: number; idempotencyKey: string }) {
  const idempotencyKey = String(input.idempotencyKey ?? "").trim();
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(idempotencyKey)) {
    throw new AqayePardakhtError("شناسه پرداخت معتبر نیست.", 400, "invalid_payment_token");
  }

  const order = await getOrder(Number(input.orderId));
  if (firstMetaString(order, CHECKOUT_IDEMPOTENCY_META_KEY) !== idempotencyKey) {
    throw new AqayePardakhtError("اجازه پرداخت این سفارش تأیید نشد.", 403, "payment_token_mismatch");
  }
  if (["processing", "completed"].includes(order.status)) {
    throw new AqayePardakhtError("این سفارش قبلاً پرداخت شده است.", 409, "order_already_paid");
  }
  if (!["pending", "failed", "on-hold"].includes(order.status)) {
    throw new AqayePardakhtError("وضعیت این سفارش برای پرداخت مناسب نیست.", 409, "order_not_payable");
  }

  const { pin, sandbox, callback } = gatewayConfig();
  const amount = amountInToman(order);
  const response = await gatewayRequest("create", {
    pin,
    amount,
    callback,
    callback_method: "GET",
    invoice_id: String(order.id),
    mobile: String(order.billing?.phone ?? "").trim() || undefined,
    description: `پرداخت سفارش #${order.number || order.id} سپید بیوتی`,
  });

  const transid = typeof response.transid === "string" ? response.transid.trim() : "";
  if (response.status !== "success" || !transid) {
    const code = String(response.code ?? "failed");
    throw new AqayePardakhtError(
      gatewayErrorMessage(code),
      502,
      `gateway_create_${code}`,
    );
  }

  await rememberTransid(order, transid);
  return {
    transid,
    url: `${sandbox ? STARTPAY_SANDBOX_BASE : STARTPAY_BASE}${encodeURIComponent(transid)}`,
    amount,
  };
}

export async function verifyAqayePardakhtCallback(input: {
  transid: string;
  invoiceId: string;
  status: string;
  trackingNumber?: string;
  cardNumber?: string;
  bank?: string;
}) {
  const transid = String(input.transid ?? "").trim();
  const orderId = Number.parseInt(String(input.invoiceId ?? ""), 10);
  if (!transid || !Number.isSafeInteger(orderId) || orderId <= 0) {
    throw new AqayePardakhtError("اطلاعات بازگشت پرداخت معتبر نیست.", 400, "invalid_callback");
  }

  const order = await getOrder(orderId);
  if (!readTransidHistory(order).includes(transid)) {
    throw new AqayePardakhtError(
      "شناسه تراکنش با سفارش مطابقت ندارد.",
      403,
      "transaction_order_mismatch",
    );
  }

  const paidTransid = firstMetaString(order, GATEWAY_PAID_TRANSID_META_KEY);
  if (["processing", "completed"].includes(order.status) && paidTransid === transid) {
    return { ok: true as const, orderId: order.id, orderNumber: order.number, transid, alreadyVerified: true };
  }

  if (String(input.status ?? "0") !== "1") {
    return {
      ok: false as const,
      orderId: order.id,
      orderNumber: order.number,
      transid,
      reason: "payment_cancelled",
    };
  }

  const { pin } = gatewayConfig();
  const amount = amountInToman(order);
  const response = await gatewayRequest("verify", { pin, amount, transid });
  const verifyCode = String(response.code ?? "");
  const verified = (response.status === "success" && verifyCode === "1") || verifyCode === "2";
  if (!verified) {
    return {
      ok: false as const,
      orderId: order.id,
      orderNumber: order.number,
      transid,
      reason: `verify_${verifyCode || "failed"}`,
    };
  }

  await wooRequest<WooOrder>(`orders/${order.id}`, {
    method: "PUT",
    body: JSON.stringify({
      set_paid: true,
      payment_method: "aqayepardakht",
      payment_method_title: "آقای پرداخت",
      transaction_id: transid,
      meta_data: [
        { key: GATEWAY_PAID_TRANSID_META_KEY, value: transid },
        { key: "_sepiid_aqayepardakht_tracking_number", value: String(input.trackingNumber ?? "").slice(0, 120) },
        { key: "_sepiid_aqayepardakht_card", value: String(input.cardNumber ?? "").slice(0, 40) },
        { key: "_sepiid_aqayepardakht_bank", value: String(input.bank ?? "").slice(0, 120) },
      ],
    }),
  });

  return {
    ok: true as const,
    orderId: order.id,
    orderNumber: order.number,
    transid,
    alreadyVerified: verifyCode === "2",
  };
}
