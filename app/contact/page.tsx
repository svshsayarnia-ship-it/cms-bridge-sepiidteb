import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, ClockIcon, PhoneIcon } from "../components/Icons";
import { whatsappHref } from "../data";
import { buildSeoMetadata } from "../lib/seo";

export const metadata = buildSeoMetadata({
  title: "تماس با سپید بیوتی",
  description:
    "برای موجودی، جزئیات بسته، سفارش کلینیکی یا پیگیری خرید با تیم سپید بیوتی در تماس باشید.",
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
            <span className="sb-eyebrow">CONTACT / SUPPORT</span>
            <h1>سؤالی دارید؟ مستقیم با خودمان حرف بزنید.</h1>
            <p>
              اسم محصول، مدل، تعداد و شهر مقصد را همان پیام اول بفرستید تا سریع‌تر بتوانیم موجودی و شرایط سفارش را برایتان چک کنیم.
            </p>
            <Link className="sb-btn sb-btn--dark" href={whatsappHref()}>
              پیام در واتساپ
              <ArrowIcon />
            </Link>
          </div>
          <div className="sb-contact-hero__card">
            <PhoneIcon />
            <span>تیم سپید بیوتی</span>
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
              text: "برای پرسیدن موجودی یک محصول یا فرستادن فهرست چندقلمی.",
              href: whatsappHref(),
              label: "ارسال پیام",
            },
            {
              no: "۰۲",
              title: "تماس تلفنی",
              text: "برای پیگیری سفارش یا سؤالی که قبل از خرید دارید.",
              href: "tel:+989037251266",
              label: "تماس مستقیم",
            },
            {
              no: "۰۳",
              title: "تلگرام",
              text: "اگر تلگرام برایتان راحت‌تر است، پیام یا فهرست محصولات را آنجا بفرستید.",
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
            <span className="sb-eyebrow sb-eyebrow--gold">قبل از پیام</span>
            <h2>این چهار مورد را بفرستید تا جواب دقیق‌تری بگیرید.</h2>
          </div>
          <ol>
            <li>نام کامل محصول و مدل</li>
            <li>تعداد موردنیاز</li>
            <li>شهر مقصد و زمان تقریبی</li>
            <li>برای سفارش کلینیکی، نام مرکز</li>
          </ol>
        </div>
      </section>
    </main>
  );
}