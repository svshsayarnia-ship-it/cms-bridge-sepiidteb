/* eslint-disable @next/next/no-img-element -- local editorial imagery */
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FaqList } from "../../components/FaqList";
import { ArrowIcon, ClockIcon } from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { buildSeoMetadata } from "../../lib/seo";
import { siteOrigin } from "../../lib/site-url";

const articlePath = "/magazine/filler-by-area-guide";
const articleTitle = "فیلر مناسب لب، زیر چشم، گونه، چانه و بدن؛ برای هر ناحیه چه چیزی را باید مقایسه کنیم؟";
const articleDescription =
  "راهنمای سناریومحور انتخاب و مقایسه فیلر برای لب، زیر چشم، گونه، خط خنده، چانه، فک و محصولات حجم بالا؛ با منابع رسمی، لینک محصولات و نکات ایمنی.";
const articleImage = "/images/product-fillers-v2.webp";
const articleImageAlt = "نمای ادیتوریال محصولات فیلر برای راهنمای انتخاب بر اساس ناحیه";

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
    question: "برای لب نورامیس بهتر است یا E.P.T.Q؟",
    answer:
      "از روی نام برند به‌تنهایی نمی‌توان یکی را برای همه مناسب‌تر دانست. مدل دقیق محصول، هدف ظاهری، حجم بسته و ارزیابی فرد واجد صلاحیت باید کنار هم بررسی شوند. صفحه محصول برای مقایسه مشخصات است، نه نسخه درمانی.",
  },
  {
    question: "برای زیر چشم چه فیلیری مناسب است؟",
    answer:
      "اول باید روشن شود مسئله اصلی گودی، تیرگی، پف یا ترکیبی از این موارد است. همه این حالت‌ها یک راه‌حل ندارند و ناحیه اطراف چشم از نظر ایمنی حساس است؛ ارزیابی حرفه‌ای قبل از انتخاب محصول ضروری است.",
  },
  {
    question: "برای گونه و چانه فیلر سفت‌تر بهتر است؟",
    answer:
      "نه لزوماً. واژه‌هایی مثل سفت‌تر یا قوی‌تر به‌تنهایی تصمیم‌ساز نیستند. هدف، فرم پایه صورت، مدل مشخص محصول و اطلاعات رسمی همان محصول باید بررسی شود.",
  },
  {
    question: "فیلر ۱۰ سی‌سی بهتر است یا ۱ سی‌سی؟",
    answer:
      "حجم بیشتر به‌تنهایی به معنی کیفیت، ماندگاری یا مناسب‌بودن برای ناحیه‌ای خاص نیست. نام مدل، حجم هر سرنگ، تعداد داخل بسته، سازنده و کاربرد رسمی محصول مهم‌ترند.",
  },
  {
    question: "آیا فیلر برای فرم‌دهی بدن مناسب است؟",
    answer:
      "برای این موضوع نباید فقط به حجم بالای بسته یا تبلیغ بازار تکیه کرد. FDA درباره تزریق فیلر برای کانتورینگ و افزایش حجم بدن، از جمله باسن و سینه، هشدار داده است. کاربرد و ایمنی هر محصول باید از منبع رسمی و توسط فرد واجد صلاحیت بررسی شود.",
  },
  {
    question: "چطور قیمت دو فیلر را درست مقایسه کنیم؟",
    answer:
      "فقط وقتی مقایسه قیمت معنا دارد که مدل، حجم هر سرنگ، تعداد داخل بسته و واحد فروش روشن باشد. دو قیمت ظاهراً متفاوت ممکن است مربوط به بسته‌های کاملاً متفاوت باشند.",
  },
];

