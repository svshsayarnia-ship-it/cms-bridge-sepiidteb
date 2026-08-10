import { cookies } from "next/headers";

export const CUSTOMER_SESSION_COOKIE = "sepiid_customer_session";
const CUSTOMER_SESSION_TTL_SECONDS = 60 * 60 * 24;

type CookieWriter = {
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
  delete: (name: string) => void;
};

type CustomerSessionPayload = {
  v: 1;
  userId: number;
  issuedAt: number;
};

export type CustomerAuthorization =
  | { ok: true; userId: number }
  | { ok: false; status: 401 | 503; message: string };

export function isCustomerAuthConfigured(): boolean {
  return Boolean(customerSessionSecret());
}

export async function createCustomerSession(customerId: number): Promise<string> {
  if (!Number.isSafeInteger(customerId) || customerId <= 0) {
    throw new Error("Invalid customer id");
  }

  const payload: CustomerSessionPayload = {
    v: 1,
    userId: customerId,
    issuedAt: Math.floor(Date.now() / 1000),
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function setCustomerSessionCookie(
  cookiesStore: CookieWriter,
  token: string,
) {
  cookiesStore.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CUSTOMER_SESSION_TTL_SECONDS,
  });
}

export function clearCustomerSessionCookie(cookiesStore: CookieWriter) {
  cookiesStore.delete(CUSTOMER_SESSION_COOKIE);
}

export async function authorizeCustomerRequest(
  request?: Request,
): Promise<CustomerAuthorization> {
  if (!isCustomerAuthConfigured()) {
    return {
      ok: false,
      status: 503,
      message: "نشست امن حساب مشتریان هنوز روی سرور تنظیم نشده است.",
    };
  }

  const token = await readSessionToken(request);
  const payload = token ? await verifyCustomerSession(token) : null;
  if (!payload) {
    return { ok: false, status: 401, message: "برای مشاهده حساب ابتدا وارد شو." };
  }

  return { ok: true, userId: payload.userId };
}

export function customerSessionErrorResponse(
  authorization: Extract<CustomerAuthorization, { ok: false }>,
) {
  return Response.json(
    { error: authorization.message },
    {
      status: authorization.status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export function clientIpFromRequest(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const candidate = forwarded || realIp;
  if (!candidate || candidate.length > 64) return undefined;
  return candidate;
}

export function isTrustedAccountMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function readSessionToken(request?: Request): Promise<string | null> {
  if (request) return cookieFromHeader(request.headers.get("cookie") ?? "");

  const requestCookies = await cookies();
  return requestCookies.get(CUSTOMER_SESSION_COOKIE)?.value ?? null;
}

function cookieFromHeader(cookieHeader: string): string | null {
  return (
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${CUSTOMER_SESSION_COOKIE}=`))
      ?.slice(CUSTOMER_SESSION_COOKIE.length + 1) ?? null
  );
}

async function verifyCustomerSession(
  token: string,
): Promise<CustomerSessionPayload | null> {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  let payload: CustomerSessionPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload)) as CustomerSessionPayload;
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (
    payload.v !== 1 ||
    !Number.isSafeInteger(payload.userId) ||
    payload.userId <= 0 ||
    !Number.isFinite(payload.issuedAt) ||
    payload.issuedAt > now ||
    now - payload.issuedAt > CUSTOMER_SESSION_TTL_SECONDS
  ) {
    return null;
  }

  const expected = await sign(encodedPayload);
  return constantTimeEqual(signature, expected) ? payload : null;
}

async function sign(payload: string): Promise<string> {
  const secret = customerSessionSecret();
  if (!secret) throw new Error("Customer session secret is not configured");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`sepiid-customer-session:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return base64Url(signature);
}

function customerSessionSecret(): string {
  const dedicated = (process.env.CUSTOMER_SESSION_SECRET ?? "").trim();
  if (dedicated) return dedicated;

  const cmsSecret = (process.env.CMS_SESSION_SECRET ?? "").trim();
  if (cmsSecret) return cmsSecret;

  if (process.env.NODE_ENV !== "production") {
    return "sepiid-customer-development-session";
  }

  return "";
}

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function base64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return diff === 0;
}
