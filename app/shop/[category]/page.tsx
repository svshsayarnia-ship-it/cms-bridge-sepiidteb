/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { ArrowIcon } from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { ShopCatalog } from "../../components/ShopCatalog";
import {
  catalogCategories,
  getGroupForCategory,
  productHref,
} from "../../catalog";
import { getEditorialCategoryCopy } from "../../lib/editorial-category-copy";
import {
  getStorefrontCategories,
  getStorefrontCategoryBySlug,
} from "../../lib/storefront-categories";
import { siteOrigin } from "../../lib/site-url";
import { getStorefrontCatalog } from "../../lib/storefront-catalog";
import { buildSeoMetadata } from "../../lib/seo";
import { getProductCutoutSrc } from "../../lib/product-image";
import { toPublicProduct } from "../../lib/public-product";

export const revalidate = 300;

const priceFormatter = new Intl.NumberFormat("fa-IR");

type PriceSource = {
  salePrice?: string | number;
  regularPrice?: string | number;
  price?: string | number;
  priceToman?: string | number;
};

function numericPrice(value?: string | number): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const normalized =
    typeof value === "string"
      ? value.replace(/[\s,٬]/gu, "")
      : value;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed > 0
    ? Math.round(parsed)
    : null;
}

function visiblePrice(product: PriceSource): number | null {
  return (
    numericPrice(product.salePrice) ??
    numericPrice(product.regularPrice) ??
    numericPrice(product.price) ??
    numericPrice(product.priceToman)
  );
}

function formatPrice(value: number): string {
  return `${priceFormatter.format(value)} تومان`;
}

