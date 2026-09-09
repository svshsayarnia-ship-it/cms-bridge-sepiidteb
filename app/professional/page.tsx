/* eslint-disable @next/next/no-img-element -- local generated imagery */
import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, CheckIcon } from "../components/Icons";
import { ProfessionalForm } from "../components/ProfessionalForm";
import { buildSeoMetadata } from "../lib/seo";

export const metadata = buildSeoMetadata({
  title: "فروش عمده فیلر و مزوژل | خرید کلینیکی سپید بیوتی",
  description:
    "برای خرید عمده فیلر و مزوژل یا سفارش چندقلمی کلینیک، فهرست محصول، مدل و تعداد را یک‌جا بفرستید و موجودی، قیمت و زمان تحویل را استعلام کنید.",
  path: "/professional",
  image: "/images/professional-clinic-v2.webp",
  imageAlt: "خرید عمده فیلر و مزوژل برای پزشکان و کلینیک‌ها",
});

export default function ProfessionalPage() {
  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "خرید عمده و همکاری با کلینیک‌ها" }]} />
      </div>

      <section className="sb-professional-hero">
        <div className="sb-shell sb-professional-hero__grid">
          <div>
            <span className="sb-eyebrow">خرید عمده و همکاری با پزشکان و کلینیک‌ها</span>
            <h1>خرید عمده فیلر و مزوژل؛ فهرست کلینیک را یک‌جا استعلام بگیرید.</h1>
            <p>
              اگر برای کلینیک چند قلم فیلر، مزوژل، اسکین‌بوستر، فرآورده بوتولینوم یا کوکتل مزوتراپی می‌خواهید، لازم نیست برای هر محصول جدا پیام بدهید. نام دقیق محصول، مدل، تعداد و زمان موردنیاز را یک‌جا بفرستید تا موجودی، قیمت و شرایط تحویل هر مورد جداگانه بررسی شود.
            </p>
            <div className="sb-professional-hero__actions">
              <a className="sb-btn sb-btn--gold" href="#brief">
                استعلام خرید عمده
                <ArrowIcon />
              </a>
              <Link className="sb-btn sb-btn--light-outline" href="/shop">
                دیدن محصولات و قیمت‌ها
              </Link>
            </div>
            <small>
              انتخاب و استفاده از محصولات حرفه‌ای باید توسط پزشک یا مسئول فنی واجد صلاحیت انجام شود.
            </small>
          </div>
          <figure>
            <img
              src="/images/professional-clinic-v2.webp"
              alt="متخصص کلینیک در حال بررسی محصولات موردنیاز"
              width="1672"
              height="941"
              fetchPriority="high"
            />
            <figcaption>برای خریدهای عمده، چندقلمی و تکرارشونده</figcaption>
          </figure>
        </div>
      </section>

      <section className="sb-professional-process">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">از استعلام تا تحویل سفارش</span>
              <h2>برای خرید عمده، مدل و تعداد هر قلم را از ابتدا مشخص کنید.</h2>
            </div>
          </div>
          <ol>
            {[
              ["فهرست را بفرستید", "نام دقیق فیلر، مزوژل، بوتاکس یا کوکتل، مدل و تعداد موردنیاز را برای ما می‌فرستید."],
              ["موجودی را چک می‌کنیم", "برای هر قلم، مدل، حجم، نوع بسته و موجودی را جدا بررسی می‌کنیم."],
              ["قیمت و زمان تحویل را می‌گوییم", "قیمت و وضعیت هر مورد را یک‌جا می‌فرستیم تا مقایسه و تصمیم‌گیری سریع‌تر باشد."],
              ["تا تحویل در تماس می‌مانیم", "اگر تعداد یا مدل تغییر کرد، همان گفت‌وگو را ادامه می‌دهید و نیازی به شروع دوباره نیست."],
            ].map(([title, text], index) => (
              <li key={title}>
                <span>۰{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sb-section sb-professional-benefits">
        <div className="sb-shell sb-professional-benefits__grid">
          <div>
            <span className="sb-eyebrow">برای تأمین محصولات کلینیک زیبایی</span>
            <h2>فیلر، مزوژل و اقلام حرفه‌ای موجود را در یک درخواست جمع کنید.</h2>
            <p>
              برای عبارت‌هایی مثل «فروش عمده فیلر و مزوژل» یا «خرید عمده محصولات کلینیک زیبایی»، این صفحه مسیر استعلام چندقلمی سپید بیوتی است. فقط محصولاتی که در فروشگاه یا موجودی تأییدشده سپید بیوتی قرار دارند قابل استعلام هستند؛ عبارت «تجهیزات کلینیک» به معنی عرضه دستگاه‌ها یا کالاهای خارج از کاتالوگ نیست.
            </p>
          </div>
          <div>
            {[
              "چند محصول در یک استعلام",
              "مدل، حجم و نوع بسته مشخص برای هر قلم",
              "موجودی هر محصول به‌صورت جداگانه",
              "قیمت و زمان تحویل روشن پیش از نهایی‌کردن",
              "مناسب برای سفارش‌های تکرارشونده کلینیک",
              "پیگیری مستقیم همان درخواست تا تحویل",
            ].map((item) => (
              <p key={item}>
                <CheckIcon />
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="sb-section">
        <div className="sb-shell sb-product-info-section__grid">
          <div>
            <span className="sb-eyebrow">مسیرهای سریع قبل از استعلام</span>
            <h2>اول محصول و قیمت را ببینید، بعد فهرست خرید را بفرستید.</h2>
            <p>
              برای کم‌شدن رفت‌وبرگشت در استعلام، نام مدل و تعداد را از صفحه همان دسته انتخاب کنید و در فرم خرید عمده وارد کنید.
            </p>
          </div>
          <div className="sb-article-parent-guide">
            <Link href="/shop/fillers">خرید و قیمت فیلر و ژل</Link>
            <Link href="/shop/skin-boosters">خرید و قیمت مزوژل و اسکین‌بوستر</Link>
            <Link href="/shop/botulinum-toxins">خرید و قیمت بوتاکس</Link>
            <Link href="/shop/rejuvenation-cocktails">خرید کوکتل مزوتراپی</Link>
          </div>
        </div>
      </section>

      <section className="sb-professional-brief" id="brief">
        <div className="sb-shell">
          <ProfessionalForm />
        </div>
      </section>
    </main>
  );
}
