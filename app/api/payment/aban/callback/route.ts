import { NextResponse } from "next/server";
import {
  AbanGatewayError,
  getStoredAbanInvoiceId,
  parseAbanWebhook,
  verifyAbanInvoice,
  verifyAbanWebhookSignature,
} from "../../../../lib/aban-gateway";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resultUrl(params: Record<string, string>) {
  const url = new URL("https://sepiidbeauty.ir/checkout/result");
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url;
}

function cleanInvoiceId(value: string | null | undefined) {
  const invoiceId = String(value ?? "").trim();
  return /^inv_[A-Za-z0-9_-]+$/.test(invoiceId) ? invoiceId : "";
}

function cleanOrderId(value: string | null | undefined) {
  const orderId = Number.parseInt(String(value ?? "").replace(/[^0-9]/g, ""), 10);
  return Number.isSafeInteger(orderId) && orderId > 0 ? orderId : 0;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  try {
    if (!verifyAbanWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { ok: false, error: "invalid_signature" },
        { status: 400, headers: { "cache-control": "no-store" } },
      );
    }

    const payload = parseAbanWebhook(rawBody);
    const headerEvent = request.headers.get("x-event") ?? "";
    if (headerEvent && payload.event && headerEvent !== payload.event) {
      return NextResponse.json(
        { ok: false, error: "event_mismatch" },
        { status: 400, headers: { "cache-control": "no-store" } },
      );
    }

    if (payload.event !== "invoice.paid" || payload.status !== "paid") {
      return NextResponse.json(
        { ok: true, ignored: true },
        { status: 200, headers: { "cache-control": "no-store" } },
      );
    }

    const invoiceId = cleanInvoiceId(payload.invoice_id);
    const orderId = cleanOrderId(payload.order_id);
    if (!invoiceId || !orderId) {
      return NextResponse.json(
        { ok: false, error: "invalid_webhook_reference" },
        { status: 400, headers: { "cache-control": "no-store" } },
      );
    }

    const result = await verifyAbanInvoice({ invoiceId, orderId });

    return NextResponse.json(
      {
        ok: true,
        orderId: result.orderId,
        invoiceId: result.invoiceId,
        alreadyVerified: result.alreadyVerified,
      },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    const gatewayError =
      error instanceof AbanGatewayError
        ? error
        : new AbanGatewayError(
            "پردازش وبهوک آبان کامل نشد.",
            500,
            "webhook_processing_failed",
          );

    console.error("[aban-webhook] processing failed", {
      code: gatewayError.code,
      status: gatewayError.status,
      message: gatewayError.message,
    });

    return NextResponse.json(
      { ok: false, error: gatewayError.code },
      {
        status: gatewayError.status >= 500 ? 502 : gatewayError.status,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  let invoiceId = cleanInvoiceId(
    url.searchParams.get("invoice_id") || url.searchParams.get("invoice"),
  );
  const orderId = cleanOrderId(
    url.searchParams.get("order_id") || url.searchParams.get("order"),
  );

  if (!invoiceId && orderId) {
    try {
      invoiceId = await getStoredAbanInvoiceId(orderId);
    } catch {
      // The verified redirect below will show a safe generic error.
    }
  }

  if (!invoiceId || !orderId) {
    return NextResponse.redirect(
      resultUrl({
        status: "error",
        order: orderId ? String(orderId) : "",
        reason: "invalid_return",
      }),
      303,
    );
  }

  try {
    const result = await verifyAbanInvoice({ invoiceId, orderId });
    return NextResponse.redirect(
      resultUrl({
        status: "success",
        order: String(result.orderId),
        transaction: result.invoiceId,
      }),
      303,
    );
  } catch (error) {
    const gatewayError =
      error instanceof AbanGatewayError
        ? error
        : new AbanGatewayError(
            "تأیید پرداخت آبان کامل نشد.",
            500,
            "return_verification_failed",
          );

    console.error("[aban-return] verification failed", {
      orderId,
      invoiceId,
      code: gatewayError.code,
      status: gatewayError.status,
      message: gatewayError.message,
    });

    return NextResponse.redirect(
      resultUrl({
        status: "error",
        order: String(orderId),
        reason: gatewayError.code,
      }),
      303,
    );
  }
}
