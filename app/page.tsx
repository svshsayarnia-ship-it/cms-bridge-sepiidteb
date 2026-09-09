/* eslint-disable @next/next/no-img-element -- storefront product media can be local or remote */
import type { Metadata } from "next";
import Link from "next/link";
import { whatsappHref } from "./data";
import { getStorefrontCatalog } from "./lib/storefront-catalog";
import { getStorefrontCategories } from "./lib/storefront-categories";
import { getSitePresentation } from "./lib/site-presentation";
import { getCompactBrandLabel } from "./lib/public-copy";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const revalidate = 300;

const categoryVisuals = [
  "/images/drive/category-fillers.webp",
  "/images/drive/category-skinbooster.webp",
  "/images/drive/category-botox.webp",
  "/images/drive/category-mesotherapy.webp",
  "/images/drive/category-skin.webp",
  "/images/drive/category-supplies.webp",
];

const concerns = [
  {
    title: "کاهش حجم و کانتورینگ",
    href: "/concerns/volume-loss",
    image: "/images/drive/category-fillers.webp",
  },
  {
    title: "خطوط حرکتی و چروک",
    href: "/concerns/dynamic-wrinkles",
    image: "/images/drive/category-botox.webp",
  },
  {
    title: "آبرسانی و کیفیت پوست",
    href: "/guides/dermal-fillers",
    image: "/images/drive/category-skinbooster.webp",
  },
  {
    title: "جوان‌سازی و شادابی پوست",
    href: "/shop/rejuvenation-cocktails",
    image: "/images/drive/category-skin.webp",
  },
  {
    title: "ریزش مو و تقویت",
    href: "/concerns/hair-loss",
    image: "/images/drive/category-mesotherapy.webp",
  },
];

const faqs = [
  {
    question: "قبل از سفارش، روی بسته محصول چه چیزهایی را چک کنم؟",
    answer:
      "نام کامل مدل، حجم، تعداد داخل بسته، سلامت ظاهری بسته و اطلاعات بچ‌کد را با همان کالایی که استعلام کرده‌اید تطبیق دهید.",
  },
  {
    question: "اگر بین دو مدل مردد باشم چه کار کنم؟",
    answer:
      "مدل‌ها را از نظر حجم، بسته‌بندی، برند و مشخصات قابل‌مقایسه کنار هم ببینید و برای انتخاب پزشکی یا تزریقی از فرد واجد صلاحیت کمک بگیرید.",
  },
  {
    question: "قیمت و موجودی محصولات قطعی است؟",
    answer:
      "قیمت و موجودی ممکن است تغییر کند؛ پیش از نهایی‌کردن سفارش، همان مدل و همان بسته با شما دوباره بررسی می‌شود.",
  },
];

function formatToman(value: number) {
  return `${Math.round(value).toLocaleString("fa-IR")} تومان`;
}

