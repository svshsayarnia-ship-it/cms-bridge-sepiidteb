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
  title: "برندهای محصولات حرفه‌ای زیبایی",
  description:
    "برندهای موجود در سپید بیوتی را ببینید و مدل‌ها، حجم‌ها و قیمت محصولات هر برند را کنار هم مقایسه کنید.",
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
  const { products } = await getStorefrontCatalog();

  const productsByBrand = new Map<string, typeof products>();

  for (const product of products) {
    const brand = getCompactBrandLabel(product.brand);

    if (!brand) continue;

    productsByBrand.set(brand, [
      ...(productsByBrand.get(brand) ?? []),
      product,
    ]);
  }

  const brands = Array.from(productsByBrand.entries())
    .sort(([first], [second]) =>
      first.localeCompare(second, "en"),
    )
    .map(([brand, brandProducts], index) => ({
      name: brand,
      anchor: createBrandAnchor(brand, index),
      products: brandProducts,
      page: getBrandPageForLabel(brand),
    }));

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "برندها" }]} />
      </div>

      <section className="sb-page-hero sb-brands-hero">
        <div className="sb-shell">
          <span className="sb-eyebrow">فهرست برندها</span>

          <h1>محصولات را برندبه‌برند مقایسه کنید.</h1>

          <p>
            اگر نام برند را می‌دانید اما بین مدل‌هایش مردد هستید، از همین‌جا شروع کنید. محصولات هر برند جدا شده‌اند تا حجم، نوع بسته و قیمت مدل‌ها را کنار هم ببینید.
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
                  <a href={`#${brand.anchor}`} key={brand.name}>
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
              const firstProduct = brand.products[0];

              return (
                <section id={brand.anchor} key={brand.name}>
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
                      <p>{brand.products.length} محصول برای مقایسه</p>
                    </div>

                    {brand.page &&
                    brand.products.length >= brand.page.minProductCount ? (
                      <Link href={`/brands/${brand.page.slug}`}>
                        دیدن همه مدل‌ها
                        <ArrowIcon />
                      </Link>
                    ) : firstProduct ? (
                      <Link href={`/shop/${firstProduct.category}`}>
                        دیدن دسته مرتبط
                        <ArrowIcon />
                      </Link>
                    ) : null}
                  </header>

                  <div className="sb-product-grid sb-product-grid--three">
                    {brand.products.map((product) => (
                      <ProductCard
                        product={product}
                        key={product.slug}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="sb-catalog__empty">
              <span>۰ برند</span>
              <h2>هنوز محصولی برای نمایش در بخش برندها نداریم.</h2>
              <p>به محض اضافه‌شدن محصولات، برندها در همین بخش قابل مقایسه خواهند بود.</p>
              <Link className="sb-text-link" href="/shop">
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
