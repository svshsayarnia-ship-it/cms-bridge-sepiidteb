import { fillerInventorySeeds } from "./inventory/fillers";
import { skinAndSupportInventorySeeds } from "./inventory/skin-support";
import type { ProductSeed } from "./product-seed";

const reviewedAt = "2026-08-16";
const professionalAudience = "پزشکان و مراکز دارای صلاحیت خرید و استفاده حرفه‌ای";

function requireSeed(slug: string, seeds: ProductSeed[]): ProductSeed {
  const seed = seeds.find((item) => item.slug === slug);
  if (!seed) throw new Error(`Missing inventory seed: ${slug}`);
  return seed;
}

const alcarisa = requireSeed("alcarisa-family", fillerInventorySeeds);
const revofil = requireSeed("revofil-ultra", fillerInventorySeeds);
const rabianca = requireSeed("rabianca", fillerInventorySeeds);
const neuramis = requireSeed("neuramis-deep-lidocaine", fillerInventorySeeds);
const perleux = requireSeed("perleux", fillerInventorySeeds);
const audrey = requireSeed("audrey-m", fillerInventorySeeds);
const inovosense = requireSeed("inovosense-family", fillerInventorySeeds);
const dimono = requireSeed("cg-dimono-ptx", fillerInventorySeeds);
const luxiva = requireSeed("luxiva-mesogel", fillerInventorySeeds);

const hyaron = requireSeed("hyaron", skinAndSupportInventorySeeds);
const kiara = requireSeed("kiara-reju", skinAndSupportInventorySeeds);
const jalupro = requireSeed("jalupro-hmw", skinAndSupportInventorySeeds);
const liporase = requireSeed("liporase-1500", skinAndSupportInventorySeeds);
const hyalase = requireSeed("hyalase-1500", skinAndSupportInventorySeeds);

const alcarisa28 = {
  id: "28",
  label: "مدل ۲۸",
  nameFa: "آلکاریسا ۲۸",
  nameEn: "ALCARISA 28",
  image: "/images/products/editorial/fillers-family.webp",
  imageAlt: "نمای ادیتوریال خانواده فیلر برای آلکاریسا ۲۸؛ مدل دقیق روی بسته کنترل می‌شود",
  imageVerified: false,
  imageKind: "editorial-family" as const,
  imageApproved: true,
  volume: "۲ سرنگ ۱ میلی‌لیتری؛ مجموع ۲ میلی‌لیتر",
  summary: "آلکاریسا ۲۸ چهارمین مدل ثبت‌شده در کاتالوگ فعلی سپیدطب است. نام مدل ۲۸ روی بسته مبنای تحویل است و تصویر دقیق همان بچ هنگام استعلام کنترل می‌شود.",
  features: ["مدل ۲۸", "۲ × ۱ میلی‌لیتر", "ثبت‌شده در کاتالوگ سپیدطب"],
  specs: [["مدل", "ALCARISA 28"], ["حجم", "۲ × ۱ میلی‌لیتر"], ["وضعیت", "مدل موجود در کاتالوگ سپیدطب"]] as Array<[string, string]>,
  priceToman: 4_600_000,
  priceNote: "قیمت مرجع سپیدطب در ۲۵ مرداد ۱۴۰۵؛ قیمت زنده فروشگاه اولویت دارد",
  sourceName: "SepiidTeb — Alcarisa 16/20/24/28",
  sourceUrl: "https://sepiidteb.ir/product/117/",
};

const alcarisaSeed: ProductSeed = {
  ...alcarisa,
  badge: "۴ مدل موجود در کاتالوگ",
  summary: "آلکاریسا در کاتالوگ فعلی سپیدطب با چهار مدل ۱۶، ۲۰، ۲۴ و ۲۸ ثبت شده است. انتخاب مدل در همین صفحه انجام می‌شود و طراحی، چیدمان و هویت بصری فعلی محصول بدون تغییر باقی می‌ماند.",
  variants: [...(alcarisa.variants ?? []), alcarisa28],
};

// Keep every existing product variant. Inventory filtering may hide whole
// product families, but it must not collapse a published family to one variant.
const revofilSeed: ProductSeed = revofil;

