import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { ArrowIcon } from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { ProductCard } from "../../components/ProductCard";
import { productHref } from "../../catalog";
import {
  concernTopics,
  getBrandEntries,
  guideTopics,
  toBrandSlug,
} from "../../lib/discovery-hubs";
import { getCompactBrandLabel } from "../../lib/public-copy";
import { buildSeoMetadata } from "../../lib/seo";
import { siteOrigin } from "../../lib/site-url";
import { getStorefrontCatalog } from "../../lib/storefront-catalog";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand: slug } = await params;
  const { products } = await getStorefrontCatalog();
  const brand = getBrandEntries(products).find((item) => item.slug === slug);

  if (!brand) return {};

  const firstProduct = products.find(
    (product) =>
      toBrandSlug(getCompactBrandLabel(product.brand)) === brand.slug,
  );

  return buildSeoMetadata({
    title: `${brand.label}؛ محصولات، مدل‌ها و راهنمای بررسی`,
    description: `محصولات برند ${brand.label} در سپید بیوتی؛ مرور مدل‌های موجود، دسته‌های مرتبط و مسیرهای بررسی پیش از خرید.`,
    path: `/brands/${brand.slug}`,
    image: firstProduct?.image,
    imageAlt: `محصولات برند ${brand.label}`,
  });
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand: slug } = await params;
  const { products } = await getStorefrontCatalog();
  const brand = getBrandEntries(products).find((item) => item.slug === slug);

  if (!brand) notFound();

  const items = products.filter(
    (product) =>
      toBrandSlug(getCompactBrandLabel(product.brand)) === brand.slug,
  );

  const categorySlugs = new Set(items.map((product) => product.category));
  const categories = Array.from(
    new Map(
      items.map((product) => [
        product.category,
        {
          slug: product.category,
          title: product.categoryTitle,
        },
      ]),
    ).values(),
  );

  const relatedGuides = guideTopics
    .filter((topic) =>
      topic.categorySlugs.some((category) => categorySlugs.has(category)),
    )
    .slice(0, 3);

  const relatedConcerns = concernTopics
    .filter((topic) =>
      topic.categorySlugs.some((category) => categorySlugs.has(category)),
    )
    .slice(0, 3);

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            { label: "برندها", href: "/brands" },
            { label: brand.label },
          ]}
        />
      </div>

      <section className="sb-page-hero sb-shop-hero">
        <div className="sb-shell sb-shop-hero__grid">
          <div>
            <span className="sb-eyebrow">BRAND / {brand.label}</span>
            <h1 dir="ltr">{brand.label}</h1>
            <p>
              این صفحه تمام محصولات فعلی {brand.label} را در یک مسیر مستقل جمع
              می‌کند. برای مقایسه، نام دقیق مدل، دسته، حجم و اطلاعات همان بسته را
              بررسی کنید؛ نام برند به‌تنهایی برای انتخاب کافی نیست.
            </p>
          </div>

          <div className="sb-shop-hero__stats">
            <div>
              <strong>{items.length}</strong>
              <span>محصول از این برند</span>
            </div>
            <div>
              <strong>{categories.length}</strong>
              <span>دسته مرتبط</span>
            </div>
            <Link href="/guides">
              راهنماهای انتخاب
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <div className="sb-subcategory-nav">
          <div className="sb-shell">
            <span>دسته‌های این برند:</span>
            {categories.map((category) => (
              <Link href={`/shop/${category.slug}`} key={category.slug}>
                {category.title}
              </Link>
            ))}
            <Link href="/brands">
              همه برندها
              <ArrowIcon />
            </Link>
          </div>
        </div>
      )}

      <section className="sb-section sb-catalog-section">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">PRODUCTS / {brand.label}</span>
              <h2>محصولات این برند</h2>
            </div>
            <p>هر محصول صفحه مستقل خود را برای بررسی مشخصات و استعلام دارد.</p>
          </div>

          <div className="sb-product-grid">
            {items.map((product) => (
              <ProductCard product={product} key={product.slug} />
            ))}
          </div>
        </div>
      </section>

      {(relatedGuides.length > 0 || relatedConcerns.length > 0) && (
        <section className="sb-section sb-guide-paths">
          <div className="sb-shell">
            <div className="sb-section-head">
              <div>
                <span className="sb-eyebrow">DISCOVER / NEXT</span>
                <h2>از برند به تصمیم درست‌تر برسید.</h2>
              </div>
              <p>برای ادامه، از راهنما یا مسئله واقعی کاربر وارد شوید.</p>
            </div>

            <div className="sb-guide-paths__grid">
              {relatedGuides.map((topic, index) => (
                <article key={topic.slug}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <small>{topic.eyebrow}</small>
                  <h3>{topic.title}</h3>
                  <p>{topic.description}</p>
                  <Link className="sb-text-link" href={`/guides/${topic.slug}`}>
                    باز کردن راهنما
                    <ArrowIcon />
                  </Link>
                </article>
              ))}

              {relatedConcerns.map((topic, index) => (
                <article key={topic.slug}>
                  <span>{String(index + relatedGuides.length + 1).padStart(2, "0")}</span>
                  <small>{topic.eyebrow}</small>
                  <h3>{topic.title}</h3>
                  <p>{topic.description}</p>
                  <Link className="sb-text-link" href={`/concerns/${topic.slug}`}>
                    مرور بر اساس نیاز
                    <ArrowIcon />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="sb-category-seo">
        <div className="sb-shell sb-category-seo__grid">
          <div>
            <span className="sb-eyebrow">BRAND CHECK / یادآوری</span>
            <h2>مدل دقیق را از روی همان بسته بخوانید.</h2>
          </div>
          <div>
            <p>
              یک برند می‌تواند چند مدل با حجم، ویژگی و جایگاه متفاوت داشته باشد.
              هنگام سفارش، نام کامل مدل و اطلاعات قابل مشاهده همان بسته را با صفحه
              محصول و استعلام موجودی تطبیق دهید.
            </p>
            <Link className="sb-text-link" href="/guides/clinic-product-authenticity">
              راهنمای اصالت و خرید کلینیکی
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `محصولات برند ${brand.label}`,
          url: `${siteOrigin}/brands/${brand.slug}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: items.length,
            itemListElement: items.map((product, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: product.nameFa,
              url: `${siteOrigin}${productHref(product)}`,
            })),
          },
        }}
      />
    </main>
  );
}
