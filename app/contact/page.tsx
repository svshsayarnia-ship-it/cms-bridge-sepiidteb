import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, ClockIcon, PhoneIcon } from "../components/Icons";
import { whatsappHref } from "../data";
import { buildSeoMetadata } from "../lib/seo";

export const metadata = buildSeoMetadata({
  title: "تماس با سپید بیوتی",
  description:
    "برای بررسی موجودی، جزئیات بسته، سفارش کلینیکی و پیگیری خرید با تیم سپید بیوتی در تماس باشید.",
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
            <h1>یک شماره واقعی، برای سؤال واقعی.</h1>
            <p>
              نام کامل محصول، مدل، تعداد و شهر مقصد را در همان پیام اول بفرستید تا جواب دقیق‌تری درباره موجودی و شرایط سفارش بگیرید.
            </p>
            <Link className="sb-btn sb-btn--dark" href={whatsappHref()}>
              گفت‌وگو در واتساپ
              <ArrowIcon />
            </Link>
          </div>
          <div className="sb-contact-hero__card">
            <PhoneIcon />
            <span>پاسخ‌گویی سپید بیوتی</span>
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
              text: "برای موجودی یک محصول یا ارسال فهرست چندقلمی.",
              href: whatsappHref(),
              label: "ارسال پیام",
            },
            {
              no: "۰۲",
              title: "تماس تلفنی",
              text: "برای پیگیری سفارش یا سؤال قبل از نهایی‌کردن خرید.",
              href: "tel:+989037251266",
              label: "تماس مستقیم",
            },
            {
              no: "۰۳",
              title: "تلگرام",
              text: "مسیر جایگزین برای فرستادن پیام یا فهرست محصولات.",
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
            <h2>برای جواب سریع‌تر، این چهار مورد را همان ابتدا بفرستید.</h2>
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
