/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  catalogCategories,
  getGroupForCategory,
  productHref,
} from "../../catalog";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { ArrowIcon } from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { ShopCatalog } from "../../components/ShopCatalog";
import { guides } from "../../content-architecture";
import { getEditorialCategoryCopy } from "../../lib/editorial-category-copy";
import { getProductCutoutSrc } from "../../lib/product-image";
import { toPublicProduct } from "../../lib/public-product";
import { buildSeoMetadata } from "../../lib/seo";
import { siteOrigin } from "../../lib/site-url";
import { getStorefrontCatalog } from "../../lib/storefront-catalog";
import {
  getStorefrontCategories,
  getStorefrontCategoryBySlug,
} from "../../lib/storefront-categories";
import styles from "./premium.module.css";

export const revalidate = 300;

const priceFormatter = new Intl.NumberFormat("fa-IR");
const BOTULINUM_CATEGORY_SLUG = "botulinum-toxins";
const botulinumGuide = guides.find(
  (guide) => guide.slug === "botulinum-toxin",
);

const botulinumComparisonChecks = [
  {
    title: "نام دقیق فرآورده",
    body:
      "نام برند، مدل و نسخه درج‌شده روی بسته را کامل بخوانید؛ عنوان عمومی «بوتاکس» برای مقایسه دو کالا کافی نیست.",
  },
  {
    title: "تعداد واحد",
    body:
      "عدد واحد را فقط در چارچوب همان فرآورده بررسی کنید و واحد دو برند را بدون مرجع رسمی معادل هم نگیرید.",
  },
  {
    title: "بسته‌بندی و بچ",
    body:
      "سلامت پلمب، خوانایی تاریخ و شماره بچ و هماهنگی اطلاعات جعبه و ویال را پیش از نهایی‌کردن سفارش بررسی کنید.",
  },
  {
    title: "حمل و نگهداری",
    body:
      "شرایط حمل و نگهداری باید با اطلاعات همان محصول هماهنگ باشد؛ یک پاسخ کلی برای همه برندها کافی نیست.",
  },
] as const;

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

  const isBotulinumCategory =
    category.slug === BOTULINUM_CATEGORY_SLUG;

  return buildSeoMetadata({
    title: isBotulinumCategory
      ? "خرید بوتاکس | قیمت و مقایسه فرآورده‌های بوتولینوم"
      : `خرید و قیمت ${category.title}`,
    description: isBotulinumCategory
      ? "قیمت و مقایسه بوتاکس و فرآورده‌های بوتولینوم بر اساس نام دقیق، تعداد واحد، بسته‌بندی و شرایط نگهداری؛ همراه با راهنمای خرید حرفه‌ای."
      : `مشاهده قیمت و مقایسه محصولات ${category.title}. ${editorial.intro}`,
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
  const isBotulinumCategory =
    category.slug === BOTULINUM_CATEGORY_SLUG;
  const guideHref =
    isBotulinumCategory && botulinumGuide
      ? `/guides/${botulinumGuide.slug}`
      : "/guides";

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

            {isBotulinumCategory ? (
              <div
                className={styles.heroAssurance}
                aria-label="معیارهای اصلی مقایسه فرآورده‌های بوتولینوم"
              >
                <span>نام دقیق فرآورده</span>
                <span>تعداد واحد</span>
                <span>بسته‌بندی و بچ</span>
                <span>حمل و نگهداری</span>
              </div>
            ) : null}
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

      {isBotulinumCategory ? (
        <section
          className={styles.compareSection}
          aria-labelledby="botulinum-comparison-title"
        >
          <div className="sb-shell">
            <div className={styles.comparePanel}>
              <div className={styles.compareHead}>
                <div className={styles.compareHeadCopy}>
                  <p className={styles.kicker}>SEPIID BUYING CHECK</p>
                  <h2 id="botulinum-comparison-title">
                    بوتاکس را با چهار معیار واقعی مقایسه کنید
                  </h2>
                  <p>
                    قیمت زمانی قابل‌مقایسه است که دقیقاً بدانید کدام فرآورده،
                    با چه تعداد واحد و چه بسته‌بندی‌ای روبه‌روی شماست.
                  </p>
                </div>

                <Link
                  className={`sb-text-link ${styles.compareHeadAction}`}
                  href={guideHref}
                >
                  راهنمای کامل خرید بوتاکس
                  <ArrowIcon />
                </Link>
              </div>

              <div className={styles.compareGrid}>
                {botulinumComparisonChecks.map((check, index) => (
                  <article className={styles.compareCard} key={check.title}>
                    <span className={styles.compareCardIndex}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <strong>{check.title}</strong>
                    <p>{check.body}</p>
                  </article>
                ))}
              </div>

              <div className={styles.professionalNote}>
                <span>برای مصرف حرفه‌ای</span>
                <p>
                  این صفحه برای مقایسه تجاری محصول است؛ انتخاب، آماده‌سازی و
                  مصرف هر فرآورده باید بر اساس اطلاعات همان محصول و توسط فرد
                  واجد صلاحیت انجام شود.
                </p>
                <Link href="/professional">
                  خرید و همکاری حرفه‌ای
                  <ArrowIcon />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

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
              href={guideHref}
            >
              {isBotulinumCategory
                ? "راهنمای خرید و اصالت بوتاکس"
                : "راهنماهای خرید و انتخاب"}
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {isBotulinumCategory && botulinumGuide ? (
        <section
          className={styles.faqSection}
          aria-labelledby="botulinum-faq-title"
        >
          <div className={`sb-shell ${styles.faqGrid}`}>
            <div className={styles.faqHead}>
              <p className={styles.kicker}>PURCHASE FAQ</p>
              <h2 id="botulinum-faq-title">
                سؤال‌های مهم قبل از سفارش بوتاکس
              </h2>
              <p>
                پاسخ‌های کوتاه برای استعلام دقیق‌تر؛ بدون تبدیل صفحه خرید به
                توصیه پزشکی یا دستور مصرف.
              </p>
              <span className={styles.reviewedAt}>
                بازبینی محتوا: {botulinumGuide.reviewedAt}
              </span>
            </div>

            <div className={styles.faqList}>
              {botulinumGuide.faq.map((item) => (
                <details className={styles.faqItem} key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

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

      {isBotulinumCategory && botulinumGuide ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: botulinumGuide.faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }}
        />
      ) : null}
    </main>
  );
}