const neurafillSeed: ProductSeed = {
  slug: "neurafill-deep-lidocaine",
  nameFa: "نورافیل",
  nameEn: "NEURAFILL",
  brand: "Neurafill",
  category: "fillers",
  type: "خانواده فیلر نورافیل",
  volume: "مدل‌های Deep، Volume و Lido",
  priceToman: 5_000_000,
  priceNote: "قیمت مرجع سپیدطب؛ مدل انتخابی هنگام استعلام کنترل شود",
  badge: "۳ مدل در سپیدطب",
  image: "/images/products/sourced/norafill-deep.webp",
  imageAlt: "بسته نورافیل؛ مدل دقیق هنگام انتخاب و استعلام کنترل می‌شود",
  imageVerified: true,
  publishedInCatalog: true,
  sourceName: "SepiidTeb — نورافیل اصلی",
  sourceUrl: "https://sepiidteb.ir/product/116/",
  reviewedAt,
  sourceStatus: "مدل‌های Deep، Volume و Lido با صفحه محصول فعلی سپیدطب تطبیق داده شدند",
  summary: "نورافیل در کاتالوگ فعلی سپیدطب با سه انتخاب Deep، Volume و Lido ثبت شده است. صفحه سپید بیوتی این سه مدل را زیر یک خانواده نگه می‌دارد تا ساختار و هویت بصری فعلی سایت تغییر نکند.",
  audience: professionalAudience,
  features: ["سه مدل Deep، Volume و Lido", "مدل روی بسته مبنای تحویل", "حفظ صفحه یکپارچه برای خانواده نورافیل"],
  specs: [["برند", "NEURAFILL"], ["مدل‌های کاتالوگ سپیدطب", "Deep، Volume، Lido"]],
  checks: ["نام مدل انتخابی روی جعبه و سرنگ تطبیق داده شود.", "بچ‌کد، تاریخ و سلامت پلمب همان بسته بررسی شود.", "تصویر و مشخصات مدل موجود پیش از نهایی‌شدن سفارش کنترل شود."],
  variants: [
    {
      id: "deep",
      label: "Deep",
      nameFa: "نورافیل دیپ",
      nameEn: "NEURAFILL Deep",
      image: "/images/products/sourced/norafill-deep.webp",
      imageAlt: "تصویر بسته نورافیل دیپ",
      imageVerified: true,
      imageKind: "official",
      volume: "حجم روی بسته همان موجودی کنترل می‌شود",
      summary: "مدل Deep خانواده نورافیل؛ نام و حجم دقیق روی بسته موجود مبنای سفارش است.",
      features: ["مدل Deep", "ثبت‌شده در سپیدطب", "تطبیق بسته پیش از تحویل"],
      specs: [["مدل", "NEURAFILL Deep"]],
      priceToman: 5_000_000,
      priceNote: "قیمت مرجع سپیدطب؛ قیمت زنده فروشگاه اولویت دارد",
      sourceName: "SepiidTeb — نورافیل اصلی",
      sourceUrl: "https://sepiidteb.ir/product/116/",
    },
    {
      id: "volume",
      label: "Volume",
      nameFa: "نورافیل والیوم",
      nameEn: "NEURAFILL Volume",
      image: "/images/products/editorial/fillers-family.webp",
      imageAlt: "نمای ادیتوریال خانواده فیلر برای نورافیل والیوم؛ تصویر بسته هنگام استعلام تطبیق می‌شود",
      imageVerified: false,
      imageKind: "editorial-family",
      imageApproved: true,
      volume: "حجم روی بسته همان موجودی کنترل می‌شود",
      summary: "مدل Volume خانواده نورافیل در صفحه فعلی سپیدطب قابل انتخاب است؛ تصویر و حجم دقیق همان بسته پیش از سفارش کنترل می‌شود.",
      features: ["مدل Volume", "ثبت‌شده در سپیدطب", "تطبیق بسته پیش از تحویل"],
      specs: [["مدل", "NEURAFILL Volume"]],
      priceToman: 5_000_000,
      priceNote: "قیمت مرجع سپیدطب؛ قیمت زنده فروشگاه اولویت دارد",
      sourceName: "SepiidTeb — نورافیل اصلی",
      sourceUrl: "https://sepiidteb.ir/product/116/",
    },
    {
      id: "lido",
      label: "Lido",
      nameFa: "نورافیل لیدو",
      nameEn: "NEURAFILL Lido",
      image: "/images/products/editorial/fillers-family.webp",
      imageAlt: "نمای ادیتوریال خانواده فیلر برای نورافیل لیدو؛ تصویر بسته هنگام استعلام تطبیق می‌شود",
      imageVerified: false,
      imageKind: "editorial-family",
      imageApproved: true,
      volume: "حجم روی بسته همان موجودی کنترل می‌شود",
      summary: "مدل Lido خانواده نورافیل در صفحه فعلی سپیدطب قابل انتخاب است؛ تصویر و حجم دقیق همان بسته پیش از سفارش کنترل می‌شود.",
      features: ["مدل Lido", "ثبت‌شده در سپیدطب", "تطبیق بسته پیش از تحویل"],
      specs: [["مدل", "NEURAFILL Lido"]],
      priceToman: 5_000_000,
      priceNote: "قیمت مرجع سپیدطب؛ قیمت زنده فروشگاه اولویت دارد",
      sourceName: "SepiidTeb — نورافیل اصلی",
      sourceUrl: "https://sepiidteb.ir/product/116/",
    },
  ],
};

