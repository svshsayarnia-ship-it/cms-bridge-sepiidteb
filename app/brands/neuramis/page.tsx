import type { Metadata } from "next";

import DynamicBrandPage from "../[slug]/page";
import { buildSeoMetadata } from "../../lib/seo";

export const revalidate = 300;

export const metadata: Metadata = buildSeoMetadata({
  title: "خرید و قیمت فیلر نورامیس | مدل‌های Deep، Volume و Lido",
  description:
    "قیمت و مدل‌های فیلر نورامیس را بر اساس Deep، Volume و Lido، حجم و نوع بسته مقایسه کنید و پیش از سفارش مشخصات همان گزینه را ببینید.",
  path: "/brands/neuramis",
  imageAlt: "فیلر نورامیس؛ مدل‌ها و قیمت",
});

export default function NeuramisBrandPage() {
  return DynamicBrandPage({
    params: Promise.resolve({ slug: "neuramis" }),
  });
}
