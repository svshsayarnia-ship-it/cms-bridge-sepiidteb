import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, ClockIcon, PhoneIcon } from "../components/Icons";
import { whatsappHref } from "../data";

export const metadata: Metadata = {
  title: "تماس با سپید بیوتی",
  description:
    "تماس مستقیم برای استعلام موجودی، مشخصات بسته، خرید کلینیکی و پیگیری سفارش Sepiid Beauty.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "تماس" }]} />
      </div>

      <section className="sb-contact-hero">
        <div className="sb-shell sb-contact-hero__grid">
          <div>
            <span className="sb-eyebrow">CONTACT / SUPPORT</span>
            <h1>یک شماره واقعی، برای سؤال واقعی.</h1>
            <p>
              نام دقیق محصول، تعداد و شهر مقصد را بنویسید تا استعلام سریع‌تر و
              دقیق‌تر انجام شود.
            </p>
            <Link className="sb-btn sb-btn--dark" href={whatsappHref()}>
              شروع گفت‌وگو در واتساپ
              <ArrowIcon />
            </Link>
          </div>
          <div className="sb-contact-hero__card">
            <PhoneIcon />
            <span>پشتیبانی و استعلام</span>
            <a href="tel:+989037251266">۰۹۰۳۷۲۵۱۲۶۶</a>
            <p>
              <ClockIcon />
              شنبه تا پنجشنبه · ۹ تا ۲۰
            </p>
          </div>
        </div>
      </section>

      <section className="sb-section sb-contact-channels">
        <div className="sb-shell">
          {[
            {
              no: "۰۱",
              title: "واتساپ",
              text: "برای استعلام محصول، تصویر یا فهرست چندقلمی.",
              href: whatsappHref(),
              label: "ارسال پیام",
            },
            {
              no: "۰۲",
              title: "تماس تلفنی",
              text: "برای هماهنگی سریع، پیگیری یا سؤال قبل از پرداخت.",
              href: "tel:+989037251266",
              label: "تماس مستقیم",
            },
            {
              no: "۰۳",
              title: "تلگرام",
              text: "مسیر جایگزین برای ارسال فهرست یا پیام.",
              href: "https://t.me/+989037251266",
              label: "باز کردن تلگرام",
            },
          ].map((channel) => (
            <article key={channel.title}>
              <span>{channel.no}</span>
              <h2>{channel.title}</h2>
              <p>{channel.text}</p>
              <Link className="sb-text-link" href={channel.href}>
                {channel.label}
                <ArrowIcon />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="sb-contact-checklist">
        <div className="sb-shell sb-contact-checklist__grid">
          <div>
            <span className="sb-eyebrow sb-eyebrow--gold">BEFORE MESSAGE</span>
            <h2>برای پاسخ دقیق‌تر، این چهار مورد را بفرستید.</h2>
          </div>
          <ol>
            <li>نام کامل محصول و مدل</li>
            <li>تعداد موردنیاز</li>
            <li>شهر مقصد و زمان تقریبی</li>
            <li>اگر کلینیک هستید، نام مرکز</li>
          </ol>
        </div>
      </section>
    </main>
  );
}

