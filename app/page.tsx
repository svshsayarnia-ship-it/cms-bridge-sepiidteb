/* eslint-disable @next/next/no-img-element -- local editorial assets are compressed */
import Link from "next/link";
import { ArticleCard } from "./components/ArticleCard";
import { FaqList } from "./components/FaqList";
import { DeferredHomeFinder } from "./components/DeferredHomeFinder";
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
    question: "قبل از سفارش چه چیزهایی از بسته محصول را ببینم؟",
    answer:
      "نام کامل مدل، حجم، تعداد داخل بسته و سلامت ظاهری محصول را با چیزی که قصد خریدش را دارید مقایسه کنید. اگر برای سفارش مشخصی جزئیات بیشتری لازم دارید، همان محصول و مدل را برای تیم سپید بفرستید.",
  },
  {
    question: "آیا سپید بیوتی می‌گوید کدام محصول برای من مناسب است؟",
    answer:
      "سپید بیوتی برای شناخت و مقایسه محصول کمک می‌کند، نه برای تجویز. انتخاب محصول تزریقی، ناحیه و روش استفاده باید پس از ارزیابی توسط فرد واجد صلاحیت انجام شود.",
  },
  {
    question: "قیمت نمایش‌داده‌شده برای یک سرنگ است یا جعبه کامل؟",
    answer:
      "این موضوع بین محصولات متفاوت است. در صفحه هر محصول تلاش می‌کنیم واحد قیمت، حجم و تعداد داخل بسته را کنار هم نشان دهیم تا قیمت یک سرنگ با قیمت جعبه کامل اشتباه نشود.",
  },
  {
    question: "برای خرید چند محصول برای کلینیک چه کار کنم؟",
    answer:
      "نام محصول، مدل و تعداد اقلام را یک‌جا بفرستید. موجودی و قیمت هر قلم جداگانه بررسی می‌شود و زمان تحویل در همان مسیر هماهنگ خواهد شد.",
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
              <strong>جزئیات قبل از خرید</strong>
              <p>مدل، حجم و اطلاعات قابل‌مشاهده بسته را روشن و قابل مقایسه نگه می‌داریم.</p>
            </div>
            <Link href="/magazine/verify-dermal-filler-authenticity">راهنمای بررسی</Link>
          </article>
          <article>
            <PackageIcon />
            <div>
              <strong>تحویل هماهنگ</strong>
              <p>زمان و روش ارسال بر اساس نوع محصول و مقصد با شما هماهنگ می‌شود.</p>
            </div>
            <Link href="/contact">سؤال درباره ارسال</Link>
          </article>
          <article>
            <HeadsetIcon />
            <div>
              <strong>پاسخ‌گویی مستقیم</strong>
              <p>برای موجودی، جزئیات سفارش و پیگیری، مستقیم با تیم سپید در ارتباطید.</p>
            </div>
            <Link href={whatsappHref()}>گفت‌وگو با سپید</Link>
          </article>
        </div>
      </section>

      <Reveal>
        <section className="sb-section sb-categories">
          <div className="sb-shell">
            <div className="sb-section-head">
              <div>
                <span className="sb-eyebrow">SHOP BY CATEGORY</span>
                <h2>از کدام گروه شروع می‌کنید؟</h2>
              </div>
              <p>دسته مناسب را باز کنید و همان ابتدا محصولات، مدل‌ها و قیمت‌ها را ببینید.</p>
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

      <DeferredHomeFinder products={products.map(toPublicProduct)} />

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
              <h2>چند محصول را یک‌جا مدیریت کنید.</h2>
              <p>
                فهرست خرید کلینیک را یک‌جا بفرستید و موجودی، مدل، قیمت و زمان تحویل هر قلم را بدون چند گفت‌وگوی پراکنده پیگیری کنید.
              </p>
              <ul>
                <li>چند محصول در یک درخواست</li>
                <li>مدل و بسته مشخص برای هر قلم</li>
                <li>پیگیری مستقیم تا زمان تحویل</li>
              </ul>
              <Link className="sb-btn sb-btn--dark" href="/professional">
                خرید حرفه‌ای کلینیک‌ها
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
                  مقاله‌هایی برای
                  <em>سؤال‌های واقعی.</em>
                </h2>
              </div>
              <div>
                <p>
                  اگر قبل از خرید درباره تفاوت مدل‌ها، اصالت، نگهداری یا کاربرد یک گروه سؤال دارید، مجله سپید برای همین مرحله است. مقاله‌ها منبع و تاریخ بازبینی دارند و جایگزین تصمیم پزشکی نیستند.
                </p>
                <Link className="sb-text-link" href="/magazine">
                  خواندن مجله سپید
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
            مقایسه محصولات بر اساس برند
            <ArrowIcon />
          </Link>
        </div>
      </section>

      <Reveal>
        <section className="sb-section sb-faq-section">
          <div className="sb-shell sb-faq-section__grid">
            <div>
              <span className="sb-eyebrow">QUESTIONS / ANSWERS</span>
              <h2>سؤال‌هایی که قبل از خرید طبیعی است داشته باشید.</h2>
              <p>پاسخ کوتاه به ابهام‌هایی که ممکن است بین دو مدل، دو بسته یا دو قیمت ایجاد شود.</p>
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
