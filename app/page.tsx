/* eslint-disable @next/next/no-img-element -- local editorial assets are compressed */
import Link from "next/link";
import { ArticleCard } from "./components/ArticleCard";
import { FaqList } from "./components/FaqList";
import { HomeFinder } from "./components/HomeFinder";
import { CustomerJourney } from "./components/CustomerJourney";
import {
  ArrowIcon,
  HeadsetIcon,
  PackageIcon,
  ShieldIcon,
} from "./components/Icons";
import { JsonLd } from "./components/JsonLd";
import { CategoryStoryCard } from "./components/CategoryStoryCard";
import { FeaturedProductCarousel } from "./components/FeaturedProductCarousel";
import { Reveal } from "./components/Reveal";
import { articles, whatsappHref } from "./data";
import { getStorefrontCatalog } from "./lib/storefront-catalog";
import { getStorefrontCategories } from "./lib/storefront-categories";
import { getSitePresentation } from "./lib/site-presentation";
import { EditableHomeHero } from "./components/EditableHomeHero";
import { getCompactBrandLabel } from "./lib/public-copy";
import { toPublicProduct } from "./lib/public-product";
import {
  brandPages,
  getBrandPageForLabel,
} from "./content-architecture";

const faqs = [
  {
    question: "پیش از ارسال، بسته محصول را چطور بررسی می‌کنید؟",
    answer:
      "نام مدل، سلامت جعبه، پلمب، تاریخ و اطلاعات قابل خواندن بسته را با سفارش مقایسه می‌کنیم. اگر سفارش حرفه‌ای دارید، می‌توانید اطلاعات همان بسته را پیش از پرداخت بپرسید.",
  },
  {
    question: "آیا سپید بیوتی برای من محصول انتخاب می‌کند؟",
    answer:
      "خیر. ما درباره خود محصول و خرید آن اطلاعات می‌دهیم. انتخاب محصول تزریقی و روش استفاده باید بعد از معاینه و با نظر پزشک انجام شود.",
  },
  {
    question: "چرا برای بعضی محصولات باید قیمت روز را بپرسیم؟",
    answer:
      "قیمت و موجودی بعضی مدل‌ها زود تغییر می‌کند. برای همین قیمت همان روز را همراه با وضعیت همان بسته اعلام می‌کنیم؛ نه یک عدد قدیمی یا حدسی.",
  },
  {
    question: "برای سفارش کلینیک چه کمکی می‌کنید؟",
    answer:
      "فهرست محصولات، تعداد، قیمت روز و زمان تحویل را یک‌جا بررسی می‌کنیم و برای پیگیری سفارش، یک مسیر مشخص در اختیار شما می‌گذاریم.",
  },
];

export const revalidate = 300;

const featuredRotationIntervalMs = 3 * 60 * 60 * 1_000;
const iranUtcOffsetMs = 3.5 * 60 * 60 * 1_000;

