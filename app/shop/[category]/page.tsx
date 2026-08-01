import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { ArrowIcon } from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { ShopCatalog } from "../../components/ShopCatalog";
import { getGroupForCategory, productHref } from "../../catalog";
import { categories, getCategory, products } from "../../data";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  return {
    title: `${category.title}؛ بررسی و استعلام محصولات`,
    description: category.description,
    alternates: { canonical: `/shop/${category.slug}` },
    openGraph: {
      title: `${category.title} | Sepiid Beauty`,
      description: category.description,
      images: [category.image],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const items = products.filter((product) => product.category === category.slug);
  const group = getGroupForCategory(category.slug);

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            { label: "فروشگاه", href: "/shop" },
            ...(group
              ? [{ label: group.title, href: `/shop/group/${group.slug}` }]
              : []),
            { label: category.title },
          ]}
        />
      </div>

      <section className="sb-category-hero">
        <div className="sb-shell sb-category-hero__grid">
          <div>
            <span className="sb-eyebrow">{category.en}</span>
            <h1>{category.title}</h1>
            <p>{category.description}</p>
            <div className="sb-category-hero__notice">
              <span>راهنمای تصمیم</span>
              <p>{category.guide}</p>
            </div>
          </div>
          <div
            className="sb-category-hero__image"
            style={{
              backgroundImage: `url(${category.image})`,
              backgroundPosition: `${category.position} center`,
            }}
            role="img"
            aria-label={`تصویر نمایشی ${category.title}`}
          />
        </div>
      </section>

      <div className="sb-subcategory-nav">
        <div className="sb-shell">
          <span>دسته‌های دیگر:</span>
          {categories
            .filter(
              (item) =>
                item.slug !== category.slug &&
                (!group || group.categorySlugs.includes(item.slug)),
            )
            .map((item) => (
              <Link href={`/shop/${item.slug}`} key={item.slug}>
                {item.title}
              </Link>
            ))}
          <Link href="/shop">
            همه محصولات
            <ArrowIcon />
          </Link>
        </div>
      </div>

      <section className="sb-section sb-catalog-section">
        <div className="sb-shell">
          <ShopCatalog items={items} initialCategory={category.slug} />
        </div>
      </section>

      <section className="sb-category-seo">
        <div className="sb-shell sb-category-seo__grid">
          <div>
            <span className="sb-eyebrow">SEPIID GUIDE</span>
            <h2>چطور این دسته را بررسی کنید؟</h2>
          </div>
          <div>
            <p>
              ابتدا هدف و مخاطب محصول را مشخص کنید؛ سپس نام کامل مدل، ترکیب درج‌شده
              و روش استفاده سازنده را بخوانید. عنوان بازاری یا محبوبیت، جای این
              بررسی را نمی‌گیرد.
            </p>
            <p>
              برای سفارش، مشخصات بسته موجود، تاریخ، بچ‌کد و شرایط تحویل را استعلام
              کنید. اگر اطلاعات ناسازگار یا ناخوانا بود، خرید یا استفاده را متوقف
              کنید.
            </p>
            <Link className="sb-text-link" href="/guides">
              مشاهده راهنماهای کامل
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: category.title,
          description: category.description,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: items.length,
            itemListElement: items.map((product, index) => ({
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
