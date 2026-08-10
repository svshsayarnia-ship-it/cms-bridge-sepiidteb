import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon } from "../components/Icons";
import { JsonLd } from "../components/JsonLd";
import { getBrandEntries, toBrandSlug } from "../lib/discovery-hubs";
import { getCompactBrandLabel } from "../lib/public-copy";
import { buildSeoMetadata } from "../lib/seo";
import { siteOrigin } from "../lib/site-url";
import { getStorefrontCatalog } from "../lib/storefront-catalog";

export const revalidate = 300;

export const metadata = buildSeoMetadata({
  title: "برندهای محصولات حرفه‌ای زیبایی",
  description:
    "نمایه برندهای موجود در Sepiid Beauty با صفحه مستقل برای هر برند، محصولات مرتبط و مسیرهای راهنمای خرید.",
  path: "/brands",
  image: "/images/editorial-detail.webp",
  imageAlt: "برندهای محصولات حرفه‌ای زیبایی",
});

export default async function BrandsPage() {
  const { products } = await getStorefrontCatalog();
  const brands = getBrandEntries(products).map((brand) => ({
    ...brand,
    count: products.filter(
      (product) =>
        toBrandSlug(getCompactBrandLabel(product.brand)) === brand.slug,
    ).length,
  }));

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "برندها" }]} />
      </div>

      <section className="sb-page-hero sb-brands-hero">
        <div className="sb-shell">
          <span className="sb-eyebrow">BRANDS / INDEX</span>
          <h1>هر برند، یک مسیر مستقل برای شناخت و مقایسه.</h1>
          <p>
            از این فهرست وارد صفحه هر برند شوید و فقط محصولات همان برند را مرور
            کنید. برای تصمیم خرید، مدل دقیق، حجم و اطلاعات همان بسته همچنان مهم‌تر
            از نام برند است.
          </p>
        </div>
      </section>

      <section className="sb-section sb-guide-paths">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">A–Z / BRANDS</span>
              <h2>برند موردنظر را انتخاب کنید.</h2>
            </div>
            <p>{brands.length} برند در کاتالوگ فعلی قابل مرور است.</p>
          </div>

          <div className="sb-guide-paths__grid">
            {brands.map((brand, index) => (
              <article key={brand.slug}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <small>BRAND</small>
                <h3 dir="ltr">{brand.label}</h3>
                <p>{brand.count} محصول از این برند در کاتالوگ فعلی دیده می‌شود.</p>
                <Link className="sb-text-link" href={`/brands/${brand.slug}`}>
                  مشاهده صفحه برند
                  <ArrowIcon />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sb-category-seo">
        <div className="sb-shell sb-category-seo__grid">
          <div>
            <span className="sb-eyebrow">HOW TO USE / برندها</span>
            <h2>نام برند، نقطه شروع است؛ نه پایان بررسی.</h2>
          </div>
          <div>
            <p>
              در خانواده‌های چندمدلی، نام برند به‌تنهایی مشخص نمی‌کند کدام محصول یا
              حجم مدنظر است. مدل دقیق، حجم، اطلاعات بسته و وضعیت موجودی را در صفحه
              محصول کنترل کنید.
            </p>
            <p>
              اگر هنوز نمی‌دانید کدام دسته را باید بررسی کنید، از راهنماهای موضوعی
              یا صفحات نیاز کاربر شروع کنید.
            </p>
            <Link className="sb-text-link" href="/concerns">
              مرور بر اساس نیاز و مسئله
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "برندهای Sepiid Beauty",
          url: `${siteOrigin}/brands`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: brands.length,
            itemListElement: brands.map((brand, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: brand.label,
              url: `${siteOrigin}/brands/${brand.slug}`,
            })),
          },
        }}
      />
    </main>
  );
}
