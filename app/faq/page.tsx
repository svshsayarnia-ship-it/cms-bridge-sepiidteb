import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { FaqList } from "../components/FaqList";
import { ArrowIcon } from "../components/Icons";
import { JsonLd } from "../components/JsonLd";
import { buildSeoMetadata } from "../lib/seo";

export const metadata = buildSeoMetadata({
  title: "پرسش‌های متداول خرید از سپید بیوتی",
  description:
    "پاسخ کوتاه به سؤال‌های رایج درباره موجودی، قیمت، اصالت، ارسال، محصولات ناموجود و خرید حرفه‌ای از سپید بیوتی.",
  path: "/faq",
  imageAlt: "پرسش‌های متداول سپید بیوتی",
});

const faqGroups = [
  {
    title: "قیمت و موجودی",
    items: [
      {
        question: "چرا قیمت بعضی محصولات استعلامی است؟",
        answer:
          "موجودی و قیمت این محصولات ممکن است تغییر کند. قیمت همان روز و وضعیت همان مدل پیش از سفارش اعلام می‌شود.",
      },
      {
        question: "برای استعلام چه اطلاعاتی بفرستم؟",
        answer:
          "نام کامل محصول، مدل، حجم و تعداد موردنیاز را بفرستید. اگر مدل را نمی‌دانید، تصویر یا نام برند هم کمک می‌کند.",
      },
      {
        question: "محصول ناموجود از سایت حذف می‌شود؟",
        answer:
          "اگر احتمال بازگشت موجودی وجود داشته باشد، صفحه محصول باقی می‌ماند و وضعیت ناموجود روی آن مشخص می‌شود.",
      },
    ],
  },
  {
    title: "اصالت و بسته‌بندی",
    items: [
      {
        question: "اصالت محصول فقط با QR مشخص می‌شود؟",
        answer:
          "خیر. منبع خرید، نام مدل، اطلاعات بسته، پلمب، تاریخ و هماهنگی اجزای داخل جعبه باید کنار هم بررسی شوند.",
      },
      {
        question: "آیا می‌توانم اطلاعات همان بسته موجود را ببینم؟",
        answer:
          "برای سفارش حرفه‌ای می‌توانید تصویر و اطلاعات قابل ارائه همان بسته را پیش از نهایی‌کردن خرید درخواست کنید.",
      },
    ],
  },
  {
    title: "ارسال و انتخاب محصول",
    items: [
      {
        question: "ارسال محصولات حساس چگونه هماهنگ می‌شود؟",
        answer:
          "روش و زمان ارسال بر اساس نوع محصول و مقصد هماهنگ می‌شود. شرایط دقیق همان سفارش پیش از پرداخت اعلام خواهد شد.",
      },
      {
        question: "آیا سپید بیوتی محصول مناسب من را تجویز می‌کند؟",
        answer:
          "خیر. سایت برای شناخت محصول و خرید آگاهانه است. انتخاب محصول تزریقی و روش استفاده باید توسط پزشک انجام شود.",
      },
      {
        question: "برای خرید کلینیک چه مسیری وجود دارد؟",
        answer:
          "در صفحه همکاری با کلینیک‌ها می‌توانید فهرست اقلام و زمان تحویل موردنظر را بفرستید تا موجودی و شرایط سفارش بررسی شود.",
      },
    ],
  },
];

const allFaqs = faqGroups.flatMap((group) => group.items);

export default function FaqPage() {
  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "پرسش‌های متداول" }]} />
      </div>

      <header className="sb-content-landing__hero">
        <div className="sb-shell">
          <span className="sb-eyebrow">FAQ / پرسش‌های متداول</span>
          <h1>پرسش‌های متداول خرید از سپید بیوتی</h1>
          <p>
            پاسخ‌های کوتاه درباره قیمت، موجودی، اصالت و ارسال. اگر سؤال شما به یک مدل مشخص مربوط است، نام کامل آن را برای پشتیبانی بفرستید.
          </p>
        </div>
      </header>

      <section className="sb-section sb-faq-page">
        <div className="sb-shell">
          {faqGroups.map((group) => (
            <section key={group.title}>
              <h2>{group.title}</h2>
              <FaqList items={group.items} />
            </section>
          ))}
          <div className="sb-faq-page__cta">
            <p>پاسخ خود را پیدا نکردید؟</p>
            <Link className="sb-btn sb-btn--dark" href="/contact">
              تماس با پشتیبانی
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: allFaqs.map((item) => ({
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
