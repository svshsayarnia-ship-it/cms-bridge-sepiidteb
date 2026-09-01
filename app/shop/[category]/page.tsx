import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  catalogCategories,
  getGroupForCategory,
  productHref,
} from "../../catalog";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import {
  FillerCategoryGuide,
  FillerCategoryIntro,
} from "../../components/FillerCategoryContent";
import { ArrowIcon } from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { ProductVisual } from "../../components/product/ProductVisual";
import { ShopCatalog } from "../../components/ShopCatalog";
import { guides } from "../../content-architecture";
import { getEditorialCategoryCopy } from "../../lib/editorial-category-copy";
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
    title: "اسم دقیق محصول",
    body:
      "روی جعبه نام برند و مدل را کامل بخوانید؛ فقط دیدن کلمه «بوتاکس» برای مقایسه دو محصول کافی نیست.",
  },
  {
    title: "تعداد واحد",
    body:
      "عدد واحد را برای همان محصول بخوانید. عدد دو برند مختلف را بدون منبع رسمی معادل هم در نظر نگیرید.",
  },
  {
    title: "جعبه، ویال و بچ",
    body:
      "پلمب، تاریخ، شماره بچ و هماهنگی اطلاعات جعبه و ویال را قبل از سفارش بررسی کنید.",
  },
  {
    title: "نگهداری و حمل",
    body:
      "شرایط نگهداری هر برند را جدا ببینید؛ برای این محصولات یک پاسخ یکسان وجود ندارد.",
  },
] as const;

const skinBoosterFaq = [
  {
    question: "مزوژل و اسکین‌بوستر چه تفاوتی دارند؟",
    answer:
      "این دو عنوان در بازار همیشه تعریف یکسانی ندارند و به‌تنهایی نوع محصول را مشخص نمی‌کنند. نام رسمی مدل، ترکیبات درج‌شده، حجم و نوع بسته را بررسی کنید.",
  },
  {
    question: "برای مقایسه مزوژل به چه چیزهایی توجه کنیم؟",
    answer:
      "مدل دقیق، حجم، تعداد سرنگ یا ویال، قیمت به‌ازای واحد یا جعبه، منبع اطلاعات و وضعیت بسته را کنار هم ببینید. عدد یا نام یک مدل را خودکار با محصول دیگری معادل نگیرید.",
  },
  {
    question: "آیا اسکین‌بوستر همان فیلر است؟",
    answer:
      "نه لزوماً. برخی محصولات این گروه برای بهبود کیفیت ظاهری پوست معرفی می‌شوند و برخی محصولات ژل یا بیورویتالایزر هستند؛ طبقه‌بندی و ویژگی‌های هر مدل باید از منبع همان محصول خوانده شود.",
  },
  {
    question: "قیمت مزوژل برای یک سرنگ است یا یک جعبه؟",
    answer:
      "واحد قیمت بین محصولات یکسان نیست. در صفحه هر محصول، تعداد سرنگ یا ویال و عبارت واحد قیمت را بررسی کنید و در صورت ابهام پیش از سفارش استعلام بگیرید.",
  },
] as const;

const fillerFaq = [
  {
    question: "برای مقایسه فیلرها چه اطلاعاتی باید یکسان باشد؟",
    answer:
      "نام برند، مدل، حجم هر سرنگ و تعداد سرنگ‌های داخل بسته باید یکسان باشد؛ مقایسه دو بسته متفاوت فقط با تکیه بر نام برند دقیق نیست.",
  },
  {
    question: "آیا فیلر یک برند برای همه نواحی مناسب است؟",
    answer:
      "خیر. نام برند به‌تنهایی برای تعیین تناسب محصول کافی نیست. انتخاب مدل، ناحیه و روش استفاده باید توسط فرد واجد صلاحیت انجام شود.",
  },
  {
    question: "پیش از خرید فیلر چه چیزی را از فروشنده بخواهیم؟",
    answer:
      "نام کامل مدل، حجم، تعداد داخل بسته، تصویر همان بسته موجود، تاریخ، بچ‌کد و شرایط تحویل را پیش از پرداخت روشن کنید.",
  },
  {
    question: "چرا قیمت دو فیلر از یک برند متفاوت است؟",
    answer:
      "مدل، حجم، تعداد سرنگ، وضعیت موجودی و مسیر تأمین می‌تواند متفاوت باشد. قیمت را فقط برای مدل و بسته کاملاً یکسان مقایسه کنید.",
  },
] as const;

