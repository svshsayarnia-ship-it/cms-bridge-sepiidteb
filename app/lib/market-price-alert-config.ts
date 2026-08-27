import { WooCommerceError } from "./woocommerce";

const CONFIG_SKU = "sepiid-system-alert-config-v1";
const CONFIG_META_KEY = "sepiid_alert_config_v1";
const CONFIG_SLUG = "sepiid-system-alert-config-v1";
const ENCRYPTION_CONTEXT = "sepiid-market-alert-config-v1";

type WooMeta = { key: string; value: unknown };
type WooConfigProduct = { id: number; meta_data?: WooMeta[] };

export type MarketPriceAlertConfig = {
  telegramBotToken: string;
  telegramChatId: string;
  resendApiKey: string;
  emailRecipient: string;
  emailFrom: string;
};

export type MarketPriceAlertConfigStatus = {
  telegramConfigured: boolean;
  telegramChatId: string;
  emailConfigured: boolean;
  emailRecipient: string;
  emailFrom: string;
};

export type MarketPriceAlertConfigInput = {
  telegramBotToken?: string;
  telegramChatId?: string;
  resendApiKey?: string;
  emailRecipient?: string;
  emailFrom?: string;
  clearTelegram?: boolean;
  clearEmail?: boolean;
};

function emptyConfig(): MarketPriceAlertConfig {
  return {
    telegramBotToken: "",
    telegramChatId: "",
    resendApiKey: "",
    emailRecipient: "",
    emailFrom: "",
  };
}

function envValue(name: string): string {
  return (process.env[name] ?? "").trim();
}

function wooConfig() {
  const storeUrl = envValue("WORDPRESS_URL").replace(/\/$/u, "");
  const consumerKey = envValue("WOOCOMMERCE_CONSUMER_KEY");
  const consumerSecret = envValue("WOOCOMMERCE_CONSUMER_SECRET");
  if (!storeUrl || !consumerKey || !consumerSecret) {
    throw new WooCommerceError(
      "اتصال WooCommerce برای ذخیره تنظیمات اعلان آماده نیست.",
      503,
      "alert_store_not_configured",
    );
  }
  return { storeUrl, consumerKey, consumerSecret };
}

async function wooRequest<T>(
  path: string,
  options: RequestInit = {},
  query?: URLSearchParams,
): Promise<T> {
  const { storeUrl, consumerKey, consumerSecret } = wooConfig();
  const url = new URL(`${storeUrl}/wp-json/wc/v3/${path.replace(/^\//u, "")}`);
  query?.forEach((value, key) => url.searchParams.set(key, value));

  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");
  headers.set("cache-control", "no-cache, no-store, max-age=0");
  if (options.body) headers.set("content-type", "application/json");

  if (envValue("WOOCOMMERCE_AUTH_MODE") === "query") {
    url.searchParams.set("consumer_key", consumerKey);
    url.searchParams.set("consumer_secret", consumerSecret);
  } else {
    headers.set(
      "authorization",
      `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      cache: "no-store",
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
        error?.code || "alert_store_woo_error",
      );
    }
    return body as T;
  } catch (error) {
    if (error instanceof WooCommerceError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new WooCommerceError(
        "زمان اتصال برای ذخیره تنظیمات اعلان تمام شد.",
        504,
        "alert_store_timeout",
      );
    }
    throw new WooCommerceError(
      error instanceof Error ? error.message : "ذخیره تنظیمات اعلان ناموفق بود.",
      502,
      "alert_store_failed",
    );
  } finally {
    clearTimeout(timer);
  }
}

async function configProduct(): Promise<WooConfigProduct | null> {
  const products = await wooRequest<WooConfigProduct[]>(
    "products",
    {},
    new URLSearchParams({ sku: CONFIG_SKU, status: "any", per_page: "1" }),
  );
  return products[0] ?? null;
}

function configCiphertext(product: WooConfigProduct | null): string {
  const value = product?.meta_data?.find((item) => item.key === CONFIG_META_KEY)?.value;
  return typeof value === "string" ? value : "";
}

async function persistCiphertext(value: string): Promise<void> {
  const existing = await configProduct();
  const meta_data = [{ key: CONFIG_META_KEY, value }];
  if (existing) {
    await wooRequest(`products/${existing.id}`, {
      method: "PUT",
      body: JSON.stringify({ meta_data }),
    });
    return;
  }

  await wooRequest("products", {
    method: "POST",
    body: JSON.stringify({
      name: "Sepiid System Alert Config",
      slug: CONFIG_SLUG,
      sku: CONFIG_SKU,
      type: "simple",
      status: "private",
      catalog_visibility: "hidden",
      virtual: true,
      meta_data,
    }),
  });
}

async function encryptionKey(): Promise<CryptoKey> {
  const secret = wooConfig().consumerSecret;
  const material = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${ENCRYPTION_CONTEXT}:${secret}`),
  );
  return crypto.subtle.importKey("raw", material, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function encode(bytes: ArrayBuffer | Uint8Array): string {
  return Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)).toString(
    "base64url",
  );
}

