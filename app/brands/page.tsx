import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon } from "../components/Icons";
import { ProductCard } from "../components/ProductCard";
import { products } from "../data";

export const metadata: Metadata = {
  title: "برندهای محصولات حرفه‌ای زیبایی",
  description:
    "نمایه برندهای موجود در Sepiid Beauty و دسترسی مستقیم به صفحات مستقل محصولات و دسته‌های مرتبط.",
  alternates: { canonical: "/brands" },
};

export default function BrandsPage() {
  const brands = Array.from(new Set(products.map((product) => product.brand)));

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "برندها" }]} />
      </div>
      <section className="sb-page-hero sb-brands-hero">
        <div className="sb-shell">
          <span className="sb-eyebrow">BRANDS / INDEX</span>
          <h1>برند، نقطه شروع شناخت است؛ نه پایان انتخاب.</h1>
          <p>
            محصولات هر برند را جدا ببینید و سپس مدل، گروه، اطلاعات بسته و نیاز
            حرفه‌ای را با هم تطبیق دهید.
          </p>
          <nav aria-label="فهرست برندها">
            {brands.map((brand) => (
              <a href={`#${brand.toLowerCase().replace(".", "")}`} key={brand}>
                {brand}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="sb-section sb-brand-directory">
        <div className="sb-shell">
          {brands.map((brand, index) => {
            const items = products.filter((product) => product.brand === brand);
            return (
              <section id={brand.toLowerCase().replace(".", "")} key={brand}>
                <header>
                  <span>۰{index + 1}</span>
                  <div>
                    <h2>{brand}</h2>
                    <p>{items.length} محصول در کاتالوگ فعلی</p>
                  </div>
                  <Link href={`/shop/${items[0].category}`}>
                    دسته مرتبط
                    <ArrowIcon />
                  </Link>
                </header>
                <div className="sb-product-grid sb-product-grid--three">
                  {items.map((product) => (
                    <ProductCard product={product} key={product.slug} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}

