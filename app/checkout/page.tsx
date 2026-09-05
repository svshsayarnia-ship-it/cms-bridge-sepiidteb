import type { Metadata } from "next";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "ارسال درخواست قیمت و موجودی | سپید بیوتی",
  description: "ارسال لیست محصولات برای استعلام قیمت و موجودی روز سپید بیوتی؛ بدون پرداخت در این مرحله.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
