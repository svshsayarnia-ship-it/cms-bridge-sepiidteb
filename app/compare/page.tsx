import type { Metadata } from "next";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { CompareClient } from "./CompareClient";

export const metadata: Metadata = {
  title: "مقایسه محصولات | سپید بیوتی",
  description: "مقایسه مدل، حجم، بسته، ترکیبات، قیمت ثبت‌شده و وضعیت استعلام محصولات سپید بیوتی.",
  robots: { index: false, follow: true },
};

export default function ComparePage() {
  return (
    <main id="main-content" className="sb-compare-page">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "مقایسه محصولات" }]} />
        <CompareClient />
      </div>
    </main>
  );
}
