import { NextResponse } from "next/server";
import {
  CheckoutOrderError,
  createPendingWooOrder,
} from "../../../lib/checkout-woocommerce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await createPendingWooOrder({
      idempotencyKey: body?.idempotencyKey,
      fullName: body?.fullName,
      phone: body?.phone,
      customerType: body?.customerType,
      note: body?.note,
      lines: body?.lines,
    });

    return NextResponse.json(
      { ok: true, order },
      {
        status: order.existing ? 200 : 201,
        headers: { "cache-control": "no-store" },
      },
    );
  } catch (error) {
    const checkoutError =
      error instanceof CheckoutOrderError
        ? error
        : new CheckoutOrderError(
            "ثبت سفارش کامل نشد. هیچ پرداختی انجام نشده است؛ دوباره تلاش کنید.",
            500,
            "order_creation_failed",
          );

    console.error("[checkout-order] create failed", {
      code: checkoutError.code,
      status: checkoutError.status,
      message: checkoutError.message,
    });

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: checkoutError.code,
          message: checkoutError.message,
        },
      },
      {
        status: checkoutError.status,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}
