import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  clearCustomerSessionCookie,
  CustomerAuthError,
  customerAuthRequest,
  customerSessionCookieName,
  setCustomerSessionCookie,
  type CustomerUser,
} from "../../../../lib/customer-auth";

type Context = { params: Promise<{ action: string }> };
type AuthResult = {
  token?: string;
  user?: CustomerUser;
  message?: string;
  ok?: boolean;
  challenge?: string;
  expiresIn?: number;
  phoneProof?: string;
};

const JSON_HEADERS = {
  "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
  pragma: "no-cache",
};

export async function GET(request: NextRequest, context: Context) {
  const { action } = await context.params;
  if (action !== "session") return methodNotAllowed();

  const store = await cookies();
  const token = store.get(customerSessionCookieName())?.value ?? null;
  if (!token) return jsonError("برای ادامه باید وارد حساب شوی.", 401, "auth_required");

  try {
    const result = await customerAuthRequest<AuthResult>("session", {
      token,
      userAgent: request.headers.get("user-agent"),
    });
    return Response.json({ user: result.user }, { headers: JSON_HEADERS });
  } catch (error) {
    if (error instanceof CustomerAuthError && error.status === 401) {
      clearCustomerSessionCookie(store);
    }
    return authErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  if (!isTrustedMutation(request)) return jsonError("درخواست نامعتبر است.", 403, "invalid_origin");

  const { action } = await context.params;
  if (
    !new Set([
      "register",
      "logout",
      "otp-request",
      "otp-verify",
      "password-request",
      "password-reset",
    ]).has(action)
  ) {
    return methodNotAllowed();
  }

  const store = await cookies();
  const token = store.get(customerSessionCookieName())?.value ?? null;

  try {
    if (action === "logout") {
      if (token) {
        try {
          await customerAuthRequest<AuthResult>("logout", {
            method: "POST",
            token,
            body: { all: false },
            userAgent: request.headers.get("user-agent"),
          });
        } catch (error) {
          if (!(error instanceof CustomerAuthError && error.status === 401)) throw error;
        }
      }
      clearCustomerSessionCookie(store);
      return Response.json({ ok: true }, { headers: JSON_HEADERS });
    }

    const input = await readJsonObject(request);
    if (!input) return jsonError("بدنه درخواست معتبر نیست.", 400, "invalid_json");

    if (action === "otp-request") {
      const result = await customerAuthRequest<AuthResult>("otp/request", {
        method: "POST",
        body: {
          phone: asString(input.phone),
          purpose: asString(input.purpose),
        },
        userAgent: request.headers.get("user-agent"),
      });
      return Response.json(
        {
          challenge: result.challenge,
          expiresIn: result.expiresIn,
          message: result.message,
        },
        { headers: JSON_HEADERS },
      );
    }

    if (action === "otp-verify") {
      const result = await customerAuthRequest<AuthResult>("otp/verify", {
        method: "POST",
        body: {
          challenge: asString(input.challenge),
          code: asString(input.code),
          purpose: asString(input.purpose),
        },
        userAgent: request.headers.get("user-agent"),
      });

      if (result.token && result.user) {
        setCustomerSessionCookie(store, result.token);
        return Response.json({ user: result.user }, { headers: JSON_HEADERS });
      }
      if (result.phoneProof) {
        return Response.json(
          { phoneProof: result.phoneProof, expiresIn: result.expiresIn },
          { headers: JSON_HEADERS },
        );
      }
      return jsonError("پاسخ تأیید کد کامل نیست.", 502, "invalid_otp_response");
    }

    if (action === "register") {
      const result = await customerAuthRequest<AuthResult>("register", {
        method: "POST",
        body: {
          email: asString(input.email),
          phone: asString(input.phone),
          fullName: asString(input.fullName),
          password: asString(input.password),
          city: asString(input.city),
          clinicName: asString(input.clinicName),
          accountType: asString(input.accountType),
          phoneProof: asString(input.phoneProof),
        },
        userAgent: request.headers.get("user-agent"),
      });
      if (!result.token || !result.user) return jsonError("پاسخ ثبت‌نام کامل نیست.", 502, "invalid_auth_response");
      setCustomerSessionCookie(store, result.token);
      return Response.json({ user: result.user }, { status: 201, headers: JSON_HEADERS });
    }

    if (action === "password-request") {
      const result = await customerAuthRequest<AuthResult>("password/request", {
        method: "POST",
        body: { identifier: asString(input.identifier) },
        userAgent: request.headers.get("user-agent"),
      });
      return Response.json({ message: result.message }, { headers: JSON_HEADERS });
    }

    const result = await customerAuthRequest<AuthResult>("password/reset", {
      method: "POST",
      body: {
        login: asString(input.login),
        key: asString(input.key),
        password: asString(input.password),
      },
      userAgent: request.headers.get("user-agent"),
    });
    clearCustomerSessionCookie(store);
    return Response.json({ message: result.message }, { headers: JSON_HEADERS });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  if (!isTrustedMutation(request)) return jsonError("درخواست نامعتبر است.", 403, "invalid_origin");

  const { action } = await context.params;
  if (action !== "profile") return methodNotAllowed();

  const store = await cookies();
  const token = store.get(customerSessionCookieName())?.value ?? null;
  if (!token) return jsonError("برای ادامه باید وارد حساب شوی.", 401, "auth_required");

  try {
    const input = await readJsonObject(request);
    if (!input) return jsonError("بدنه درخواست معتبر نیست.", 400, "invalid_json");

    const result = await customerAuthRequest<AuthResult>("profile", {
      method: "PATCH",
      token,
      body: {
        fullName: asString(input.fullName),
        phone: asString(input.phone),
        city: asString(input.city),
        clinicName: asString(input.clinicName),
        accountType: asString(input.accountType),
      },
      userAgent: request.headers.get("user-agent"),
    });
    return Response.json({ user: result.user }, { headers: JSON_HEADERS });
  } catch (error) {
    if (error instanceof CustomerAuthError && error.status === 401) {
      clearCustomerSessionCookie(store);
    }
    return authErrorResponse(error);
  }
}

function isTrustedMutation(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin === request.nextUrl.origin;
    } catch {
      return false;
    }
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  return !fetchSite || fetchSite === "same-origin";
}

async function readJsonObject(request: NextRequest): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 16_384) return null;

  try {
    const value = (await request.json()) as unknown;
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function asString(value: unknown) {
  return typeof value === "string" ? value.slice(0, 512) : "";
}

function authErrorResponse(error: unknown) {
  if (error instanceof CustomerAuthError) {
    return jsonError(error.message, error.status, error.code);
  }
  return jsonError("خطای غیرمنتظره در حساب کاربری رخ داد.", 500, "auth_internal_error");
}

function jsonError(message: string, status: number, code: string) {
  return Response.json({ error: message, code }, { status, headers: JSON_HEADERS });
}

function methodNotAllowed() {
  return jsonError("این عملیات پشتیبانی نمی‌شود.", 405, "method_not_allowed");
}
