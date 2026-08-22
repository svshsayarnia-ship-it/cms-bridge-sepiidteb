import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon } from "../components/Icons";
import { JsonLd } from "../components/JsonLd";
import { ShopCatalog } from "../components/ShopCatalog";
import {
  catalogGroups,
  productHref,
} from "../catalog";
import { getStorefrontCategories } from "../lib/storefront-categories";
import { getStorefrontCatalog } from "../lib/storefront-catalog";
import { siteOrigin } from "../lib/site-url";
import { buildSeoMetadata } from "../lib/seo";
import { toPublicProduct } from "../lib/public-product";

export const revalidate = 300;

export const metadata = buildSeoMetadata({
  title: "محصولات زیبایی و کلینیکی",
  description:
    "فیلر، بوتاکس، مزوژل و محصولات حرفه‌ای زیبایی را با نام، حجم، قیمت و راه خرید روشن ببینید.",
  path: "/shop",
  image: "/images/drive/category-fillers.webp",
  imageAlt: "فروشگاه محصولات تخصصی زیبایی",
});

export default async function ShopPage() {
  const [{ products }, categories] =
    await Promise.all([
      getStorefrontCatalog(),
      getStorefrontCategories(),
    ]);

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[{ label: "فروشگاه" }]}
        />
      </div>

      <section className="sb-page-hero sb-shop-hero">
        <div className="sb-shell sb-shop-hero__grid">
          <div>
            <span className="sb-eyebrow">
              همه محصولات
            </span>

            <h1>
              محصولتان را پیدا کنید
            </h1>

            <p>
              از دسته یا نام برند شروع کنید. در صفحه هر محصول، نام مدل،
              تصویر، حجم بسته و راه پرسیدن قیمت را یک‌جا می‌بینید.
            </p>
          </div>

          <div className="sb-shop-hero__stats">
            <div>
              <strong>{products.length}</strong>
              <span>محصول برای دیدن</span>
            </div>

            <div>
              <strong>{categories.length}</strong>
              <span>گروه محصول</span>
            </div>

            <Link href="/guides">
              اگر مردد هستید
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="sb-shop-groups"
        aria-label="مسیرهای اصلی کاتالوگ"
      >
        <div className="sb-shell">
          {catalogGroups.map(
            (group, index) => {
              const count = products.filter(
                (product) =>
                  group.categorySlugs.includes(
                    product.category,
                  ),
              ).length;

              return (
                <Link
                  href={`/shop/group/${group.slug}`}
                  key={group.slug}
                >
                  <span>۰{index + 1}</span>

                  <div>
                    <strong>
                      {group.title}
                    </strong>

                    <small>
                      {group.description}
                    </small>
                  </div>

                  <b>{count} محصول</b>

                  <ArrowIcon />
                </Link>
              );
            },
          )}
        </div>
      </section>

      <section className="sb-shop-categories">
        <div className="sb-shell sb-shop-categories__row">
          {categories.map((category) => {
            const count = products.filter(
              (product) =>
                product.category ===
                category.slug,
            ).length;

            return (
              <Link
                href={`/shop/${category.slug}`}
                key={category.slug}
              >
                <div
                  style={{
                    backgroundImage: `url(${category.image})`,
                    backgroundPosition: `${category.position} center`,
                  }}
                />

                <span>{category.title}</span>

                <small>
                  {count} محصول
                </small>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="sb-section sb-catalog-section">
  <div className="sb-shell">
    <ShopCatalog
      items={products.map(toPublicProduct)}
      categoryOptions={categories}
    />
  </div>
</section>

      <section className="sb-category-seo">
        <div className="sb-shell sb-category-seo__grid">
          <div>
            <span className="sb-eyebrow">
          چطور از فروشگاه استفاده کنیم؟
            </span>

            <h2>
              از نام کامل مدل شروع کنید.
            </h2>
          </div>

          <div>
            <p>
              عنوان دسته فقط شروع کار است. نام مدل، حجم و تعداد داخل بسته را
              با هم بخوانید تا دو محصول متفاوت را اشتباهی مقایسه نکنید.
            </p>

            <p>
              اگر قیمت یا موجودی زود تغییر کند، قیمت روز و وضعیت همان مدل را
              از ما بپرسید. عدد حدسی به درد خرید نمی‌خورد.
            </p>
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "فروشگاه Sepiid Beauty",
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: products.length,
            itemListElement: products.map(
              (product, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: `${siteOrigin}${productHref(
                  product,
                )}`,
                name: product.nameFa,
              }),
            ),
          },
        }}
      />
    </main>
  );
}
