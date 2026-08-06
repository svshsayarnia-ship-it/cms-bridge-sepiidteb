import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon } from "../components/Icons";
import { ProductCard } from "../components/ProductCard";
import { getStorefrontCatalog } from "../lib/storefront-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "برندهای محصولات حرفه‌ای زیبایی",
  description:
    "نمایه برندهای موجود در Sepiid Beauty و دسترسی مستقیم به صفحات مستقل محصولات و دسته‌های مرتبط.",
  alternates: {
    canonical: "/brands",
  },
};

function createBrandAnchor(
  brand: string,
  index: number,
): string {
  const normalized = brand
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return `brand-${index + 1}-${normalized || "item"}`;
}

export default async function BrandsPage() {
  const { products } =
    await getStorefrontCatalog();

  const brandNames = Array.from(
    new Set(
      products
        .map((product) => product.brand.trim())
        .filter(Boolean),
    ),
  ).sort((first, second) =>
    first.localeCompare(second, "fa"),
  );

  const brands = brandNames.map(
    (brand, index) => ({
      name: brand,
      anchor: createBrandAnchor(
        brand,
        index,
      ),
      products: products.filter(
        (product) =>
          product.brand === brand,
      ),
    }),
  );

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[{ label: "برندها" }]}
        />
      </div>

      <section className="sb-page-hero sb-brands-hero">
        <div className="sb-shell">
          <span className="sb-eyebrow">
            BRANDS / INDEX
          </span>

          <h1>
            برند، نقطه شروع شناخت است؛ نه پایان
            انتخاب.
          </h1>

          <p>
            محصولات هر برند را جدا ببینید و سپس
            مدل، گروه، اطلاعات بسته و نیاز
            حرفه‌ای را با هم تطبیق دهید.
          </p>

          {brands.length > 0 && (
            <nav aria-label="فهرست برندها">
              {brands.map((brand) => (
                <a
                  href={`#${brand.anchor}`}
                  key={brand.name}
                >
                  {brand.name}
                </a>
              ))}
            </nav>
          )}
        </div>
      </section>

      <section className="sb-section sb-brand-directory">
        <div className="sb-shell">
          {brands.length > 0 ? (
            brands.map((brand, index) => {
              const firstProduct =
                brand.products[0];

              return (
                <section
                  id={brand.anchor}
                  key={brand.name}
                >
                  <header>
                    <span>
                      {new Intl.NumberFormat(
                        "fa-IR",
                        {
                          minimumIntegerDigits: 2,
                          useGrouping: false,
                        },
                      ).format(index + 1)}
                    </span>

                    <div>
                      <h2>{brand.name}</h2>

                      <p>
                        {brand.products.length} محصول
                        در کاتالوگ فعلی
                      </p>
                    </div>

                    {firstProduct && (
                      <Link
                        href={`/shop/${firstProduct.category}`}
                      >
                        دسته مرتبط
                        <ArrowIcon />
                      </Link>
                    )}
                  </header>

                  <div className="sb-product-grid sb-product-grid--three">
                    {brand.products.map(
                      (product) => (
                        <ProductCard
                          product={product}
                          key={product.slug}
                        />
                      ),
                    )}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="sb-catalog__empty">
              <span>۰ برند</span>

              <h2>
                هنوز برند قابل نمایشی ثبت نشده است.
              </h2>

              <p>
                پس از ثبت اطلاعات برند محصولات در
                WooCommerce، نمایه برندها در این
                قسمت نمایش داده می‌شود.
              </p>

              <Link
                className="sb-text-link"
                href="/shop"
              >
                مشاهده همه محصولات
                <ArrowIcon />
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}