import { NextResponse } from "next/server";
import {
  AqayePardakhtError,
  verifyAqayePardakhtCallback,
} from "../../../../lib/aqayepardakht-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resultUrl(params: Record<string, string>) {
  const url = new URL("https://sepiidbeauty.ir/checkout/result");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

function pick(params: URLSearchParams, ...keys: string[]) {
  for (const key of keys) {
    const value = params.get(key);
    if (value) return value;
  }
  return "";
}

async function handleCallback(params: URLSearchParams) {
  const transid = pick(params, "transid", "tracking_code", "trace_code");
  const invoiceId = pick(params, "invoice_id", "order_id", "invoice");
  const status = pick(params, "status", "payment_status");

  try {
    const result = await verifyAqayePardakhtCallback({
      transid,
      invoiceId,
      status,
      trackingNumber: pick(params, "tracking_number", "reference_id", "ref_id"),
      cardNumber: pick(params, "cardnumber", "card_number", "card"),
      bank: pick(params, "bank", "bank_name"),
    });

    if (!result.ok) {
      return NextResponse.redirect(
        resultUrl({
          status: "failed",
          order: String(result.orderId),
          reason: result.reason,
        }),
        303,
      );
    }

    return NextResponse.redirect(
      resultUrl({
        status: "success",
        order: String(result.orderId),
        transaction: result.transid,
      }),
      303,
    );
  } catch (error) {
    const gatewayError =
      error instanceof AqayePardakhtError
        ? error
        : new AqayePardakhtError(
            "تأیید پرداخت کامل نشد.",
            500,
            "callback_verification_failed",
          );

    console.error("[aqayepardakht-callback] verification failed", {
      code: gatewayError.code,
      status: gatewayError.status,
      message: gatewayError.message,
    });

    return NextResponse.redirect(
      resultUrl({
        status: "error",
        order: invoiceId,
        reason: gatewayError.code,
      }),
      303,
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return handleCallback(new URLSearchParams(url.searchParams));
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const params = new URLSearchParams(url.searchParams);
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      for (const [key, value] of Object.entries(body ?? {})) {
        if (value !== undefined && value !== null) params.set(key, String(value));
      }
    } else {
      const form = await request.formData();
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") params.set(key, value);
      }
    }
  } catch {
    console.warn("[aqayepardakht-callback] callback body could not be parsed");
  }

  return handleCallback(params);
}
