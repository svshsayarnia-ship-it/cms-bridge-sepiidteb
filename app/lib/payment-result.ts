import "server-only";

type WooMeta = { key: string; value: unknown };
type WooOrder = {
  id: number;
  number: string;
  status: string;
  transaction_id?: string;
  meta_data?: WooMeta[];
};

const CHECKOUT_SOURCE_META_KEY = "_sepiid_checkout_source";
const GATEWAY_PAID_TRANSID_META_KEY = "_sepiid_aqayepardakht_paid_transid";
const REQUEST_TIMEOUT_MS = 15_000;

function config() {
  const storeUrl = (process.env.WORDPRESS_URL ?? "").trim().replace(/\/$/, "");
  const consumerKey = (process.env.WOOCOMMERCE_CONSUMER_KEY ?? "").trim();
  const consumerSecret = (process.env.WOOCOMMERCE_CONSUMER_SECRET ?? "").trim();

  if (!storeUrl || !consumerKey || !consumerSecret) {
    throw new Error("woocommerce_not_configured");
  }

  return { storeUrl, consumerKey, consumerSecret };
}

function apiUrl(orderId: number) {
  const { storeUrl, consumerKey, consumerSecret } = config();
  const url = new URL(`${storeUrl}/wp-json/wc/v3/orders/${orderId}`);
  if ((process.env.WOOCOMMERCE_AUTH_MODE ?? "basic") === "query") {
    url.searchParams.set("consumer_key", consumerKey);
    url.searchParams.set("consumer_secret", consumerSecret);
  }
  return url;
}

async function getOrder(orderId: number) {
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    throw new Error("invalid_order_id");
  }

  const { consumerKey, consumerSecret } = config();
  const headers = new Headers({
    accept: "application/json",
    "cache-control": "no-cache, no-store, max-age=0",
  });
  if ((process.env.WOOCOMMERCE_AUTH_MODE ?? "basic") !== "query") {
    headers.set(
      "authorization",
      `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(apiUrl(orderId), {
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("order_lookup_failed");
    return (await response.json()) as WooOrder;
  } finally {
    clearTimeout(timeout);
  }
}

function metaString(order: WooOrder, key: string) {
  const value = order.meta_data?.find((meta) => meta.key === key)?.value;
  return typeof value === "string" ? value : "";
}

export async function verifyPaymentResultView(input: {
  orderId: number;
  transid: string;
}) {
  const transid = String(input.transid ?? "").trim();
  if (!transid) return null;

  const order = await getOrder(input.orderId);
  const validSource = metaString(order, CHECKOUT_SOURCE_META_KEY) === "nextjs_storefront";
  const paidTransid = metaString(order, GATEWAY_PAID_TRANSID_META_KEY);
  const validStatus = ["processing", "completed"].includes(order.status);
  const validTransaction = order.transaction_id === transid && paidTransid === transid;

  if (!validSource || !validStatus || !validTransaction) return null;

  return {
    orderId: order.id,
    orderNumber: order.number || String(order.id),
    transid,
  };
}
