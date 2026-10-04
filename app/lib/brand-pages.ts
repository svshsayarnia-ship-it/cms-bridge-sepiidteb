import {
  brandPages as baseBrandPages,
  type BrandPage,
} from "../content-architecture";

const inovosenseBrandPage: BrandPage = {
  slug: "inovosense",
  name: "Inovosense",
  matchers: ["Inovosense"],
  title: "فیلر اینووسنس؛ مدل‌ها، حجم و قیمت",
  description:
    "مدل‌های Smile، Style و Shape فیلر اینووسنس را همراه حجم، قیمت و مشخصات بسته در سپید بیوتی ببینید و هر مدل را جداگانه بررسی کنید.",
  intro:
    "اینووسنس در کاتالوگ فعلی سپید بیوتی با مدل‌های Smile، Style و Shape ارائه شده است. برای مقایسه یا استعلام، نام دقیق مدل و حجم همان بسته را مبنا قرار دهید؛ نام برند به‌تنهایی برای تشخیص دو محصول متفاوت کافی نیست.",
  buyingChecks: [
    "نام مدل را کامل انتخاب کنید؛ Smile، Style یا Shape.",
    "حجم بسته را با همان مدل تطبیق دهید؛ مدل‌های فعلی به‌صورت دو سرنگ یک‌میلی‌لیتری ثبت شده‌اند.",
    "قیمت را فقط بین مدل و حجم یکسان مقایسه کنید.",
    "پیش از نهایی‌شدن سفارش، نام انگلیسی، مدل، بچ‌کد و سلامت بسته موجود را کنترل کنید.",
  ],
  faq: [
    {
      question: "مدل‌های فیلر اینووسنس کدام‌اند؟",
      answer:
        "در کاتالوگ فعلی سپید بیوتی سه مدل Smile، Style و Shape برای خانواده Inovosense ثبت شده‌اند. موجودی و قیمت هر مدل باید جداگانه بررسی شود.",
    },
    {
      question: "اینووسنس چند سی‌سی است؟",
      answer:
        "مدل‌های فعلی این خانواده در کاتالوگ سپید بیوتی با دو سرنگ یک‌میلی‌لیتری ثبت شده‌اند؛ یعنی مجموع حجم بسته ۲ میلی‌لیتر است. مشخصات همان بسته موجود را پیش از سفارش دوباره کنترل کنید.",
    },
    {
      question: "ژل اینوسنس با اینووسنس فرق دارد؟",
      answer:
        "«اینوسنس» یکی از شکل‌های رایج نوشتن نام Inovosense در جست‌وجوی فارسی است. برای جلوگیری از اشتباه، نام انگلیسی Inovosense و نام مدل روی جعبه را مبنا قرار دهید.",
    },
    {
      question: "کدام مدل اینووسنس برای لب، گونه یا زیر چشم مناسب است؟",
      answer:
        "صفحه فروش برای ناحیه تزریق نسخه تعیین نمی‌کند. انتخاب مدل و ناحیه باید با ارزیابی فردی و توسط پزشک واجد صلاحیت انجام شود؛ این صفحه برای مقایسه نام مدل، حجم، بسته و قیمت است.",
    },
  ],
  articleSlugs: [],
  guideSlugs: ["dermal-fillers", "product-authenticity"],
  minProductCount: 1,
  indexable: true,
};

export const brandPages: BrandPage[] = [
  ...baseBrandPages,
  inovosenseBrandPage,
];

export function getBrandPage(slug: string): BrandPage | undefined {
  return brandPages.find((brand) => brand.slug === slug);
}

export function getBrandPageForLabel(label: string): BrandPage | undefined {
  const normalized = label.trim().toLocaleLowerCase("en");

  return brandPages.find((brand) =>
    brand.matchers.some(
      (matcher) => matcher.toLocaleLowerCase("en") === normalized,
    ),
  );
}
