import type { Metadata } from "next";
import { PaymentResultClient } from "./PaymentResultClient";

export const metadata: Metadata = {
  title: "نتیجه پرداخت | سپید بیوتی",
  description: "نتیجه پرداخت سفارش سپید بیوتی.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function PaymentResultPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawStatus = first(params.status);
  const status = rawStatus === "success" ? "success" : rawStatus === "failed" ? "failed" : "error";
  const order = first(params.order).replace(/[^0-9A-Za-z_-]/g, "").slice(0, 80);
  const transaction = first(params.transaction).replace(/[^0-9A-Za-z_-]/g, "").slice(0, 200);

  return (
    <PaymentResultClient
      status={status}
      order={order}
      transaction={transaction || undefined}
    />
  );
}
