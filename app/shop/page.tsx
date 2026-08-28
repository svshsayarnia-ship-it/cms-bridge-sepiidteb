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

const groupDescriptions: Record<string, string> = {
  injectables:
    "فیلر، مزوژل، اسکین‌بوستر و فرآورده‌های بوتولینوم را جداگانه ببینید و مدل، حجم، بسته و قیمت را مقایسه کنید.",
  "mesotherapy-cocktails":
    "کوکتل‌های پوست، دور چشم و مو را بر اساس گروهشان ببینید تا سریع‌تر به محصولی که دنبالش هستید برسید.",
  "professional-support":
    "محصولات پشتیبان حرفه‌ای را با نام دقیق، قدرت درج‌شده و نوع بسته کنار هم ببینید.",
};

export const metadata = buildSeoMetadata({
  title: "فروشگاه سپید بیوتی | قیمت و مقایسه محصولات زیبایی",
  description:
    "فیلر، مزوژل، اسکین‌بوستر، بوتولینوم و کوکتل‌های تخصصی را با مدل، حجم، بسته‌بندی و قیمت مقایسه کنید.",
  path: "/shop",
  image: "/images/drive/category-fillers.webp",
  imageAlt: "فروشگاه محصولات تخصصی زیبایی سپید بیوتی",
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
              فروشگاه سپید بیوتی
            </span>

            <h1>فروشگاه سپید بیوتی</h1>

            <p>
              اسم محصول را می‌دانید؟ مستقیم جستجو کنید. اگر هنوز بین چند مدل مردد هستید، از دسته‌بندی شروع کنید و حجم، نوع بسته و قیمت گزینه‌ها را کنار هم ببینید.
            </p>
          </div>

          <div className="sb-shop-hero__stats">
            <div>
              <strong>{products.length}</strong>
              <span>محصول</span>
            </div>

            <div>
              <strong>{categories.length}</strong>
              <span>دسته محصول</span>
            </div>

            <Link href="/guides">
              برای انتخاب راهنما می‌خواهید؟
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="sb-shop-groups"
        aria-label="گروه‌های اصلی فروشگاه"
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
                    <strong>{group.title}</strong>

                    <small>
                      {groupDescriptions[group.slug] ?? group.description}
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
                product.category === category.slug,
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

                <small>{count} محصول</small>
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
              قبل از انتخاب
            </span>

            <h2>فقط اسم محصول را نبینید؛ مدل و بسته را هم چک کنید.</h2>
          </div>

          <div>
            <p>
              دو محصول با نام یا برند مشابه ممکن است حجم، تعداد سرنگ یا ویال و قیمت متفاوتی داشته باشند. صفحه محصول را باز کنید و همان مدلی را ببینید که قصد خریدش را دارید.
            </p>

            <p>
              ما قیمت، مدل و نوع بسته را تا جای ممکن کنار هم می‌آوریم تا قبل از پیام دادن یا سفارش، بدانید دقیقاً دارید چه چیزی را مقایسه می‌کنید.
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
                url: `${siteOrigin}${productHref(product)}`,
                name: product.nameFa,
              }),
            ),
          },
        }}
      />
    </main>
  );
}