const neuramisLidoOneMl = {
  id: "lido-1ml",
  label: "Lido · ۱ سی‌سی",
  nameFa: "نورامیس لیدو ۱ سی‌سی",
  nameEn: "NEURAMIS Lido 1 mL",
  image: "/images/products/sourced/neuramis-lidocaine.webp",
  imageAlt: "نمای مرجع نورامیس لیدو یک میلی‌لیتری",
  imageVerified: false,
  imageKind: "market-reference" as const,
  imageApproved: true,
  volume: "۱ سرنگ ۱ میلی‌لیتری",
  summary: "گزینه Lido یک‌سی‌سی مطابق انتخاب‌های فعلی صفحه نورامیس در سپیدطب اضافه شده است.",
  features: ["مدل Lido", "۱ میلی‌لیتر", "ثبت‌شده در سپیدطب"],
  specs: [["مدل", "NEURAMIS Lido"], ["حجم", "۱ میلی‌لیتر"]] as Array<[string, string]>,
  priceToman: 3_895_000,
  priceNote: "قیمت مرجع سپیدطب؛ قیمت زنده فروشگاه اولویت دارد",
  sourceName: "SepiidTeb — نورامیس ۱ و ۱۰ سی‌سی",
  sourceUrl: "https://sepiidteb.ir/product/92/",
};

const neuramisVolumeTenMl = {
  id: "volume-10ml",
  label: "Volume · ۱۰×۱ میل",
  nameFa: "نورامیس والیوم بسته ۱۰ عددی",
  nameEn: "NEURAMIS Volume 10 × 1 mL",
  image: "/images/products/editorial/fillers-family.webp",
  imageAlt: "نمای ادیتوریال خانواده فیلر برای نورامیس والیوم ۱۰ سی‌سی؛ بسته دقیق هنگام استعلام کنترل می‌شود",
  imageVerified: false,
  imageKind: "editorial-family" as const,
  imageApproved: true,
  volume: "۱۰ × ۱ میلی‌لیتر؛ مجموع ۱۰ میلی‌لیتر",
  summary: "گزینه Volume ده‌سی‌سی مطابق ترکیب مقدار و مدل صفحه فعلی نورامیس در سپیدطب اضافه شده است؛ تعداد و بسته دقیق پیش از تحویل کنترل می‌شود.",
  features: ["مدل Volume", "مجموع ۱۰ میلی‌لیتر", "ثبت‌شده در سپیدطب"],
  specs: [["مدل", "NEURAMIS Volume"], ["مقدار کاتالوگ", "۱۰ سی‌سی"]] as Array<[string, string]>,
  priceToman: 3_895_000,
  priceNote: "قیمت مرجع سپیدطب؛ واحد نهایی قیمت هنگام استعلام تأیید شود",
  sourceName: "SepiidTeb — نورامیس ۱ و ۱۰ سی‌سی",
  sourceUrl: "https://sepiidteb.ir/product/92/",
};

