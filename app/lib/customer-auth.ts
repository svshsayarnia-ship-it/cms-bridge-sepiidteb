import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type CustomerUser = {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  clinicName: string;
  accountType: "customer" | "clinic" | "doctor" | "buyer" | string;
};

type CustomerAuthEnvelope = {
  token?: string;
  user?: CustomerUser;
  message?: string;
};

type AuthRequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  token?: string | null;
  userAgent?: string | null;
};

type CustomerAuthAction =
  | "register"
  | "login"
  | "session"
  | "logout"
  | "profile"
  | "otp/request"
  | "otp/verify"
  | "password/request"
  | "password/reset";

const CUSTOMER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const REQUEST_TIMEOUT_MS = 12_000;
const PROD_COOKIE = "__Host-sepiid_customer_session";
const DEV_COOKIE = "sepiid_customer_session";

export class CustomerAuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "customer_auth_error",
  ) {
    super(message);
  }
}

export function customerSessionCookieName() {
  return process.env.NODE_ENV === "production" ? PROD_COOKIE : DEV_COOKIE;
}

export function sanitizeReturnTo(value: string | null | undefined, fallback = "/account/profile") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;

  try {
    const parsed = new URL(value, "https://sepiid.local");
    if (parsed.origin !== "https://sepiid.local") return fallback;
    if (parsed.pathname.startsWith("/api/")) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export async function readCustomerSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(customerSessionCookieName())?.value ?? null;
}

export async function getCustomerUser(): Promise<CustomerUser | null> {
  const token = await readCustomerSessionToken();
  if (!token) return null;

  try {
    const result = await customerAuthRequest<CustomerAuthEnvelope>("session", { token });
    return result.user ?? null;
  } catch (error) {
    if (error instanceof CustomerAuthError && error.status === 401) return null;
    throw error;
  }
}

export async function requireCustomerUser(returnTo = "/account/profile"): Promise<CustomerUser> {
  const user = await getCustomerUser();
  if (user) return user;

  const safeReturnTo = sanitizeReturnTo(returnTo);
  redirect(`/account/login?return_to=${encodeURIComponent(safeReturnTo)}`);
}

export function setCustomerSessionCookie(
  store: Awaited<ReturnType<typeof cookies>>,
  token: string,
) {
  store.set(customerSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_SESSION_TTL_SECONDS,
    priority: "high",
  });
}

export function clearCustomerSessionCookie(store: Awaited<ReturnType<typeof cookies>>) {
  store.set(customerSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    priority: "high",
  });
}

export async function customerAuthRequest<T>(
  action: CustomerAuthAction,
  options: AuthRequestOptions = {},
): Promise<T> {
  const baseUrl = wordpressBaseUrl();
  const url = new URL(`${baseUrl}/wp-json/sepiid/v1/auth/${action}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers = new Headers({
    accept: "application/json",
    "cache-control": "no-store",
  });

  if (options.body !== undefined) headers.set("content-type", "application/json");
  if (options.token) headers.set("x-sepiid-session", options.token);
  if (options.userAgent) headers.set("user-agent", options.userAgent.slice(0, 512));

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });

    const raw = await response.text();
    let payload: unknown = null;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const error = payload as { code?: string; message?: string } | null;
      throw new CustomerAuthError(
        error?.message ?? "ارتباط امن با حساب کاربری انجام نشد.",
        response.status,
        error?.code,
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof CustomerAuthError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new CustomerAuthError("پاسخ سرویس حساب کاربری بیش از حد طول کشید.", 504, "customer_auth_timeout");
    }
    throw new CustomerAuthError("اتصال به سرویس حساب کاربری برقرار نشد.", 502, "customer_auth_unavailable");
  } finally {
    clearTimeout(timeout);
  }
}

function wordpressBaseUrl() {
  const configured = (process.env.WORDPRESS_URL ?? "").trim().replace(/\/$/, "");
  if (!configured) {
    throw new CustomerAuthError("سرویس حساب کاربری هنوز تنظیم نشده است.", 503, "customer_auth_not_configured");
  }

  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new CustomerAuthError("آدرس سرویس حساب کاربری معتبر نیست.", 503, "customer_auth_invalid_url");
  }

  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new CustomerAuthError("اتصال حساب کاربری باید امن باشد.", 503, "customer_auth_insecure_url");
  }

  return parsed.origin + parsed.pathname.replace(/\/$/, "");
}
