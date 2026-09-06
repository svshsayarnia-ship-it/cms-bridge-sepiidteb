import type { Metadata } from "next";
import { TransactionalCheckoutClient } from "./TransactionalCheckoutClient";

export const metadata: Metadata = {
  title: "ثبت سفارش | سپید بیوتی",
  description: "ثبت امن سفارش سپید بیوتی با بررسی مجدد قیمت و موجودی و ذخیره سفارش پیش از مرحله پرداخت.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <TransactionalCheckoutClient />;
}
