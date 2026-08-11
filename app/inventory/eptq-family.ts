import type { ProductSeed } from "../product-seed";

const reviewedAt = "2026-08-11";
const professionalAudience = "پزشکان و مراکز دارای صلاحیت خرید و استفاده حرفه‌ای";

/**
 * Canonical storefront definition for the e.p.t.q. Lidocaine family.
 *
 * Images intentionally stay unverified until the Sepiid Beauty editorial
 * renders for all three exact models are added. Do not publish this override
 * before /images/products/eptq-s100.webp, eptq-s300.webp and eptq-s500.webp
 * are verified against the corresponding packaging.
 */
export const eptqFamilySeed: ProductSeed = {
  slug: "eptq-1ml",
  nameFa: "فیلر ای‌پی‌تی‌کیو",
  nameEn: "e.p.t.q. Lidocaine",
  brand: "e.p.t.q. / JETEMA",
  category: "fillers",
  type: "خانواده فیلر e.p.t.q. Lidocaine",
  volume: "هر مدل ۱٫۱ میلی‌لیتر",
  priceToman: 2600000,
  priceNote: "مدل را انتخاب کنید؛ قیمت نهایی همان مدل استعلام شود",
  badge: "۳ مدل",
  image: "/images/products/eptq-s100.webp",
  imageVerified: false,
  publishedInCatalog: true,
  sourceName: "JETEMA — e.p.t.q. Lidocaine",
  sourceUrl: "https://www.jetema.com/page/eptq",
  reviewedAt,
  sourceStatus: "ساختار S100 / S300 / S500، حجم 1.1 mL و فرمول پایه با منبع رسمی JETEMA تطبیق شد",
  summary:
    "e.p.t.q. Lidocaine در سه مدل S100، S300 و S500 عرضه می‌شود. هر مدل باید با نام دقیق خودش انتخاب شود و صفحه محصول پس از تکمیل تصاویر، نام، تصویر و مشخصات همان مدل را بدون تغییر چیدمان نمایش می‌دهد.",
  audience: professionalAudience,
  features: [
    "سه مدل رسمی S100، S300 و S500",
    "هر مدل در بسته ۱٫۱ میلی‌لیتری",
    "Cross-linked HA 24 mg/mL همراه Lidocaine 0.3%",
  ],
  specs: [
    ["برند", "e.p.t.q."],
    ["سازنده", "JETEMA"],
    ["مدل‌ها", "S100 / S300 / S500"],
    ["حجم هر مدل", "۱٫۱ میلی‌لیتر"],
    ["فرمول پایه", "Cross-linked HA 24 mg/mL + Lidocaine 0.3%"],
  ],
  checks: [
    "کد مدل S100، S300 یا S500 روی جعبه و سرنگ با گزینه انتخاب‌شده یکسان باشد.",
    "حجم 1.1 mL روی همان بسته کنترل شود.",
    "بچ‌کد، تاریخ، پلمب و اطلاعات همان بسته پیش از تحویل بررسی شود.",
  ],
  faq: [
    {
      question: "ای‌پی‌تی‌کیو چند مدل دارد؟",
      answer: "در این خانواده سه مدل S100، S300 و S500 نمایش داده می‌شود و هر مدل به‌صورت گزینه مستقل در همین صفحه انتخاب خواهد شد.",
    },
    {
      question: "حجم S100، S300 و S500 چقدر است؟",
      answer: "طبق مشخصات رسمی فعلی JETEMA، بسته‌های این سری Lidocaine برای هر سه مدل ۱٫۱ میلی‌لیتر هستند.",
    },
  ],
  variants: [
    {
      id: "s100",
      label: "S100",
      nameFa: "ای‌پی‌تی‌کیو S100",
      nameEn: "e.p.t.q. Lidocaine S100",
      image: "/images/products/eptq-s100.webp",
      imageAlt: "بسته e.p.t.q. Lidocaine S100 با ادیت ادیتوریال سپید بیوتی",
      imageVerified: false,
      volume: "۱٫۱ میلی‌لیتر",
      summary: "مدل S100 از خانواده e.p.t.q. Lidocaine است. هنگام انتخاب این گزینه، نام و تصویر مخصوص S100 باید نمایش داده شود.",
      features: ["مدل S100", "۱٫۱ میلی‌لیتر", "HA 24 mg/mL + Lidocaine 0.3%"],
      specs: [
        ["مدل", "e.p.t.q. S100"],
        ["حجم", "۱٫۱ میلی‌لیتر"],
        ["فرمول پایه", "Cross-linked HA 24 mg/mL + Lidocaine 0.3%"],
      ],
      priceToman: 2600000,
      priceNote: "قیمت همان مدل در زمان استعلام تأیید شود",
      sourceName: "JETEMA — e.p.t.q. Lidocaine S100",
      sourceUrl: "https://www.jetema.com/page/eptq",
    },
    {
      id: "s300",
      label: "S300",
      nameFa: "ای‌پی‌تی‌کیو S300",
      nameEn: "e.p.t.q. Lidocaine S300",
      image: "/images/products/eptq-s300.webp",
      imageAlt: "بسته e.p.t.q. Lidocaine S300 با ادیت ادیتوریال سپید بیوتی",
      imageVerified: false,
      volume: "۱٫۱ میلی‌لیتر",
      summary: "مدل S300 از خانواده e.p.t.q. Lidocaine است. هنگام انتخاب این گزینه، نام و تصویر مخصوص S300 باید نمایش داده شود.",
      features: ["مدل S300", "۱٫۱ میلی‌لیتر", "HA 24 mg/mL + Lidocaine 0.3%"],
      specs: [
        ["مدل", "e.p.t.q. S300"],
        ["حجم", "۱٫۱ میلی‌لیتر"],
        ["فرمول پایه", "Cross-linked HA 24 mg/mL + Lidocaine 0.3%"],
      ],
      priceToman: 2600000,
      priceNote: "قیمت همان مدل در زمان استعلام تأیید شود",
      sourceName: "JETEMA — e.p.t.q. Lidocaine S300",
      sourceUrl: "https://www.jetema.com/page/eptq",
    },
    {
      id: "s500",
      label: "S500",
      nameFa: "ای‌پی‌تی‌کیو S500",
      nameEn: "e.p.t.q. Lidocaine S500",
      image: "/images/products/eptq-s500.webp",
      imageAlt: "بسته e.p.t.q. Lidocaine S500 با ادیت ادیتوریال سپید بیوتی",
      imageVerified: false,
      volume: "۱٫۱ میلی‌لیتر",
      summary: "مدل S500 از خانواده e.p.t.q. Lidocaine است. هنگام انتخاب این گزینه، نام و تصویر مخصوص S500 باید نمایش داده شود.",
      features: ["مدل S500", "۱٫۱ میلی‌لیتر", "HA 24 mg/mL + Lidocaine 0.3%"],
      specs: [
        ["مدل", "e.p.t.q. S500"],
        ["حجم", "۱٫۱ میلی‌لیتر"],
        ["فرمول پایه", "Cross-linked HA 24 mg/mL + Lidocaine 0.3%"],
      ],
      priceToman: 2600000,
      priceNote: "قیمت همان مدل در زمان استعلام تأیید شود",
      sourceName: "JETEMA — e.p.t.q. Lidocaine S500",
      sourceUrl: "https://www.jetema.com/page/eptq",
    },
  ],
};
