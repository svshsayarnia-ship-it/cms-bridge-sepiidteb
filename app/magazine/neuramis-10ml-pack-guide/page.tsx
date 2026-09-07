/* eslint-disable @next/next/no-img-element -- local editorial imagery */
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FaqList } from "../../components/FaqList";
import { ArrowIcon, ClockIcon } from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { buildSeoMetadata } from "../../lib/seo";
import { siteOrigin } from "../../lib/site-url";

const articlePath = "/magazine/neuramis-10ml-pack-guide";
const articleTitle = "نورامیس ۱۰ سی‌سی یعنی چه؟ تفاوت بسته ۱۰ عددی با سرنگ ۱ سی‌سی";
const articleDescription =
  "نورامیس ۱۰ سی‌سی همیشه به معنی یک سرنگ ۱۰ میلی‌لیتری نیست. تفاوت بسته ۱۰×۱ میلی‌لیتر با نورامیس تکی، مدل‌ها و روش درست مقایسه قیمت را بخوانید.";

export const metadata: Metadata = buildSeoMetadata({
  title: "نورامیس ۱۰ سی‌سی یعنی چه؟ راهنمای بسته ۱۰ عددی نورامیس",
  description: articleDescription,
  path: articlePath,
  image: "/images/products/neuramis-deep-10-pack.webp",
  imageAlt: "نمای بسته نورامیس ۱۰ عددی شامل سرنگ‌های یک میلی‌لیتری",
  type: "article",
  publishedTime: "2026-09-07",
  modifiedTime: "2026-09-07",
});

const faqs = [
  {
    question: "نورامیس ۱۰ سی‌سی یعنی یک سرنگ ۱۰ میلی‌لیتری؟",
    answer:
      "نه لزوماً. در بعضی فهرست‌های بازار، عبارت ۱۰ سی‌سی برای بسته‌ای با ۱۰ سرنگ یک‌میلی‌لیتری استفاده می‌شود. تعداد سرنگ و حجم هر سرنگ باید روی همان بسته بررسی شود.",
  },
  {
    question: "برای مقایسه قیمت نورامیس تکی و بسته ۱۰ عددی چه چیزی مهم است؟",
    answer:
      "مدل دقیق، تعداد سرنگ، حجم هر سرنگ و واحد قیمت باید یکسان شود. قیمت یک سرنگ را نباید مستقیم با قیمت یک جعبه چندتایی مقایسه کرد.",
  },
  {
    question: "آیا Deep، Volume و Lido بسته‌بندی یکسانی دارند؟",
    answer:
      "ممکن است گزینه‌های بازار و موجودی هر مدل متفاوت باشد. نام مدل و تعداد داخل همان جعبه را پیش از سفارش مبنا قرار دهید.",
  },
];

