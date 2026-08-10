export type CustomerType = "clinic" | "doctor" | "buyer" | "customer";

export type CustomerProfile = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  clinicName: string;
  city: string;
  customerType: CustomerType;
  dateCreated: string | null;
};

export type CustomerRegistrationInput = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  clinicName: string;
  city: string;
  customerType: CustomerType;
};

export type CustomerProfileUpdateInput = Pick<
  CustomerRegistrationInput,
  "fullName" | "clinicName" | "city" | "customerType"
>;

type CustomerBridgeResponse = {
  profile: CustomerProfile;
};

const CUSTOMER_TIMEOUT_MS = 15_000;

export class CustomerAccountError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "customer_account_error",
  ) {
    super(message);
  }
}

function config() {
  const storeUrl = (process.env.WORDPRESS_URL ?? "").trim().replace(/\/$/, "");
  const consumerKey = (process.env.WOOCOMMERCE_CONSUMER_KEY ?? "").trim();
  const consumerSecret = (process.env.WOOCOMMERCE_CONSUMER_SECRET ?? "").trim();

  if (!storeUrl || !consumerKey || !consumerSecret) {
    throw new CustomerAccountError(
      "اتصال حساب مشتریان به WooCommerce تنظیم نشده است.",
      503,
      "customer_store_not_configured",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(storeUrl);
  } catch {
    throw new CustomerAccountError(
      "آدرس WordPress معتبر نیست.",
      503,
      "invalid_store_url",
    );
  }

  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new CustomerAccountError(
      "اتصال حساب مشتریان باید روی HTTPS باشد.",
      503,
      "insecure_store_url",
    );
  }

  return { storeUrl, consumerKey, consumerSecret };
}

function bridgeUrl(path: string) {
  const { storeUrl, consumerKey, consumerSecret } = config();
  const url = new URL(
    `${storeUrl}/wp-json/wc/v3/sepiid-customer-auth/${path.replace(/^\//, "")}`,
  );

  if ((process.env.WOOCOMMERCE_AUTH_MODE ?? "basic") === "query") {
    url.searchParams.set("consumer_key", consumerKey);
    url.searchParams.set("consumer_secret", consumerSecret);
  }

  return url;
}

async function bridgeRequest<T>(
  path: string,
  options: RequestInit = {},
  clientIp?: string,
): Promise<T> {
  const { consumerKey, consumerSecret } = config();
  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");

  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if ((process.env.WOOCOMMERCE_AUTH_MODE ?? "basic") !== "query") {
    headers.set(
      "authorization",
      `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`,
    );
  }

  if (clientIp) headers.set("x-sepiid-client-ip", clientIp);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CUSTOMER_TIMEOUT_MS);

  try {
    const response = await fetch(bridgeUrl(path), {
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
        data = null;
      }
    }

    if (!response.ok) {
      const error = data as { message?: string; code?: string } | null;
      throw new CustomerAccountError(
        error?.message || "ارتباط با حساب کاربری انجام نشد.",
        response.status,
        error?.code,
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof CustomerAccountError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      throw new CustomerAccountError(
        "پاسخ WordPress برای حساب کاربری بیش از حد طول کشید.",
        504,
        "customer_store_timeout",
      );
    }

    throw new CustomerAccountError(
      "اتصال امن به WordPress برقرار نشد.",
      502,
      "customer_store_connection_failed",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function loginCustomer(
  identifier: string,
  password: string,
  clientIp?: string,
): Promise<CustomerProfile> {
  const response = await bridgeRequest<CustomerBridgeResponse>(
    "login",
    {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    },
    clientIp,
  );
  return response.profile;
}

export async function registerCustomer(
  input: CustomerRegistrationInput,
  clientIp?: string,
): Promise<CustomerProfile> {
  const response = await bridgeRequest<CustomerBridgeResponse>(
    "register",
    {
      method: "POST",
      body: JSON.stringify({
        full_name: input.fullName,
        email: input.email,
        phone: input.phone,
        password: input.password,
        clinic_name: input.clinicName,
        city: input.city,
        customer_type: input.customerType,
      }),
    },
    clientIp,
  );
  return response.profile;
}

export async function getCustomerProfile(
  customerId: number,
): Promise<CustomerProfile> {
  const response = await bridgeRequest<CustomerBridgeResponse>(
    `profile/${customerId}`,
  );
  return response.profile;
}

export async function updateCustomerProfile(
  customerId: number,
  input: CustomerProfileUpdateInput,
): Promise<CustomerProfile> {
  const response = await bridgeRequest<CustomerBridgeResponse>(
    `profile/${customerId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        full_name: input.fullName,
        clinic_name: input.clinicName,
        city: input.city,
        customer_type: input.customerType,
      }),
    },
  );
  return response.profile;
}

export function customerAccountErrorResponse(error: unknown): Response {
  if (error instanceof CustomerAccountError) {
    return Response.json(
      { error: error.message, code: error.code },
      {
        status: error.status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return Response.json(
    { error: "خطای پیش‌بینی‌نشده در حساب کاربری." },
    {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
