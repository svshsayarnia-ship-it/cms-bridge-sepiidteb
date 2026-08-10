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
  getConcernTopic,
  guideTopics,
} from "../../lib/discovery-hubs";
import { buildSeoMetadata } from "../../lib/seo";
import { siteOrigin } from "../../lib/site-url";
import { getStorefrontCatalog } from "../../lib/storefront-catalog";

export const revalidate = 300;

export function generateStaticParams() {
  return concernTopics.map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = getConcernTopic(slug);

  if (!topic) return {};

  return buildSeoMetadata({
    title: `${topic.title}؛ از مسئله تا مسیر بررسی`,
    description: topic.description,
    path: `/concerns/${topic.slug}`,
    image: "/images/hero-editorial-portrait.webp",
    imageAlt: topic.title,
  });
}

export default async function ConcernTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic: slug } = await params;
  const topic = getConcernTopic(slug);

  if (!topic) notFound();

  const { products } = await getStorefrontCatalog();
  const relatedProducts = products
    .filter((product) => topic.categorySlugs.includes(product.category))
    .slice(0, 8);
  const relatedGuides = guideTopics.filter((guide) =>
    topic.guideSlugs.includes(guide.slug),
  );
  const relatedArticles = articles.filter((article) =>
    topic.articleSlugs.includes(article.slug),
  );

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            { label: "نیازها و دغدغه‌ها", href: "/concerns" },
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
              <span>نکته مهم</span>
              <p>
                نمایش دسته یا محصول در این صفحه به معنی تشخیص، تجویز یا تضمین نتیجه
                نیست. هدف صفحه، سازمان‌دهی اطلاعات برای گفت‌وگوی دقیق‌تر با فرد واجد
                صلاحیت است.
              </p>
            </div>
          </div>

          <div className="sb-guide-comparison__cards">
            <article>
              <strong>سؤال‌های تصمیم</strong>
              <ul>
                {topic.decisionQuestions.map((question) => (
                  <li key={question}>{question}</li>
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
              <span className="sb-eyebrow">QUESTION FIRST</span>
              <h2>قبل از محصول، سؤال را دقیق کنید.</h2>
            </div>
            <p>این چهار سؤال کمک می‌کنند مسیر اطلاعاتی درست‌تر انتخاب شود.</p>
          </div>

          <div className="sb-guide-paths__grid">
            {topic.decisionQuestions.map((question, index) => (
              <article key={question}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <small>DECISION QUESTION</small>
                <h3>سؤال {index + 1}</h3>
                <p>{question}</p>
                <div>
                  <CheckIcon />
                  پاسخ را قبل از مقایسه محصولات روشن کنید.
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {relatedGuides.length > 0 && (
        <section className="sb-section sb-guide-paths">
          <div className="sb-shell">
            <div className="sb-section-head">
              <div>
                <span className="sb-eyebrow">RELATED / GUIDES</span>
                <h2>راهنماهای مرتبط با این مسئله</h2>
              </div>
              <Link className="sb-text-link" href="/guides">
                همه راهنماها
                <ArrowIcon />
              </Link>
            </div>

            <div className="sb-guide-paths__grid">
              {relatedGuides.map((guide, index) => (
                <article key={guide.slug}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <small>{guide.eyebrow}</small>
                  <h3>{guide.title}</h3>
                  <p>{guide.description}</p>
                  <Link className="sb-text-link" href={`/guides/${guide.slug}`}>
                    باز کردن راهنما
                    <ArrowIcon />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section className="sb-section sb-catalog-section">
          <div className="sb-shell">
            <div className="sb-section-head">
              <div>
                <span className="sb-eyebrow">RELATED / CATALOG</span>
                <h2>دسته‌های محصولی که معمولاً در این مسیر بررسی می‌شوند</h2>
              </div>
              <p>
                این محصولات فقط برای مرور اطلاعات نمایش داده می‌شوند و انتخاب آن‌ها
                برای یک فرد باید جداگانه ارزیابی شود.
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
            <span className="sb-eyebrow">BOUNDARY / تصمیم پزشکی</span>
            <h2>مسئله کاربر را به یک محصول تقلیل ندهید.</h2>
          </div>
          <div>
            <p>
              یک دغدغه ظاهری ممکن است چند علت و چند مسیر بررسی داشته باشد. در این
              معماری، صفحه نیاز فقط شما را به راهنما، دسته و اطلاعات محصول متصل
              می‌کند و تصمیم بالینی را جدا نگه می‌دارد.
            </p>
            <Link className="sb-text-link" href="/concerns">
              بازگشت به همه نیازها
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
          url: `${siteOrigin}/concerns/${topic.slug}`,
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
