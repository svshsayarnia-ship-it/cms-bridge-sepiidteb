/* eslint-disable @next/next/no-img-element -- local generated product imagery */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FaqList } from "../../components/FaqList";
import {
  ArrowIcon,
  CheckIcon,
  PackageIcon,
  ShieldIcon,
} from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { ProductCard } from "../../components/ProductCard";
import { getGroupForCategory } from "../../catalog";
import {
  articles,
  getProduct,
  products,
  whatsappHref,
} from "../../data";
import { siteOrigin } from "../../lib/site-url";
import {
  getProductBySlug as getCmsProductBySlug,
  WooCommerceError,
} from "../../lib/woocommerce";

export const dynamic = "force-dynamic";

const priceFormatter = new Intl.NumberFormat("fa-IR");

type ProductPricing = {
  label: string;
  note: string;
};

function formatTomanPrice(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return `${priceFormatter.format(numeric)} تومان`;
}

async function getLiveProductPricing(slug: string): Promise<ProductPricing | null> {
  try {
    const cmsProduct = await getCmsProductBySlug(slug);
    if (!cmsProduct) return null;

    if (cmsProduct.stockStatus === "outofstock") {
      return {
        label: "ناموجود",
        note: "موجودی این محصول در CMS ناموجود ثبت شده است.",
      };
    }

    const salePrice = formatTomanPrice(cmsProduct.salePrice);
    const regularPrice = formatTomanPrice(cmsProduct.regularPrice || cmsProduct.price);
    const livePrice = salePrice || regularPrice;
    if (!livePrice) return null;

    return {
      label: livePrice,
      note: salePrice && regularPrice
        ? `قیمت عادی: ${regularPrice}`
        : "قیمت از CMS / WooCommerce خوانده شده است.",
    };
  } catch (error) {
    if (error instanceof WooCommerceError) return null;
    throw error;
  }
}

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};

  return {
    title: product.nameFa,
    description: `${product.summary} استعلام موجودی، مشخصات بسته و شرایط تحویل از Sepiid Beauty.`,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.nameFa} | Sepiid Beauty`,
      description: product.summary,
      images: [product.image],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const related = products
    .filter((item) => item.category === product.category && item.slug !== product.slug)
    .slice(0, 3);
  const article =
    articles.find((item) => item.relatedProducts.includes(product.slug)) ?? articles[0];
  const image = product.image;
  const group = getGroupForCategory(product.category);
  const livePricing = await getLiveProductPricing(product.slug);
  const inquiryLink = whatsappHref(
    `سلام، برای «${product.nameFa}» موجودی، قیمت و مشخصات بسته موجود را استعلام می‌کنم.`,
  );

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            { label: "فروشگاه", href: "/shop" },
            ...(group
              ? [{ label: group.title, href: `/shop/group/${group.slug}` }]
              : []),
            { label: product.categoryTitle, href: `/shop/${product.category}` },
            { label: product.nameFa },
          ]}
        />
      </div>

      <section className="sb-product-detail">
        <div className="sb-shell sb-product-detail__grid">
          <div className="sb-product-gallery">
            <div className="sb-product-gallery__main">
              <img
                src={image}
                alt={product.imageAlt ?? `تصویر ${product.nameFa}`}
                width="1254"
                height="1254"
                fetchPriority="high"
              />
              <span>
                {product.imageVerified
                  ? "تصویر مجموعه محصول"
                  : "تصویر مفهومی گروه؛ تصویر بسته هنگام استعلام"}
              </span>
            </div>
            <div className="sb-product-gallery__proofs">
              <article>
                <ShieldIcon />
                <strong>بررسی ظاهری</strong>
                <p>پلمب، تاریخ و بچ‌کد قابل مشاهده</p>
              </article>
              <article>
                <PackageIcon />
                <strong>تحویل هماهنگ</strong>
                <p>روش ارسال متناسب با نوع کالا</p>
              </article>
            </div>
          </div>

          <div className="sb-product-summary">
            <div className="sb-product-summary__top">
              <span>{product.categoryTitle}</span>
              <span>{product.brand}</span>
            </div>
            <h1>{product.nameFa}</h1>
            <p className="sb-product-summary__en">{product.nameEn}</p>
            <p className="sb-product-summary__lead">{product.summary}</p>

            <div
              className={`sb-product-summary__verification ${
                product.warning ? "sb-product-summary__verification--warning" : ""
              }`}
            >
              <span>وضعیت اطلاعات</span>
              <strong>{product.sourceStatus}</strong>
              {product.warning && <p>{product.warning}</p>}
            </div>

            <div className="sb-product-summary__facts">
              <div>
                <span>مخاطب</span>
                <strong>{product.audience}</strong>
              </div>
              <div>
                <span>وضعیت</span>
                <strong>استعلام پیش از سفارش</strong>
              </div>
            </div>

            <ul className="sb-product-summary__features">
              {product.features.map((feature) => (
                <li key={feature}>
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="sb-product-summary__order">
              <div>
                <span>قیمت و موجودی</span>
                <strong>{livePricing?.label ?? "استعلام همان روز"}</strong>
                <small>
                  {livePricing?.note ?? "اطلاعات ساختگی یا قیمت منقضی نمایش داده نمی‌شود."}
                </small>
              </div>
              <Link className="sb-btn sb-btn--dark" href={inquiryLink}>
                استعلام موجودی و مشخصات همین بچ
                <ArrowIcon />
              </Link>
            </div>
            <p className="sb-product-summary__notice">
              انتخاب و استفاده محصولات تزریقی فقط باید توسط فرد واجد صلاحیت و پس از
              ارزیابی انجام شود.
            </p>
          </div>
        </div>
      </section>

      <nav className="sb-product-anchor-nav" aria-label="بخش‌های صفحه محصول">
        <div className="sb-shell">
          <a href="#specs">مشخصات</a>
          <a href="#authenticity">کنترل اصالت</a>
          <a href="#safety">نکات مهم</a>
          <a href="#questions">پرسش‌ها</a>
        </div>
      </nav>

      <section className="sb-section sb-product-info-section" id="specs">
        <div className="sb-shell sb-product-info-section__grid">
          <div>
            <span className="sb-eyebrow">PRODUCT / SPECIFICATIONS</span>
            <h2>مشخصات برای تصمیم‌گیری</h2>
            <p>
              داده‌های هر بسته ممکن است با بازار یا بچ تغییر کند؛ برچسب و بروشور
              همان محصول مرجع نهایی است.
            </p>
          </div>
          <dl className="sb-spec-table">
            {product.specs.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="sb-product-authenticity" id="authenticity">
        <div className="sb-shell sb-product-authenticity__grid">
          <div>
            <span className="sb-eyebrow sb-eyebrow--gold">SEPIID CHECK / 03 STEPS</span>
            <h2>کنترل اصالت، یک کد یا هولوگرام نیست.</h2>
            <p>
              تصمیم مطمئن‌تر از تطبیق چند نشانه و یک مسیر تأمین قابل‌پیگیری می‌آید.
            </p>
            <Link
              className="sb-text-link sb-text-link--light"
              href="/magazine/verify-dermal-filler-authenticity"
            >
              چک‌لیست کامل بررسی اصالت
              <ArrowIcon />
            </Link>
          </div>
          <ol>
            {product.checks.map((check, index) => (
              <li key={check}>
                <span>۰{index + 1}</span>
                <p>{check}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sb-section sb-product-safety" id="safety">
        <div className="sb-shell sb-product-safety__grid">
          <div className="sb-product-safety__callout">
            <span>محدوده مسئولیت</span>
            <h2>این صفحه، اطلاعات خرید است؛ نه نسخه پزشکی.</h2>
            <p>
              تناسب محصول، منع مصرف، ناحیه و پروتکل باید توسط پزشک بررسی شود. نتیجه
              نیز بین افراد متفاوت است و در این سایت تضمین نمی‌شود.
            </p>
          </div>
          <article>
            <span className="sb-eyebrow">RELATED READING</span>
            <h3>{article.title}</h3>
            <p>{article.excerpt}</p>
            <Link className="sb-text-link" href={`/magazine/${article.slug}`}>
              مطالعه راهنما
              <ArrowIcon />
            </Link>
          </article>
        </div>
      </section>

      <section className="sb-section sb-product-faq" id="questions">
        <div className="sb-shell sb-faq-section__grid">
          <div>
            <span className="sb-eyebrow">PRODUCT / QUESTIONS</span>
            <h2>پرسش‌های همین محصول</h2>
            <p>پاسخ‌های شفاف، بدون ادعای نتیجه قطعی یا توصیه عمومی.</p>
          </div>
          <FaqList items={product.faq} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="sb-section sb-related-products">
          <div className="sb-shell">
            <div className="sb-section-head">
              <div>
                <span className="sb-eyebrow">RELATED / PRODUCTS</span>
                <h2>محصولات دیگر این دسته</h2>
              </div>
              <Link className="sb-text-link" href={`/shop/${product.category}`}>
                مشاهده دسته
                <ArrowIcon />
              </Link>
            </div>
            <div className="sb-product-grid sb-product-grid--three">
              {related.map((item) => (
                <ProductCard product={item} key={item.slug} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="sb-product-mobile-cta">
        <div>
          <span>{product.brand}</span>
          <strong>{livePricing?.label ?? "استعلام روز"}</strong>
        </div>
        <Link href={inquiryLink}>استعلام موجودی و مشخصات</Link>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.nameFa,
          alternateName: product.nameEn,
          brand: {
            "@type": "Brand",
            name: product.brand,
          },
          category: product.categoryTitle,
          description: product.summary,
          image: `${siteOrigin}${image}`,
          url: `${siteOrigin}/product/${product.slug}`,
          audience: {
            "@type": "Audience",
            audienceType: product.audience,
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: product.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />
    </main>
  );
}