function decode(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

async function encrypt(config: MarketPriceAlertConfig): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(config));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await encryptionKey(),
    plaintext,
  );
  return `v1.${encode(iv)}.${encode(encrypted)}`;
}

async function decrypt(value: string): Promise<MarketPriceAlertConfig> {
  if (!value) return emptyConfig();
  const [version, ivValue, encryptedValue] = value.split(".");
  if (version !== "v1" || !ivValue || !encryptedValue) return emptyConfig();
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: decode(ivValue) },
      await encryptionKey(),
      decode(encryptedValue),
    );
    const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as Partial<MarketPriceAlertConfig>;
    return {
      telegramBotToken: typeof parsed.telegramBotToken === "string" ? parsed.telegramBotToken : "",
      telegramChatId: typeof parsed.telegramChatId === "string" ? parsed.telegramChatId : "",
      resendApiKey: typeof parsed.resendApiKey === "string" ? parsed.resendApiKey : "",
      emailRecipient: typeof parsed.emailRecipient === "string" ? parsed.emailRecipient : "",
      emailFrom: typeof parsed.emailFrom === "string" ? parsed.emailFrom : "",
    };
  } catch {
    return emptyConfig();
  }
}

export async function getMarketPriceAlertConfig(): Promise<MarketPriceAlertConfig> {
  return decrypt(configCiphertext(await configProduct()));
}

export async function getMarketPriceAlertConfigStatus(): Promise<MarketPriceAlertConfigStatus> {
  const config = await getMarketPriceAlertConfig();
  return {
    telegramConfigured: Boolean(config.telegramBotToken && config.telegramChatId),
    telegramChatId: config.telegramChatId,
    emailConfigured: Boolean(config.resendApiKey && config.emailRecipient && config.emailFrom),
    emailRecipient: config.emailRecipient,
    emailFrom: config.emailFrom,
  };
}

export async function updateMarketPriceAlertConfig(
  input: MarketPriceAlertConfigInput,
): Promise<MarketPriceAlertConfigStatus> {
  const current = await getMarketPriceAlertConfig();
  const next = { ...current };

  if (input.clearTelegram) {
    next.telegramBotToken = "";
    next.telegramChatId = "";
  } else {
    const token = input.telegramBotToken?.trim();
    const chatId = input.telegramChatId?.trim();
    if (token) next.telegramBotToken = token;
    if (chatId !== undefined) next.telegramChatId = chatId;
  }

  if (input.clearEmail) {
    next.resendApiKey = "";
    next.emailRecipient = "";
    next.emailFrom = "";
  } else {
    const apiKey = input.resendApiKey?.trim();
    const recipient = input.emailRecipient?.trim();
    const sender = input.emailFrom?.trim();
    if (apiKey) next.resendApiKey = apiKey;
    if (recipient !== undefined) next.emailRecipient = recipient;
    if (sender !== undefined) next.emailFrom = sender;
  }

  await persistCiphertext(await encrypt(next));
  return {
    telegramConfigured: Boolean(next.telegramBotToken && next.telegramChatId),
    telegramChatId: next.telegramChatId,
    emailConfigured: Boolean(next.resendApiKey && next.emailRecipient && next.emailFrom),
    emailRecipient: next.emailRecipient,
    emailFrom: next.emailFrom,
  };
}
