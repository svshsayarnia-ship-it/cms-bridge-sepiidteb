import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, ClockIcon, PhoneIcon } from "../components/Icons";
import { whatsappHref } from "../data";
import { buildSeoMetadata } from "../lib/seo";

export const metadata = buildSeoMetadata({
  title: "تماس با سپید بیوتی",
  description:
    "برای پرسیدن قیمت روز، موجودی، مشخصات بسته یا پیگیری سفارش با سپید بیوتی تماس بگیرید.",
  path: "/contact",
  imageAlt: "تماس و پشتیبانی سپید بیوتی",
});

export default function ContactPage() {
  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "تماس" }]} />
      </div>

      <section className="sb-contact-hero">
        <div className="sb-shell sb-contact-hero__grid">
          <div>
            <span className="sb-eyebrow">تماس با سپید بیوتی</span>
            <h1>سؤال دارید؟ مستقیم بپرسید.</h1>
            <p>
              نام مدل، تعداد و شهر مقصد را بنویسید تا جواب دقیق‌تری درباره قیمت،
              موجودی و زمان ارسال بگیرید.
            </p>
            <Link className="sb-btn sb-btn--dark" href={whatsappHref()}>
              پیام در واتساپ
              <ArrowIcon />
            </Link>
          </div>
          <div className="sb-contact-hero__card">
            <PhoneIcon />
            <span>پاسخ‌گویی سپید</span>
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
              text: "برای پرسیدن قیمت، فرستادن تصویر یا بررسی چند محصول.",
              href: whatsappHref(),
              label: "ارسال پیام",
            },
            {
              no: "۰۲",
              title: "تماس تلفنی",
              text: "برای هماهنگی سریع، پیگیری سفارش یا سؤال قبل از پرداخت.",
              href: "tel:+989037251266",
              label: "تماس مستقیم",
            },
            {
              no: "۰۳",
              title: "تلگرام",
              text: "اگر واتساپ در دسترس نبود، فهرست یا پیام را از اینجا بفرستید.",
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
            <h2>برای اینکه سریع‌تر جواب بگیرید، این چهار مورد را بفرستید.</h2>
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
