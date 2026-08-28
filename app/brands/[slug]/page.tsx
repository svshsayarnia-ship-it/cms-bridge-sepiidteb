import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "../../components/ArticleCard";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FaqList } from "../../components/FaqList";
import { ArrowIcon } from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { ProductCard } from "../../components/ProductCard";
import {
  brandPages,
  getBrandPage,
} from "../../content-architecture";
import { getCompactBrandLabel, toPublicCopy } from "../../lib/public-copy";
import { buildSeoMetadata } from "../../lib/seo";
import { siteOrigin } from "../../lib/site-url";
import { getStorefrontCatalog } from "../../lib/storefront-catalog";
import { getManagedArticles, getSitePresentation } from "../../lib/site-presentation";

export const revalidate = 300;

export function generateStaticParams() {
  return brandPages
    .filter((brand) => brand.indexable)
    .map((brand) => ({ slug: brand.slug }));
}

function brandMatches(
  label: string,
  matchers: string[],
) {
  const normalized = label
    .trim()
    .toLocaleLowerCase("en");

  return matchers.some(
    (matcher) =>
      matcher.toLocaleLowerCase("en") === normalized,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandPage(slug);

  if (!brand) return {};

  const { products } = await getStorefrontCatalog();
  const productCount = products.filter((product) =>
    brandMatches(
      getCompactBrandLabel(product.brand),
      brand.matchers,
    ),
  ).length;

  if (
    !brand.indexable ||
    productCount < brand.minProductCount
  ) {
    return {
      robots: { index: false, follow: true },
    };
  }

  return buildSeoMetadata({
    title: brand.title,
    description: toPublicCopy(brand.description),
    path: `/brands/${brand.slug}`,
    imageAlt: brand.title,
  });
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = getBrandPage(slug);

  if (!brand || !brand.indexable) {
    notFound();
  }

  const { products } = await getStorefrontCatalog();
  const brandProducts = products.filter((product) =>
    brandMatches(
      getCompactBrandLabel(product.brand),
      brand.matchers,
    ),
  );

  if (brandProducts.length < brand.minProductCount) {
    notFound();
  }

  const modelRows = brandProducts.flatMap((product) =>
    product.variants?.length
      ? product.variants.map((variant) => ({
          name: variant.nameFa,
          englishName: variant.nameEn,
          volume: variant.volume,
          href: `/product/${product.slug}`,
        }))
      : [
          {
            name: product.nameFa,
            englishName: product.nameEn,
            volume: product.volume ?? "جزئیات در صفحه محصول",
            href: `/product/${product.slug}`,
          },
        ],
  );

  const managedArticles = getManagedArticles(await getSitePresentation());
  const relatedArticles = managedArticles.filter((article) =>
    brand.articleSlugs.includes(article.slug) || article.brandSlugs?.includes(brand.slug),
  );
  const publicFaq = brand.faq.map((item) => ({
    question: toPublicCopy(item.question),
    answer: toPublicCopy(item.answer),
  }));

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            { label: "برندها", href: "/brands" },
            { label: brand.name },
          ]}
        />
      </div>

      <header className="sb-content-landing__hero sb-brand-page__hero">
        <div className="sb-shell">
          <span className="sb-eyebrow">صفحه برند {brand.name}</span>
          <h1>{brand.title}</h1>
          <p>{toPublicCopy(brand.intro)}</p>
          <div className="sb-brand-page__stats">
            <span>{brandProducts.length} محصول</span>
            <span>{modelRows.length} مدل و بسته</span>
          </div>
        </div>
      </header>

      <section className="sb-section sb-brand-page__products">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <h2>محصولات {brand.name}</h2>
            </div>
            <Link className="sb-text-link" href="/brands">
              همه برندها
              <ArrowIcon />
            </Link>
          </div>
          <div className="sb-product-grid sb-product-grid--three">
            {brandProducts.map((product) => (
              <ProductCard
                product={product}
                key={product.slug}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="sb-section sb-brand-page__models">
        <div className="sb-shell sb-brand-page__models-grid">
          <div>
            <span className="sb-eyebrow">مدل‌ها و بسته‌ها</span>
            <h2>نام مدل و حجم را کنار هم ببینید</h2>
            <p>
              اگر یک برند چند مدل دارد، فقط نام برند را مبنا قرار ندهید. حجم، نوع بسته و قیمت همان گزینه را باز کنید تا دو محصول متفاوت با هم اشتباه نشوند.
            </p>
          </div>
          <div className="sb-brand-page__table" role="region" aria-label={`مدل‌های ${brand.name}`}>
            <table>
              <thead>
                <tr>
                  <th scope="col">مدل</th>
                  <th scope="col">حجم یا بسته</th>
                  <th scope="col">جزئیات</th>
                </tr>
              </thead>
              <tbody>
                {modelRows.map((model) => (
                  <tr key={`${model.name}-${model.volume}`}>
                    <td>
                      <strong>{model.name}</strong>
                      <small>{model.englishName}</small>
                    </td>
                    <td>{toPublicCopy(model.volume)}</td>
                    <td>
                      <Link href={model.href}>مشاهده محصول</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="sb-brand-page__checks">
        <div className="sb-shell">
          <h2>قبل از خرید این برند</h2>
          <ul>
            {brand.buyingChecks.map((check) => (
              <li key={check}>{toPublicCopy(check)}</li>
            ))}
          </ul>
          <div>
            {brand.guideSlugs.map((guide) => (
              <Link href={`/guides/${guide}`} key={guide}>
                راهنمای مرتبط
                <ArrowIcon />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sb-section sb-content-landing__faq">
        <div className="sb-shell sb-faq-section__grid">
          <div>
            <span className="sb-eyebrow">پرسش‌های رایج</span>
            <h2>سؤال‌هایی که قبل از خرید پیش می‌آید</h2>
          </div>
          <FaqList items={publicFaq} />
        </div>
      </section>

      {relatedArticles.length > 0 ? (
        <section className="sb-section sb-related-articles">
          <div className="sb-shell">
            <div className="sb-section-head">
              <div>
                <h2>برای شناخت بهتر {brand.name}</h2>
              </div>
            </div>
            <div className="sb-article-grid">
              {relatedArticles.map((article) => (
                <ArticleCard article={article} key={article.slug} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: brand.title,
          description: toPublicCopy(brand.description),
          url: `${siteOrigin}/brands/${brand.slug}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: brandProducts.length,
            itemListElement: brandProducts.map((product, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: product.nameFa,
              url: `${siteOrigin}/product/${product.slug}`,
            })),
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: publicFaq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }}
      />
    </main>
  );
}