const cocktailFaq = [
  {
    question: "کوکتل‌های مزوتراپی را با چه معیاری مقایسه کنیم؟",
    answer:
      "نام کامل مدل، ترکیبات درج‌شده، حجم، تعداد ویال یا سرنگ، واحد قیمت و اطلاعات سازنده را کنار هم بخوانید؛ عنوان‌هایی مثل جوان‌سازی یا ضدلک به‌تنهایی کافی نیستند.",
  },
  {
    question: "آیا عنوان ضدریزش یا روشن‌کننده نتیجه را تضمین می‌کند؟",
    answer:
      "خیر. این عنوان‌ها معمولاً توصیف بازاری محصول‌اند و تضمین نتیجه نیستند. علت مشکل و تناسب پروتکل باید جداگانه بررسی شود.",
  },
  {
    question: "قیمت کوکتل برای یک ویال است یا یک جعبه؟",
    answer:
      "واحد قیمت بین محصولات یکسان نیست. تعداد ویال یا سرنگ داخل بسته و عبارت واحد قیمت را در همان صفحه بررسی کنید.",
  },
  {
    question: "آیا کوکتل دور چشم یا مو برای مصرف عمومی است؟",
    answer:
      "خیر. محصولات تزریقی باید فقط مطابق اطلاعات همان محصول و توسط فرد واجد صلاحیت انتخاب و استفاده شوند.",
  },
] as const;

const brighteningFaq = [
  {
    question: "کوکتل‌های روشن‌کننده و ضدلک را چطور مقایسه کنیم؟",
    answer:
      "نام کامل مدل، ترکیبات درج‌شده، حجم، تعداد ویال یا سرنگ و اطلاعات سازنده را کنار هم بررسی کنید. عنوان روشن‌کننده به‌تنهایی مشخصات محصول را ثابت نمی‌کند.",
  },
  {
    question: "آیا کوکتل روشن‌کننده لک را به‌طور قطعی از بین می‌برد؟",
    answer:
      "خیر. لک‌ها علت‌های متفاوتی دارند و هیچ عنوان بازاری تضمین نتیجه نیست. علت لک، موارد منع مصرف و تناسب پروتکل باید توسط فرد واجد صلاحیت بررسی شود.",
  },
  {
    question: "قیمت کوکتل ضدلک برای چه واحدی محاسبه می‌شود؟",
    answer:
      "واحد قیمت ممکن است یک ویال، یک سرنگ یا یک جعبه باشد. تعداد داخل بسته و واحد قیمت همان مدل را پیش از مقایسه بخوانید.",
  },
  {
    question: "پیش از سفارش کوکتل روشن‌کننده چه اطلاعاتی بخواهیم؟",
    answer:
      "تصویر بسته موجود، نام کامل مدل، ترکیبات درج‌شده، تاریخ، بچ‌کد، تعداد داخل بسته و شرایط تحویل را پیش از پرداخت روشن کنید.",
  },
] as const;

const eyeCocktailFaq = [
  {
    question: "برای مقایسه کوکتل‌های دور چشم به چه چیزهایی توجه کنیم؟",
    answer:
      "نام کامل مدل، ترکیبات، حجم، تعداد ویال یا سرنگ، روش نگهداری و واحد قیمت را بررسی کنید؛ ظاهر بسته یا عنوان دور چشم به‌تنهایی کافی نیست.",
  },
  {
    question: "آیا هر محصول دور چشم برای تیرگی، گودی و پف مناسب است؟",
    answer:
      "خیر. تیرگی، گودی، پف و خطوط ظریف علت و شرایط یکسانی ندارند. انتخاب محصول و روش استفاده باید پس از ارزیابی فرد واجد صلاحیت انجام شود.",
  },
  {
    question: "کوکتل دور چشم برای مصرف خانگی است؟",
    answer:
      "محصولات تزریقی برای مصرف خانگی نیستند و باید فقط مطابق اطلاعات همان محصول و توسط فرد واجد صلاحیت استفاده شوند.",
  },
  {
    question: "اگر بسته کوکتل دور چشم آسیب‌دیده باشد چه کار کنیم؟",
    answer:
      "تا بررسی منبع تأمین، پلمب، تاریخ، بچ‌کد و شرایط حمل، پرداخت یا استفاده از بسته آسیب‌دیده را نهایی نکنید.",
  },
] as const;

