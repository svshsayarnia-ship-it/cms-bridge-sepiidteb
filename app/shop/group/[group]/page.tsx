/* eslint-disable @next/next/no-img-element -- category imagery */

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

import { getEditorialCategoryCopy } from "../../../lib/editorial-category-copy";
import { getStorefrontCategories } from "../../../lib/storefront-categories";
import { siteOrigin } from "../../../lib/site-url";
import { getStorefrontCatalog } from "../../../lib/storefront-catalog";
import { buildSeoMetadata } from "../../../lib/seo";

export const revalidate = 300;

const groupCopy: Record<string, { intro: string; title: string; note: string }> = {
  injectables: {
    intro: "فیلر، مزوژل، اسکین‌بوستر و فرآورده‌های بوتولینوم را جدا از هم ببینید و از همان گروهی وارد شوید که واقعاً دنبالش هستید.",
    title: "کدام گروه به چیزی که می‌خواهید نزدیک‌تر است؟",
    note: "هر دسته محصولات و قیمت‌های خودش را دارد. اگر بین دو گروه مردد هستید، اول تفاوتشان را ببینید و بعد سراغ مدل‌ها بروید.",
  },
  "mesotherapy-cocktails": {
    intro: "کوکتل‌های مزوتراپی را بر اساس کاربرد رایج بازار جدا کرده‌ایم تا پیدا کردن محصول ساده‌تر باشد؛ نه برای اینکه از اسم دسته نتیجه درمانی بگیریم.",
    title: "دنبال محصول برای کدام گروه هستید؟",
    note: "از دسته‌ای وارد شوید که به نیاز شما نزدیک‌تر است؛ داخل هر دسته می‌توانید مدل، حجم، بسته و قیمت را کنار هم مقایسه کنید.",
  },
  "professional-support": {
    intro: "محصولات پشتیبان حرفه‌ای را جدا از محصولات زیبایی آورده‌ایم تا قدرت، واحد و نوع بسته هر مورد واضح‌تر دیده شود.",
    title: "محصول موردنظر را از اینجا پیدا کنید",
    note: "در این گروه، عدد قدرت و نوع بسته مهم است. قبل از سفارش، مشخصات همان مدل را دقیق ببینید.",
  },
};

export function generateStaticParams() {
  return catalogGroups.map((group) => ({
    group: group.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string }>;
}): Promise<Metadata> {
  const { group: slug } = await params;
  const group = getCatalogGroup(slug);

  if (!group) {
    return {};
  }

  const copy = groupCopy[group.slug];

  return buildSeoMetadata({
    title: `${group.title}؛ دسته‌ها و محصولات`,
    description: copy?.intro || group.description,
    path: `/shop/group/${group.slug}`,
    imageAlt: group.title,
  });
}

export default async function ProductGroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group: slug } = await params;

  const group = getCatalogGroup(slug);

  if (!group) {
    notFound();
  }

  const [{ products }, categories] =
    await Promise.all([
      getStorefrontCatalog(),
      getStorefrontCategories(),
    ]);

  const childCategories = categories.filter(
    (category) =>
      group.categorySlugs.includes(
        category.slug,
      ),
  );

  const groupProducts = products.filter(
    (product) =>
      group.categorySlugs.includes(
        product.category,
      ),
  );
  const copy = groupCopy[group.slug] ?? {
    intro: group.description,
    title: "دسته موردنظر را انتخاب کنید",
    note: "هر دسته محصولات و توضیحات خودش را دارد؛ از نزدیک‌ترین گزینه به چیزی که می‌خواهید شروع کنید.",
  };

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            {
              label: "فروشگاه",
              href: "/shop",
            },
            {
              label: group.title,
            },
          ]}
        />
      </div>

      <section className="sb-page-hero sb-group-hero">
        <div className="sb-shell">
          <span className="sb-eyebrow">
            گروه محصولات
          </span>

          <h1>{group.title}</h1>

          <p>{copy.intro}</p>

          <div className="sb-group-hero__stats">
            <span>
              {childCategories.length} دسته
            </span>

            <span>
              {groupProducts.length} محصول
            </span>
          </div>
        </div>
      </section>

      <section className="sb-section sb-group-categories">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">
                دسته‌های این گروه
              </span>

              <h2>
                {copy.title}
              </h2>
            </div>

            <p>{copy.note}</p>
          </div>

          <div className="sb-group-category-grid">
            {childCategories.map(
              (category) => {
                const count =
                  groupProducts.filter(
                    (product) =>
                      product.category ===
                      category.slug,
                  ).length;
                const editorial = getEditorialCategoryCopy(
                  category.slug,
                  category.description,
                  category.guide,
                );

                return (
                  <Link
                    href={`/shop/${category.slug}`}
                    key={category.slug}
                  >
                    <img
                      src={category.image}
                      alt={`تصویر مفهومی ${category.title}`}
                      width="1254"
                      height="1254"
                    />

                    <div>
                      <span>
                        {count} محصول
                      </span>

                      <h2>
                        {category.title}
                      </h2>

                      <p>
                        {editorial.intro}
                      </p>

                      <strong>
                        دیدن محصولات
                        <ArrowIcon />
                      </strong>
                    </div>
                  </Link>
                );
              },
            )}
          </div>
        </div>
      </section>

      <section className="sb-section sb-group-products">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">
                چند پیشنهاد از این گروه
              </span>

              <h2>
                چند محصول از این گروه
              </h2>
            </div>

            <Link
              className="sb-text-link"
              href="/shop"
            >
              دیدن همه محصولات
              <ArrowIcon />
            </Link>
          </div>

          {groupProducts.length > 0 ? (
            <div className="sb-product-grid sb-product-grid--three">
              {groupProducts
                .slice(0, 9)
                .map((product) => (
                  <ProductCard
                    product={product}
                    key={product.slug}
                  />
                ))}
            </div>
          ) : (
            <div className="sb-catalog__empty">
              <span>۰ محصول</span>

              <h2>
                فعلاً محصولی در این گروه منتشر نشده است.
              </h2>

              <p>
                هر محصولی که اضافه شود، همین‌جا نمایش داده می‌شود.
              </p>
            </div>
          )}
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: group.title,
          description: copy.intro,

          mainEntity: {
            "@type": "ItemList",
            numberOfItems:
              groupProducts.length,

            itemListElement:
              groupProducts.map(
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
