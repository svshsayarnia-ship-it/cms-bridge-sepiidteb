import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { FaqList } from "../components/FaqList";
import { ArrowIcon } from "../components/Icons";
import { JsonLd } from "../components/JsonLd";
import { buildSeoMetadata } from "../lib/seo";

export const metadata = buildSeoMetadata({
  title: "پرسش‌های متداول خرید از سپید بیوتی",
  description:
    "پاسخ ساده به سؤال‌های رایج درباره قیمت، موجودی، بسته‌بندی، ارسال و سفارش از سپید بیوتی.",
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
          "قیمت و موجودی بعضی مدل‌ها تغییر می‌کند. قبل از سفارش، قیمت همان روز و وضعیت همان مدل را اعلام می‌کنیم.",
      },
      {
        question: "برای استعلام چه اطلاعاتی بفرستم؟",
        answer:
          "نام کامل محصول، مدل، حجم و تعداد را بفرستید. اگر مدل را نمی‌دانید، نام برند یا عکس بسته هم کمک می‌کند.",
      },
      {
        question: "محصول ناموجود از سایت حذف می‌شود؟",
        answer:
          "اگر احتمال موجودشدن دوباره باشد، صفحه را نگه می‌داریم و وضعیت ناموجود را واضح می‌نویسیم.",
      },
    ],
  },
  {
    title: "اصالت و بسته‌بندی",
    items: [
      {
        question: "اصالت محصول فقط با QR مشخص می‌شود؟",
        answer:
          "خیر. نام مدل، اطلاعات بسته، پلمب، تاریخ و هماهنگی اجزای جعبه باید کنار هم دیده شوند.",
      },
      {
        question: "آیا می‌توانم اطلاعات همان بسته موجود را ببینم؟",
        answer:
          "اگر سفارش حرفه‌ای دارید، می‌توانید قبل از خرید عکس و اطلاعات قابل ارائه همان بسته را بخواهید.",
      },
    ],
  },
  {
    title: "ارسال و انتخاب محصول",
    items: [
      {
        question: "ارسال محصولات حساس چگونه هماهنگ می‌شود؟",
        answer:
          "روش و زمان ارسال به نوع محصول و شهر مقصد بستگی دارد. قبل از پرداخت، جزئیات همان سفارش را با شما هماهنگ می‌کنیم.",
      },
      {
        question: "آیا سپید بیوتی محصول مناسب من را تجویز می‌کند؟",
        answer:
          "خیر. سایت برای شناخت محصول و خرید است. انتخاب محصول تزریقی و روش استفاده باید با نظر پزشک انجام شود.",
      },
      {
        question: "برای خرید کلینیک چه مسیری وجود دارد؟",
        answer:
          "در صفحه سفارش کلینیک، فهرست اقلام و زمان تحویل را بفرستید تا موجودی و شرایط سفارش را بررسی کنیم.",
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
          <h1>سؤال‌های رایج درباره خرید</h1>
          <p>
            پاسخ‌های کوتاه درباره قیمت، موجودی، بسته و ارسال. اگر درباره یک مدل مشخص سؤال دارید، نام کاملش را برای ما بفرستید.
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
            <p>جواب سؤال‌تان را پیدا نکردید؟</p>
            <Link className="sb-btn sb-btn--dark" href="/contact">
              پرسیدن از سپید
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