const hyaluronidaseFaq = [
  {
    question: "برای مقایسه هیالورونیداز چه اطلاعاتی باید بررسی شود؟",
    answer:
      "نام سازنده، قدرت درج‌شده، حجم هر ویال یا آمپول، تعداد داخل بسته، تاریخ و شرایط نگهداری را برای همان مدل بررسی کنید.",
  },
  {
    question: "آیا عدد قدرت در همه برندهای هیالورونیداز قابل‌مقایسه است؟",
    answer:
      "نه لزوماً. عدد و واحد قدرت باید از برگه و بسته همان محصول خوانده شود و نباید دو برند را فقط بر اساس یک عدد مشابه معادل دانست.",
  },
  {
    question: "هیالورونیداز را می‌توان برای مصرف خانگی تهیه کرد؟",
    answer:
      "خیر. این گروه برای استفاده حرفه‌ای است و انتخاب، آماده‌سازی و مصرف آن باید توسط فرد واجد صلاحیت انجام شود.",
  },
  {
    question: "پیش از سفارش هیالورونیداز چه چیزی را از فروشنده بخواهیم؟",
    answer:
      "تصویر همان بسته موجود، نام دقیق، قدرت، تعداد ویال، تاریخ، بچ‌کد، منبع تأمین و شرایط تحویل را قبل از پرداخت دریافت کنید.",
  },
] as const;

