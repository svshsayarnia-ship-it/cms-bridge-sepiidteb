import Link from "next/link";
import styles from "./NeuramisModelComparison.module.css";

const models = [
  {
    name: "نورامیس دیپ",
    en: "DEEP",
    summary: "مدلی با جایگاه میانی در خانواده نورامیس؛ برای بررسی خطوط نسبتاً عمیق‌تر و حجم‌دهی کنترل‌شده مطرح می‌شود.",
    note: "Deep نام مدل است، نه توصیه خودکار برای یک ناحیه مشخص.",
    href: "/product/neuramis-deep-lidocaine?variant=deep-1ml",
  },
  {
    name: "نورامیس والیوم",
    en: "VOLUME",
    summary: "برای زمانی که موضوع، حمایت و حجم‌دهی ساختاری‌تر است بیشتر بررسی می‌شود.",
    note: "مدل قوی‌تر یا حجیم‌تر لزوماً برای همه انتخاب بهتر نیست.",
    href: "/product/neuramis-deep-lidocaine?variant=volume-1ml",
  },
  {
    name: "نورامیس لیدو",
    en: "LIDO",
    summary: "یکی از مدل‌های خانواده نورامیس است که در موجودی سپید بیوتی به صورت بسته ۱۰ × ۱ میلی‌لیتری دیده می‌شود.",
    note: "Lido نام مدل است؛ Lidocaine نام ماده بی‌حس‌کننده است.",
    href: "/product/neuramis-deep-lidocaine?variant=lido-10ml",
  },
];

export function NeuramisModelComparison() {
  return (
    <section className={styles.root} aria-labelledby="neuramis-comparison-title">
      <div className={styles.head}>
        <span>مقایسه سریع</span>
        <h2 id="neuramis-comparison-title">تفاوت مدل‌ها در یک نگاه</h2>
        <p>این مقایسه برای شناخت مدل و بسته است؛ انتخاب و استفاده از فیلر باید با نظر فرد واجد صلاحیت انجام شود.</p>
      </div>
      <div className={styles.grid}>
        {models.map((model) => (
          <article className={styles.card} key={model.en}>
            <span>{model.en}</span>
            <h3>{model.name}</h3>
            <p>{model.summary}</p>
            <small>{model.note}</small>
            <Link href={model.href}>دیدن مشخصات مدل</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
