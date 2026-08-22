/* eslint-disable @next/next/no-img-element -- local editorial assets are compressed */
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "۱۱۶۲۶۴۰۰" },
};
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
    question: "قبل از سفارش، روی بسته محصول چه چیزهایی را چک کنم؟",
    answer:
      "نام کامل مدل، حجم، تعداد داخل بسته و سلامت ظاهری آن را با چیزی که می‌خواهید بخرید تطبیق دهید. اگر درباره یک محصول خاص مطمئن نیستید، اسم و مدلش را برای تیم سپید بفرستید.",
  },
  {
    question: "سپید بیوتی می‌گوید کدام محصول برای من مناسب است؟",
    answer:
      "نه. ما کمک می‌کنیم محصول‌ها را بهتر بشناسید و مقایسه کنید. انتخاب محصول تزریقی، ناحیه و روش استفاده باید بعد از ارزیابی توسط فرد واجد صلاحیت انجام شود.",
  },
  {
    question: "قیمتی که می‌بینم برای یک سرنگ است یا جعبه کامل؟",
    answer:
      "بستگی به محصول دارد. در صفحه هر محصول سعی کرده‌ایم واحد قیمت، حجم و تعداد داخل بسته را کنار هم نشان دهیم تا قیمت یک سرنگ با قیمت یک جعبه اشتباه نشود.",
  },
  {
    question: "اگر برای کلینیک چند محصول بخواهم چه کار کنم؟",
    answer:
      "اسم محصول‌ها، مدل و تعداد را یک‌جا بفرستید. موجودی و قیمت هر قلم جدا بررسی می‌شود و زمان تحویل را همان‌جا با شما هماهنگ می‌کنیم.",
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
              <strong>بدانید دقیقاً چه مدلی می‌خرید</strong>
              <p>مدل، حجم و اطلاعات روی بسته را واضح می‌بینید تا مقایسه بین گزینه‌ها راحت‌تر باشد.</p>
            </div>
            <Link href="/magazine/verify-dermal-filler-authenticity">چطور بررسی کنم؟</Link>
          </article>
          <article>
            <PackageIcon />
            <div>
              <strong>ارسال را از قبل هماهنگ کنید</strong>
              <p>زمان و روش تحویل به نوع محصول و مقصد بستگی دارد؛ قبل از نهایی‌کردن سفارش با شما هماهنگ می‌کنیم.</p>
            </div>
            <Link href="/contact">سؤال درباره ارسال</Link>
          </article>
          <article>
            <HeadsetIcon />
            <div>
              <strong>اگر چیزی مبهم است، بپرسید</strong>
              <p>برای موجودی، جزئیات سفارش یا پیگیری، مستقیم با تیم سپید صحبت می‌کنید.</p>
            </div>
            <Link href={whatsappHref()}>پیام به سپید</Link>
          </article>
        </div>
      </section>

      <Reveal>
        <section className="sb-section sb-categories">
          <div className="sb-shell">
            <div className="sb-section-head">
              <div>
                <span className="sb-eyebrow">SHOP BY CATEGORY</span>
                <h2>دنبال چه نوع محصولی هستید؟</h2>
              </div>
              <p>دسته موردنظر را باز کنید؛ مدل‌ها و قیمت‌ها همان‌جا جلوی چشم شماست.</p>
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
              <h2>چند قلم می‌خواهید؟ همه را یک‌جا بفرستید.</h2>
              <p>
                اگر برای کلینیک چند محصول می‌خواهید، لازم نیست برای هرکدام جدا پیام بدهید. فهرست را یک‌جا بفرستید تا موجودی، مدل، قیمت و زمان تحویل هر قلم را در همان گفت‌وگو پیگیری کنیم.
              </p>
              <ul>
                <li>چند محصول در یک درخواست</li>
                <li>مدل و بسته مشخص برای هر قلم</li>
                <li>پیگیری مستقیم تا زمان تحویل</li>
              </ul>
              <Link className="sb-btn sb-btn--dark" href="/professional">
                سفارش کلینیکی
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
                  جواب سؤال‌هایی که
                  <em>قبل از خرید پیش می‌آید.</em>
                </h2>
              </div>
              <div>
                <p>
                  اگر بین دو مدل مردد هستید یا درباره اصالت، نگهداری و تفاوت گروه‌های محصول سؤال دارید، مجله سپید برای همین است. مطالب تاریخ بازبینی و منبع دارند و قرار نیست جای تصمیم پزشکی را بگیرند.
                </p>
                <Link className="sb-text-link" href="/magazine">
                  رفتن به مجله سپید
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
            دیدن محصولات بر اساس برند
            <ArrowIcon />
          </Link>
        </div>
      </section>

      <Reveal>
        <section className="sb-section sb-faq-section">
          <div className="sb-shell sb-faq-section__grid">
            <div>
              <span className="sb-eyebrow">QUESTIONS / ANSWERS</span>
              <h2>چند سؤال رایج قبل از خرید</h2>
              <p>اگر جواب چیزی را اینجا پیدا نکردید، مستقیم از تیم سپید بپرسید.</p>
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