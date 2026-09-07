/* eslint-disable @next/next/no-img-element -- local editorial imagery */
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FaqList } from "../../components/FaqList";
import { ArrowIcon, ClockIcon } from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { buildSeoMetadata } from "../../lib/seo";
import { siteOrigin } from "../../lib/site-url";

const articlePath = "/magazine/jalupro-classic-hmw-super-hydro-guide";
const articleTitle = "جالپرو Classic، HMW یا Super Hydro؟ تفاوت مدل‌ها، ترکیب و بسته‌بندی";
const articleDescription =
  "تفاوت Jalupro Classic، HMW و Super Hydro را بر اساس اطلاعات رسمی سازنده، ترکیب، ساختار بسته و مسیر درست مقایسه قبل از خرید بررسی کنید.";

export const metadata: Metadata = buildSeoMetadata({
  title: "تفاوت جالپرو Classic، HMW و Super Hydro | راهنمای انتخاب",
  description: articleDescription,
  path: articlePath,
  image: "/images/drive/product-jalupro.webp",
  imageAlt: "نمای محصول جالپرو برای مقایسه مدل‌های Classic، HMW و Super Hydro",
  type: "article",
  publishedTime: "2026-09-07",
  modifiedTime: "2026-09-07",
});

const faqs = [
  {
    question: "جالپرو HMW با Classic چه تفاوتی دارد؟",
    answer:
      "طبق اطلاعات رسمی Jalupro، HMW از هیالورونیک اسید با وزن مولکولی بالا همراه مجموعه آمینواسید استفاده می‌کند، در حالی که Classic بر هیالورونیک اسید با وزن مولکولی پایین‌تر و آمینواسیدها تکیه دارد. انتخاب مدل باید با هدف حرفه‌ای و نظر فرد واجد صلاحیت انجام شود.",
  },
  {
    question: "Super Hydro همان HMW است؟",
    answer:
      "خیر. سازنده Super Hydro را به‌عنوان فرمولی با ویسکوزیته بالاتر و تمرکز متفاوت بر پشتیبانی ساختاری معرفی می‌کند. نام، ترکیب و بسته هر مدل را جداگانه بررسی کنید.",
  },
  {
    question: "برای مقایسه قیمت جالپرو چه چیزی مهم است؟",
    answer:
      "مدل دقیق، تعداد اجزای داخل بسته، حجم هر جزء و واحد قیمت باید یکسان باشد. قیمت یک مدل یا بسته را نباید فقط با نام برند با مدل دیگر مقایسه کرد.",
  },
];

