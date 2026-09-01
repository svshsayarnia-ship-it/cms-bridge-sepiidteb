import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { ArrowIcon } from "../../../components/Icons";
import { JsonLd } from "../../../components/JsonLd";
import { ProductCard } from "../../../components/ProductCard";
import { isHighVolumeFiller } from "../../../lib/product-volume";
import { buildSeoMetadata } from "../../../lib/seo";
import { siteOrigin } from "../../../lib/site-url";
import { getStorefrontCatalog } from "../../../lib/storefront-catalog";

export const revalidate = 300;

export const metadata: Metadata = buildSeoMetadata({
  title: "خرید فیلر بالای ۲ سی‌سی | فیلرهای حجم بالا و بسته‌های بزرگ",
  description:
    "فیلرهای بالای ۲ سی‌سی و بسته‌های حجم بالا را بر اساس مدل، حجم درج‌شده، تعداد سرنگ و قیمت مقایسه کنید. حجم بسته به‌تنهایی به معنی مناسب‌بودن برای ناحیه خاص نیست.",
  path: "/shop/fillers/high-volume",
  imageAlt: "فیلرهای بالای ۲ سی‌سی و حجم بالا",
});

const faq = [
  {
    question: "فیلر بالای ۲ سی‌سی یعنی چه؟",
    answer:
      "در این صفحه منظور محصول یا گزینه‌ای است که حجم درج‌شده آن بیشتر از ۲ میلی‌لیتر باشد. این عدد فقط مشخصات حجم یا بسته را توصیف می‌کند و به‌تنهایی کاربرد یا ناحیه مصرف را تعیین نمی‌کند.",
  },
  {
    question: "آیا بسته ۱۰ سی‌سی همان فیلر بادی است؟",
    answer:
      "خیر. حجم بالاتر یا بسته ۱۰ سی‌سی به‌تنهایی ثابت نمی‌کند که محصول برای بادی‌فیلر طراحی شده است. نام دقیق مدل، سازنده، برچسب و اطلاعات همان بسته باید جداگانه بررسی شود.",
  },
  {
    question: "قیمت فیلرهای حجم بالا را چطور مقایسه کنیم؟",
    answer:
      "مدل، حجم واقعی هر واحد، تعداد داخل بسته و واحد قیمت باید یکسان باشد. قیمت یک سرنگ را با قیمت یک بسته چندتایی یا حجم متفاوت مقایسه نکنید.",
  },
];

export default async function HighVolumeFillersPage() {
  const { products } = await getStorefrontCatalog();
  const items = products.filter((product) =>
    isHighVolumeFiller({
      category: product.category,
      volume: product.volume,
      variantVolumes: product.variants?.map((variant) => variant.volume),
    }),
  );

  return (
    <main id="main-content" className="sb-category-page">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            { label: "فروشگاه", href: "/shop" },
            { label: "فیلرها", href: "/shop/fillers" },
            { label: "فیلرهای بالای ۲ سی‌سی" },
          ]}
        />
      </div>

      <header className="sb-content-landing__hero">
        <div className="sb-shell">
          <span className="sb-eyebrow">مقایسه بر اساس حجم واقعی بسته</span>
          <h1>خرید و قیمت فیلرهای بالای ۲ سی‌سی</h1>
          <p>
            این صفحه فیلرها و گزینه‌هایی را جمع می‌کند که در مشخصات ثبت‌شده‌شان
            حجم بیشتر از ۲ میلی‌لیتر دیده می‌شود. برای مقایسه قیمت، مدل دقیق، حجم
            هر واحد و تعداد داخل بسته را کنار هم ببینید؛ حجم بالا به‌تنهایی به معنی
            مناسب‌بودن برای ناحیه یا کاربرد مشخص نیست.
          </p>
          <div className="sb-brand-page__stats">
            <span>{items.length} محصول یا خانواده مرتبط</span>
            <Link href="/shop/fillers">
              همه فیلرها
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </header>

      <section className="sb-section">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">محصولات حجم بالا</span>
              <h2>مدل‌ها و بسته‌های بالای ۲ میلی‌لیتر</h2>
              <p>
                فقط محصولاتی نمایش داده می‌شوند که حجم بالاتر از ۲ میلی‌لیتر در
                خود محصول یا یکی از گزینه‌های ثبت‌شده آن‌ها صراحتاً ذکر شده باشد.
              </p>
            </div>
          </div>

          {items.length > 0 ? (
            <div className="sb-product-grid sb-product-grid--three">
              {items.map((product) => (
                <ProductCard product={product} key={product.slug} />
              ))}
            </div>
          ) : (
            <div className="sb-filler-guide__notice">
              <strong>موجودی در حال به‌روزرسانی است</strong>
              <p>
                در حال حاضر محصولی با حجم صریح بالای ۲ میلی‌لیتر در کاتالوگ عمومی
                ثبت نشده است. برای مشاهده همه مدل‌ها به دسته فیلرها برگردید.
              </p>
              <Link href="/shop/fillers">
                مشاهده همه فیلرها
                <ArrowIcon />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="sb-category-seo">
        <div className="sb-shell sb-category-seo__grid">
          <div>
            <span className="sb-eyebrow">قبل از سفارش</span>
            <h2>حجم بالا را با کاربرد محصول اشتباه نگیرید</h2>
          </div>
          <div>
            <p className="sb-category-seo__lead">
              عبارت‌هایی مثل «فیلر ۱۰ سی‌سی»، «فیلر حجم بالا» یا «فیلر بالای ۲
              سی‌سی» درباره حجم یا بسته سؤال می‌کنند؛ اما از روی این عدد نمی‌توان
              ناحیه تزریق یا تناسب محصول را تعیین کرد.
            </p>
            <p>
              پیش از خرید، نام کامل مدل، سازنده، حجم هر سرنگ یا ویال، تعداد داخل
              بسته، تصویر همان موجودی، بچ‌کد و تاریخ را بررسی کنید. اگر هدف شما
              مقایسه همه فیلرهاست، دسته اصلی فیلر را ببینید؛ برای شناخت اصطلاحات و
              معیارهای انتخاب هم راهنمای فیلر را مطالعه کنید.
            </p>
            <div>
              <Link className="sb-text-link" href="/shop/fillers">
                خرید و قیمت همه فیلرها
                <ArrowIcon />
              </Link>{" "}
              <Link className="sb-text-link" href="/guides/dermal-fillers">
                راهنمای انتخاب فیلر
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="sb-section sb-content-landing__faq">
        <div className="sb-shell sb-faq-section__grid">
          <div>
            <span className="sb-eyebrow">پرسش‌های پرتکرار</span>
            <h2>فیلر حجم بالا و بسته‌های بزرگ</h2>
          </div>
          <div>
            {faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "خرید و قیمت فیلرهای بالای ۲ سی‌سی",
          description:
            "مقایسه فیلرها و بسته‌های حجم بالا بر اساس حجم ثبت‌شده، مدل و نوع بسته.",
          url: `${siteOrigin}/shop/fillers/high-volume`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: items.length,
            itemListElement: items.map((product, index) => ({
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