const neuramisSeed: ProductSeed = {
  ...neuramis,
  badge: "۶ انتخاب در سپیدطب",
  summary: "نورامیس در صفحه فعلی سپیدطب دو مقدار ۱ و ۱۰ سی‌سی و سه مدل Deep، Lido و Volume دارد. هر شش ترکیب در انتخاب‌گر یکپارچه سپید بیوتی نگه داشته می‌شوند بدون تغییر در ساختار صفحه.",
  features: ["Deep، Lido و Volume", "انتخاب مقدار ۱ یا ۱۰ سی‌سی", "شش ترکیب مطابق کاتالوگ فعلی سپیدطب"],
  variants: [...(neuramis.variants ?? []), neuramisLidoOneMl, neuramisVolumeTenMl],
};

const perleuxSeed: ProductSeed = {
  ...perleux,
  nameFa: "پرلوکس ۲ سی‌سی",
  nameEn: "PERLEUX 2 cc",
  volume: "۲ سی‌سی؛ مدل Nova یا Lip",
  badge: "Nova / Lip",
  priceToman: 9_500_000,
  priceNote: "قیمت مرجع سپیدطب؛ مدل را انتخاب کنید",
  summary: "پرلوکس در کاتالوگ فعلی سپیدطب با دو مدل Nova و Lip ثبت شده است. هر دو مدل در همان صفحه محصول سپید بیوتی نمایش داده می‌شوند تا طراحی و ساختار فعلی حفظ شود.",
  features: ["دو مدل Nova و Lip", "حجم درج‌شده در سپیدطب: ۲ سی‌سی", "انتخاب مدل بدون تغییر صفحه"],
  variants: [
    {
      id: "nova",
      label: "Nova",
      nameFa: "پرلوکس نوا",
      nameEn: "PERLEUX Nova",
      image: perleux.image ?? "/images/products/editorial/skin-boosters-family.webp",
      imageAlt: "نمای پرلوکس نوا؛ مدل روی بسته هنگام استعلام کنترل می‌شود",
      imageVerified: perleux.imageVerified,
      imageKind: perleux.imageKind,
      imageApproved: perleux.imageApproved,
      volume: "۲ سی‌سی؛ طبق کاتالوگ سپیدطب",
      summary: "مدل Nova پرلوکس مطابق کاتالوگ فعلی سپیدطب در انتخاب‌گر محصول قرار دارد.",
      features: ["مدل Nova", "۲ سی‌سی", "ثبت‌شده در سپیدطب"],
      specs: [["مدل", "PERLEUX Nova"], ["حجم", "۲ سی‌سی"]],
      priceToman: 9_500_000,
      priceNote: "قیمت مرجع سپیدطب؛ قیمت زنده فروشگاه اولویت دارد",
      sourceName: "SepiidTeb — Perleux Nova/Lip",
      sourceUrl: "https://sepiidteb.ir/product/94/",
    },
    {
      id: "lip",
      label: "Lip",
      nameFa: "پرلوکس لیپ",
      nameEn: "PERLEUX Lip",
      image: perleux.image ?? "/images/products/editorial/skin-boosters-family.webp",
      imageAlt: "نمای پرلوکس لیپ؛ مدل روی بسته هنگام استعلام کنترل می‌شود",
      imageVerified: perleux.imageVerified,
      imageKind: perleux.imageKind,
      imageApproved: perleux.imageApproved,
      volume: "۲ سی‌سی؛ طبق کاتالوگ سپیدطب",
      summary: "مدل Lip پرلوکس مطابق کاتالوگ فعلی سپیدطب در انتخاب‌گر محصول قرار دارد.",
      features: ["مدل Lip", "۲ سی‌سی", "ثبت‌شده در سپیدطب"],
      specs: [["مدل", "PERLEUX Lip"], ["حجم", "۲ سی‌سی"]],
      priceToman: 9_500_000,
      priceNote: "قیمت مرجع سپیدطب؛ قیمت زنده فروشگاه اولویت دارد",
      sourceName: "SepiidTeb — Perleux Nova/Lip",
      sourceUrl: "https://sepiidteb.ir/product/94/",
    },
  ],
};

const audreySeed: ProductSeed = audrey;

