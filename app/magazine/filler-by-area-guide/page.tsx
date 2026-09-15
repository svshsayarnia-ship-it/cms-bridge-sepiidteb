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
const articleTitle = "فیلر مناسب لب، زیر چشم، گونه، چانه و خط خنده؛ راهنمای انتخاب برای بازار ایران";
const articleDescription =
  "راهنمای کاربردی انتخاب فیلر برای لب، زیر چشم، گونه، خط خنده، چانه و فک با تمرکز بر برندها و الگوهای رایج بازار ایران؛ همراه با پیشنهادهای قابل مقایسه و لینک محصولات.";
const articleImage = "/images/product-fillers-v2.webp";
const articleImageAlt = "راهنمای انتخاب فیلر برای نواحی مختلف صورت";

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
    question: "برای لب، نورامیس بهتر است یا رووفیل؟",
    answer:
      "اگر هدف لب طبیعی و حجم کنترل‌شده باشد، هر دو در بازار ایران زیاد مقایسه می‌شوند. نورامیس Deep معمولاً انتخاب اقتصادی و نرم‌تری برای شروع مقایسه است و رووفیل برای کسانی که فرم مشخص‌تر می‌خواهند بیشتر مطرح می‌شود. انتخاب نهایی به مدل دقیق، فرم لب و نظر پزشک بستگی دارد.",
  },
  {
    question: "برای زیر چشم از چه نوع فیلیری شروع کنیم؟",
    answer:
      "برای زیر چشم، مدل‌های نرم و سبک‌تر که برای ناحیه نازک طراحی شده‌اند منطقی‌تر از فیلرهای حجیم و ساختاری هستند. در منابع ایرانی، مدل‌هایی از ژوویدرم، بلوترو، استایلج و تئوسیال بیشتر برای این ناحیه مطرح می‌شوند. اگر فقط تیرگی دارید و گودی واضحی ندارید، فیلر لزوماً اولین انتخاب نیست.",
  },
  {
    question: "برای گونه و چانه چه نوع فیلیری مناسب‌تر است؟",
    answer:
      "برای گونه، چانه و فک معمولاً فیلرهایی که فرم را بهتر نگه می‌دارند بیشتر بررسی می‌شوند. در بازار ایران، مدل‌های Volume نورامیس، رووفیل و مدل‌های متراکم‌تر خانواده‌های مشابه از گزینه‌های رایج مقایسه هستند.",
  },
  {
    question: "برای خط خنده نورامیس یا رووفیل؟",
    answer:
      "برای خط خنده با شدت متوسط، نورامیس Deep یکی از گزینه‌های رایج بازار ایران است. برای خطوط عمیق‌تر، رووفیل و مدل‌های ساختاری‌تر بیشتر در فهرست مقایسه قرار می‌گیرند. عمق خط و وضعیت قسمت میانی صورت روی انتخاب اثر دارد.",
  },
  {
    question: "فیلر بینی را هم می‌شود مثل لب انتخاب کرد؟",
    answer:
      "نه. بینی ناحیه حساس‌تری است و بهتر است انتخاب محصول در آن کاملاً به پزشک واگذار شود. در این ناحیه، تجربه و ارزیابی پزشک از نام برند مهم‌تر است.",
  },
  {
    question: "فیلرهای حجم بالا را چطور مقایسه کنیم؟",
    answer:
      "حجم بالای بسته به‌تنهایی نشان نمی‌دهد محصول برای یک ناحیه خاص بدن مناسب است. در محصولات حجم بالا اول باید کاربرد رسمی همان مدل، سازنده، حجم واقعی و اصالت بسته بررسی شود و انتخاب ناحیه استفاده به پزشک سپرده شود.",
  },
];

