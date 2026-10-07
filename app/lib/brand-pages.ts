import {
  brandPages as baseBrandPages,
  type BrandPage,
} from "../content-architecture";

const inovosenseBrandPage: BrandPage = {
  slug: "inovosense",
  name: "Inovosense",
  matchers: ["Inovosense"],
  title: "اینووسنس؛ مدل‌ها و قیمت محصولات",
  description:
    "مدل‌های Smile، Style، Shape و Scalp اینووسنس را همراه حجم، قیمت و مشخصات بسته در سپید بیوتی ببینید و هر مدل را جداگانه بررسی کنید.",
  intro:
    "اینووسنس در کاتالوگ فعلی سپید بیوتی با مدل‌های Smile، Style، Shape و Scalp ارائه شده است. برای مقایسه یا استعلام، نام دقیق مدل و حجم همان بسته را مبنا قرار دهید؛ نام برند به‌تنهایی برای تشخیص دو محصول متفاوت کافی نیست.",
  buyingChecks: [
    "نام مدل را کامل انتخاب کنید؛ Smile، Style، Shape یا Scalp.",
    "حجم بسته را با همان مدل تطبیق دهید؛ مشخصات فیلرهای Smile، Style و Shape به Scalp تعمیم داده نمی‌شود.",
    "قیمت را فقط بین مدل و حجم یکسان مقایسه کنید.",
    "پیش از نهایی‌شدن سفارش، نام انگلیسی، مدل، بچ‌کد و سلامت بسته موجود را کنترل کنید.",
  ],
  faq: [
    {
      question: "مدل‌های خانواده اینووسنس کدام‌اند؟",
      answer:
        "در کاتالوگ فعلی سپید بیوتی چهار مدل Smile، Style، Shape و Scalp برای خانواده Inovosense ثبت شده‌اند. موجودی و قیمت هر مدل باید جداگانه بررسی شود.",
    },
    {
      question: "اینووسنس چند سی‌سی است؟",
      answer:
        "فیلرهای Smile، Style و Shape با دو سرنگ یک‌میلی‌لیتری ثبت شده‌اند؛ مجموع حجم این بسته‌ها ۲ میلی‌لیتر است. Scalp محصول مستقلی است و محتویات بسته آن جداگانه هنگام سفارش بررسی می‌شود.",
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
  {
    slug: "dremore",
    name: "Dremore",
    matchers: ["Dremore"],
    title: "دمور؛ قیمت مدل‌های گرند و اولترا",
    description: "مدل‌های گرند و اولترا خانواده دمور را در سپید بیوتی ببینید. نام و قیمت هر مدل جداگانه نمایش داده می‌شود و انتخاب مدل پیش از سفارش انجام می‌گیرد.",
    intro: "خانواده دمور در سپید بیوتی شامل دو مدل گرند و اولترا است. از کارت دمور مدل موردنظر را انتخاب کنید و قیمت همان مدل را ببینید.",
    buyingChecks: ["مدل گرند یا اولترا را پیش از سفارش انتخاب کنید.", "نام مدل و مشخصات بسته تحویلی با سفارش تطبیق داده شود."],
    faq: [{ question: "دمور چه مدل‌هایی دارد؟", answer: "در فهرست فعلی سپید بیوتی دو مدل گرند و اولترا زیر خانواده دمور ثبت شده‌اند." }],
    articleSlugs: [],
    guideSlugs: ["product-authenticity"],
    minProductCount: 1,
    indexable: true,
  },
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