export default function NeuramisTenMlPackGuidePage() {
  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            { label: "مجله سپید", href: "/magazine" },
            { label: "راهنمای بسته ۱۰ عددی نورامیس" },
          ]}
        />
      </div>

      <header className="sb-article-header">
        <div className="sb-shell sb-article-header__grid">
          <div className="sb-article-header__content">
            <span className="sb-eyebrow">راهنمای انتخاب فیلر</span>
            <h1>{articleTitle}</h1>
            <p>
              عبارت «نورامیس ۱۰ سی‌سی» در بازار می‌تواند گمراه‌کننده باشد. در این
              راهنما روشن می‌کنیم چه زمانی منظور یک بسته ۱۰ × ۱ میلی‌لیتری است و
              برای مقایسه قیمت باید دقیقاً چه واحدی را کنار چه واحدی گذاشت.
            </p>
            <div className="sb-article-header__meta">
              <span>تحریریه سپید بیوتی</span>
              <span>شهریور ۱۴۰۵</span>
              <span>
                <ClockIcon />
                ۶ دقیقه
              </span>
            </div>
          </div>
          <figure>
            <img
              src="/images/products/neuramis-deep-10-pack.webp"
              alt="نمای بسته نورامیس دیپ ۱۰ عددی با سرنگ‌های یک میلی‌لیتری"
              width="1672"
              height="941"
              fetchPriority="high"
            />
            <figcaption>
              برای مقایسه درست، تعداد سرنگ و حجم هر سرنگ را جدا از حجم کل بخوانید.
            </figcaption>
          </figure>
        </div>
      </header>

      <section className="sb-article-layout sb-shell">
        <aside className="sb-article-toc">
          <strong>در این مقاله</strong>
          <nav>
            <a href="#summary">خلاصه سریع</a>
            <a href="#meaning">نورامیس ۱۰ سی‌سی یعنی چه؟</a>
            <a href="#compare">تکی و بسته ۱۰ عددی</a>
            <a href="#price">مقایسه قیمت</a>
            <a href="#models">Deep، Volume و Lido</a>
            <a href="#checklist">چک‌لیست سفارش</a>
            <a href="#faq">پرسش‌های پرتکرار</a>
            <a href="#sources">منابع</a>
          </nav>
          <p>
            آخرین بازبینی محتوایی
            <b>شهریور ۱۴۰۵</b>
          </p>
        </aside>

        <article className="sb-article-body">
          <section className="sb-article-summary" id="summary">
            <span>خلاصه سریع</span>
            <p>
              اگر در یک آگهی یا فهرست فروش نوشته شده «نورامیس ۱۰ سی‌سی»، قبل از
              مقایسه قیمت فرض نکنید که با یک سرنگ بزرگ ۱۰ میلی‌لیتری طرف هستید.
              در ساختار فعلی صفحه نورامیس سپید بیوتی، گزینه‌های ۱۰ میلی‌لیتری به
              شکل بسته ۱۰ سرنگ یک‌میلی‌لیتری نمایش داده می‌شوند. معیار نهایی، نام
              مدل و اطلاعات روی همان بسته است.
            </p>
          </section>

          <div className="sb-article-notice">
            <strong>نکته مهم</strong>
            <p>
              این مطلب برای شناخت بسته‌بندی و مقایسه واحد قیمت است؛ آموزش تزریق یا
              انتخاب محصول برای یک فرد نیست. انتخاب و استفاده از فیلر باید توسط فرد
              واجد صلاحیت انجام شود.
            </p>
          </div>

          <section id="meaning">
            <span className="sb-article-body__index">۰۱</span>
            <h2>نورامیس ۱۰ سی‌سی یعنی چه؟</h2>
            <p>
              «۱۰ سی‌سی» فقط یک عدد حجم است و به‌تنهایی شکل بسته را مشخص نمی‌کند.
              وقتی فروشنده، کاتالوگ یا آگهی از این عبارت استفاده می‌کند، باید مشخص
              شود این ۱۰ میلی‌لیتر چگونه داخل بسته توزیع شده است.
            </p>
            <p>
              در گزینه‌های فعلی نورامیس سپید بیوتی، بسته‌های ۱۰ میلی‌لیتری برای
              مدل‌های مربوط به‌صورت <strong>۱۰ × ۱ میلی‌لیتر</strong> تعریف شده‌اند؛
              یعنی مجموع حجم بسته ۱۰ میلی‌لیتر است، اما هر سرنگ یک میلی‌لیتر حجم
              دارد. بنابراین عبارت «۱۰ میل» را نباید خودکار معادل «یک سرنگ ۱۰
              میلی‌لیتری» دانست.
            </p>
          </section>

          <section id="compare">
            <span className="sb-article-body__index">۰۲</span>
            <h2>نورامیس تکی با بسته ۱۰ عددی چه تفاوتی دارد؟</h2>
            <p>
              اولین تفاوت، واحد فروش است. یک گزینه ممکن است برای یک سرنگ یک‌میلی‌لیتری
              قیمت‌گذاری شده باشد و گزینه دیگر برای یک جعبه شامل چند سرنگ. قبل از
              نتیجه‌گیری درباره ارزان‌تر یا گران‌تر بودن، این دو را به یک واحد
              مشترک تبدیل کنید.
            </p>
            <div className="sb-article-table" role="region" aria-label="مقایسه بسته‌های نورامیس">
              <table>
                <thead>
                  <tr>
                    <th scope="col">عبارت روی صفحه</th>
                    <th scope="col">ساختار بسته</th>
                    <th scope="col">حجم کل</th>
                    <th scope="col">نکته مقایسه</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>۱ سی‌سی</td>
                    <td>۱ سرنگ × ۱ میلی‌لیتر</td>
                    <td>۱ میلی‌لیتر</td>
                    <td>قیمت معمولاً برای همان واحد تکی خوانده می‌شود</td>
                  </tr>
                  <tr>
                    <td>۱۰ × ۱ میل</td>
                    <td>۱۰ سرنگ × ۱ میلی‌لیتر</td>
                    <td>۱۰ میلی‌لیتر</td>
                    <td>قیمت جعبه را با قیمت یک سرنگ اشتباه نگیرید</td>
                  </tr>
                  <tr>
                    <td>«۱۰ سی‌سی» بدون توضیح</td>
                    <td>نامشخص</td>
                    <td>۱۰ میلی‌لیتر ادعاشده</td>
                    <td>قبل از خرید تصویر و تعداد داخل بسته را بخواهید</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="price">
            <span className="sb-article-body__index">۰۳</span>
            <h2>قیمت نورامیس ۱ سی‌سی و ۱۰ سی‌سی را چطور مقایسه کنیم؟</h2>
            <p>
              برای مقایسه قیمت، فقط عدد نهایی را نبینید. در نتایج فروشگاهی بازار
              معمولاً قیمت نورامیس به‌صورت هر سرنگ ۱ سی‌سی نمایش داده می‌شود، در
              حالی که یک بسته چندتایی طبیعتاً عدد نهایی بزرگ‌تری دارد. مقایسه درست
              وقتی ممکن است که مدل و واحد یکسان باشند.
            </p>
            <ul>
              <li>مدل دقیق را یکسان کنید: Deep با Deep، Volume با Volume.</li>
              <li>تعداد سرنگ داخل بسته را مشخص کنید.</li>
              <li>حجم هر سرنگ را جدا از حجم کل جعبه بخوانید.</li>
              <li>مشخص کنید قیمت برای یک عدد است یا کل جعبه.</li>
              <li>قیمت و موجودی روز را روی همان گزینه انتخاب‌شده بررسی کنید.</li>
            </ul>
            <div className="sb-article-parent-guide">
              <span>قیمت و موجودی فعلی</span>
              <p>مدل و حجم را در صفحه محصول انتخاب کنید تا واحد قیمت همان گزینه را ببینید.</p>
              <Link href="/product/neuramis-deep-lidocaine">
                مشاهده نورامیس و انتخاب مدل
                <ArrowIcon />
              </Link>
            </div>
          </section>

          <section id="models">
            <span className="sb-article-body__index">۰۴</span>
            <h2>Deep، Volume و Lido را با هم قاطی نکنید</h2>
            <p>
              نورامیس نام یک خانواده محصول است. Deep، Volume و Lido مدل‌های متفاوتی
              هستند و مقایسه قیمت دو بسته فقط وقتی معنا دارد که مدل، تعداد و حجم
              یکسان باشد. وجود واژه Lidocaine نیز باید در نام کامل همان محصول و روی
              بسته بررسی شود؛ «Lido» و «Lidocaine» را صرفاً از روی شباهت کلمه یکی
              فرض نکنید.
            </p>
            <div className="sb-article-parent-guide">
              <span>راهنمای مدل‌ها</span>
              <Link href="/magazine/neuramis-deep-volume-lido-difference">
                تفاوت نورامیس Deep، Volume و Lido
                <ArrowIcon />
              </Link>
              <Link href="/brands/neuramis">
                مشاهده همه مدل‌های نورامیس
                <ArrowIcon />
              </Link>
            </div>
          </section>

          <section id="checklist">
            <span className="sb-article-body__index">۰۵</span>
            <h2>چک‌لیست کوتاه قبل از سفارش نورامیس چندتایی</h2>
            <p>
              اگر عنوان محصول مبهم است، خرید را فقط بر اساس عکس یا عبارت «۱۰ سی‌سی»
              نهایی نکنید. چهار اطلاعات ساده معمولاً ابهام اصلی را برطرف می‌کند.
            </p>
            <ul>
              <li>نام کامل مدل روی جعبه چیست؟</li>
              <li>داخل جعبه چند سرنگ وجود دارد؟</li>
              <li>حجم هر سرنگ چند میلی‌لیتر است؟</li>
              <li>قیمت اعلام‌شده برای یک سرنگ است یا کل بسته؟</li>
              <li>تصویر، تاریخ، بچ‌کد و سلامت پلمب همان موجودی قابل بررسی است؟</li>
            </ul>
          </section>

          <section className="sb-article-faq" id="faq">
            <span className="sb-eyebrow">پرسش‌های پرتکرار</span>
            <h2>سؤال‌هایی که قبل از مقایسه قیمت مطرح می‌شوند</h2>
            <FaqList items={faqs} />
          </section>

          <section className="sb-article-sources" id="sources">
            <span className="sb-eyebrow">منابع این مطلب</span>
            <h2>منابع مستقیم و قابل بررسی</h2>
            <ol>
              <li>
                <a href="https://medytox.com/page/neuramis_en?site_id=en" rel="noreferrer" target="_blank">
                  Medytox — اطلاعات رسمی خانواده Neuramis
                  <span>↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers"
                  rel="noreferrer"
                  target="_blank"
                >
                  FDA — Dermal Fillers: Benefits and Risks
                  <span>↗</span>
                </a>
              </li>
            </ol>
          </section>

          <div className="sb-article-parent-guide">
            <span>ادامه مسیر خرید</span>
            <p>
              اگر حالا می‌دانید دنبال کدام بسته هستید، مدل را انتخاب کنید و قیمت همان
              واحد را ببینید.
            </p>
            <Link href="/product/neuramis-deep-lidocaine?variant=deep-10ml">
              مشاهده بسته ۱۰ عددی نورامیس Deep
              <ArrowIcon />
            </Link>
          </div>
        </article>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          "@id": `${siteOrigin}${articlePath}#article`,
          headline: articleTitle,
          description: articleDescription,
          image: `${siteOrigin}/images/products/neuramis-deep-10-pack.webp`,
          inLanguage: "fa-IR",
          datePublished: "2026-09-07",
          dateModified: "2026-09-07",
          author: {
            "@type": "Organization",
            name: "تحریریه سپید بیوتی",
          },
          publisher: {
            "@type": "Organization",
            name: "Sepiid Beauty",
            url: siteOrigin,
          },
          mainEntityOfPage: `${siteOrigin}${articlePath}`,
        }}
      />
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