export default function FillerByAreaGuidePage() {
  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            { label: "مجله سپید", href: "/magazine" },
            { label: "فیلر مناسب هر ناحیه" },
          ]}
        />
      </div>

      <header className="sb-article-header">
        <div className="sb-shell sb-article-header__grid">
          <div className="sb-article-header__content">
            <span className="sb-eyebrow">راهنمای انتخاب فیلر برای بازار ایران</span>
            <h1>{articleTitle}</h1>
            <p>
              اگر قرار است برای لب، زیر چشم، گونه یا چانه فیلر انتخاب کنید، جواب
              «همه‌شان خوب‌اند» کمکی نمی‌کند. این راهنما دقیق‌تر می‌گوید برای هر
              ناحیه چه نوع محصولی ارزش مقایسه دارد و از بین گزینه‌های رایج بازار
              ایران، کدام‌ها منطقی‌ترند که اول بررسی شوند.
            </p>
            <div className="sb-article-header__meta">
              <span>تحریریه سپید بیوتی</span>
              <span>بازبینی: ۲۴ شهریور ۱۴۰۵</span>
              <span>
                <ClockIcon />
                ۱۵ دقیقه
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
            <figcaption>انتخاب فیلر را از ناحیه و نتیجه‌ای که می‌خواهید شروع کنید، نه از اسم برند.</figcaption>
          </figure>
        </div>
      </header>

      <section className="sb-article-layout sb-shell">
        <aside className="sb-article-toc">
          <strong>در این مقاله</strong>
          <nav>
            <a href="#quick-guide">پیشنهاد سریع برای هر ناحیه</a>
            <a href="#lips">لب</a>
            <a href="#under-eye">زیر چشم</a>
            <a href="#smile-lines">خط خنده</a>
            <a href="#cheek">گونه</a>
            <a href="#chin-jaw">چانه و فک</a>
            <a href="#nose">بینی</a>
            <a href="#body">محصولات حجم بالا</a>
            <a href="#compare">چطور بین دو محصول انتخاب کنیم؟</a>
            <a href="#faq">سؤالات متداول</a>
            <a href="#sources">منابع بازار ایران</a>
          </nav>
          <p>
            آخرین بازبینی
            <b>۲۴ شهریور ۱۴۰۵</b>
          </p>
        </aside>

        <article className="sb-article-body">
          <section className="sb-article-summary" id="quick-guide">
            <span>اگر فقط ۳۰ ثانیه وقت دارید</span>
            <p>
              برای <strong>لب</strong> معمولاً فیلر نرم‌تر و منعطف‌تر منطقی‌تر است؛
              برای <strong>زیر چشم</strong> مدل سبک و مخصوص ناحیه ظریف؛ برای
              <strong> گونه، چانه و فک</strong> فیلری که فرم را بهتر نگه دارد؛ و برای
              <strong> خط خنده</strong> بسته به عمق خط، گزینه‌ای با قوام متوسط تا
              ساختاری‌تر. اگر فقط به اسم برند نگاه کنید، احتمال انتخاب اشتباه بالا می‌رود.
            </p>
          </section>

          <section>
            <span className="sb-article-body__index">۰۱</span>
            <h2>اول نتیجه‌ای را که می‌خواهید مشخص کنید؛ بعد برند را انتخاب کنید</h2>
            <p>
              فرض کنید سه نفر وارد کلینیک می‌شوند. نفر اول می‌گوید لبم طبیعی بماند
              اما مرتب‌تر شود. نفر دوم می‌گوید زیر چشمم خسته دیده می‌شود. نفر سوم
              فقط نیم‌رخش را نشان می‌دهد و می‌گوید چانه‌ام کمی عقب است. هر سه دنبال
              «فیلر خوب» هستند، اما محصولی که برای یکی منطقی است لزوماً برای دیگری
              انتخاب خوبی نیست.
            </p>
            <p>
              در بازار ایران هم همین الگو دیده می‌شود: کلینیک‌ها برای نواحی متحرک و
              ظریف معمولاً سراغ بافت نرم‌تر می‌روند و برای گونه، چانه و فک گزینه‌های
              ساختاری‌تر را بررسی می‌کنند. پس بهتر است از این سؤال شروع کنید:
              <strong> می‌خواهم چه چیزی در صورتم تغییر کند؟</strong>
            </p>
          </section>

          <section id="lips">
            <span className="sb-article-body__index">۰۲</span>
            <h2>فیلر مناسب لب؛ اگر نتیجه طبیعی می‌خواهید، از این دو گزینه شروع کنید</h2>
            <p>
              برای لب، چیزی که بیشتر از «حجم زیاد» اهمیت دارد حرکت طبیعی و هماهنگی با
              فرم خود لب است. اگر هدفتان این است که لب کمی خوش‌فرم‌تر شود، مرز لب
              بهتر دیده شود یا حجم اضافه‌شده خیلی مصنوعی به نظر نرسد، معمولاً فیلرهای
              نرم‌تر انتخاب منطقی‌تری برای مقایسه هستند.
            </p>
            <div className="sb-article-parent-guide">
              <span>پیشنهاد سپید برای شروع مقایسه</span>
              <p>
                اگر بین برندهای کره‌ای بازار ایران انتخاب می‌کنید، اول
                <strong> نورامیس Deep</strong> و <strong>رووفیل</strong> را کنار هم
                ببینید. نورامیس معمولاً برای نتیجه ملایم‌تر و اقتصادی‌تر مطرح می‌شود؛
                رووفیل بیشتر زمانی جلب توجه می‌کند که فرم مشخص‌تر مدنظر باشد.
              </p>
              <Link href="/product/neuramis-deep-lidocaine">
                مشاهده نورامیس Deep
                <ArrowIcon />
              </Link>
              <Link href="/product/revofil-ultra">
                مشاهده رووفیل
                <ArrowIcon />
              </Link>
            </div>
            <p>
              اگر E.P.T.Q را هم در لیست دارید، نام کامل مدل را قبل از مقایسه قیمت
              مشخص کنید. خانواده E.P.T.Q مدل‌های مختلفی دارد و فقط دیدن نام برند یا
              عبارت «۱ میلی‌لیتر» برای انتخاب کافی نیست.
            </p>
            <div className="sb-article-parent-guide">
              <span>گزینه سوم برای مقایسه</span>
              <Link href="/product/eptq-1ml">
                مشاهده E.P.T.Q یک میلی‌لیتری
                <ArrowIcon />
              </Link>
            </div>
            <p>
              اگر فرم روسی می‌خواهید، قبل از خرید محصول بهتر است تفاوت «فرم روسی» با
              «فیلر مخصوص روسی» را بدانید؛ روسی یک مدل تزریق و نتیجه ظاهری است، نه
              اسم یک سرنگ خاص.
            </p>
            <div className="sb-article-parent-guide">
              <span>قبل از انتخاب برای لب</span>
              <Link href="/magazine/russian-lip-filler-guide">
                راهنمای فیلر لب روسی
                <ArrowIcon />
              </Link>
            </div>
          </section>

          <section id="under-eye">
            <span className="sb-article-body__index">۰۳</span>
            <h2>زیر چشم؛ اینجا من از فیلرهای حجیم و سفت شروع نمی‌کنم</h2>
            <p>
              زیر چشم ناحیه‌ای است که انتخاب اشتباه خیلی زود خودش را نشان می‌دهد.
              اگر فقط تیرگی دارید و گودی واضحی دیده نمی‌شود، من اصلاً فیلر را اولین
              گزینه مقایسه نمی‌گذارم. اگر مشکل اصلی گودی باشد، آن وقت محصولی با بافت
              نرم و سبک که برای ناحیه ظریف بررسی شده، منطقی‌تر از فیلرهای ساختاری است.
            </p>
            <p>
              در سایت‌ها و کلینیک‌های ایرانی، نام‌هایی مثل Juvederm Volbella،
              Belotero، Stylage S و بعضی مدل‌های Teosyal برای زیر چشم بیشتر تکرار
              می‌شوند. نکته مهم این است که «برند» کافی نیست؛ مدل باید مناسب ناحیه نازک
              زیر چشم باشد.
            </p>
            <div className="sb-article-parent-guide">
              <span>پیشنهاد سپید</span>
              <p>
                اگر محصولی که می‌بینید بافت حجیم و ساختاری دارد، برای زیر چشم آن را
                از لیست اولیه کنار بگذارید. اول سراغ مدل‌هایی بروید که صراحتاً برای
                ناحیه ظریف‌تر معرفی شده‌اند.
              </p>
              <Link href="/concerns/under-eye">
                راهنمای گودی، تیرگی و پف زیر چشم
                <ArrowIcon />
              </Link>
            </div>
          </section>

          <section id="smile-lines">
            <span className="sb-article-body__index">۰۴</span>
            <h2>خط خنده؛ برای خط متوسط، نورامیس Deep یکی از اولین مقایسه‌های منطقی است</h2>
            <p>
              اگر خط خنده متوسط است و قرار نیست تغییر خیلی سنگینی ایجاد شود، نورامیس
              Deep یکی از گزینه‌هایی است که در بازار ایران زیاد برای مقایسه مطرح
              می‌شود. اگر خط عمیق‌تر باشد یا صورت به حمایت بیشتری نیاز داشته باشد،
              رووفیل و مدل‌های ساختاری‌تر معمولاً بیشتر وارد بحث می‌شوند.
            </p>
            <p>
              نکته‌ای که در بسیاری از مقاله‌های ایرانی نادیده گرفته می‌شود این است که
              گاهی خود خط خنده تنها مسئله نیست؛ کم‌شدن حجم قسمت میانی صورت هم می‌تواند
              باعث عمیق‌تر دیده‌شدن آن شود. پس اگر کسی فقط به شما گفت «همین خط را پر
              کن»، هنوز یک سؤال باقی است: آیا صورت از قسمت گونه هم حجم از دست داده؟
            </p>
            <div className="sb-article-parent-guide">
              <span>دو گزینه‌ای که ارزش مقایسه دارند</span>
              <Link href="/product/neuramis-deep-lidocaine">
                نورامیس Deep
                <ArrowIcon />
              </Link>
              <Link href="/product/revofil-ultra">
                رووفیل
                <ArrowIcon />
              </Link>
            </div>
          </section>

          <section id="cheek">
            <span className="sb-article-body__index">۰۵</span>
            <h2>گونه؛ اگر لیفت و فرم می‌خواهید، فقط سراغ فیلر نرم نروید</h2>
            <p>
              گونه با لب فرق دارد. اینجا معمولاً هدف فقط «پرشدن» نیست؛ قرار است فرم
              قسمت میانی صورت بهتر دیده شود و برجستگی گونه بعد از چند حرکت صورت از
              بین نرود. به همین دلیل در منابع ایرانی، برای گونه بیشتر از فیلرهایی
              صحبت می‌شود که توان نگهداری فرم بالاتری دارند.
            </p>
            <div className="sb-article-parent-guide">
              <span>پیشنهاد سپید برای گونه</span>
              <p>
                اگر از خانواده نورامیس انتخاب می‌کنید، مدل‌های Volume ارزش بررسی
                بیشتری دارند. در کنار آن، رووفیل هم برای کسی که دنبال فرم مشخص‌تر است
                معمولاً در لیست مقایسه قرار می‌گیرد. اگر E.P.T.Q می‌خواهید، مدل
                متراکم‌تر همان خانواده را با مدل‌های نرم‌تر اشتباه نگیرید.
              </p>
              <Link href="/brands/neuramis">
                دیدن خانواده نورامیس
                <ArrowIcon />
              </Link>
              <Link href="/product/revofil-ultra">
                دیدن رووفیل
                <ArrowIcon />
              </Link>
            </div>
            <p>
              اگر صورت لاغر و کشیده است، حجم زیاد گونه همیشه نتیجه بهتری نمی‌دهد.
              هدف باید متعادل‌ترشدن صورت باشد، نه صرفاً بزرگ‌ترشدن یک ناحیه.
            </p>
          </section>

          <section id="chin-jaw">
            <span className="sb-article-body__index">۰۶</span>
            <h2>چانه و فک؛ اینجا فیلر باید بتواند فرم را نگه دارد</h2>
            <p>
              برای چانه و خط فک معمولاً فیلر نرمِ مخصوص لب انتخاب اول نیست. این ناحیه
              بیشتر به محصولی نیاز دارد که بعد از قرارگرفتن، ساختار و فرم را بهتر حفظ
              کند. به همین دلیل در بازار ایران، نام‌هایی مثل Juvederm Volux،
              Restylane Lyft و مدل‌های Volume در کنار برندهای کره‌ای ساختاری‌تر زیاد
              دیده می‌شوند.
            </p>
            <div className="sb-article-parent-guide">
              <span>اگر از موجودی سپید انتخاب می‌کنید</span>
              <p>
                برای مقایسه اولیه، <strong>رووفیل</strong> و مدل‌های ساختاری‌تر
                <strong> نورامیس</strong> منطقی‌تر از فیلرهای خیلی نرم هستند. اگر
                E.P.T.Q مدنظر است، مدل دقیق و میزان قوام آن را قبل از تصمیم بررسی کنید.
              </p>
              <Link href="/product/revofil-ultra">
                مشاهده رووفیل
                <ArrowIcon />
              </Link>
              <Link href="/brands/neuramis">
                مشاهده مدل‌های نورامیس
                <ArrowIcon />
              </Link>
              <Link href="/product/eptq-1ml">
                مشاهده E.P.T.Q
                <ArrowIcon />
              </Link>
            </div>
            <p>
              اگر مشکل اصلی عقب‌بودن چانه است، اضافه‌کردن حجم به فک بدون توجه به
              چانه ممکن است همان چیزی نباشد که انتظار دارید. نیم‌رخ را کامل ببینید،
              بعد درباره محصول تصمیم بگیرید.
            </p>
          </section>

          <section id="nose">
            <span className="sb-article-body__index">۰۷</span>
            <h2>بینی؛ این تنها بخشی است که من برایش «برند اول» پیشنهاد نمی‌دهم</h2>
            <p>
              برای بینی، مهارت و ارزیابی پزشک مهم‌تر از اسم محصول است. اگر کسی قبل از
              دیدن فرم بینی فقط از روی قیمت یا برند محصول پیشنهاد داد، این برای من
              نشانه خوبی نیست. این ناحیه حساس‌تر است و انتخاب محصول باید کاملاً توسط
              پزشک انجام شود.
            </p>
          </section>

          <section id="body">
            <span className="sb-article-body__index">۰۸</span>
            <h2>فیلرهای حجم بالا؛ ۱۰ یا ۷۰ میلی‌لیتر بودن یعنی «برای بدن» نیست</h2>
            <p>
              در بازار ایران بسته‌های حجم بالا زیاد با عنوان‌هایی مثل «بادی فیلر»
              دیده می‌شوند. اما حجم بسته فقط می‌گوید چقدر محصول داخل آن است؛ نمی‌گوید
              برای کدام ناحیه بدن مجاز یا مناسب است. اینجا بهتر است از خرید بر اساس
              عدد روی جعبه فاصله بگیرید و اول کاربرد رسمی همان مدل را بررسی کنید.
            </p>
            <div className="sb-article-parent-guide">
              <span>برای بررسی مشخصات، نه انتخاب خودسرانه ناحیه</span>
              <Link href="/product/hyamax-contour">
                مشاهده Hyamax Contour
                <ArrowIcon />
              </Link>
              <Link href="/product/rabianca">
                مشاهده Rabianca 70ml
                <ArrowIcon />
              </Link>
            </div>
            <p>
              اگر یک محصول صرفاً حجم زیادی دارد اما سازنده کاربرد ناحیه‌ای آن را روشن
              نکرده، من آن را فقط به‌خاطر «به‌صرفه بودن» وارد لیست انتخاب نمی‌کنم.
            </p>
          </section>

          <section id="compare">
            <span className="sb-article-body__index">۰۹</span>
            <h2>بین دو فیلر مردد هستید؟ این چهار سؤال سریع‌تر از ده تبلیغ جواب می‌دهد</h2>
            <div className="sb-article-table" role="region" aria-label="معیار مقایسه فیلر">
              <table>
                <thead>
                  <tr>
                    <th scope="col">سؤال</th>
                    <th scope="col">اگر جواب روشن نیست</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>مدل کامل محصول چیست؟</td>
                    <td>هنوز مقایسه را شروع نکنید</td>
                  </tr>
                  <tr>
                    <td>برای ناحیه نرم است یا ساختاری؟</td>
                    <td>نام برند به‌تنهایی کافی نیست</td>
                  </tr>
                  <tr>
                    <td>هر سرنگ چند میلی‌لیتر است و چند عدد داخل بسته است؟</td>
                    <td>قیمت‌ها قابل مقایسه نیستند</td>
                  </tr>
                  <tr>
                    <td>اصالت و منبع محصول قابل بررسی است؟</td>
                    <td>از لیست حذفش کنید</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              بعد از این چهار سؤال، معمولاً به جای ده محصول فقط دو یا سه گزینه واقعی
              باقی می‌ماند. این همان جایی است که مقایسه قیمت معنی پیدا می‌کند.
            </p>
            <div className="sb-article-parent-guide">
              <span>حالا گزینه‌ها را کنار هم ببینید</span>
              <p>مدل، حجم، بسته‌بندی و قیمت فیلرهای موجود را مقایسه کنید.</p>
              <Link href="/shop/fillers">
                مشاهده فیلرهای موجود
                <ArrowIcon />
              </Link>
            </div>
          </section>

          <section>
            <span className="sb-article-body__index">۱۰</span>
            <h2>جمع‌بندی پیشنهادی سپید</h2>
            <p>
              اگر بخواهم خیلی ساده جمع‌بندی کنم: برای <strong>لب</strong> اول سراغ
              گزینه‌های نرم‌تر مثل نورامیس Deep و رووفیل بروید و مدل دقیق را مقایسه
              کنید. برای <strong>زیر چشم</strong> فیلرهای سبک و مخصوص ناحیه ظریف را
              در اولویت بگذارید و اگر فقط تیرگی دارید، فیلر را انتخاب پیش‌فرض ندانید.
              برای <strong>خط خنده</strong> نورامیس Deep و رووفیل از گزینه‌های رایج
              بازار ایران برای مقایسه‌اند. برای <strong>گونه، چانه و فک</strong>
              مدل‌های ساختاری‌تر و Volume منطقی‌ترند. برای <strong>بینی</strong> محصول
              را خودتان انتخاب نکنید و تصمیم را به پزشک بسپارید.
            </p>
            <p>
              این‌ها پیشنهادهای اولیه برای کوتاه‌کردن مسیر مقایسه‌اند، نه نسخه درمانی.
              تصمیم نهایی درباره اینکه چه محصولی برای صورت شما مناسب است، با توجه به
              معاینه، فرم صورت، سابقه پزشکی و نظر پزشک انجام می‌شود.
            </p>
          </section>

          <section className="sb-article-faq" id="faq">
            <span className="sb-eyebrow">سؤالات متداول</span>
            <h2>سؤال‌هایی که مشتری ایرانی واقعاً می‌پرسد</h2>
            <FaqList items={faqs} />
          </section>

          <section className="sb-article-sources" id="sources">
            <span className="sb-eyebrow">منابع بررسی بازار ایران</span>
            <h2>الگوی پیشنهادها از کجا آمده است؟</h2>
            <p>
              برای این نسخه، الگوی انتخاب هر ناحیه با چند منبع ایرانیِ پزشکی و
              کلینیکی مقایسه شده تا پیشنهادها فقط از کاتالوگ فروشگاه نیایند.
            </p>
            <ol>
              <li>
                <a href="https://iranianclinic.com/s/injections/filler/lip-filler-injection/" rel="noreferrer" target="_blank">
                  کلینیک زیبایی ایرانیان — فیلر لب
                  <span>↗</span>
                </a>
              </li>
              <li>
                <a href="https://fakhraei.clinic/filler/under-eyes/" rel="noreferrer" target="_blank">
                  کلینیک فخرائی — فیلر زیر چشم
                  <span>↗</span>
                </a>
              </li>
              <li>
                <a href="https://www.darmankade.com/blog/best-laugh-line-filler/" rel="noreferrer" target="_blank">
                  درمانکده — بهترین ژل برای خط خنده
                  <span>↗</span>
                </a>
              </li>
              <li>
                <a href="https://www.darmankade.com/blog/best-chin-filler/" rel="noreferrer" target="_blank">
                  درمانکده — فیلر چانه
                  <span>↗</span>
                </a>
              </li>
              <li>
                <a href="https://iranianclinic.com/s/injections/filler/jaw-contouring/gel-injection/" rel="noreferrer" target="_blank">
                  کلینیک زیبایی ایرانیان — زاویه‌سازی فک
                  <span>↗</span>
                </a>
              </li>
            </ol>
          </section>
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
          publisher: {
            "@type": "Organization",
            name: "Sepiid Beauty",
            url: siteOrigin,
          },
          citation: [
            "https://iranianclinic.com/s/injections/filler/lip-filler-injection/",
            "https://fakhraei.clinic/filler/under-eyes/",
            "https://www.darmankade.com/blog/best-laugh-line-filler/",
            "https://www.darmankade.com/blog/best-chin-filler/",
            "https://iranianclinic.com/s/injections/filler/jaw-contouring/gel-injection/",
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