export default function JaluproModelsGuidePage() {
  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            { label: "مجله سپید", href: "/magazine" },
            { label: "مقایسه مدل‌های جالپرو" },
          ]}
        />
      </div>

      <header className="sb-article-header">
        <div className="sb-shell sb-article-header__grid">
          <div className="sb-article-header__content">
            <span className="sb-eyebrow">راهنمای اسکین‌بوستر و بیورویتالایزر</span>
            <h1>{articleTitle}</h1>
            <p>
              سه نام Jalupro Classic، HMW و Super Hydro زیر یک برند قرار می‌گیرند،
              اما یک محصول واحد نیستند. تفاوت مدل، ترکیب و ساختار بسته را جدا
              می‌کنیم تا مقایسه قیمت و مشخصات از روی نام برند انجام نشود.
            </p>
            <div className="sb-article-header__meta">
              <span>تحریریه سپید بیوتی</span>
              <span>شهریور ۱۴۰۵</span>
              <span>
                <ClockIcon />
                ۸ دقیقه
              </span>
            </div>
          </div>
          <figure>
            <img
              src="/images/drive/product-jalupro.webp"
              alt="نمای جالپرو برای راهنمای مقایسه Classic، HMW و Super Hydro"
              width="1672"
              height="941"
              fetchPriority="high"
            />
            <figcaption>
              نام برند کافی نیست؛ مدل و ساختار بسته هر Jalupro را جدا بخوانید.
            </figcaption>
          </figure>
        </div>
      </header>

      <section className="sb-article-layout sb-shell">
        <aside className="sb-article-toc">
          <strong>در این مقاله</strong>
          <nav>
            <a href="#summary">خلاصه سریع</a>
            <a href="#classic">Jalupro Classic</a>
            <a href="#hmw">Jalupro HMW</a>
            <a href="#super-hydro">Jalupro Super Hydro</a>
            <a href="#compare">جدول مقایسه</a>
            <a href="#price">مقایسه قیمت و بسته</a>
            <a href="#checklist">چک‌لیست انتخاب</a>
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
              Jalupro در اطلاعات رسمی خود Classic، HMW و Super Hydro را به‌عنوان
              مدل‌های متفاوت معرفی می‌کند. Classic بر هیالورونیک اسید با وزن
              مولکولی پایین و آمینواسیدها، HMW بر هیالورونیک اسید با وزن مولکولی
              بالا همراه آمینواسیدها و Super Hydro بر فرمولی با ویسکوزیته بالاتر و
              هدف ساختاری متفاوت تأکید دارد. این تفاوت‌ها یعنی قیمت و کاربرد تجاری
              هر مدل را باید مستقل مقایسه کرد.
            </p>
          </section>

          <div className="sb-article-notice">
            <strong>نکته مهم</strong>
            <p>
              این مقاله برای شناخت مدل و بسته است، نه انتخاب درمان یا آموزش تزریق.
              تناسب محصول، پروتکل و ناحیه استفاده باید توسط فرد واجد صلاحیت تعیین شود.
            </p>
          </div>

          <section id="classic">
            <span className="sb-article-body__index">۰۱</span>
            <h2>Jalupro Classic چه جایگاهی در خانواده جالپرو دارد؟</h2>
            <p>
              سازنده، Classic را با ترکیب آمینواسیدها و هیالورونیک اسید با وزن
              مولکولی پایین معرفی می‌کند. در صفحه رسمی Jalupro، این مدل در خانواده
              محصولات biorevitalization قرار می‌گیرد و با HMW از نظر نوع جزء
              هیالورونیک اسید یکسان معرفی نشده است.
            </p>
            <p>
              برای خرید، نام «Jalupro» به‌تنهایی کافی نیست؛ باید مشخص شود منظور
              Classic است یا مدل دیگری، چون ساختار بسته و قیمت ممکن است متفاوت باشد.
            </p>
          </section>

          <section id="hmw">
            <span className="sb-article-body__index">۰۲</span>
            <h2>Jalupro HMW چه تفاوتی دارد؟</h2>
            <p>
              اطلاعات رسمی Jalupro برای HMW از یک سرنگ ۱٫۵ میلی‌لیتری سدیم
              هیالورونات با وزن مولکولی بالا و یک جزء آمینواسیدی صحبت می‌کند. در
              کاتالوگ سپید بیوتی نیز HMW به‌صورت یک مدل مستقل و دو جزئی نگهداری
              می‌شود تا قیمت یا بسته آن با Classic اشتباه نشود.
            </p>
            <p>
              بنابراین هنگام مقایسه HMW با Classic، هم نوع مدل و هم ساختار بسته را
              بررسی کنید؛ مقایسه صرفاً بر اساس نام برند یا عدد قیمت کامل نیست.
            </p>
          </section>

          <section id="super-hydro">
            <span className="sb-article-body__index">۰۳</span>
            <h2>Jalupro Super Hydro چرا یک مدل جداست؟</h2>
            <p>
              Jalupro در معرفی رسمی Super Hydro بر فرمول با ویسکوزیته بالاتر و
              پشتیبانی ساختاری عمیق‌تر تأکید می‌کند. همین تعریف نشان می‌دهد Super
              Hydro فقط نام دیگری برای HMW نیست و نباید این دو را در صفحه خرید یا
              مقایسه قیمت معادل فرض کرد.
            </p>
            <p>
              مشخصات دقیق بسته موجود، حجم و برچسب همان محصول باید مرجع نهایی خرید
              باشد؛ چون بازار ممکن است نام‌های کوتاه‌شده یا توضیحات ناقص نمایش دهد.
            </p>
          </section>

          <section id="compare">
            <span className="sb-article-body__index">۰۴</span>
            <h2>مقایسه سریع Classic، HMW و Super Hydro</h2>
            <div className="sb-article-table" role="region" aria-label="مقایسه مدل‌های جالپرو">
              <table>
                <thead>
                  <tr>
                    <th scope="col">مدل</th>
                    <th scope="col">نکته ترکیب</th>
                    <th scope="col">نکته بسته/مقایسه</th>
                    <th scope="col">اشتباه رایج</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Classic</td>
                    <td>آمینواسید + HA با وزن مولکولی پایین‌تر در معرفی رسمی</td>
                    <td>مدل را با نام کامل بررسی کنید</td>
                    <td>فرض اینکه هر Jalupro همان HMW است</td>
                  </tr>
                  <tr>
                    <td>HMW</td>
                    <td>آمینواسید + HA با وزن مولکولی بالا</td>
                    <td>در سپید بیوتی: ساختار دو جزئی، سرنگ ۱٫۵ ml + ویال ۱ ml</td>
                    <td>مقایسه قیمت آن با Classic بدون توجه به بسته</td>
                  </tr>
                  <tr>
                    <td>Super Hydro</td>
                    <td>فرمول با ویسکوزیته بالاتر در معرفی رسمی</td>
                    <td>مدل مستقل؛ مشخصات بسته همان موجودی را ببینید</td>
                    <td>معادل دانستن آن با HMW</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="price">
            <span className="sb-article-body__index">۰۵</span>
            <h2>قیمت مدل‌های جالپرو را چطور مقایسه کنیم؟</h2>
            <p>
              چون مدل‌ها ترکیب و ساختار بسته یکسانی ندارند، یک عدد قیمت پایین‌تر
              لزوماً به معنی گزینه اقتصادی‌تر در همان مقایسه نیست. ابتدا مشخص کنید
              قیمت برای چه مدل و چه بسته‌ای است.
            </p>
            <ul>
              <li>نام کامل مدل: Classic، HMW یا Super Hydro.</li>
              <li>تعداد سرنگ، ویال یا اجزای داخل همان بسته.</li>
              <li>حجم هر جزء و حجم کل قابل مقایسه.</li>
              <li>قیمت اعلام‌شده برای یک جزء یا کل بسته.</li>
            </ul>
          </section>

          <section id="checklist">
            <span className="sb-article-body__index">۰۶</span>
            <h2>چک‌لیست کوتاه قبل از انتخاب مدل Jalupro</h2>
            <ul>
              <li>نام مدل روی جعبه با عنوان صفحه یکی است؟</li>
              <li>ساختار بسته و حجم اجزا مشخص است؟</li>
              <li>قیمت برای همان بسته اعلام شده است؟</li>
              <li>منبع رسمی یا تصویر همان موجودی قابل بررسی است؟</li>
              <li>تاریخ، بچ‌کد و سلامت بسته قبل از نهایی‌کردن سفارش بررسی می‌شود؟</li>
            </ul>
          </section>

          <section className="sb-article-faq" id="faq">
            <span className="sb-eyebrow">پرسش‌های پرتکرار</span>
            <h2>سؤال‌های رایج درباره مدل‌های جالپرو</h2>
            <FaqList items={faqs} />
          </section>

          <section className="sb-article-sources" id="sources">
            <span className="sb-eyebrow">منابع این مطلب</span>
            <h2>منابع رسمی سازنده</h2>
            <ol>
              <li>
                <a href="https://www.jalupro.com/jalupro" rel="noreferrer" target="_blank">
                  Jalupro — معرفی رسمی خانواده محصولات تزریقی
                  <span>↗</span>
                </a>
              </li>
              <li>
                <a href="https://www.jalupro.com/hcp/skin-aging" rel="noreferrer" target="_blank">
                  Jalupro HCP — مشخصات HMW و اطلاعات فنی خانواده
                  <span>↗</span>
                </a>
              </li>
            </ol>
          </section>

          <div className="sb-article-parent-guide">
            <span>ادامه مسیر مقایسه</span>
            <p>
              اگر دنبال HMW هستید، مشخصات و قیمت همان مدل را در صفحه محصول ببینید؛
              برای مقایسه گروه هم می‌توانید به دسته مزوژل و اسکین‌بوستر برگردید.
            </p>
            <Link href="/product/jalupro-hmw">
              مشاهده جالپرو HMW
              <ArrowIcon />
            </Link>
            <Link href="/shop/skin-boosters">
              مقایسه مزوژل و اسکین‌بوسترها
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
          image: `${siteOrigin}/images/drive/product-jalupro.webp`,
          inLanguage: "fa-IR",
          datePublished: "2026-09-07",
          dateModified: "2026-09-07",
          author: { "@type": "Organization", name: "تحریریه سپید بیوتی" },
          publisher: { "@type": "Organization", name: "Sepiid Beauty", url: siteOrigin },
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
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />
    </main>
  );
}
