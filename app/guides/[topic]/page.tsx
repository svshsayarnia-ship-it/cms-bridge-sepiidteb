import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "../../components/ArticleCard";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { ArrowIcon, CheckIcon } from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { ProductCard } from "../../components/ProductCard";
import { articles } from "../../data";
import {
  concernTopics,
  getGuideTopic,
  guideTopics,
} from "../../lib/discovery-hubs";
import { buildSeoMetadata } from "../../lib/seo";
import { siteOrigin } from "../../lib/site-url";
import { getStorefrontCatalog } from "../../lib/storefront-catalog";

export const revalidate = 300;

export function generateStaticParams() {
  return guideTopics.map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = getGuideTopic(slug);

  if (!topic) return {};

  return buildSeoMetadata({
    title: topic.title,
    description: topic.description,
    path: `/guides/${topic.slug}`,
    image: "/images/magazine-authenticity-v2.webp",
    imageAlt: topic.title,
  });
}

export default async function GuideTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic: slug } = await params;
  const topic = getGuideTopic(slug);

  if (!topic) notFound();

  const { products } = await getStorefrontCatalog();
  const relatedProducts = products
    .filter((product) => topic.categorySlugs.includes(product.category))
    .slice(0, 8);
  const relatedArticles = articles.filter((article) =>
    topic.articleSlugs.includes(article.slug),
  );
  const relatedConcerns = concernTopics.filter((concern) =>
    topic.concernSlugs.includes(concern.slug),
  );

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            { label: "راهنمای انتخاب", href: "/guides" },
            { label: topic.title },
          ]}
        />
      </div>

      <section className="sb-category-hero">
        <div className="sb-shell sb-category-hero__grid">
          <div>
            <span className="sb-eyebrow">{topic.eyebrow}</span>
            <h1>{topic.title}</h1>
            <p>{topic.intro}</p>
            <div className="sb-category-hero__notice">
              <span>مرز این راهنما</span>
              <p>
                این صفحه برای شناخت، مقایسه و خرید آگاهانه است. تشخیص، انتخاب روش،
                ناحیه و پروتکل درمانی باید توسط پزشک واجد صلاحیت انجام شود.
              </p>
            </div>
          </div>

          <div className="sb-guide-comparison__cards">
            <article>
              <strong>چک‌لیست تصمیم</strong>
              <ul>
                {topic.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="sb-section sb-guide-paths">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">DECISION FLOW</span>
              <h2>مسیر را با چهار سؤال جلو ببرید.</h2>
            </div>
            <p>هر پاسخ باید شما را به اطلاعات دقیق‌تر برساند، نه به خرید سریع‌تر.</p>
          </div>

          <div className="sb-guide-paths__grid">
            {topic.checklist.map((item, index) => (
              <article key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <small>CHECK</small>
                <h3>{index === 0 ? "تعریف مسئله" : index === 1 ? "شناخت محصول" : index === 2 ? "بررسی اطلاعات" : "تصمیم حرفه‌ای"}</h3>
                <p>{item}</p>
                <div>
                  <CheckIcon />
                  قبل از رفتن به مرحله بعد، پاسخ این مورد را روشن کنید.
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="sb-section sb-catalog-section">
          <div className="sb-shell">
            <div className="sb-section-head">
              <div>
                <span className="sb-eyebrow">RELATED / PRODUCTS</span>
                <h2>محصولات مرتبط برای مقایسه اطلاعات</h2>
              </div>
              <p>
                نمایش محصول در این بخش به معنی توصیه برای استفاده نیست؛ فقط مسیر
                مقایسه کاتالوگ را کوتاه‌تر می‌کند.
              </p>
            </div>
            <div className="sb-product-grid">
              {relatedProducts.map((product) => (
                <ProductCard product={product} key={product.slug} />
              ))}
            </div>
          </div>
        </section>
      )}

      {relatedConcerns.length > 0 && (
        <section className="sb-section sb-guide-paths">
          <div className="sb-shell">
            <div className="sb-section-head">
              <div>
                <span className="sb-eyebrow">START FROM THE NEED</span>
                <h2>اگر از مسئله کاربر شروع می‌کنید</h2>
              </div>
              <Link className="sb-text-link" href="/concerns">
                همه نیازها و مسئله‌ها
                <ArrowIcon />
              </Link>
            </div>

            <div className="sb-guide-paths__grid">
              {relatedConcerns.map((concern, index) => (
                <article key={concern.slug}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <small>{concern.eyebrow}</small>
                  <h3>{concern.title}</h3>
                  <p>{concern.description}</p>
                  <Link className="sb-text-link" href={`/concerns/${concern.slug}`}>
                    ورود از مسیر نیاز
                    <ArrowIcon />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {relatedArticles.length > 0 && (
        <section className="sb-section">
          <div className="sb-shell">
            <div className="sb-section-head">
              <div>
                <span className="sb-eyebrow">READ / NEXT</span>
                <h2>مطالعه تکمیلی</h2>
              </div>
              <Link className="sb-text-link" href="/magazine">
                همه مقاله‌ها
                <ArrowIcon />
              </Link>
            </div>
            <div className="sb-article-grid">
              {relatedArticles.map((article) => (
                <ArticleCard article={article} key={article.slug} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="sb-category-seo">
        <div className="sb-shell sb-category-seo__grid">
          <div>
            <span className="sb-eyebrow">NEXT STEP</span>
            <h2>از راهنما به صفحه محصول بروید، نه برعکس.</h2>
          </div>
          <div>
            <p>
              ابتدا مسئله و معیار مقایسه را روشن کنید. سپس فقط محصولاتی را باز کنید
              که در همان مسیر قرار می‌گیرند و اطلاعات قابل استعلام آن‌ها را با هم
              مقایسه کنید.
            </p>
            <Link className="sb-text-link" href="/shop">
              ورود به فروشگاه
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: topic.title,
          description: topic.description,
          url: `${siteOrigin}/guides/${topic.slug}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: relatedProducts.length,
            itemListElement: relatedProducts.map((product, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: product.nameFa,
              url: `${siteOrigin}/product/${product.slug}`,
            })),
          },
        }}
      />
    </main>
  );
}
