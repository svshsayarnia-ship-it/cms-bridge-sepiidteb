import { NextResponse } from "next/server";
import {
  CheckoutOrderError,
  createPendingWooOrder,
} from "../../../lib/checkout-woocommerce";
import {
  AbanGatewayError,
  createAbanPayment,
  isAbanConfigured,
} from "../../../lib/aban-gateway";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const startedAt = performance.now();
  try {
    const body = await request.json();
    const idempotencyKey = body?.idempotencyKey;
    const checkoutOrder = await createPendingWooOrder({
      idempotencyKey,
      retry: body?.retry === true,
      expectedSubtotal: body?.expectedSubtotal,
      fullName: body?.fullName,
      phone: body?.phone,
      customerType: body?.customerType,
      note: body?.note,
      lines: body?.lines,
    });
    const commerceMs = Math.round(performance.now() - startedAt);
    const { __wooOrder, ...order } = checkoutOrder;

    // Aban is the only transactional gateway for the storefront.
    // Never silently fall back to a legacy provider when Aban is unavailable.
    if (!isAbanConfigured()) {
      console.error("[checkout-order] Aban API token is not configured", {
        orderId: order.id,
      });

      return NextResponse.json(
        {
          ok: false,
          order,
          error: {
            code: "gateway_not_configured",
            message:
              "سفارش #" +
              order.number +
              " ثبت شد، اما اتصال آبان روی سرور کامل نیست. سفارش تکراری ساخته نمی‌شود.",
          },
        },
        {
          status: 503,
          headers: { "cache-control": "no-store" },
        },
      );
    }

    try {
      const payment = await createAbanPayment({
        orderId: order.id,
        idempotencyKey,
        orderSnapshot: __wooOrder,
      });

      const totalMs = Math.round(performance.now() - startedAt);
      const gatewayMs = totalMs - commerceMs;
      console.info("[checkout-order] timings", { commerceMs, gatewayMs, totalMs });
      return NextResponse.json(
        {
          ok: true,
          order,
          payment: {
            url: payment.url,
            invoiceId: payment.invoiceId,
            payableRial: payment.payableRial,
            provider: "aban",
          },
          paymentConfigured: true,
        },
        {
          status: order.existing ? 200 : 201,
          headers: { "cache-control": "no-store", "server-timing": `commerce;dur=${commerceMs}, gateway;dur=${gatewayMs}` },
        },
      );
    } catch (error) {
      const paymentError =
        error instanceof AbanGatewayError
          ? error
          : new AbanGatewayError(
              "اتصال به آبان کامل نشد. دوباره تلاش کنید.",
              502,
              "payment_start_failed",
            );

      console.error("[checkout-order] Aban payment start failed", {
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
            message:
              "سفارش #" +
              order.number +
              " ثبت شد، اما " +
              paymentError.message +
              " با زدن دوباره دکمه پرداخت، سفارش تکراری ساخته نمی‌شود.",
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