export function generateStaticParams() {
  return catalogCategories.map(
    (category) => ({
      category: category.slug,
    }),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;

  if (slug === "body-fillers") {
    return {
      title: "فیلرهای بیشتر از ۲ میلی‌لیتر",
      robots: { index: false, follow: true },
      alternates: { canonical: "/shop/fillers" },
    };
  }

  const category =
    await getStorefrontCategoryBySlug(
      slug,
    );

  if (!category) {
    return {};
  }

  const editorial = getEditorialCategoryCopy(
    category.slug,
    category.description,
    category.guide,
  );
  const { products } = await getStorefrontCatalog();

  if (
    !products.some(
      (product) => product.category === category.slug,
    )
  ) {
    return {
      title: category.title,
      robots: { index: false, follow: true },
      alternates: {
        canonical: `/shop/${category.slug}`,
      },
    };
  }

  return buildSeoMetadata({
    title: `خرید و قیمت ${category.title}`,
    description: `مشاهده قیمت و مقایسه محصولات ${category.title}. ${editorial.intro}`,
    path: `/shop/${category.slug}`,
    image: category.image,
    imageAlt: category.title,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;

  if (slug === "body-fillers") {
    redirect("/shop/fillers?volume=high");
  }

  const [categories, { products }] =
    await Promise.all([
      getStorefrontCategories(),
      getStorefrontCatalog(),
    ]);

  const category =
    categories.find(
      (item) =>
        item.slug === slug,
    );

  if (!category) {
    notFound();
  }

  const editorial = getEditorialCategoryCopy(
    category.slug,
    category.description,
    category.guide,
  );
  const items = products.filter(
    (product) =>
      product.category === category.slug,
  );
  const pricedItems = items
    .map((product) => ({
      product,
      price: visiblePrice(product),
    }))
    .filter(
      (
        entry,
      ): entry is {
        product: (typeof items)[number];
        price: number;
      } => entry.price !== null,
    );
  const featuredEntry = pricedItems[0] ?? null;
  const startingPrice = pricedItems.length
    ? Math.min(...pricedItems.map((entry) => entry.price))
    : null;

  const group = getGroupForCategory(
    category.slug,
  );

  return (
    <main id="main-content" className="sb-category-page" data-category={category.slug}>
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            {
              label: "فروشگاه",
              href: "/shop",
            },

            ...(group
              ? [
                  {
                    label: group.title,
                    href: `/shop/group/${group.slug}`,
                  },
                ]
              : []),

            {
              label: category.title,
            },
          ]}
        />
      </div>

      <section className="sb-category-hero sb-category-commerce-hero">
        <div className="sb-shell sb-category-commerce-hero__grid">
          <div className="sb-category-commerce-hero__copy">
            <span className="sb-eyebrow">
              {category.en}
            </span>

            <h1>خرید و قیمت {category.title}</h1>

            <p>{editorial.intro}</p>

            <div
              className="sb-category-commerce-hero__signals"
              aria-label="اطلاعات خرید این دسته"
            >
              <span>
                <small>محصولات قابل مقایسه</small>
                <strong>{priceFormatter.format(items.length)} محصول</strong>
              </span>

              {startingPrice ? (
                <span>
                  <small>قیمت از</small>
                  <strong>{formatPrice(startingPrice)}</strong>
                </span>
              ) : null}

              <Link href="#category-products">
                دیدن محصولات و قیمت‌ها
                <ArrowIcon />
              </Link>
            </div>
          </div>

          <div
            className="sb-category-commerce-hero__visual"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(255,255,255,.06), rgba(31,27,25,.2)), url(${category.image})`,
              backgroundPosition: `${category.position} center`,
            }}
            role="group"
            aria-label={`هویت بصری و محصول قیمت‌دار ${category.title}`}
          >
            <span className="sb-category-commerce-hero__editorial-label">
              SEPIID EDITORIAL / {category.en}
            </span>

            {featuredEntry ? (
              <Link
                href={productHref(featuredEntry.product)}
                className="sb-category-commerce-hero__featured"
                aria-label={`مشاهده ${featuredEntry.product.nameFa} با قیمت ${formatPrice(featuredEntry.price)}`}
              >
                <span className="sb-category-commerce-hero__product-image">
                  <img
                    src={getProductCutoutSrc(featuredEntry.product.image)}
                    alt={
                      featuredEntry.product.imageAlt ||
                      `تصویر ${featuredEntry.product.nameFa}`
                    }
                    width="520"
                    height="520"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </span>

                <span className="sb-category-commerce-hero__product-copy">
                  <small>یک گزینه برای شروع مقایسه</small>
                  <strong>{featuredEntry.product.nameFa}</strong>
                  {featuredEntry.product.volume ? (
                    <span>{featuredEntry.product.volume}</span>
                  ) : null}
                  <b>{formatPrice(featuredEntry.price)}</b>
                  <em>
                    جزئیات این محصول
                    <ArrowIcon />
                  </em>
                </span>
              </Link>
            ) : (
              <Link
                href="#category-products"
                className="sb-category-commerce-hero__featured sb-category-commerce-hero__featured--fallback"
              >
                <span className="sb-category-commerce-hero__product-copy">
                  <small>محصولات این دسته</small>
                  <strong>{category.title}</strong>
                  <em>
                    دیدن محصولات و قیمت‌ها
                    <ArrowIcon />
                  </em>
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="sb-subcategory-nav">
        <div className="sb-shell">
          <span>دسته‌های مرتبط:</span>

          {categories
            .filter(
              (item) =>
                item.slug !== category.slug &&
                (!group ||
                  group.categorySlugs.includes(
                    item.slug,
                  )),
            )
            .map((item) => (
              <Link
                href={`/shop/${item.slug}`}
                key={item.slug}
              >
                {item.title}
              </Link>
            ))}

          <Link href="/shop">
            همه محصولات
            <ArrowIcon />
          </Link>
        </div>
      </div>

      <section id="category-products" className="sb-section sb-catalog-section">
        <div className="sb-shell">
          <ShopCatalog
            items={items.map(toPublicProduct)}
            initialCategory={category.slug}
          />
        </div>
      </section>

      <section className="sb-category-seo">
        <div className="sb-shell sb-category-seo__grid">
          <div>
            <span className="sb-eyebrow">
              SEPIID GUIDE
            </span>

            <h2>{editorial.guideTitle}</h2>
          </div>

          <div>
            <p className="sb-category-seo__lead">
              {editorial.guideLead}
            </p>

            <p>{editorial.guideBody}</p>

            <Link
              className="sb-text-link"
              href="/guides"
            >
              راهنماهای خرید و انتخاب
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `خرید و قیمت ${category.title}`,
          description: editorial.intro,

          mainEntity: {
            "@type": "ItemList",
            numberOfItems: items.length,

            itemListElement: items.map(
              (product, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: product.nameFa,
                url: `${siteOrigin}${productHref(
                  product,
                )}`,
              }),
            ),
          },
        }}
      />
    </main>
  );
}