export default async function Home() {
  const [{ products }, categories, presentation] =
    await Promise.all([
      getStorefrontCatalog(),
      getStorefrontCategories(),
      getSitePresentation(),
    ]);

  const pricedProducts = products.filter((product) => {
    const visiblePrice = Number(
      product.salePrice ||
        product.regularPrice ||
        product.price ||
        product.priceToman,
    );

    return Number.isFinite(visiblePrice) && visiblePrice > 0;
  });
  const featuredProducts =
    pricedProducts.length >= 4 ? pricedProducts : products;
  // A cached page intentionally snapshots the shared three-hour rotation window.
  // eslint-disable-next-line react-hooks/purity
  const rotationNow = Date.now();
  const shiftedRotationNow = rotationNow + iranUtcOffsetMs;
  const initialRotationSeed = Math.floor(
    shiftedRotationNow / featuredRotationIntervalMs,
  );
  const initialRotationRemainingMs =
    (initialRotationSeed + 1) * featuredRotationIntervalMs -
    shiftedRotationNow;

  const availableBrands = Array.from(
    new Set(
      products
        .map((product) => getCompactBrandLabel(product.brand))
        .filter(Boolean),
    ),
  ).sort((first, second) =>
    first.localeCompare(second, "fa"),
  );
  const brandCounts = new Map<string, number>();
  for (const product of products) {
    const label = getCompactBrandLabel(product.brand);
    if (label) {
      brandCounts.set(label, (brandCounts.get(label) ?? 0) + 1);
    }
  }
  const linkedBrandLabels = brandPages.flatMap((page) =>
    page.indexable
      ? availableBrands.filter(
          (label) =>
            page.matchers.includes(label) &&
            (brandCounts.get(label) ?? 0) >= page.minProductCount,
        )
      : [],
  );
  const homeBrandLabels = Array.from(
    new Set([...linkedBrandLabels, ...availableBrands]),
  ).slice(0, 6);
  const homeBrands = homeBrandLabels.map((label) => {
    const page = getBrandPageForLabel(label);
    const normalized = label
      .toLocaleLowerCase("en")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "");
    const brandIndex = availableBrands.indexOf(label);
    const href =
      page &&
      page.indexable &&
      (brandCounts.get(label) ?? 0) >= page.minProductCount
        ? `/brands/${page.slug}`
        : `/brands#brand-${brandIndex + 1}-${normalized || "item"}`;

    return { label, href };
  });
  return (
    <main id="main-content">
      <CustomerJourney />
      <EditableHomeHero hero={presentation.home.hero} />

      <section className="sb-proof-strip">
        <div className="sb-shell sb-proof-strip__grid">
          <article>
            <ShieldIcon />
            <div>
              <strong>قبل از ارسال، چک می‌کنیم</strong>
              <p>نام مدل، تاریخ، پلمب و وضعیت ظاهری بسته را با سفارش مقایسه می‌کنیم.</p>
            </div>
            <Link href="/magazine/verify-dermal-filler-authenticity">جزئیات کار</Link>
          </article>
          <article>
            <PackageIcon />
            <div>
              <strong>ارسال را از قبل هماهنگ می‌کنیم</strong>
              <p>زمان و روش ارسال را بر اساس نوع محصول و شهر مقصد با شما هماهنگ می‌کنیم.</p>
            </div>
            <Link href="/contact">شرایط ارسال</Link>
          </article>
          <article>
            <HeadsetIcon />
            <div>
              <strong>یک نفر پاسخ‌گوی شماست</strong>
              <p>برای قیمت، موجودی، پیگیری سفارش و سؤال‌های بعد از تحویل پیام بدهید.</p>
            </div>
            <Link href={whatsappHref()}>شروع گفت‌وگو</Link>
          </article>
        </div>
      </section>

      <Reveal>
        <section className="sb-section sb-categories">
          <div className="sb-shell">
            <div className="sb-section-head">
              <div>
                <span className="sb-eyebrow">SHOP BY CATEGORY</span>
                <h2>محصول موردنظرتان را از اینجا پیدا کنید</h2>
              </div>
              <p>اگر نام محصول را نمی‌دانید، از گروهی شروع کنید که به نیازتان نزدیک‌تر است.</p>
            </div>
            <div className="sb-category-grid">
              {categories.map((category, index) => (
                <CategoryStoryCard
                  index={index}
                  key={category.slug}
                  slug={category.slug}
                  title={category.title}
                  en={category.en}
                />
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <FeaturedProductCarousel
          initialRotationRemainingMs={initialRotationRemainingMs}
          initialRotationSeed={initialRotationSeed}
          products={featuredProducts.map((product) => ({
            slug: product.slug,
            nameFa: product.nameFa,
            nameEn: product.nameEn,
            brand: getCompactBrandLabel(product.brand),
            category: product.category,
            categoryTitle: product.categoryTitle,
            badge: product.badge,
            image: product.image,
            imageAlt: product.imageAlt,
            volume: product.volume,
            shortBenefit: product.shortBenefit,
            position: product.position,
            price: product.price,
            regularPrice: product.regularPrice,
            salePrice: product.salePrice,
            priceToman: product.priceToman,
            stockStatus: product.stockStatus,
          }))}
        />
      </Reveal>

      <HomeFinder products={products.map(toPublicProduct)} />

      <Reveal>
        <section className="sb-section sb-professional-home">
          <div className="sb-shell sb-professional-home__grid">
            <div className="sb-professional-home__media">
              <img
                src="/images/professional-clinic-v2.webp"
                alt="متخصص کلینیک در حال بررسی موجودی محصولات"
                width="1672"
                height="941"
                loading="lazy"
              />
              <span>PROFESSIONAL ACCESS</span>
            </div>
            <div className="sb-professional-home__content">
              <span className="sb-eyebrow">FOR CLINICS / پزشکان و کلینیک‌ها</span>
              <h2>سفارش کلینیک نباید بین چند پیام گم شود.</h2>
              <p>
                فهرست اقلام، تعداد، موجودی و زمان تحویل را یک‌جا بفرستید تا
                لازم نباشد برای هر مورد چند بار پیام بدهید.
              </p>
              <ul>
                <li>بررسی چند محصول در یک پیام</li>
                <li>اعلام جداگانه قیمت و وضعیت هر مدل</li>
                <li>هماهنگی سفارش‌های بعدی با یک مسیر مشخص</li>
              </ul>
              <Link className="sb-btn sb-btn--dark" href="/professional">
                سفارش برای کلینیک
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="sb-section sb-journal-home">
          <div className="sb-shell">
            <div className="sb-section-head sb-section-head--split">
              <div>
                <span className="sb-eyebrow">SEPIID JOURNAL / 2026</span>
                <h2>
                  قبل از خرید،
                  <em>چند نکته ساده را بخوانید.</em>
                </h2>
              </div>
              <div>
                <p>
                  مقاله‌ها کمک می‌کنند نام مدل، بسته و سؤال‌های مهم را بهتر بشناسید.
                  این نوشته‌ها جای معاینه و نظر پزشک را نمی‌گیرند.
                </p>
                <Link className="sb-text-link" href="/magazine">
                  خواندن مقاله‌ها
                  <ArrowIcon />
                </Link>
              </div>
            </div>
            <div className="sb-article-grid">
              {[
                articles.find(
                  (article) => article.slug === "botulinum-cold-chain-checklist",
                )!,
                ...articles.slice(0, 2),
              ].map((article) => (
                <ArticleCard article={article} key={article.slug} />
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <section className="sb-section sb-brands-home">
        <div className="sb-shell">
          <span className="sb-eyebrow">BRANDS / INDEX</span>
          <div className="sb-brands-home__row">
            {homeBrands.map((brand) => (
              <Link href={brand.href} key={brand.label}>
                {brand.label}
              </Link>
            ))}
          </div>
          <Link className="sb-text-link" href="/brands">
            راهنمای برندها
            <ArrowIcon />
          </Link>
        </div>
      </section>

      <Reveal>
        <section className="sb-section sb-faq-section">
          <div className="sb-shell sb-faq-section__grid">
            <div>
              <span className="sb-eyebrow">QUESTIONS / ANSWERS</span>
              <h2>سؤال‌تان را قبل از خرید جواب بگیرید.</h2>
              <p>پاسخ کوتاه و روشن برای چیزهایی که هنگام خرید مهم‌اند.</p>
              <Link className="sb-text-link" href="/contact">
                سؤال دیگری دارید؟
                <ArrowIcon />
              </Link>
            </div>
            <FaqList items={faqs} />
          </div>
        </section>
      </Reveal>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((item) => ({
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
