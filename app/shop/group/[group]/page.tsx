/* eslint-disable @next/next/no-img-element -- local optimized Drive imagery */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { ArrowIcon } from "../../../components/Icons";
import { JsonLd } from "../../../components/JsonLd";
import { ProductCard } from "../../../components/ProductCard";
import {
  catalogGroups,
  getCatalogGroup,
  productHref,
} from "../../../catalog";
import { categories, products } from "../../../data";

export function generateStaticParams() {
  return catalogGroups.map((group) => ({ group: group.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string }>;
}): Promise<Metadata> {
  const { group: slug } = await params;
  const group = getCatalogGroup(slug);
  if (!group) return {};

  return {
    title: `${group.title}؛ دسته‌ها و محصولات`,
    description: group.description,
    alternates: { canonical: `/shop/group/${group.slug}` },
  };
}

export default async function ProductGroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group: slug } = await params;
  const group = getCatalogGroup(slug);
  if (!group) notFound();

  const childCategories = categories.filter((category) =>
    group.categorySlugs.includes(category.slug),
  );
  const groupProducts = products.filter((product) =>
    group.categorySlugs.includes(product.category),
  );

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            { label: "فروشگاه", href: "/shop" },
            { label: group.title },
          ]}
        />
      </div>

      <section className="sb-page-hero sb-group-hero">
        <div className="sb-shell">
          <span className="sb-eyebrow">{group.en}</span>
          <h1>{group.title}</h1>
          <p>{group.description}</p>
          <div className="sb-group-hero__stats">
            <span>{childCategories.length} مسیر تخصصی</span>
            <span>{groupProducts.length} صفحه محصول مستقل</span>
          </div>
        </div>
      </section>

      <section className="sb-section sb-group-categories">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">CATEGORY / PATHS</span>
              <h2>مسیر دقیق‌تر را انتخاب کنید.</h2>
            </div>
            <p>
              هر مسیر، فیلترها و توضیحات مخصوص خود را دارد؛ عنوان دسته جایگزین
              انتخاب حرفه‌ای نیست.
            </p>
          </div>
          <div className="sb-group-category-grid">
            {childCategories.map((category) => {
              const count = groupProducts.filter(
                (product) => product.category === category.slug,
              ).length;
              return (
                <Link href={`/shop/${category.slug}`} key={category.slug}>
                  <img
                    src={category.image}
                    alt={`تصویر مفهومی ${category.title}`}
                    width="1254"
                    height="1254"
                  />
                  <div>
                    <span>{count} محصول</span>
                    <h2>{category.title}</h2>
                    <p>{category.description}</p>
                    <strong>
                      ورود به دسته
                      <ArrowIcon />
                    </strong>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sb-section sb-group-products">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">PRODUCT / INDEX</span>
              <h2>نمونه‌هایی از این گروه</h2>
            </div>
            <Link className="sb-text-link" href="/shop">
              مشاهده کاتالوگ کامل
              <ArrowIcon />
            </Link>
          </div>
          <div className="sb-product-grid sb-product-grid--three">
            {groupProducts.slice(0, 9).map((product) => (
              <ProductCard product={product} key={product.slug} />
            ))}
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: group.title,
          description: group.description,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: groupProducts.length,
            itemListElement: groupProducts.map((product, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: product.nameFa,
              url: `https://sepiid-beauty-home.svshsayarnia.chatgpt.site${productHref(product)}`,
            })),
          },
        }}
      />
    </main>
  );
}
