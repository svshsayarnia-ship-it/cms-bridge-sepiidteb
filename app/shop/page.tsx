import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon } from "../components/Icons";
import { JsonLd } from "../components/JsonLd";
import { ShopCatalog } from "../components/ShopCatalog";
import { catalogGroups, productHref } from "../catalog";
import { categories, products } from "../data";
import { siteOrigin } from "../lib/site-url";

export const metadata: Metadata = {
  title: "فروشگاه محصولات تخصصی زیبایی",
  description:
    "مرور و استعلام ۶۱ محصول تخصصی زیبایی در هفت مسیر؛ از فیلر و اسکین‌بوستر تا بوتولینوم و کوکتل‌های حرفه‌ای.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "فروشگاه" }]} />
      </div>
      <section className="sb-page-hero sb-shop-hero">
        <div className="sb-shell sb-shop-hero__grid">
          <div>
            <span className="sb-eyebrow">SHOP / ALL PRODUCTS</span>
            <h1>فروشگاهی برای مقایسه؛ نه انتخاب عجولانه.</h1>
            <p>
              محصولات را با دسته، برند و سطح دسترسی فیلتر کنید. هر کارت به صفحه
              مستقلی می‌رسد که مشخصات، فرایند بررسی و مسیر استعلام را یک‌جا دارد.
            </p>
          </div>
          <div className="sb-shop-hero__stats">
            <div>
              <strong>{products.length}</strong>
              <span>صفحه محصول مستقل</span>
            </div>
            <div>
              <strong>{categories.length}</strong>
              <span>مسیر تخصصی</span>
            </div>
            <Link href="/guides">
              راهنمای انتخاب
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <section className="sb-shop-groups" aria-label="مسیرهای اصلی کاتالوگ">
        <div className="sb-shell">
          {catalogGroups.map((group, index) => {
            const count = products.filter((product) =>
              group.categorySlugs.includes(product.category),
            ).length;
            return (
              <Link href={`/shop/group/${group.slug}`} key={group.slug}>
                <span>۰{index + 1}</span>
                <div>
                  <strong>{group.title}</strong>
                  <small>{group.description}</small>
                </div>
                <b>{count} محصول</b>
                <ArrowIcon />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="sb-shop-categories">
        <div className="sb-shell sb-shop-categories__row">
          {categories.map((category) => (
            <Link href={`/shop/${category.slug}`} key={category.slug}>
              <div
                style={{
                  backgroundImage: `url(${category.image})`,
                  backgroundPosition: `${category.position} center`,
                }}
              />
              <span>{category.title}</span>
              <small>{products.filter((product) => product.category === category.slug).length} محصول</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="sb-section sb-catalog-section">
        <div className="sb-shell">
          <ShopCatalog items={products} />
        </div>
      </section>

      <section className="sb-category-seo">
        <div className="sb-shell sb-category-seo__grid">
          <div>
            <span className="sb-eyebrow">HOW TO USE / راهنما</span>
            <h2>اطلاعات درست را از صفحه محصول بگیرید.</h2>
          </div>
          <div>
            <p>
              عنوان دسته برای تصمیم نهایی کافی نیست. نام کامل محصول، اطلاعات
              سازنده، مشخصات بسته و نظر پزشک باید کنار هم دیده شوند.
            </p>
            <p>
              قیمت یا موجودی ساختگی نمایش نمی‌دهیم؛ هر مورد در زمان استعلام با
              اطلاعات قابل ارائه همان بسته اعلام می‌شود.
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
            itemListElement: products.map((product, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${siteOrigin}${productHref(product)}`,
              name: product.nameFa,
            })),
          },
        }}
      />
    </main>
  );
}
