import type { Metadata } from "next";
import { verifyPaymentResultView } from "../../lib/payment-result";
import { PaymentResultClient } from "./PaymentResultClient";

export const metadata: Metadata = {
  title: "نتیجه پرداخت | سپید بیوتی",
  description: "نتیجه پرداخت سفارش سپید بیوتی.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function PaymentResultPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawStatus = first(params.status);
  const rawOrder = first(params.order).replace(/[^0-9]/g, "").slice(0, 20);
  const rawTransaction = first(params.transaction).replace(/[^0-9A-Za-z_-]/g, "").slice(0, 200);

  let status: "success" | "failed" | "error" =
    rawStatus === "failed" ? "failed" : "error";
  let order = rawOrder;
  let transaction: string | undefined;

  if (rawStatus === "success" && rawOrder && rawTransaction) {
    try {
      const verified = await verifyPaymentResultView({
        orderId: Number.parseInt(rawOrder, 10),
        transid: rawTransaction,
      });

      if (verified) {
        status = "success";
        order = verified.orderNumber;
        transaction = verified.transid;
      }
    } catch (error) {
      console.error("[payment-result] verification lookup failed", {
        orderId: rawOrder,
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  return (
    <PaymentResultClient
      status={status}
      order={order}
      transaction={transaction}
    />
  );
}
