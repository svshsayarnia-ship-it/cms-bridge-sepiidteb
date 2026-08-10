/* eslint-disable @next/next/no-img-element -- local generated imagery */
import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ArrowIcon, CheckIcon } from "../components/Icons";
import { ProfessionalForm } from "../components/ProfessionalForm";
import { buildSeoMetadata } from "../lib/seo";

export const metadata = buildSeoMetadata({
  title: "خرید حرفه‌ای پزشکان و کلینیک‌ها",
  description:
    "استعلام چندمحصولی، ثبت مشخصات بچ، برنامه تحویل و هماهنگی سفارش‌های دوره‌ای برای کلینیک‌های زیبایی.",
  path: "/professional",
  image: "/images/professional-clinic-v2.webp",
  imageAlt: "خرید حرفه‌ای پزشکان و کلینیک‌ها",
});

export default function ProfessionalPage() {
  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs items={[{ label: "همکاری با کلینیک‌ها" }]} />
      </div>

      <section className="sb-professional-hero">
        <div className="sb-shell sb-professional-hero__grid">
          <div>
            <span className="sb-eyebrow">PROFESSIONAL ACCESS</span>
            <h1>خرید حرفه‌ای، با یک فهرست و یک مسئول پیگیری.</h1>
            <p>
              مسیر اختصاصی پزشکان و مراکز زیبایی برای تطبیق چند قلم، هماهنگی زمان
              تحویل و نگهداری تاریخچه روشن از درخواست‌ها.
            </p>
            <div className="sb-professional-hero__actions">
              <a className="sb-btn sb-btn--gold" href="#brief">
                ثبت درخواست حرفه‌ای
                <ArrowIcon />
              </a>
              <Link className="sb-btn sb-btn--light-outline" href="/shop">
                مرور فروشگاه
              </Link>
            </div>
            <small>
              تأیید صلاحیت، مقررات و تصمیم درمانی بر عهده مسئول فنی و پزشک مرکز است.
            </small>
          </div>
          <figure>
            <img
              src="/images/professional-clinic-v2.webp"
              alt="متخصص کلینیک در حال بررسی موجودی"
              width="1672"
              height="941"
              fetchPriority="high"
            />
            <figcaption>Clinic inventory / controlled workflow</figcaption>
          </figure>
        </div>
      </section>

      <section className="sb-professional-process">
        <div className="sb-shell">
          <div className="sb-section-head">
            <div>
              <span className="sb-eyebrow">WORKFLOW / روند همکاری</span>
              <h2>از فهرست تا تحویل، چهار مرحله روشن</h2>
            </div>
          </div>
          <ol>
            {[
              ["ارسال فهرست", "نام دقیق، تعداد و اولویت اقلام را می‌فرستید."],
              ["تطبیق موجودی", "مدل، بسته، تاریخ و اطلاعات قابل ارائه بررسی می‌شود."],
              ["تأیید سفارش", "قیمت روز و برنامه تحویل یک‌جا اعلام می‌شود."],
              ["پیگیری انسانی", "یک مسیر مشخص برای تحویل و سفارش بعدی دارید."],
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
            <span className="sb-eyebrow">FOR YOUR TEAM</span>
            <h2>ساخته‌شده برای مسئول خرید و مسئول فنی</h2>
            <p>
              اطلاعات پراکنده پیام‌ها را به یک brief کوتاه و قابل پیگیری تبدیل کنید.
            </p>
          </div>
          <div>
            {[
              "استعلام چندمحصولی در یک پیام",
              "تطبیق عنوان دقیق و مشخصات بسته",
              "اعلام وضعیت هر قلم به‌صورت جداگانه",
              "هماهنگی زمان و روش تحویل",
              "امکان برنامه‌ریزی سفارش‌های تکرارشونده",
              "پاسخ‌گویی مستقیم پس از تحویل",
            ].map((item) => (
              <p key={item}>
                <CheckIcon />
                {item}
              </p>
            ))}
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
