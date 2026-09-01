import { cookies } from "next/headers";
import { getChatGPTUser, type ChatGPTUser } from "../chatgpt-auth";

export const CMS_SESSION_COOKIE = "sepiid_cms_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type CmsUser = ChatGPTUser;

type CmsPasswordUser = {
  username: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  iterations: number;
  disabled?: boolean;
};

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
    const sessionUser = session ? await verifySessionToken(session) : null;
    if (sessionUser) {
      return {
        ok: true,
        user: sessionUser,
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

export async function createCmsSession(
  username: string,
  password: string,
): Promise<string | null> {
  if (!hasPasswordAuth()) return null;

  const normalizedUsername = normalizeUsername(username);
  const configuredUser = passwordUsers().find(
    (user) => normalizeUsername(user.username) === normalizedUsername && !user.disabled,
  );
  let authenticatedUser: CmsUser | null = null;

  if (configuredUser && (await verifyPassword(password, configuredUser))) {
    authenticatedUser = {
      email: `${configuredUser.username}@cms.sepiid.local`,
      displayName: configuredUser.displayName,
      fullName: configuredUser.displayName,
    };
  } else if (
    isLegacyAdminUsername(normalizedUsername) &&
    constantTimeEqual(password, process.env.CMS_ADMIN_PASSWORD ?? "")
  ) {
    const displayName = process.env.CMS_ADMIN_NAME ?? "مدیر سپید";
    authenticatedUser = {
      email: process.env.CMS_ADMIN_USER ?? "admin@sepiid.local",
      displayName,
      fullName: displayName,
    };
  }

  if (!authenticatedUser) return null;

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = base64UrlText(JSON.stringify({
    issuedAt,
    username: normalizedUsername,
    email: authenticatedUser.email,
    displayName: authenticatedUser.displayName,
  }));
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
  return Boolean(
    (process.env.CMS_ADMIN_PASSWORD ?? "").trim() || passwordUsers().length,
  );
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

async function verifySessionToken(token: string): Promise<CmsUser | null> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  if (!constantTimeEqual(signature, await sign(payload))) return null;

  // Backward compatibility for sessions issued before multi-user login.
  if (/^\d+$/u.test(payload)) {
    const issuedAt = Number(payload);
    if (!isFreshSession(issuedAt)) return null;
    const displayName = process.env.CMS_ADMIN_NAME ?? "مدیر سپید";
    return {
      email: process.env.CMS_ADMIN_USER ?? "admin@sepiid.local",
      displayName,
      fullName: displayName,
    };
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as {
      issuedAt?: unknown;
      username?: unknown;
      email?: unknown;
      displayName?: unknown;
    };
    if (
      !isFreshSession(Number(parsed.issuedAt)) ||
      typeof parsed.email !== "string" ||
      typeof parsed.displayName !== "string"
    ) return null;
    if (typeof parsed.username === "string") {
      const account = passwordUsers().find(
        (user) => normalizeUsername(user.username) === normalizeUsername(parsed.username as string),
      );
      if (account?.disabled) return null;
      if (!account && !isLegacyAdminUsername(normalizeUsername(parsed.username))) return null;
    }
    return {
      email: parsed.email,
      displayName: parsed.displayName,
      fullName: parsed.displayName,
    };
  } catch {
    return null;
  }
}

function isFreshSession(issuedAt: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return Number.isFinite(issuedAt) && issuedAt <= now && now - issuedAt <= SESSION_TTL_SECONDS;
}

function normalizeUsername(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

function isLegacyAdminUsername(username: string): boolean {
  const configured = normalizeUsername(process.env.CMS_ADMIN_USER ?? "admin");
  return username === configured || username === "admin";
}

function passwordUsers(): CmsPasswordUser[] {
  const raw = (process.env.CMS_USERS_JSON ?? "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const user = item as Partial<CmsPasswordUser>;
      if (
        typeof user.username !== "string" || !user.username.trim() ||
        typeof user.displayName !== "string" || !user.displayName.trim() ||
        typeof user.passwordHash !== "string" || !user.passwordHash ||
        typeof user.salt !== "string" || !user.salt ||
        !Number.isSafeInteger(user.iterations) || Number(user.iterations) < 100_000
      ) return [];
      return [{
        username: user.username.trim(),
        displayName: user.displayName.trim(),
        passwordHash: user.passwordHash,
        salt: user.salt,
        iterations: Number(user.iterations),
        disabled: user.disabled === true,
      }];
    });
  } catch {
    return [];
  }
}

async function verifyPassword(password: string, user: CmsPasswordUser): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const result = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: fromBase64UrlBytes(user.salt),
      iterations: user.iterations,
    },
    key,
    256,
  );
  return constantTimeEqual(base64Url(result), user.passwordHash);
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

function base64UrlText(value: string): string {
  return base64Url(new TextEncoder().encode(value).buffer);
}

function fromBase64Url(value: string): string {
  return new TextDecoder().decode(fromBase64UrlBytes(value));
}

function fromBase64UrlBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
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
