import type { ProductSeed } from "../product-seed";

// Names, family relationships and prices were confirmed by the shop owner.
// Packaging photos and technical specifications are deliberately not inferred
// from the illustrated price poster.
const source = {
  sourceName: "فهرست قیمت مهر ۱۴۰۵ سپید بیوتی؛ تأیید مدیریت فروشگاه",
  reviewedAt: "2026-10-07",
  sourceStatus: "نام مدل و قیمت بر اساس فهرست تأییدشده سپید بیوتی",
  audience: "پزشکان و مراکز دارای صلاحیت خرید و استفاده حرفه‌ای",
  publishedInCatalog: true,
  imageVerified: false,
};

export const posterAdditionSeeds: ProductSeed[] = [
  {
    ...source,
    slug: "dremore-family",
    nameFa: "دمور",
    nameEn: "Dremore",
    brand: "Dremore",
    category: "fillers",
    type: "خانواده فیلر دمور",
    priceToman: 7_200_000,
    priceNote: "قیمت مدل انتخابی؛ گرند یا اولترا",
    badge: "۲ مدل",
    summary: "دمور در دو مدل گرند و اولترا در سپید بیوتی عرضه می‌شود. مدل موردنظر را انتخاب کنید تا نام و قیمت همان مدل نمایش داده شود. گرند و اولترا دو انتخاب مستقل در یک خانواده هستند.",
    features: ["دو مدل گرند و اولترا", "قیمت جدا برای هر مدل", "انتخاب مدل پیش از سفارش"],
    specs: [["برند", "Dremore"], ["مدل‌ها", "Grand و Ultra"]],
    checks: ["نام گرند یا اولترا روی بسته با مدل انتخابی سفارش تطبیق داده شود.", "حجم، بچ‌کد و تاریخ بسته موجود هنگام استعلام کنترل شود."],
    variants: [
      { id: "grand", label: "گرند", nameFa: "دمور گرند", nameEn: "Dremore Grand", image: "", imageAlt: "", imageVerified: false, volume: "", summary: "گرند یکی از دو مدل خانواده دمور در سپید بیوتی است. قیمت این انتخاب برای مدل گرند ثبت شده است؛ مشخصات و بسته موجود هنگام سفارش تطبیق داده می‌شود.", features: ["مدل Grand", "انتخاب مستقل در خانواده دمور"], specs: [["برند", "Dremore"], ["مدل", "Grand"]], priceToman: 7_200_000, priceNote: "مدل گرند" },
      { id: "ultra", label: "اولترا", nameFa: "دمور اولترا", nameEn: "Dremore Ultra", image: "", imageAlt: "", imageVerified: false, volume: "", summary: "اولترا دومین مدل خانواده دمور در سپید بیوتی است. قیمت این انتخاب برای مدل اولترا در فهرست فروشگاه ثبت شده است؛ مشخصات همان بسته موجود هنگام سفارش بررسی می‌شود.", features: ["مدل Ultra", "انتخاب مستقل در خانواده دمور"], specs: [["برند", "Dremore"], ["مدل", "Ultra"]], priceToman: 5_250_000, priceNote: "مدل اولترا" },
    ],
  },
  {
    ...source,
    slug: "replast-plus",
    nameFa: "ریپلیس پلاس",
    nameEn: "Replast+",
    brand: "Replast",
    category: "fillers",
    type: "فیلر ریپلیس پلاس",
    priceToman: 6_400_000,
    priceNote: "مدل Plus",
    summary: "ریپلیس پلاس با نام Replast+ در فهرست محصولات سپید بیوتی ثبت شده است. قیمت مربوط به مدل پلاس است. برای سفارش، نام مدل، حجم و مشخصات بسته موجود با تیم فروش تطبیق داده می‌شود.",
    features: ["مدل Plus", "قیمت ثبت‌شده در فهرست سپید بیوتی"],
    specs: [["برند", "Replast"], ["مدل", "Plus"]],
  },
  {
    ...source,
    slug: "arasti-a-plus",
    nameFa: "آراستی A پلاس",
    nameEn: "Arasti A+",
    brand: "Arasti",
    category: "fillers",
    type: "فیلر آراستی A پلاس",
    priceToman: 2_500_000,
    priceNote: "مدل A+",
    summary: "آراستی A پلاس، مدل A+ برند Arasti، در فهرست سپید بیوتی قرار دارد. قیمت برای همین مدل ثبت شده است. پیش از سفارش، نام A+، حجم و مشخصات بسته موجود با تیم فروش بررسی می‌شود.",
    features: ["مدل A+", "برند Arasti"],
    specs: [["برند", "Arasti"], ["مدل", "A+"]],
  },
  {
    ...source,
    slug: "fillerage-s",
    nameFa: "فیورج S",
    nameEn: "Fillerage S",
    brand: "Fillerage",
    category: "fillers",
    type: "فیلر فیورج S",
    priceToman: 7_900_000,
    priceNote: "مدل S",
    summary: "فیورج S با نام درج‌شده در فهرست سپید بیوتی عرضه می‌شود. قیمت این کالا برای مدل S ثبت شده است. نام مدل، حجم و مشخصات بسته موجود هنگام سفارش با تیم فروش تطبیق داده می‌شود.",
    features: ["مدل S", "قیمت ثبت‌شده در فهرست سپید بیوتی"],
    specs: [["نام در فهرست", "Fillerage"], ["مدل", "S"]],
  },
];
