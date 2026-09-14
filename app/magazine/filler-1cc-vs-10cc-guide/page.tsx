/* eslint-disable @next/next/no-img-element -- local editorial imagery */
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FaqList } from "../../components/FaqList";
import { ArrowIcon, ClockIcon } from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { buildSeoMetadata } from "../../lib/seo";
import { siteOrigin } from "../../lib/site-url";

const articlePath = "/magazine/filler-1cc-vs-10cc-guide";
const articleTitle = "فیلر ۱، ۲ یا ۱۰ سی‌سی؛ تفاوت حجم فیلر چیست؟";
const articleDescription =
  "تفاوت فیلر ۱، ۲ و ۱۰ سی‌سی چیست؟ آیا نورامیس ۱۰ سی‌سی تولید می‌شود؟ راهنمای بررسی حجم، مدل، بسته‌بندی و اصالت فیلر.";
const articleImage = "/images/product-fillers-v2.webp";
const articleImageAlt = "مقایسه حجم فیلر ۱، ۲ و ۱۰ سی‌سی";

export const metadata: Metadata = buildSeoMetadata({
  title: articleTitle,
  description: articleDescription,
  path: articlePath,
  image: articleImage,
  imageAlt: articleImageAlt,
  type: "article",
  publishedTime: "2026-09-15",
  modifiedTime: "2026-09-15",
});

const faqs = [
  {
    question: "یک سی‌سی چند میلی‌لیتر است؟",
    answer: "یک سی‌سی برابر با یک میلی‌لیتر است. بنابراین ۱ سی‌سی همان ۱ میلی‌لیتر حجم دارد.",
  },
  {
    question: "فیلر ۲ سی‌سی یعنی چه؟",
    answer:
      "فیلر ۲ سی‌سی محصولی با حجم ۲ میلی‌لیتر است. این مقدار ممکن است مربوط به یک سرنگ یا مجموع چند سرنگ باشد و باید از روی بسته‌بندی همان محصول بررسی شود.",
  },
  {
    question: "آیا نورامیس ۱۰ سی‌سی تولید می‌شود؟",
    answer:
      "در اطلاعات فعلی وب‌سایت رسمی Medytox، مدل‌های اصلی Neuramis با واحد بسته‌بندی ۱٫۰ میلی‌لیتر معرفی شده‌اند. در بازار، عبارت نورامیس ۱۰ سی‌سی می‌تواند به بسته‌های چندتایی اشاره کند؛ نام مدل، تعداد سرنگ و حجم هر سرنگ باید جداگانه بررسی شود.",
  },
  {
    question: "فیلر ۱۰ سی‌سی بهتر است یا یک سی‌سی؟",
    answer:
      "نمی‌توان فقط بر اساس حجم پاسخ داد. نام مدل، ترکیبات، مشخصات فنی، کاربرد رسمی، بسته‌بندی و اطلاعات سازنده مهم‌تر از عدد حجم هستند.",
  },
  {
    question: "آیا فیلر ۱۰ سی‌سی ماندگاری بیشتری دارد؟",
    answer:
      "حجم بیشتر به‌تنهایی ماندگاری بیشتر را ثابت نمی‌کند. ماندگاری باید برای مدل مشخص و بر اساس اطلاعات معتبر همان محصول بررسی شود.",
  },
  {
    question: "آیا فیلرهای بالای ۲ سی‌سی هم وجود دارند؟",
    answer:
      "بله، محصولات تزریقی با بسته‌بندی‌ها و حجم‌های مختلف عرضه می‌شوند. حجم دقیق هر محصول را باید از اطلاعات سازنده و بسته‌بندی همان مدل بررسی کرد.",
  },
  {
    question: "آیا می‌توان از روی قیمت، اصل یا تقلبی‌بودن فیلر را تشخیص داد؟",
    answer:
      "خیر. قیمت غیرعادی فقط می‌تواند نشانه‌ای برای بررسی بیشتر باشد. نام مدل، بسته‌بندی، بچ‌کد، منبع تأمین و سایر اطلاعات محصول باید کنار هم بررسی شوند.",
  },
];