const categoryFaq = {
  fillers: fillerFaq,
  "skin-boosters": skinBoosterFaq,
  "rejuvenation-cocktails": cocktailFaq,
  "brightening-cocktails": brighteningFaq,
  "eye-cocktails": eyeCocktailFaq,
  "hair-cocktails": cocktailFaq,
  "hyaluronidase-products": hyaluronidaseFaq,
} as const;

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
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const [{ category: slug }, activeSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const hasSearchParams = Object.keys(activeSearchParams).length > 0;

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

  const metadata = buildSeoMetadata({
    title: isBotulinumCategory
      ? "خرید بوتاکس | قیمت و مقایسه فرآورده‌های بوتولینوم"
      : category.slug === "skin-boosters"
        ? "خرید مزوژل و اسکین‌بوستر | قیمت و مقایسه مدل‌ها"
      : `خرید و قیمت ${category.title}`,
    description: isBotulinumCategory
      ? "قیمت و مقایسه بوتاکس و فرآورده‌های بوتولینوم بر اساس نام دقیق، تعداد واحد، بسته‌بندی و شرایط نگهداری؛ همراه با راهنمای خرید حرفه‌ای."
      : category.slug === "skin-boosters"
        ? "قیمت و مقایسه مزوژل و اسکین‌بوستر بر اساس مدل، حجم، تعداد سرنگ یا ویال، بسته‌بندی و منبع اطلاعات؛ همراه با راهنمای انتخاب حرفه‌ای."
      : `مشاهده قیمت و مقایسه محصولات ${category.title}. ${editorial.intro}`,
    path: `/shop/${category.slug}`,
    image: category.image,
    imageAlt: category.title,
  });

  // Filter and pagination URLs change the client-side catalogue, but do not
  // represent standalone landing pages. Keep their canonical signal pointed at
  // the category while preventing parameter combinations from entering index.
  return hasSearchParams
    ? {
        ...metadata,
        robots: { index: false, follow: true },
      }
    : metadata;
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
              این دسته از محصولات
            </span>

            <h1>خرید و قیمت {category.title}</h1>

            <p>{editorial.intro}</p>

            <div
              className="sb-category-commerce-hero__signals"
              aria-label="اطلاعات خرید این دسته"
            >
              <span>
                <small>تعداد محصولات</small>
                <strong>{priceFormatter.format(items.length)} محصول</strong>
              </span>

              {startingPrice ? (
                <span>
                  <small>شروع قیمت</small>
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
                <span>نام دقیق محصول</span>
                <span>تعداد واحد</span>
                <span>جعبه و بچ</span>
                <span>نگهداری و حمل</span>
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
            aria-label={`تصویر و محصول منتخب ${category.title}`}
          >
            <span className="sb-category-commerce-hero__editorial-label">
              راهنمای این دسته
            </span>

            {featuredEntry ? (
              <Link
                href={productHref(featuredEntry.product)}
                className="sb-category-commerce-hero__featured"
                aria-label={`مشاهده ${featuredEntry.product.nameFa} با قیمت ${formatPrice(featuredEntry.price)}`}
              >
                <span className="sb-category-commerce-hero__product-image">
                  <ProductVisual
                    product={featuredEntry.product}
                    variant="hero"
                    priority
                    showBackground={false}
                    sizes="(max-width: 820px) 44vw, 260px"
                  />
                </span>

                <span className="sb-category-commerce-hero__product-copy">
                  <small>برای شروع، این مدل را ببینید</small>
                  <strong>{featuredEntry.product.nameFa}</strong>
                  {featuredEntry.product.volume ? (
                    <span>{featuredEntry.product.volume}</span>
                  ) : null}
                  <b>{formatPrice(featuredEntry.price)}</b>
                  <em>
                    دیدن محصول
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
          <span>دسته‌های نزدیک:</span>

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

      {category.slug === "fillers" ? <FillerCategoryIntro /> : null}

      <section id="category-products" className="sb-section sb-catalog-section">
        <div className="sb-shell">
          <ShopCatalog
            items={items.map(toPublicProduct)}
            initialCategory={category.slug}
          />
        </div>
      </section>

      {category.slug === "fillers" ? <FillerCategoryGuide /> : null}

      {isBotulinumCategory ? (
        <section
          className={styles.compareSection}
          aria-labelledby="botulinum-comparison-title"
        >
          <div className="sb-shell">
            <div className={styles.comparePanel}>
              <div className={styles.compareHead}>
                <div className={styles.compareHeadCopy}>
                  <p className={styles.kicker}>چهار نکته قبل از خرید</p>
                  <h2 id="botulinum-comparison-title">
                    برای مقایسه بوتاکس، فقط قیمت را نبینید
                  </h2>
                  <p>
                    وقتی قیمت دو محصول را کنار هم می‌گذارید، اول مطمئن شوید مدل، تعداد واحد و نوع بسته واقعاً قابل‌مقایسه هستند.
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
                <span>اگر برای کلینیک می‌خرید</span>
                <p>
                  اینجا برای شناخت و مقایسه محصول است. انتخاب، آماده‌سازی و استفاده از هر فرآورده باید بر اساس اطلاعات همان محصول و توسط فرد واجد صلاحیت انجام شود.
                </p>
                <Link href="/professional">
                  سفارش کلینیکی
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
              راهنمای کوتاه این دسته
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
              <p className={styles.kicker}>سؤال‌های قبل از سفارش</p>
              <h2 id="botulinum-faq-title">
                چند سؤال مهم درباره خرید بوتاکس
              </h2>
              <p>
                جواب‌های کوتاه برای چیزهایی که معمولاً قبل از سفارش باید روشن باشند.
              </p>
              <span className={styles.reviewedAt}>
                آخرین بازبینی: {botulinumGuide.reviewedAt}
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

      {categoryFaq[category.slug as keyof typeof categoryFaq] ? (
        <section
          className={styles.faqSection}
          aria-labelledby={`${category.slug}-faq-title`}
        >
          <div className={`sb-shell ${styles.faqGrid}`}>
            <div className={styles.faqHead}>
              <p className={styles.kicker}>سؤال‌های قبل از سفارش</p>
              <h2 id={`${category.slug}-faq-title`}>
                سؤال‌های مهم درباره {category.title}
              </h2>
              <p>
                قبل از مقایسه قیمت، مدل، حجم و واحد بسته هر محصول را روشن کنید.
              </p>
            </div>

            <div className={styles.faqList}>
              {categoryFaq[category.slug as keyof typeof categoryFaq].map((item) => (
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

    </main>
  );
}