const blankBSeed: ProductSeed = {
  slug: "blank-b",
  nameFa: "بلانک بی",
  nameEn: "Blank B",
  brand: "Blank B",
  category: "skin-boosters",
  type: "محصول حرفه‌ای مراقبت و جوان‌سازی پوست",
  priceToman: 7_400_000,
  priceNote: "قیمت مرجع سپیدطب در ۲۵ مرداد ۱۴۰۵؛ قیمت زنده فروشگاه اولویت دارد",
  badge: "جدید از سپیدطب",
  image: "/images/products/editorial/skin-boosters-family.webp",
  imageAlt: "تصویر ادیتوریال هم‌خانواده برای بلانک بی؛ تصویر دقیق بسته هنگام استعلام تطبیق می‌شود",
  imageVerified: false,
  imageKind: "editorial-family",
  imageApproved: true,
  publishedInCatalog: true,
  sourceName: "SepiidTeb — Blank B",
  sourceUrl: "https://sepiidteb.ir/product/122/",
  reviewedAt,
  sourceStatus: "وجود محصول و نام Blank B با کاتالوگ زنده سپیدطب در ۲۵ مرداد ۱۴۰۵ تطبیق داده شد",
  summary: "بلانک بی در کاتالوگ فعلی سپیدطب عرضه می‌شود و به موجودی مرجع سپید بیوتی اضافه شده است. تا زمان ثبت پک‌شات اختصاصی، از تصویر ادیتوریال هم‌خانواده استفاده می‌شود تا هویت بصری دسته‌بندی تغییر نکند و تصویر نادرست به محصول نسبت داده نشود.",
  audience: professionalAudience,
  features: ["ثبت‌شده در کاتالوگ فعلی سپیدطب", "صفحه محصول مستقل در سپید بیوتی", "استفاده از تصویر هم‌خانواده تا تأیید پک‌شات دقیق"],
  specs: [["نام", "Blank B"], ["منبع موجودی", "SepiidTeb"]],
  checks: ["نام دقیق Blank B روی بسته با سفارش تطبیق داده شود.", "بچ‌کد، تاریخ و سلامت بسته هنگام استعلام کنترل شود.", "تصویر دقیق همان موجودی پیش از نهایی‌شدن سفارش دریافت شود."],
};

export const currentInventorySeeds: ProductSeed[] = [
  alcarisaSeed,
  revofilSeed,
  rabianca,
  neurafillSeed,
  neuramisSeed,
  perleuxSeed,
  audreySeed,
  inovosense,
  dimono,
  luxiva,
  hyaron,
  kiara,
  jalupro,
  liporase,
  hyalase,
  blankBSeed,
];

export const currentInventoryLegacyAliases: Record<string, string> = {
  "neuramis-volume-lidocaine": "neuramis-deep-lidocaine",
  "neuramis-lidocaine": "neuramis-deep-lidocaine",
  "audrey-h": "audrey-m",
  "dimono-3ml": "cg-dimono-ptx",
  "dimono-mesotherapy": "cg-dimono-ptx",
  luxiva: "luxiva-mesogel",
};

const restoredLegacyInventorySlugs = [
  "dyston-500",
  "masport",
  "fusion-f-lift-face",
  "fusion-f-mesomatrix",
  "fusion-f-radiance",
  "fusion-f-melaclear",
  "fusion-f-vitamin-c",
  "fusion-f-melirutin",
  "fusion-f-eye-contour",
  "fusion-f-hair",
  "fusion-f-hair-men",
  "mesolike-top-age-pro",
  "mesolike-lift",
  "mesolike-whitening-shine",
  "mesolike-glutathione",
  "mesolike-eye-top",
  "mesolike-hair",
  "mesolike-hair-men",
  "mesolike-dutasteride",
] as const;

const approvedInventorySlugs = new Set([
  ...currentInventorySeeds.map((seed) => seed.slug),
  ...restoredLegacyInventorySlugs,
]);

export function canonicalInventorySlug(slug: string): string {
  return currentInventoryLegacyAliases[slug] ?? slug;
}

export function isApprovedInventorySlug(slug: string): boolean {
  return approvedInventorySlugs.has(canonicalInventorySlug(slug));
}