export default function FillerVolumeGuidePage() {
  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            { label: "مجله سپید", href: "/magazine" },
            { label: "راهنمای حجم فیلر" },
          ]}
        />
      </div>

      <header className="sb-article-header">
        <div className="sb-shell sb-article-header__grid">
          <div className="sb-article-header__content">
            <span className="sb-eyebrow">راهنمای انتخاب فیلر</span>
            <h1>{articleTitle}</h1>
            <p>
              عدد ۱، ۲ یا ۱۰ سی‌سی قبل از هر چیز حجم محصول یا بسته را نشان می‌دهد؛
              نه کیفیت، ماندگاری یا مناسب‌بودن آن برای یک ناحیه خاص. در این راهنما
              یاد می‌گیرید حجم، مدل و واحد بسته‌بندی را درست از هم تفکیک کنید.
            </p>
            <div className="sb-article-header__meta">
              <span>تحریریه سپید بیوتی</span>
              <span>شهریور ۱۴۰۵</span>
              <span>
                <ClockIcon />
                ۹ دقیقه
              </span>
            </div>
          </div>
          <figure>
            <img
              src={articleImage}
              alt={articleImageAlt}
              width="1254"
              height="1254"
              fetchPriority="high"
            />
            <figcaption>
              حجم درج‌شده روی بسته‌بندی، مقدار محصول را نشان می‌دهد و به‌تنهایی
              بیانگر کیفیت یا کاربرد آن نیست.
            </figcaption>
          </figure>
        </div>
      </header>

      <section className="sb-article-layout sb-shell">
        <aside className="sb-article-toc">
          <strong>در این مقاله</strong>
          <nav>
            <a href="#summary">خلاصه سریع</a>
            <a href="#comparison">مقایسه ۱، ۲ و ۱۰ سی‌سی</a>
            <a href="#one-cc">فیلر ۱ سی‌سی چیست؟</a>
            <a href="#two-cc">فیلر ۲ سی‌سی چیست؟</a>
            <a href="#ten-cc">فیلر ۱۰ سی‌سی چیست؟</a>
            <a href="#neuramis">نورامیس ۱۰ سی‌سی</a>
            <a href="#box-vs-needed">حجم بسته و مقدار موردنیاز</a>
            <a href="#price">مقایسه قیمت</a>
            <a href="#trust">بررسی اطلاعات و اصالت</a>
            <a href="#faq">سؤالات متداول</a>
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
              هر سی‌سی برابر با یک میلی‌لیتر است. بنابراین عدد روی سرنگ یا جعبه
              در قدم اول حجم را نشان می‌دهد؛ نه کیفیت. برای مقایسه واقعی فیلرها،
              نام مدل، حجم هر سرنگ، تعداد سرنگ داخل بسته، ترکیبات، کاربرد رسمی و
              اطلاعات سازنده را کنار هم بررسی کنید.
            </p>
          </section>

          <div className="sb-article-notice">
            <strong>یادداشت ایمنی</strong>
            <p>
              این مطلب درباره شناخت حجم و بسته‌بندی فیلرهاست و مقدار مناسب تزریق
              برای یک فرد را تعیین نمی‌کند. انتخاب و استفاده از فیلر باید توسط فرد
              واجد صلاحیت انجام شود.
            </p>
          </div>

          <section id="comparison">
            <span className="sb-article-body__index">۰۱</span>
            <h2>مقایسه حجم فیلرهای ۱، ۲ و ۱۰ سی‌سی</h2>
            <p>
              اگر برای خرید فیلر جست‌وجو کرده باشید، احتمالاً با عبارت‌هایی مانند
              «فیلر یک سی‌سی»، «فیلر ۲ سی‌سی»، «فیلر ۱۰ سی‌سی» یا «نورامیس ۱۰
              سی‌سی» روبه‌رو شده‌اید. عدد درج‌شده پیش از هر چیز حجم محصول یا مجموع
              حجم یک بسته را بیان می‌کند.
            </p>
            <div className="sb-article-table" role="region" aria-label="مقایسه حجم فیلرهای ۱، ۲ و ۱۰ سی‌سی">
              <table>
                <thead>
                  <tr>
                    <th scope="col">حجم فیلر</th>
                    <th scope="col">معادل میلی‌لیتر</th>
                    <th scope="col">چه چیزی را نشان می‌دهد؟</th>
                    <th scope="col">نکته مهم</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>۱ سی‌سی</td>
                    <td>۱ میلی‌لیتر</td>
                    <td>حجم ماده داخل سرنگ یا بسته</td>
                    <td>حجم کمتر به‌تنهایی به معنای کیفیت پایین‌تر نیست</td>
                  </tr>
                  <tr>
                    <td>۲ سی‌سی</td>
                    <td>۲ میلی‌لیتر</td>
                    <td>حجم کل محصول یا بسته طبق اطلاعات سازنده</td>
                    <td>مشخص کنید حجم مربوط به یک سرنگ است یا مجموع بسته</td>
                  </tr>
                  <tr>
                    <td>۱۰ سی‌سی</td>
                    <td>۱۰ میلی‌لیتر</td>
                    <td>حجم بالاتر محصول یا مجموع حجم بسته</td>
                    <td>حجم بیشتر به‌تنهایی کیفیت یا کاربرد را ثابت نمی‌کند</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              پیش از مقایسه، نام کامل برند و مدل، حجم هر سرنگ، تعداد سرنگ‌ها،
              ترکیبات، کاربرد رسمی، اطلاعات سازنده، بچ‌کد، تاریخ و شرایط نگهداری را
              بررسی کنید.
            </p>
          </section>

          <section id="one-cc">
            <span className="sb-article-body__index">۰۲</span>
            <h2>فیلر ۱ سی‌سی چیست؟</h2>
            <p>
              عبارت ۱ میلی‌لیتر یا ۱ سی‌سی یعنی حجم ماده داخل سرنگ یک میلی‌لیتر
              است. بسیاری از فیلرهای صورت در سرنگ‌های یک سی‌سی عرضه می‌شوند؛ اما
              این عدد به‌تنهایی کاربرد یا کیفیت محصول را مشخص نمی‌کند.
            </p>
            <p>
              دو فیلر یک سی‌سی ممکن است از نظر غلظت هیالورونیک اسید، میزان
              کراس‌لینک، وجود لیدوکائین، ویژگی‌های ژل و کاربرد ثبت‌شده با یکدیگر
              تفاوت داشته باشند. سؤال مهم‌تر این است: نام دقیق مدل چیست و سازنده چه
              مشخصاتی برای آن اعلام کرده است؟
            </p>
          </section>

          <section id="two-cc">
            <span className="sb-article-body__index">۰۳</span>
            <h2>فیلر ۲ سی‌سی چیست؟</h2>
            <p>
              فیلر ۲ سی‌سی محصول یا بسته‌ای با حجم درج‌شده دو میلی‌لیتر است. این
              مقدار ممکن است در یک سرنگ یا مجموع چند سرنگ ارائه شود؛ بنابراین باید
              اطلاعات بسته‌بندی را دقیق بخوانید.
            </p>
            <p>
              حجم دو سی‌سی به‌تنهایی نشان‌دهنده غلظت، کیفیت یا کاربرد محصول نیست.
              هنگام مقایسه قیمت نیز مشخص کنید این مقدار مربوط به یک سرنگ است یا کل
              بسته.
            </p>
          </section>

          <section id="ten-cc">
            <span className="sb-article-body__index">۰۴</span>
            <h2>فیلر ۱۰ سی‌سی چیست؟</h2>
            <p>
              «فیلر ۱۰ سی‌سی» معمولاً به محصول یا بسته‌ای با مجموع حجم ۱۰ میلی‌لیتر
              اشاره دارد. در بازار ایران محصولات مختلفی با عنوان فیلر حجم بالا عرضه
              می‌شوند و می‌توانند از نظر برند، مدل، ترکیبات، غلظت، کشور عرضه، مجوزها
              و دستورالعمل رسمی با یکدیگر تفاوت داشته باشند.
            </p>
            <p>
              بنابراین حجم بیشتر، محصول را خودکار قوی‌تر، باکیفیت‌تر یا مناسب‌تر
              نمی‌کند. حتی دو محصولی که هر دو با عنوان «۱۰ سی‌سی» فروخته می‌شوند،
              ممکن است ساختار بسته‌بندی متفاوتی داشته باشند.
            </p>
            <div className="sb-article-parent-guide">
              <span>مثال تخصصی</span>
              <p>برای دیدن تفاوت یک محصول ۱ میلی‌لیتری و نسخه ۱۰ میلی‌لیتری در یک برند مشخص:</p>
              <Link href="/magazine/revofil-10ml-vs-1ml-guide">
                رووفیل ۱۰ سی‌سی یا ۱ سی‌سی؟
                <ArrowIcon />
              </Link>
            </div>
          </section>

          <section id="difference">
            <span className="sb-article-body__index">۰۵</span>
            <h2>تفاوت فیلر ۱ سی‌سی و ۱۰ سی‌سی چیست؟</h2>
            <p>
              تفاوت اصلی، حجم بسته‌بندی است. برای مقایسه فنی باید مشخص شود آیا دو
              محصول اصلاً برای کاربرد مشابه طراحی شده‌اند، نام کامل مدل چیست، حجم
              هر سرنگ و تعداد سرنگ‌ها چقدر است و سازنده چه مشخصاتی اعلام کرده است.
            </p>
            <p>
              بنابراین پرسش «فیلر ۱۰ سی‌سی بهتر است یا یک سی‌سی؟» بدون دانستن نام
              دقیق دو محصول پاسخ کاملی ندارد. سؤال دقیق‌تر این است که دو مدل مشخص
              با حجم و بسته‌بندی مشخص چه تفاوتی دارند.
            </p>
          </section>

          <section id="high-volume">
            <span className="sb-article-body__index">۰۶</span>
            <h2>فیلر حجم بالا چیست و آیا همان فیلر ۱۰ سی‌سی است؟</h2>
            <p>
              «فیلر حجم بالا» اصطلاحی بازاری برای محصولاتی با حجم بیشتر از
              سرنگ‌های رایج یک‌میلی‌لیتری است و برای همه برندها تعریف استاندارد
              واحدی ندارد. اگر فروشنده از این عنوان استفاده می‌کند، نام دقیق برند،
              مدل و حجم اعلام‌شده توسط سازنده را نیز بررسی کنید.
            </p>
          </section>

          <section id="neuramis">
            <span className="sb-article-body__index">۰۷</span>
            <h2>آیا نورامیس ۱۰ سی‌سی دارد؟</h2>
            <p>
              بر اساس اطلاعات فعلی وب‌سایت رسمی Medytox، خانواده Neuramis شامل
              مدل‌هایی مانند Neuramis Light Lidocaine، Neuramis Lidocaine، Neuramis
              Deep، Neuramis Deep Lidocaine و Neuramis Volume Lidocaine است و برای
              مدل‌های نمایش‌داده‌شده واحد بسته‌بندی ۱٫۰ میلی‌لیتر ذکر شده است.
            </p>
            <p>
              در بازار، عبارت «نورامیس ۱۰ سی‌سی» می‌تواند برای یک بسته چندتایی به
              کار برود. بنابراین از روی عنوان فروشنده نتیجه نگیرید که با یک سرنگ ۱۰
              میلی‌لیتری طرف هستید؛ نام کامل مدل، تعداد سرنگ، حجم هر سرنگ، بچ‌کد و
              اطلاعات روی جعبه را با منبع رسمی تطبیق دهید.
            </p>
            <div className="sb-article-parent-guide">
              <span>راهنمای دقیق نورامیس</span>
              <Link href="/magazine/neuramis-10ml-pack-guide">
                نورامیس ۱۰ سی‌سی؛ تفاوت بسته ۱۰ عددی با سرنگ ۱ سی‌سی
                <ArrowIcon />
              </Link>
              <Link href="/magazine/neuramis-deep-volume-lido-difference">
                تفاوت نورامیس Deep، Volume و Lido
                <ArrowIcon />
              </Link>
            </div>
          </section>

          <section id="face-use">
            <span className="sb-article-body__index">۰۸</span>
            <h2>آیا هر فیلر ۱۰ سی‌سی برای صورت مناسب است؟</h2>
            <p>
              صرف مشاهده عبارت «۱۰ سی‌سی» چنین چیزی را ثابت نمی‌کند. حجم بسته
              ارتباط مستقیمی با محل استفاده ندارد و کاربرد محصول باید بر اساس
              دستورالعمل رسمی همان سازنده بررسی شود. ادعاهایی مانند «مناسب برای همه
              نواحی» نیز باید با احتیاط ارزیابی شوند.
            </p>
          </section>

          <section id="check-box">
            <span className="sb-article-body__index">۰۹</span>
            <h2>هنگام خرید فیلر، حجم روی جعبه را چگونه بررسی کنیم؟</h2>
            <p>
              عنوان صفحه فروشگاه به‌تنهایی کافی نیست. روی بسته اصلی باید نام کامل
              محصول، مدل، حجم، سازنده، بچ‌کد، تاریخ و اطلاعات قابل رهگیری درج شده
              باشد و با جزئیات سفارش همخوانی داشته باشد.
            </p>
            <p>
              اگر حجم درج‌شده در صفحه فروش با بسته‌بندی یا اطلاعات سازنده تفاوت
              دارد، پیش از خرید یا استفاده علت آن را مشخص کنید. بررسی اصالت نیز فقط
              با رنگ جعبه یا هولوگرام انجام نمی‌شود.
            </p>
            <div className="sb-article-parent-guide">
              <span>چک‌لیست اصالت</span>
              <Link href="/magazine/verify-dermal-filler-authenticity">
                چطور اصالت فیلر را پیش از خرید بررسی کنیم؟
                <ArrowIcon />
              </Link>
            </div>
          </section>

          <section id="box-vs-needed">
            <span className="sb-article-body__index">۱۰</span>
            <h2>تفاوت حجم بسته با مقدار موردنیاز چیست؟</h2>
            <p>
              حجم بسته فقط مقدار ماده داخل بسته‌بندی را نشان می‌دهد. مقدار موردنیاز
              برای یک فرد، موضوع دیگری است و به ارزیابی تخصصی بستگی دارد. بنابراین
              یک یا ۱۰ سی‌سی بودن فیلر، نیاز پزشکی فرد را تعیین نمی‌کند.
            </p>
          </section>

          <section id="price">
            <span className="sb-article-body__index">۱۱</span>
            <h2>پیش از مقایسه قیمت فیلرها، واحدها را یکسان کنید</h2>
            <p>
              محصولات را فقط بر اساس قیمت نهایی مقایسه نکنید. نام مدل، حجم هر
              سرنگ، تعداد سرنگ‌ها، حجم کل بسته و مشخصات بسته‌بندی را در کنار قیمت
              قرار دهید. ممکن است یک بسته ارزان‌تر به نظر برسد، اما حجم یا مدل
              متفاوتی داشته باشد.
            </p>
            <div className="sb-article-parent-guide">
              <span>مشاهده محصولات</span>
              <p>مدل، حجم و بسته‌بندی فیلرها را در یک واحد قابل مقایسه بررسی کنید.</p>
              <Link href="/shop/fillers">
                مشاهده فیلرها و ژل‌های حجم‌دهنده
                <ArrowIcon />
              </Link>
            </div>
          </section>

          <section id="trust">
            <span className="sb-article-body__index">۱۲</span>
            <h2>از کجا بفهمیم اطلاعات یک فیلر قابل اعتماد است؟</h2>
            <p>
              بهترین نقطه شروع، منبع رسمی سازنده است. سپس اطلاعات بسته، بچ‌کد،
              تاریخ و شرایط نگهداری، اسناد عرضه و مشخصات فروشگاه یا تأمین‌کننده را
              با یکدیگر تطبیق دهید. عکس شبکه‌های اجتماعی یا نوشته فروشنده به‌تنهایی
              مشخصات محصول را تأیید نمی‌کند.
            </p>
          </section>

          <section id="conclusion">
            <span className="sb-article-body__index">۱۳</span>
            <h2>جمع‌بندی: ابتدا مدل را بشناسید، سپس حجم را مقایسه کنید</h2>
            <p>
              فیلرهای ۱، ۲ و ۱۰ سی‌سی از نظر حجم بسته‌بندی تفاوت دارند؛ اما این عدد
              به‌تنهایی درباره کیفیت، ماندگاری یا کاربرد محصول تصمیم‌گیری نمی‌کند.
              نام کامل برند و مدل، ترکیبات، مشخصات فنی، حجم هر سرنگ، تعداد داخل بسته
              و اطلاعات سازنده را با هم بخوانید.
            </p>
            <p>
              درباره Neuramis نیز اطلاعات فعلی Medytox برای مدل‌های اصلی معرفی‌شده
              واحد بسته‌بندی ۱٫۰ میلی‌لیتر را نشان می‌دهد؛ بنابراین عنوان «نورامیس
              ۱۰ سی‌سی» باید با ساختار واقعی همان بسته تطبیق داده شود.
            </p>
          </section>

          <section className="sb-article-faq" id="faq">
            <span className="sb-eyebrow">سؤالات متداول درباره حجم فیلر</span>
            <h2>پرسش‌هایی که هنگام مقایسه حجم و بسته‌بندی مطرح می‌شوند</h2>
            <FaqList items={faqs} />
          </section>

          <section className="sb-article-sources" id="sources">
            <span className="sb-eyebrow">منابع این مطلب</span>
            <h2>منابع مستقیم و قابل بررسی</h2>
            <ol>
              <li>
                <a href="https://medytox.com/page/neuramis_en?site_id=en" rel="noreferrer" target="_blank">
                  Medytox — Neuramis Hyaluronic Acid Filler
                  <span>↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers"
                  rel="noreferrer"
                  target="_blank"
                >
                  FDA — Dermal Fillers (Soft Tissue Fillers)
                  <span>↗</span>
                </a>
              </li>
            </ol>
          </section>

          <div className="sb-article-parent-guide">
            <span>قدم بعدی</span>
            <p>اگر مدل مدنظر را می‌دانید، حجم و بسته‌بندی همان محصول را در فروشگاه مقایسه کنید.</p>
            <Link href="/shop/fillers">
              مشاهده فیلرها و ژل‌های حجم‌دهنده
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
          image: `${siteOrigin}${articleImage}`,
          inLanguage: "fa-IR",
          datePublished: "2026-09-15",
          dateModified: "2026-09-15",
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
