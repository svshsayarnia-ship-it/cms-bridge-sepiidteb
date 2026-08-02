import { cookies } from "next/headers";
import { getChatGPTUser, type ChatGPTUser } from "../chatgpt-auth";

export const CMS_SESSION_COOKIE = "sepiid_cms_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type CmsUser = ChatGPTUser;

type CmsAuthorization =
  | { ok: true; user: CmsUser }
  | { ok: false; status: 401 | 403 | 503; message: string };

type CookieWriter = {
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
  delete: (name: string) => void;
};

function allowedEmails(): string[] {
  return (process.env.CMS_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isCmsConfigured(): boolean {
  return isPasswordAuthReady() || (!hasPasswordAuth() && allowedEmails().length > 0);
}

export function isCmsEmailAllowed(email: string): boolean {
  return allowedEmails().includes(email.trim().toLowerCase());
}

export async function authorizeCmsRequest(
  request?: Request,
): Promise<CmsAuthorization> {
  if (!isCmsConfigured()) {
    return {
      ok: false,
      status: 503,
      message:
        "ورود CMS هنوز تنظیم نشده است. CMS_ADMIN_PASSWORD و CMS_SESSION_SECRET را تنظیم کن.",
    };
  }

  if (hasPasswordAuth()) {
    const session = await readSessionToken(request);
    if (session && (await verifySessionToken(session))) {
      return {
        ok: true,
        user: {
          email: process.env.CMS_ADMIN_USER ?? "admin@sepiid.local",
          displayName: process.env.CMS_ADMIN_NAME ?? "مدیر سپید",
          fullName: process.env.CMS_ADMIN_NAME ?? null,
        },
      };
    }

    return { ok: false, status: 401, message: "برای ورود به CMS رمز لازم است." };
  }

  const headerEmail = request?.headers.get("oai-authenticated-user-email") ?? null;
  const authenticatedUser = headerEmail
    ? { email: headerEmail, displayName: headerEmail, fullName: null }
    : await getChatGPTUser();
  const developmentEmail =
    process.env.NODE_ENV !== "production"
      ? (process.env.CMS_DEV_EMAIL ?? "").trim()
      : "";
  const user =
    authenticatedUser ??
    (developmentEmail
      ? {
          email: developmentEmail,
          displayName: "مدیر محلی",
          fullName: null,
        }
      : null);

  if (!user) {
    return { ok: false, status: 401, message: "برای ورود به CMS احراز هویت لازم است." };
  }

  if (!isCmsEmailAllowed(user.email)) {
    return { ok: false, status: 403, message: "این حساب اجازه دسترسی به CMS را ندارد." };
  }

  return { ok: true, user };
}

export async function cmsApiGuard(request: Request): Promise<Response | null> {
  const authorization = await authorizeCmsRequest(request);
  if (authorization.ok) return null;

  return Response.json(
    { error: authorization.message },
    { status: authorization.status },
  );
}

export async function createCmsSession(password: string): Promise<string | null> {
  if (!hasPasswordAuth()) return null;
  if (!constantTimeEqual(password, process.env.CMS_ADMIN_PASSWORD ?? "")) return null;

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = String(issuedAt);
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export function setCmsSessionCookie(cookiesStore: CookieWriter, token: string) {
  cookiesStore.set(CMS_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearCmsSessionCookie(cookiesStore: CookieWriter) {
  cookiesStore.delete(CMS_SESSION_COOKIE);
}

function hasPasswordAuth(): boolean {
  return Boolean((process.env.CMS_ADMIN_PASSWORD ?? "").trim());
}

function isPasswordAuthReady(): boolean {
  if (!hasPasswordAuth()) return false;
  if (process.env.NODE_ENV !== "production") return true;
  return Boolean((process.env.CMS_SESSION_SECRET ?? "").trim());
}

async function readSessionToken(request?: Request): Promise<string | null> {
  if (request) return cookieFromHeader(request.headers.get("cookie") ?? "");

  const requestCookies = await cookies();
  return requestCookies.get(CMS_SESSION_COOKIE)?.value ?? null;
}

function cookieFromHeader(cookieHeader: string): string | null {
  return (
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${CMS_SESSION_COOKIE}=`))
      ?.slice(CMS_SESSION_COOKIE.length + 1) ?? null
  );
}

async function verifySessionToken(token: string): Promise<boolean> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const issuedAt = Number(payload);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(issuedAt) || issuedAt > now || now - issuedAt > SESSION_TTL_SECONDS) {
    return false;
  }

  return constantTimeEqual(signature, await sign(payload));
}

async function sign(payload: string): Promise<string> {
  const secret = sessionSecret();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64Url(signature);
}

function sessionSecret(): string {
  const configuredSecret = (process.env.CMS_SESSION_SECRET ?? "").trim();
  if (configuredSecret) return configuredSecret;

  if (process.env.NODE_ENV !== "production") {
    return `dev:${process.env.CMS_ADMIN_PASSWORD ?? ""}`;
  }

  return "";
}

function base64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
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
