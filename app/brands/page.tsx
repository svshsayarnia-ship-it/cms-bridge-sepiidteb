import Link from "next/link";

import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon } from "../components/Icons";
import { ProductCard } from "../components/ProductCard";
import { getBrandPageForLabel } from "../content-architecture";
import { getStorefrontCatalog } from "../lib/storefront-catalog";
import { getCompactBrandLabel } from "../lib/public-copy";
import { buildSeoMetadata } from "../lib/seo";

export const revalidate = 300;

export const metadata = buildSeoMetadata({
  title: "برندهای محصولات زیبایی",
  description:
    "محصولات هر برند را جدا ببینید و مدل، حجم و اطلاعات بسته را راحت‌تر مقایسه کنید.",
  path: "/brands",
  imageAlt: "برندهای محصولات حرفه‌ای زیبایی",
});

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

  const productsByBrand = new Map<
    string,
    typeof products
  >();

  for (const product of products) {
    const brand = getCompactBrandLabel(
      product.brand,
    );

    if (!brand) continue;

    productsByBrand.set(brand, [
      ...(productsByBrand.get(brand) ?? []),
      product,
    ]);
  }

  const brands = Array.from(
    productsByBrand.entries(),
  )
    .sort(([first], [second]) =>
      first.localeCompare(second, "en"),
    )
    .map(([brand, brandProducts], index) => ({
      name: brand,
      anchor: createBrandAnchor(
        brand,
        index,
      ),
      products: brandProducts,
      page: getBrandPageForLabel(brand),
    }));

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
            فهرست برندها
          </span>

          <h1>
            برندهای محصولات زیبایی
          </h1>

          <p>
            محصولات هر برند را جدا ببینید و بعد مدل، حجم و تعداد داخل بسته را
            با هم مقایسه کنید.
          </p>

          {brands.length > 0 && (
            <nav aria-label="فهرست برندها">
              {brands.map((brand) => (
                brand.page &&
                brand.products.length >= brand.page.minProductCount ? (
                  <Link
                    href={`/brands/${brand.page.slug}`}
                    key={brand.name}
                  >
                    {brand.name}
                  </Link>
                ) : (
                  <a
                    href={`#${brand.anchor}`}
                    key={brand.name}
                  >
                    {brand.name}
                  </a>
                )
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

                    {brand.page &&
                    brand.products.length >= brand.page.minProductCount ? (
                      <Link href={`/brands/${brand.page.slug}`}>
                        دیدن صفحه برند
                        <ArrowIcon />
                      </Link>
                    ) : firstProduct ? (
                      <Link
                        href={`/shop/${firstProduct.category}`}
                      >
                        دیدن گروه محصول
                        <ArrowIcon />
                      </Link>
                    ) : null}
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
                هنوز برندی برای نمایش ثبت نشده است.
              </h2>

              <p>
                بعد از انتشار نخستین محصول، فهرست برندها اینجا دیده می‌شود.
              </p>

              <Link
                className="sb-text-link"
                href="/shop"
              >
                دیدن همه محصولات
                <ArrowIcon />
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