export default async function Home() {
  const [{ products }, categories, presentation] = await Promise.all([
    getStorefrontCatalog(),
    getStorefrontCategories(),
    getSitePresentation(),
  ]);

  const pricedProducts = products.filter((product) => {
    const value = Number(
      product.salePrice || product.regularPrice || product.price || product.priceToman,
    );
    return Number.isFinite(value) && value > 0;
  });

  const featuredProducts = (pricedProducts.length >= 4 ? pricedProducts : products).slice(0, 4);
  const heroProduct =
    pricedProducts.find((product) =>
      /juvederm|juvéd|ژوویدرم|ژوودرم/i.test(
        `${product.nameFa ?? ""} ${product.nameEn ?? ""} ${product.brand ?? ""}`,
      ),
    ) ??
    featuredProducts[0] ??
    products[0];

  const heroImage = heroProduct?.image || presentation.home.hero.image;
  const heroName = heroProduct?.nameFa || heroProduct?.nameEn || "محصولات منتخب سپید بیوتی";
  const heroBrand = getCompactBrandLabel(heroProduct?.brand) || "Sepiid Beauty";

  const brandLabels = Array.from(
    new Set(
      products
        .map((product) => getCompactBrandLabel(product.brand))
        .filter((value): value is string => Boolean(value)),
    ),
  ).slice(0, 8);

  return (
    <main id="main-content" className="halo-home">
      <section className="halo-hero" aria-labelledby="halo-home-title">
        <div className="halo-shell halo-hero__grid">
          <div className="halo-hero__copy">
            <span className="halo-eyebrow">NATURAL BEAUTY · REAL CONFIDENCE</span>
            <h1 id="halo-home-title">زیبایی طبیعی با انتخاب حرفه‌ای</h1>
            <p>
              فیلر، مزوژل و محصولات تخصصی زیبایی از برندهای معتبر؛ با اطلاعات شفاف،
              بررسی دقیق مدل و مسیر روشن برای استعلام قیمت و موجودی.
            </p>
            <div className="halo-hero__actions">
              <Link className="halo-btn halo-btn--dark" href="/shop">
                مشاهده محصولات ←
              </Link>
              <Link className="halo-btn halo-btn--ghost" href={whatsappHref()}>
                استعلام قیمت
              </Link>
            </div>
          </div>

          <div className="halo-hero__visual" aria-label={heroName}>
            <div className="halo-hero__product-stage">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={heroProduct?.imageAlt || heroName}
                  width="900"
                  height="680"
                  fetchPriority="high"
                  decoding="async"
                />
              ) : null}
              <div className="halo-hero__product-meta">
                <strong>{heroName}</strong>
                <small>{heroBrand} · انتخاب ویژه سپید</small>
              </div>
            </div>
            <span className="halo-hero__sidecopy">SMOOTHER · FIRMER · MORE YOU</span>
            <div className="halo-hero__pager" aria-hidden="true">
              <span>01</span>
              <span>02</span>
              <span>03</span>
            </div>
          </div>
        </div>

        <div className="halo-proof">
          <div className="halo-shell halo-proof__grid">
            <div className="halo-proof__item">
              <span className="halo-proof__icon">✓</span>
              <span>تضمین اصالت و بررسی بسته</span>
            </div>
            <div className="halo-proof__item">
              <span className="halo-proof__icon">◌</span>
              <span>مشاوره تخصصی قبل از خرید</span>
            </div>
            <div className="halo-proof__item">
              <span className="halo-proof__icon">↗</span>
              <span>ارسال سریع و هماهنگ‌شده</span>
            </div>
            <div className="halo-proof__item">
              <span className="halo-proof__icon">□</span>
              <span>تأمین از منابع معتبر</span>
            </div>
          </div>
        </div>
      </section>

      <section className="halo-quick" aria-label="مسیرهای سریع انتخاب محصول">
        <div className="halo-shell halo-quick__grid">
          <Link className="halo-quick-card" href="/shop">
            <div>
              <strong>اسم محصولم را می‌دانم</strong>
              <small>جستجوی سریع محصول ←</small>
            </div>
            <img src={heroImage || "/images/product-fillers-v2.webp"} alt="" width="120" height="120" loading="lazy" />
          </Link>

          <Link className="halo-quick-card" href="/guides/dermal-fillers">
            <div>
              <strong>بین دو مدل مرددم</strong>
              <small>مقایسه و راهنمای انتخاب ←</small>
            </div>
            <img src="/images/drive/category-fillers.webp" alt="" width="120" height="120" loading="lazy" />
          </Link>

          <Link className="halo-quick-card" href="/concerns/volume-loss">
            <div>
              <strong>براساس کاربرد می‌خواهم</strong>
              <small>شروع از نیاز و دغدغه ←</small>
            </div>
            <img src="/images/drive/category-skinbooster.webp" alt="" width="120" height="120" loading="lazy" />
          </Link>

          <Link className="halo-quick-card" href={whatsappHref()}>
            <div>
              <strong>نیاز به راهنمایی دارم</strong>
              <small>دریافت مشاوره ←</small>
            </div>
            <img src="/images/hero-editorial-portrait.webp" alt="" width="120" height="120" loading="lazy" />
          </Link>
        </div>
      </section>

      <section className="halo-section" id="featured-products">
        <div className="halo-shell">
          <div className="halo-section-head">
            <div>
              <span className="halo-eyebrow">FEATURED PRODUCTS</span>
              <h2>محصولات منتخب سپید بیوتی</h2>
            </div>
            <Link className="halo-text-link" href="/shop">
              مشاهده همه محصولات ←
            </Link>
          </div>

          <div className="halo-product-rail">
            {featuredProducts.map((product) => {
              const price = Number(
                product.salePrice || product.regularPrice || product.price || product.priceToman,
              );
              const brand = getCompactBrandLabel(product.brand);
              return (
                <Link className="halo-product-card" href={`/product/${product.slug}`} key={product.slug}>
                  <div className="halo-product-card__image">
                    <span className="halo-product-card__badge">
                      {product.stockStatus === "instock" ? "موجود" : "استعلام موجودی"}
                    </span>
                    <img
                      src={product.image || "/images/product-category-panorama.webp"}
                      alt={product.imageAlt || product.nameFa || product.nameEn}
                      width="520"
                      height="520"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="halo-product-card__body">
                    <span className="halo-product-card__brand">{brand || product.categoryTitle || "Sepiid Beauty"}</span>
                    <h3>{product.nameFa || product.nameEn}</h3>
                    <div className="halo-product-card__meta">
                      {[product.volume, product.categoryTitle].filter(Boolean).join(" · ")}
                    </div>
                    <div className="halo-product-card__foot">
                      <span className="halo-product-card__price">
                        {Number.isFinite(price) && price > 0 ? formatToman(price) : "استعلام قیمت"}
                      </span>
                      <span className="halo-product-card__go">←</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="halo-authenticity" id="trust">
        <img
          className="halo-authenticity__bg"
          src="/images/magazine-authenticity-v2.webp"
          alt="بررسی اصالت و مشخصات بسته محصول"
          width="1400"
          height="900"
          loading="lazy"
        />
        <div className="halo-shell halo-authenticity__grid">
          <div>
            <span className="halo-eyebrow">SCIENCE · AUTHENTICITY · SAFER BEAUTY</span>
            <h2>اصالت فقط یک برچسب نیست</h2>
            <p>
              ما مدل، بسته‌بندی، اطلاعات بچ‌کد و منبع تأمین را شفاف‌تر می‌کنیم تا قبل از
              سفارش دقیقاً بدانید چه محصولی را بررسی می‌کنید.
            </p>
            <Link className="halo-btn" href="/magazine/verify-dermal-filler-authenticity">
              اطلاعات بیشتر ←
            </Link>
          </div>
          <div className="halo-authenticity__checks">
            <span><i>✓</i> بررسی بچ‌کد و اطلاعات بسته</span>
            <span><i>✓</i> بسته‌بندی و شرایط نگهداری</span>
            <span><i>✓</i> منبع تأمین و زنجیره توزیع</span>
            <span><i>✓</i> اطلاعات کامل مدل و حجم</span>
          </div>
        </div>
      </section>

      <section className="halo-concerns">
        <div className="halo-shell">
          <div className="halo-section-head">
            <div>
              <span className="halo-eyebrow">BY CONCERN</span>
              <h2>براساس دغدغه انتخاب کنید</h2>
            </div>
            <p>به‌جای شروع از اسم برند، می‌توانید از مسئله‌ای که می‌خواهید بهتر بشناسید شروع کنید.</p>
          </div>
          <div className="halo-concern-grid">
            {concerns.map((item) => (
              <Link className="halo-concern-card" href={item.href} key={item.title}>
                <img src={item.image} alt="" width="560" height="420" loading="lazy" />
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="halo-categories">
        <div className="halo-shell">
          <div className="halo-section-head">
            <div>
              <span className="halo-eyebrow">SHOP BY CATEGORY</span>
              <h2>دسته‌بندی‌های اصلی</h2>
            </div>
            <Link className="halo-text-link" href="/shop">ورود به فروشگاه ←</Link>
          </div>
          <div className="halo-category-grid">
            {categories.slice(0, 6).map((category, index) => (
              <Link className="halo-category-card" href={`/shop/${category.slug}`} key={category.slug}>
                <strong>{category.title}</strong>
                <small>مشاهده مدل‌ها و قیمت‌ها</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="halo-clinic">
        <div className="halo-shell halo-clinic__card">
          <div className="halo-clinic__image">
            <img
              src="/images/professional-clinic-v2.webp"
              alt="تأمین محصولات حرفه‌ای برای کلینیک‌ها"
              width="1200"
              height="900"
              loading="lazy"
            />
          </div>
          <div className="halo-clinic__copy">
            <span className="halo-eyebrow">FOR PROFESSIONALS</span>
            <h2>خرید حرفه‌ای برای پزشکان و کلینیک‌ها</h2>
            <p>
              چند قلم محصول را یک‌جا بفرستید تا مدل، تعداد، موجودی، قیمت و زمان تحویل هر قلم
              در یک مسیر روشن پیگیری شود.
            </p>
            <Link className="halo-btn halo-btn--dark" href="/professional">سفارش کلینیکی ←</Link>
          </div>
        </div>
      </section>

      <section className="halo-section halo-section--soft">
        <div className="halo-shell">
          <div className="halo-section-head">
            <div>
              <span className="halo-eyebrow">SELECTED BRANDS</span>
              <h2>برندهای موجود در سپید</h2>
            </div>
            <Link className="halo-text-link" href="/brands">مشاهده برندها ←</Link>
          </div>
          <div className="halo-brand-row">
            {brandLabels.map((label) => (
              <Link className="halo-brand-pill" href="/brands" key={label}>{label}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="halo-section">
        <div className="halo-shell halo-faq">
          <div>
            <span className="halo-eyebrow">BEFORE YOU BUY</span>
            <div className="halo-section-head" style={{ marginTop: 8, marginBottom: 0 }}>
              <div><h2>قبل از خرید، واضح‌تر تصمیم بگیرید</h2></div>
            </div>
          </div>
          <div className="halo-faq__list">
            {faqs.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
