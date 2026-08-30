import type { Metadata } from "next";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "تکمیل سفارش | سپید بیوتی",
  description: "ثبت اطلاعات گیرنده، نشانی ارسال و انتخاب روش پرداخت سفارش سپید بیوتی.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
