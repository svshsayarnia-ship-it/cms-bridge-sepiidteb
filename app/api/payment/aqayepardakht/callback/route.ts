import { NextResponse } from "next/server";
import {
  AqayePardakhtError,
  verifyAqayePardakhtCallback,
} from "../../../../lib/aqayepardakht";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resultUrl(params: Record<string, string>) {
  const url = new URL("https://sepiidbeauty.ir/checkout/result");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const transid = url.searchParams.get("transid") ?? "";
  const invoiceId = url.searchParams.get("invoice_id") ?? "";
  const status = url.searchParams.get("status") ?? "0";

  try {
    const result = await verifyAqayePardakhtCallback({
      transid,
      invoiceId,
      status,
      trackingNumber: url.searchParams.get("tracking_number") ?? "",
      cardNumber: url.searchParams.get("cardnumber") ?? "",
      bank: url.searchParams.get("bank") ?? "",
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
