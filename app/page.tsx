/* eslint-disable @next/next/no-img-element -- local editorial assets are compressed */
import Link from "next/link";
import { ArticleCard } from "./components/ArticleCard";
import { FaqList } from "./components/FaqList";
import { HomeFinder } from "./components/HomeFinder";
import { BrandStory } from "./components/BrandStory";
import { BrandStamp } from "./components/BrandStamp";
import { CustomerJourney } from "./components/CustomerJourney";
import {
  ArrowIcon,
  HeadsetIcon,
  PackageIcon,
  ShieldIcon,
} from "./components/Icons";
import { JsonLd } from "./components/JsonLd";
import { ProductCard } from "./components/ProductCard";
import { ProductUseReveal } from "./components/ProductUseReveal";
import { Reveal } from "./components/Reveal";
import { articles, categories, whatsappHref } from "./data";
import { getStorefrontCatalog } from "./lib/storefront-catalog";

const faqs = [
  {
    question: "اصالت و سلامت بسته‌بندی محصولات چگونه بررسی می‌شود؟",
    answer:
      "پیش از ارسال، عنوان محصول، سلامت ظاهری جعبه، پلمب، تاریخ و بچ‌کد قابل مشاهده بررسی می‌شود. برای سفارش حرفه‌ای می‌توانید جزئیات همان بچ را پیش از پرداخت استعلام کنید.",
  },
  {
    question: "آیا سپید بیوتی محصول مناسب من را تجویز می‌کند؟",
    answer:
      "خیر. راهنمایی ما برای شناخت گروه محصول و فرایند خرید است. انتخاب محصول تزریقی، ناحیه و پروتکل باید پس از ارزیابی توسط پزشک واجد صلاحیت انجام شود.",
  },
  {
    question: "چرا قیمت بعضی محصولات به‌صورت استعلامی است؟",
    answer:
      "موجودی و شرایط تأمین محصولات حرفه‌ای می‌تواند تغییر کند. قیمت روز همراه با وضعیت موجودی و اطلاعات بسته قابل ارائه اعلام می‌شود تا داده ساختگی یا قدیمی نمایش داده نشود.",
  },
  {
    question: "برای خرید کلینیکی چه خدماتی ارائه می‌شود؟",
    answer:
      "تطبیق فهرست اقلام، استعلام موجودی، ثبت مشخصات هر بچ، هماهنگی زمان تحویل و پیگیری سفارش‌های تکرارشونده در مسیر حرفه‌ای انجام می‌شود.",
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const { products } =
    await getStorefrontCatalog();

  const prioritizedProducts = [
    ...products.filter(
      (product) => product.featured,
    ),
    ...products.filter(
      (product) => !product.featured,
    ),
  ];

  const featuredProducts = Array.from(
    new Map(
      prioritizedProducts.map(
        (product) => [
          product.slug,
          product,
        ],
      ),
    ).values(),
  ).slice(0, 4);

  const homeBrands = Array.from(
    new Set(
      products
        .map((product) =>
          product.brand.trim(),
        )
        .filter(Boolean),
    ),
  )
    .sort((first, second) =>
      first.localeCompare(second, "fa"),
    )
    .slice(0, 6);
  return (
    <main id="main-content">
      <CustomerJourney />
      <section className="sb-hero">
        <div className="sb-shell sb-hero__grid">
          <div className="sb-hero__content">
            <span className="sb-eyebrow">
              <i />
              فروشگاه تخصصی و مجله تصمیم‌یار زیبایی
            </span>
            <h1>
              <em>از انتخاب اول تا آخرین لحظه با شما هستیم.</em>
            </h1>
            <p>
              محصول، مشخصات و استعلام موجودی را سریع و مرتب در یک‌جا ببینید.
            </p>
            <div className="sb-hero__actions">
              <Link className="sb-btn sb-btn--dark" href="/shop">
                دیدن محصولات
                <ArrowIcon />
              </Link>
              <Link className="sb-btn sb-btn--outline" href="/guides">
                راهنمای پنج‌سؤالی
              </Link>
            </div>
            <div className="sb-hero__microproof">
              <span>اطلاعات بچ پیش از خرید</span>
              <span>مسیر ویژه کلینیک</span>
              <span>مقالات منبع‌دار</span>
            </div>
          </div>

          <figure className="sb-hero__media">
            <BrandStamp />
            <span className="sb-hero__orb sb-hero__orb--one" />
            <span className="sb-hero__orb sb-hero__orb--two" />
            <div className="sb-hero__photo">
              <img
                src="/images/drive/hero-rejuvenation.webp"
                alt="تصویر ادیتوریال جوان‌سازی پوست از مجموعه Sepiid Beauty"
                width="1400"
                height="933"
                fetchPriority="high"
              />
            </div>
            <figcaption>
              <span>SEPIID EDITORIAL / 01</span>
              <p>علم، ظرافت و انتخاب مسئولانه</p>
            </figcaption>
            <div className="sb-hero__quality">
              <ShieldIcon />
              <div>
                <strong>بررسی قبل از ارسال</strong>
                <small>PACK / LOT / CONDITION</small>
              </div>
            </div>
          </figure>
        </div>
      </section>

      <section className="sb-proof-strip">
        <div className="sb-shell sb-proof-strip__grid">
          <article>
            <ShieldIcon />
            <div>
              <strong>اصالت، یک ادعا نیست</strong>
              <p>بچ‌کد، تاریخ، پلمب و وضعیت بسته را پیش از ارسال کنترل می‌کنیم.</p>
            </div>
            <Link href="/magazine/verify-dermal-filler-authenticity">فرایند بررسی</Link>
          </article>
          <article>
            <PackageIcon />
            <div>
              <strong>تحویل متناسب با محصول</strong>
              <p>زمان و روش ارسال براساس نوع کالا و مقصد هماهنگ می‌شود.</p>
            </div>
            <Link href="/contact">شرایط ارسال</Link>
          </article>
          <article>
            <HeadsetIcon />
            <div>
              <strong>پاسخگوی همیشگی شما</strong>
              <p>برای استعلام، پیگیری و سؤال بعد از تحویل همیشه پاسخگو هستیم.</p>
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
                <h2>مسیرهای اصلی فروشگاه</h2>
              </div>
              <p>دستهٔ موردنظرتان را انتخاب کنید و مستقیم وارد محصولات شوید.</p>
            </div>
            <div className="sb-category-grid">
              {categories.map((category, index) => (
                <Link
                  className="sb-category-card"
                  href={`/shop/${category.slug}`}
                  key={category.slug}
                >
                  <div
                    className="sb-category-card__image"
                    style={{
                      backgroundImage: `url(${category.image})`,
                      backgroundPosition: `${category.position} center`,
                    }}
                  />
                  <div className="sb-category-card__content">
                    <span>۰{index + 1}</span>
                    <div>
                      <h3>{category.title}</h3>
                    </div>
                    <ArrowIcon />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <ProductUseReveal />
      </Reveal>

      <Reveal>
        <section className="sb-section sb-featured-products">
          <div className="sb-shell">
            <div className="sb-section-head sb-section-head--split">
              <div>
                <span className="sb-eyebrow">CURATED / PRODUCTS</span>
                <h2>
                  محصولات منتخب،
                  <em>با اطلاعات روشن.</em>
                </h2>
              </div>
              <div>
                <p>
                  برای هر محصول، مشخصات و مسیر استعلام در دسترس است.
                </p>
                <Link className="sb-text-link" href="/shop">
                  مشاهده همه محصولات
                  <ArrowIcon />
                </Link>
              </div>
            </div>
            <div className="sb-product-grid">
              {featuredProducts.map(
  (product, index) => (
    <ProductCard
      product={product}
      priority={index < 2}
      key={product.slug}
    />
  ),
)}
            </div>
          </div>
        </section>
      </Reveal>

      <HomeFinder products={products} />

      <Reveal>
        <BrandStory />
      </Reveal>

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
              <h2>خرید حرفه‌ای باید قابل برنامه‌ریزی باشد.</h2>
              <p>
                فهرست اقلام، وضعیت موجودی، مشخصات بسته و زمان تحویل را در یک مسیر
                روشن هماهنگ کنید؛ بدون تکرار پیام‌ها و خریدهای اتفاقی.
              </p>
              <ul>
                <li>استعلام چندقلمی و تطبیق عنوان دقیق محصول</li>
                <li>ثبت بچ‌کد و وضعیت بسته برای سفارش</li>
                <li>هماهنگی سفارش‌های دوره‌ای و پیگیری انسانی</li>
              </ul>
              <Link className="sb-btn sb-btn--dark" href="/professional">
                ورود به مسیر حرفه‌ای
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
                  محتوایی برای
                  <em>تصمیم‌های دقیق‌تر.</em>
                </h2>
              </div>
              <div>
                <p>
                  مقاله‌ها بر پایه منابع رسمی و پژوهشی نوشته شده‌اند، تاریخ بازبینی
                  و محدودیت آموزشی دارند و جایگزین مشاوره پزشکی نیستند.
                </p>
                <Link className="sb-text-link" href="/magazine">
                  ورود به مجله
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
  <Link
    href="/brands"
    key={brand}
  >
    {brand}
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
              <h2>قبل از خرید بدانید.</h2>
              <p>پاسخ شفاف به سؤال‌هایی که مستقیماً روی تصمیم و ایمنی اثر دارند.</p>
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