export default function FillerByAreaGuidePage() {
  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            { label: "مجله سپید", href: "/magazine" },
            { label: "راهنمای انتخاب فیلر بر اساس ناحیه" },
          ]}
        />
      </div>

      <header className="sb-article-header">
        <div className="sb-shell sb-article-header__grid">
          <div className="sb-article-header__content">
            <span className="sb-eyebrow">راهنمای انتخاب فیلر</span>
            <h1>{articleTitle}</h1>
            <p>
              اگر یک نفر برای لب، نفر بعدی برای زیر چشم و نفر سوم برای چانه دنبال
              «بهترین فیلر» باشد، جواب یکسان معمولاً جواب خوبی نیست. این راهنما از
              اسم برند شروع نمی‌کند؛ از سؤال واقعی شما شروع می‌کند: دقیقاً قرار است
              چه چیزی تغییر کند؟
            </p>
            <div className="sb-article-header__meta">
              <span>نویسنده: تحریریه سپید بیوتی</span>
              <span>بازبینی منابع: ۲۴ شهریور ۱۴۰۵</span>
              <span>
                <ClockIcon />
                ۱۲ دقیقه
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
              تصویر ادیتوریال برای شناخت خانواده فیلرها؛ تصویر، محل تزریق یا نتیجه
              درمان را نمایش نمی‌دهد.
            </figcaption>
          </figure>
        </div>
      </header>

      <section className="sb-article-layout sb-shell">
        <aside className="sb-article-toc">
          <strong>در این مقاله</strong>
          <nav>
            <a href="#experience">از مسئله واقعی شروع کنیم</a>
            <a href="#lips">فیلر لب</a>
            <a href="#under-eye">زیر چشم</a>
            <a href="#smile-lines">خط خنده</a>
            <a href="#cheek">گونه</a>
            <a href="#chin-jaw">چانه و فک</a>
            <a href="#nose">بینی</a>
            <a href="#body">محصولات حجم بالا و بدن</a>
            <a href="#compare">روش مقایسه محصول</a>
            <a href="#eeat">روش تهیه و بازبینی مطلب</a>
            <a href="#faq">سؤالات متداول</a>
            <a href="#sources">منابع</a>
          </nav>
          <p>
            آخرین بازبینی محتوایی
            <b>۲۴ شهریور ۱۴۰۵</b>
          </p>
        </aside>

        <article className="sb-article-body">
          <section className="sb-article-summary" id="experience">
            <span>خلاصه سریع</span>
            <p>
              انتخاب فیلر از «کدام برند بهتر است؟» شروع نمی‌شود. ابتدا باید ناحیه،
              هدف و مسئله واقعی مشخص شود؛ بعد نام کامل مدل، حجم، تعداد داخل بسته،
              منبع سازنده و وضعیت اصالت همان محصول مقایسه شود. لینک‌های محصول در
              این مقاله برای مقایسه مشخصات هستند و به معنی توصیه تزریق در یک ناحیه
              خاص نیستند.
            </p>
          </section>

          <div className="sb-article-notice">
            <strong>شفافیت پزشکی و ایمنی</strong>
            <p>
              این مقاله نسخه پزشکی یا دستور تزریق نیست. فیلر یک اقدام پزشکی با
              عوارض احتمالی است و انتخاب محصول، ناحیه و مقدار مناسب باید توسط فرد
              واجد صلاحیت انجام شود. FDA نیز درباره خطر ورود ناخواسته فیلر به رگ،
              عوارض جدی بینایی و برخی کاربردهای تأییدنشده هشدار داده است.
            </p>
          </div>

          <section>
            <span className="sb-article-body__index">۰۱</span>
            <h2>سه نفر، یک کلمه؛ سه انتظار کاملاً متفاوت</h2>
            <p>
              نفر اول می‌گوید: «لبم خیلی تغییر نکند، فقط مرتب‌تر شود.» نفر دوم زیر
              چشمش را نشان می‌دهد: «هرچقدر می‌خوابم باز خسته به نظر می‌رسم.» نفر
              سوم عکس نیم‌رخش را باز می‌کند: «چانه‌ام کمی عقب است.» هر سه کلمه
              «فیلر» را جست‌وجو می‌کنند؛ اما اگر برای هر سه یک محصول یا یک پاسخ
              آماده داشته باشیم، احتمالاً از سؤال اصلی جا مانده‌ایم.
            </p>
            <p>
              سؤال دقیق‌تر این است: <strong>قرار است چه چیزی تغییر کند و چرا؟</strong>
              همین سؤال ساده، قیمت‌محوری و برندمحوری را کنار می‌زند و انتخاب را قابل
              مقایسه می‌کند.
            </p>
          </section>

          <section id="lips">
            <span className="sb-article-body__index">۰۲</span>
            <h2>فیلر مناسب لب؛ «بزرگ‌تر» می‌خواهید یا «مرتب‌تر»؟</h2>
            <p>
              دو نفر ممکن است هر دو عبارت «فیلر لب» را سرچ کنند، ولی یکی فقط مرز
              لب واضح‌تر می‌خواهد و دیگری افزایش حجم محسوس. همین تفاوت هدف باعث
              می‌شود جمله «بهترین فیلر لب فلان برند است» بیش از حد ساده باشد.
            </p>
            <p>
              اگر در مرحله مقایسه محصول هستید، می‌توانید مشخصات
              {" "}
              <Link href="/product/neuramis-deep-lidocaine">خانواده نورامیس</Link>
              {" "}
              و
              {" "}
              <Link href="/product/eptq-1ml">E.P.T.Q یک میلی‌لیتری</Link>
              {" "}
              را کنار هم باز کنید؛ اما مدل و حجم را جداگانه بخوانید و نام برند را
              جایگزین ارزیابی حرفه‌ای نکنید.
            </p>
            <div className="sb-article-parent-guide">
              <span>اگر فرم روسی مدنظر شماست</span>
              <p>ابتدا تفاوت فرم و تکنیک را بفهمید؛ «روسی» نام یک سرنگ خاص نیست.</p>
              <Link href="/magazine/russian-lip-filler-guide">
                راهنمای فیلر لب روسی
                <ArrowIcon />
              </Link>
            </div>
          </section>

          <section id="under-eye">
            <span className="sb-article-body__index">۰۳</span>
            <h2>زیر چشم؛ اول بفهمید چیزی که می‌بینید واقعاً چیست</h2>
            <p>
              صبح زیر چشم تیره دیده می‌شود؛ چند دقیقه بعد با تغییر نور، تیرگی کمتر
              می‌شود. ممکن است بخشی از چیزی که «تیرگی» می‌نامید درواقع سایه ناشی از
              گودی باشد. برای فرد دیگری مشکل اصلی رنگ پوست است و برای نفر سوم پف.
              این سه حالت قرار نیست یک مسیر واحد داشته باشند.
            </p>
            <p>
              ناحیه اطراف چشم حساس است. FDA در فهرست کاربردهای تأییدنشده خود به
              تزریق در ناحیه اطراف چشم نیز اشاره می‌کند؛ بنابراین تصمیم‌گیری درباره
              این ناحیه باید با احتیاط و توسط فرد واجد صلاحیت انجام شود.
            </p>
            <div className="sb-article-parent-guide">
              <span>قبل از دیدن برند</span>
              <p>اول فرق گودی، تیرگی و پف را از هم جدا کنید.</p>
              <Link href="/concerns/under-eye">
                راهنمای دور چشم سپید بیوتی
                <ArrowIcon />
              </Link>
            </div>
            <p>
              اگر بعد از ارزیابی حرفه‌ای نام یک محصول مشخص مطرح شد، صفحات
              {" "}
              <Link href="/product/neuramis-deep-lidocaine">نورامیس</Link>
              {" "}
              یا
              {" "}
              <Link href="/product/eptq-1ml">E.P.T.Q</Link>
              {" "}
              را برای مقایسه مدل، حجم و بسته‌بندی ببینید؛ نه برای خودانتخابی محل
              تزریق.
            </p>
          </section>

          <section id="smile-lines">
            <span className="sb-article-body__index">۰۴</span>
            <h2>خط خنده؛ همیشه خود خط، کل داستان نیست</h2>
            <p>
              فردی دو خط کنار دهانش را نشان می‌دهد و می‌گوید «همین‌ها را پر کنید».
              اما وقتی کل صورت دیده می‌شود، ممکن است تغییر حجم قسمت میانی صورت هم
              در ظاهر این خطوط نقش داشته باشد. به همین دلیل دو نفر با خط خنده شبیه
              به هم لزوماً یک تصمیم واحد ندارند.
            </p>
            <p>
              در مرحله مقایسه محصول، به جای «کدام برند ارزان‌تر است؟» حجم، مدل و
              تعداد داخل بسته را کنار هم بگذارید. برای نمونه
              {" "}
              <Link href="/product/alcarisa-family">خانواده آلکاریسا</Link>
              {" "}
              و
              {" "}
              <Link href="/product/neuramis-deep-lidocaine">نورامیس</Link>
              {" "}
              صفحات جداگانه‌ای برای بررسی بسته و مدل دارند.
            </p>
          </section>

          <section id="cheek">
            <span className="sb-article-body__index">۰۵</span>
            <h2>گونه؛ یک نقطه را تغییر می‌دهید، اما کل صورت دیده می‌شود</h2>
            <p>
              گونه فقط یک برجستگی مستقل نیست. تغییر آن می‌تواند روی نیم‌رخ، قسمت
              میانی صورت و نحوه دیده‌شدن خط خنده اثر بگذارد. به همین دلیل «گونه
              بزرگ‌تر» و «گونه متناسب‌تر» یک خواسته نیستند.
            </p>
            <p>
              اگر در مرحله بررسی گزینه‌های بازار هستید، می‌توانید صفحات
              {" "}
              <Link href="/product/neuramis-deep-lidocaine">نورامیس</Link>،
              {" "}
              <Link href="/product/revofil-ultra">رووفیل</Link>
              {" "}
              و
              {" "}
              <Link href="/product/alcarisa-family">آلکاریسا</Link>
              {" "}
              را برای نام مدل، حجم و مشخصات بسته مقایسه کنید. این مقایسه قرار نیست
              یکی را برای همه «برنده» اعلام کند.
            </p>
          </section>

          <section id="chin-jaw">
            <span className="sb-article-body__index">۰۶</span>
            <h2>چانه و خط فک؛ شاید چیزی که می‌خواهید «حجم بیشتر» نباشد</h2>
            <p>
              یک عکس نیم‌رخ گاهی سؤال را عوض می‌کند. ممکن است فرد فکر کند زاویه فک
              بیشتری می‌خواهد، اما مسئله اصلی از نگاه خودش تعادل چانه با بقیه صورت
              باشد. برای نفر دیگری دقیقاً برعکس است. بنابراین قبل از نام محصول،
              باید هدف ظاهری روشن شود.
            </p>
            <p>
              سؤال مفیدتر از «کدام بهتر است؟» این است:
              <strong> چرا این مدل برای هدف من پیشنهاد شده و مشخصات دقیق بسته چیست؟</strong>
            </p>
          </section>

          <section id="nose">
            <span className="sb-article-body__index">۰۷</span>
            <h2>بینی؛ این قسمت را مثل لب و گونه نبینید</h2>
            <p>
              جست‌وجوی «فیلر بینی» رایج است، اما بینی ناحیه‌ای نیست که انتخاب محصول
              در آن فقط به فرم دلخواه یا قیمت خلاصه شود. FDA تزریق فیلر در بینی را
              در فهرست کاربردهای تأییدنشده خود آورده است. این بخش از تصمیم‌گیری باید
              کاملاً حرفه‌ای و مبتنی بر ارزیابی ایمنی باشد.
            </p>
          </section>

          <section id="body">
            <span className="sb-article-body__index">۰۸</span>
            <h2>محصولات حجم بالا؛ عدد بزرگ روی جعبه را با «مناسب برای بدن» اشتباه نگیرید</h2>
            <p>
              در بازار ایران ممکن است بعد از دیدن بسته‌های ۱ میلی‌لیتری، ناگهان با
              محصولاتی با حجم ۱۰ یا ۷۰ میلی‌لیتر روبه‌رو شوید. عدد بزرگ‌تر می‌تواند
              فقط درباره حجم بسته حرف بزند؛ نه درباره محل استفاده، کیفیت یا ایمنی.
            </p>
            <p>
              برای نمونه
              {" "}
              <Link href="/product/hyamax-contour">هایامکس کانتور</Link>
              {" "}
              و
              {" "}
              <Link href="/product/rabianca">رابیانکا ۷۰ میلی‌لیتری</Link>
              {" "}
              صفحات محصول حجم بالاتر دارند. این لینک‌ها برای بررسی هویت، حجم و
              بسته‌بندی محصول هستند و به معنی تأیید استفاده در یک ناحیه بدنی نیستند.
            </p>
            <div className="sb-article-notice">
              <strong>نکته مهم درباره فرم‌دهی بدن</strong>
              <p>
                FDA استفاده از فیلرهای تزریقی برای کانتورینگ یا افزایش حجم بدن، از
                جمله سینه و باسن، را تأیید نکرده و درباره عوارض جدی هشدار داده است.
                قبل از هر تصمیم، کاربرد رسمی همان محصول و مقررات محل درمان را بررسی
                کنید.
              </p>
            </div>
          </section>

          <section id="compare">
            <span className="sb-article-body__index">۰۹</span>
            <h2>تست ۳۰ ثانیه‌ای قبل از مقایسه قیمت</h2>
            <p>
              اگر بین دو محصول مردد هستید، قبل از قیمت چهار چیز را روی یک خط بنویسید:
            </p>
            <div className="sb-article-table" role="region" aria-label="چهار معیار مقایسه فیلر">
              <table>
                <thead>
                  <tr>
                    <th scope="col">معیار</th>
                    <th scope="col">سؤال ساده</th>
                    <th scope="col">چرا مهم است؟</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>مدل دقیق</td>
                    <td>اسم کامل روی جعبه چیست؟</td>
                    <td>یک برند می‌تواند چند مدل متفاوت داشته باشد</td>
                  </tr>
                  <tr>
                    <td>حجم</td>
                    <td>هر سرنگ چند میلی‌لیتر است؟</td>
                    <td>قیمت دو حجم متفاوت را نباید مستقیم مقایسه کرد</td>
                  </tr>
                  <tr>
                    <td>تعداد</td>
                    <td>داخل بسته چند سرنگ یا ویال است؟</td>
                    <td>واحد فروش می‌تواند قیمت ظاهری را تغییر دهد</td>
                  </tr>
                  <tr>
                    <td>منبع</td>
                    <td>اطلاعات با سازنده و بسته تطبیق دارد؟</td>
                    <td>اعتماد فقط با ظاهر جعبه یا تبلیغ ساخته نمی‌شود</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              حالا اگر بین دو گزینه مانده‌اید، سؤال شما از «کدام بهتره؟» تبدیل می‌شود
              به «بین این دو مدل با این حجم و این بسته، تفاوت واقعی چیست؟» این سؤال
              هم برای شما روشن‌تر است و هم پاسخ دقیق‌تری می‌گیرد.
            </p>
            <div className="sb-article-parent-guide">
              <span>برای مقایسه حجم‌ها</span>
              <p>فرق ۱، ۲ و ۱۰ سی‌سی و تفاوت حجم هر سرنگ با حجم کل بسته را جدا ببینید.</p>
              <Link href="/magazine/filler-1cc-vs-10cc-guide">
                راهنمای حجم فیلر
                <ArrowIcon />
              </Link>
            </div>
          </section>

          <section>
            <span className="sb-article-body__index">۱۰</span>
            <h2>CTA نامرئی مقاله: اول گزینه اشتباه را حذف کنید</h2>
            <p>
              قرار نیست بعد از خواندن این صفحه فوراً یک محصول انتخاب کنید. قدم بهتر
              این است که گزینه‌هایی را که مدل، حجم یا منبعشان با هدف شما روشن نیست
              از لیست کنار بگذارید. اگر بعد از این مرحله دو یا سه محصول باقی ماند،
              مقایسه آن‌ها بسیار ساده‌تر می‌شود.
            </p>
            <div className="sb-article-parent-guide">
              <span>قدم بعدی</span>
              <p>مدل، حجم، بسته‌بندی و موجودی فیلرها را کنار هم ببینید.</p>
              <Link href="/shop/fillers">
                مشاهده فیلرها و ژل‌های حجم‌دهنده
                <ArrowIcon />
              </Link>
            </div>
          </section>

          <section id="eeat">
            <span className="sb-article-body__index">۱۱</span>
            <h2>این مقاله چطور تهیه و بازبینی شده است؟</h2>
            <p>
              برای اینکه مقاله فقط مجموعه‌ای از ادعاهای فروشگاهی نباشد، بخش‌های
              ایمنی و کاربرد عمومی با منابع رسمی FDA و انجمن جراحان پلاستیک آمریکا
              تطبیق داده شده‌اند. اطلاعات محصولی از صفحات فعلی کاتالوگ سپید بیوتی
              می‌آید و هرجا صفحه محصول لینک شده، هدف مقایسه مدل و بسته است؛ نه
              توصیه درمانی.
            </p>
            <ul>
              <li>نویسنده: تحریریه سپید بیوتی</li>
              <li>تاریخ انتشار و بازبینی: ۲۴ شهریور ۱۴۰۵</li>
              <li>روش بررسی: منابع رسمی + تطبیق با مشخصات محصول موجود در سایت</li>
              <li>سیاست ادعا: بدون عبارت «بهترین برای همه»، بدون تضمین نتیجه و بدون نسخه تزریق</li>
              <li>شفافیت تجاری: لینک بعضی محصولات به فروشگاه سپید بیوتی است؛ وجود لینک به معنی توصیه پزشکی آن محصول نیست</li>
            </ul>
            <p>
              اگر مشخصات یک محصول، بسته یا منبع تغییر کند، این صفحه باید دوباره
              بازبینی شود. برای تشخیص اصالت نیز از یک نشانه منفرد مثل رنگ جعبه یا
              QR استفاده نکنید.
            </p>
            <div className="sb-article-parent-guide">
              <span>اعتماد و اصالت</span>
              <Link href="/magazine/verify-dermal-filler-authenticity">
                چطور اصالت فیلر را پیش از خرید بررسی کنیم؟
                <ArrowIcon />
              </Link>
            </div>
          </section>

          <section className="sb-article-faq" id="faq">
            <span className="sb-eyebrow">سؤالات متداول</span>
            <h2>سؤال‌هایی که قبل از انتخاب فیلر واقعاً ارزش پرسیدن دارند</h2>
            <FaqList items={faqs} />
          </section>

          <section className="sb-article-sources" id="sources">
            <span className="sb-eyebrow">منابع این مطلب</span>
            <h2>منابع مستقیم و قابل بررسی</h2>
            <ol>
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
              <li>
                <a
                  href="https://www.fda.gov/consumers/consumer-updates/dermal-filler-dos-and-donts-wrinkles-lips-and-more"
                  rel="noreferrer"
                  target="_blank"
                >
                  FDA — Dermal Filler Do&apos;s and Don&apos;ts
                  <span>↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.plasticsurgery.org/cosmetic-procedures/dermal-fillers"
                  rel="noreferrer"
                  target="_blank"
                >
                  American Society of Plastic Surgeons — Dermal Fillers
                  <span>↗</span>
                </a>
              </li>
            </ol>
          </section>

          <div className="sb-article-parent-guide">
            <span>مسیر بعدی، بدون فشار خرید</span>
            <p>
              اگر دو یا سه مدل در ذهن دارید، صفحه آن‌ها را باز کنید و فقط مدل، حجم،
              تعداد داخل بسته و منبع را کنار هم بگذارید.
            </p>
            <Link href="/shop/fillers">
              مقایسه فیلرهای موجود
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
            url: `${siteOrigin}/magazine`,
          },
          reviewedBy: {
            "@type": "Organization",
            name: "تیم بازبینی محتوای سپید بیوتی",
            url: `${siteOrigin}/magazine`,
          },
          publisher: {
            "@type": "Organization",
            name: "Sepiid Beauty",
            url: siteOrigin,
          },
          citation: [
            "https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers",
            "https://www.fda.gov/consumers/consumer-updates/dermal-filler-dos-and-donts-wrinkles-lips-and-more",
            "https://www.plasticsurgery.org/cosmetic-procedures/dermal-fillers",
          ],
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
