import { NextResponse } from "next/server";
import {
  CheckoutOrderError,
  createPendingWooOrder,
} from "../../../lib/checkout-woocommerce";
import {
  AqayePardakhtError,
  createAqayePardakhtPayment,
  isAqayePardakhtConfigured,
} from "../../../lib/aqayepardakht-v3";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idempotencyKey = body?.idempotencyKey;
    const order = await createPendingWooOrder({
      idempotencyKey,
      fullName: body?.fullName,
      phone: body?.phone,
      customerType: body?.customerType,
      note: body?.note,
      lines: body?.lines,
    });

    if (!isAqayePardakhtConfigured()) {
      return NextResponse.json(
        { ok: true, order, payment: null, paymentConfigured: false },
        {
          status: order.existing ? 200 : 201,
          headers: { "cache-control": "no-store" },
        },
      );
    }

    try {
      const payment = await createAqayePardakhtPayment({
        orderId: order.id,
        idempotencyKey,
      });

      return NextResponse.json(
        {
          ok: true,
          order,
          payment: { url: payment.url },
          paymentConfigured: true,
        },
        {
          status: order.existing ? 200 : 201,
          headers: { "cache-control": "no-store" },
        },
      );
    } catch (error) {
      const paymentError =
        error instanceof AqayePardakhtError
          ? error
          : new AqayePardakhtError(
              "سفارش ثبت شد، اما اتصال به درگاه کامل نشد. دوباره تلاش کنید.",
              502,
              "payment_start_failed",
            );

      console.error("[checkout-order] payment start failed", {
        orderId: order.id,
        code: paymentError.code,
        status: paymentError.status,
        message: paymentError.message,
      });

      return NextResponse.json(
        {
          ok: false,
          order,
          error: {
            code: paymentError.code,
            message: `سفارش #${order.number} ثبت شد، اما اتصال به درگاه کامل نشد. با زدن دوباره دکمه پرداخت، سفارش تکراری ساخته نمی‌شود.`,
          },
        },
        {
          status: paymentError.status,
          headers: { "cache-control": "no-store" },
        },
      );
    }
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
