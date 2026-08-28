import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { ArrowIcon } from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { buildSeoMetadata } from "../../lib/seo";
import { whatsappHref } from "../../data";

const policies = {
  privacy: {
    title: "حریم خصوصی",
    lead: "اطلاعات تماس فقط برای پاسخ‌گویی، استعلام و پیگیری درخواست شما استفاده می‌شود.",
    sections: [
      {
        title: "چه اطلاعاتی دریافت می‌شود؟",
        text: "در مسیر فعلی سایت، خرید و پرداخت آنلاین انجام نمی‌شود. نام، شماره تماس و اطلاعاتی که خودتان در پیام یا فرم وارد می‌کنید برای پاسخ‌گویی به همان درخواست استفاده می‌شود.",
      },
      {
        title: "چطور از اطلاعات استفاده می‌کنیم؟",
        text: "برای تطبیق محصول، اعلام موجودی، هماهنگی تحویل و پیگیری ارتباط. اطلاعات پزشکی حساس را در فرم عمومی درخواست نمی‌کنیم و توصیه می‌کنیم چنین اطلاعاتی را بدون ضرورت ارسال نکنید.",
      },
      {
        title: "درخواست حذف یا اصلاح",
        text: "برای اصلاح یا حذف اطلاعاتی که در گفت‌وگو در اختیار تیم گذاشته‌اید، از همان شماره ثبت‌شده با پشتیبانی تماس بگیرید.",
      },
    ],
  },
  terms: {
    title: "شرایط استفاده",
    lead: "Sepiid Beauty در نسخه فعلی یک کاتالوگ تخصصی و مسیر استعلام است؛ نه سامانه تجویز یا فروش خودکار.",
    sections: [
      {
        title: "محدوده اطلاعات سایت",
        text: "اطلاعات محصول برای شناخت، مقایسه و بررسی بسته‌بندی ارائه می‌شود و جایگزین بروشور رسمی، مجوز قابل استعلام یا ارزیابی فرد واجد صلاحیت نیست.",
      },
      {
        title: "قیمت و موجودی",
        text: "نمایش نام محصول به معنی موجودی یا امکان قانونی عرضه نیست. قیمت، موجودی، مشخصات همان بچ و شرایط تحویل فقط در زمان استعلام تأیید می‌شود.",
      },
      {
        title: "محدودیت پزشکی",
        text: "انتخاب، تزریق یا مصرف محصولات حرفه‌ای باید توسط فرد واجد صلاحیت و مطابق مقررات و اطلاعات سازنده انجام شود. نتیجه برای افراد مختلف یکسان نیست.",
      },
    ],
  },
  shipping: {
    title: "ارسال و تحویل",
    lead: "روش و زمان تحویل پیش از نهایی‌شدن درخواست، متناسب با نوع محصول و مقصد هماهنگ می‌شود.",
    sections: [
      {
        title: "هماهنگی پیش از ارسال",
        text: "نام کامل محصول، تعداد، مقصد، بازه تحویل و اطلاعات قابل ارائه از بسته پیش از ارسال با درخواست‌کننده تطبیق داده می‌شود.",
      },
      {
        title: "محصولات حساس",
        text: "برای فرآورده‌های حساس، امکان عرضه و شرایط حمل و زنجیره سرد باید جداگانه تأیید شود. ارسال عادی برای کالایی که شرایط ویژه دارد به‌عنوان گزینه پیش‌فرض اعلام نمی‌شود.",
      },
      {
        title: "بررسی هنگام دریافت",
        text: "پیش از بازکردن بسته، نام کالا، سلامت ظاهری، تعداد و هرگونه آسیب احتمالی را بررسی و در صورت مغایرت همان زمان ثبت کنید.",
      },
    ],
  },
  returns: {
    title: "مغایرت، آسیب و بازگشت",
    lead: "به‌دلیل ماهیت حرفه‌ای و حساس بعضی محصولات، امکان بازگشت باید پیش از سفارش و برای همان کالا مشخص شود.",
    sections: [
      {
        title: "گزارش مغایرت",
        text: "اگر نام، تعداد یا ظاهر بسته با مورد هماهنگ‌شده متفاوت است، پیش از بازکردن پلمب تصویر و توضیح را برای پشتیبانی ارسال کنید.",
      },
      {
        title: "محصول بازشده یا حساس",
        text: "کالاهای بازشده، دارای زنجیره نگهداری حساس یا خارج‌شده از کنترل شرایط حمل ممکن است قابل بازگشت نباشند. شرایط دقیق پیش از ارسال همان سفارش اعلام می‌شود.",
      },
      {
        title: "بسته آسیب‌دیده",
        text: "از بسته، برچسب ارسال و آسیب ظاهری تصویر تهیه کنید و مصرف کالا را تا بررسی متوقف نگه دارید.",
      },
    ],
  },
  authenticity: {
    title: "فرایند بررسی اصالت و بسته‌بندی",
    lead: "یک هولوگرام یا کد به‌تنهایی اصالت را ثابت نمی‌کند؛ بررسی باید چندنشانه‌ای و قابل‌پیگیری باشد.",
    sections: [
      {
        title: "پیش از سفارش",
        text: "نام دقیق مدل، تصویر بسته موجود، بچ‌کد و تاریخ قابل مشاهده و اطلاعات واردکننده یا تولیدکننده در حد قابل ارائه بررسی می‌شود.",
      },
      {
        title: "هنگام تحویل",
        text: "پلمب، سلامت جعبه، تطبیق شناسه‌ها و شرایط ظاهری باید دوباره کنترل شود. در صورت ناسازگاری، مصرف متوقف و موضوع پیگیری شود.",
      },
      {
        title: "حدود این بررسی",
        text: "بررسی ظاهری جای آزمون آزمایشگاهی، استعلام قانونی یا تأیید سازنده را نمی‌گیرد. بسته و منابع رسمی مرجع نهایی‌اند.",
      },
    ],
  },
} as const;

type PolicySlug = keyof typeof policies;

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = policies[slug as PolicySlug];
  if (!policy) return {};
  return buildSeoMetadata({
    title: policy.title,
    description: policy.lead,
    path: `/policies/${slug}`,
    imageAlt: policy.title,
  });
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = policies[slug as PolicySlug];
  if (!policy) notFound();

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: policy.title }]} />
      </div>
      <header className="sb-policy-hero">
        <div className="sb-shell">
          <span className="sb-eyebrow">اطلاعات و قوانین سپید</span>
          <h1>{policy.title}</h1>
          <p>{policy.lead}</p>
          <small>آخرین بازبینی: ۳ مرداد ۱۴۰۵</small>
        </div>
      </header>
      <section className="sb-policy-content">
        <div className="sb-shell">
          {policy.sections.map((section, index) => (
            <article key={section.title}>
              <span>۰{index + 1}</span>
              <div>
                <h2>{section.title}</h2>
                <p>{section.text}</p>
              </div>
            </article>
          ))}
          <div className="sb-policy-contact">
            <div>
              <strong>برای سؤال درباره همین موضوع</strong>
              <p>شماره سفارش یا نام محصول را همراه پیام بفرستید.</p>
            </div>
            <Link className="sb-btn sb-btn--dark" href={whatsappHref()}>
              گفت‌وگو با پشتیبانی
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: policy.title,
          description: policy.lead,
          inLanguage: "fa-IR",
        }}
      />
    </main>
  );
}
