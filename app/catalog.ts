import type { Category, Product } from "./data";
import {
  currentInventoryLegacyAliases,
  currentInventorySeeds,
} from "./current-inventory";
import type { ProductSeed } from "./product-seed";

export type CatalogGroup = {
  slug: "injectables" | "mesotherapy-cocktails" | "professional-support";
  title: string;
  en: string;
  description: string;
  categorySlugs: string[];
};

export const catalogGroups: CatalogGroup[] = [
  {
    slug: "injectables",
    title: "محصولات تزریقی زیبایی",
    en: "PROFESSIONAL INJECTABLES",
    description:
      "فیلرها، اسکین‌بوسترها، مزوژل‌ها و فرآورده‌های بوتولینوم در مسیرهای جدا و قابل‌مقایسه.",
    categorySlugs: ["fillers", "skin-boosters", "botulinum-toxins"],
  },
  {
    slug: "mesotherapy-cocktails",
    title: "کوکتل‌های حرفه‌ای مزوتراپی",
    en: "MESOTHERAPY COCKTAILS",
    description:
      "دسته‌بندی کوکتل‌ها بر اساس عنوان رایج بازار؛ بدون تبدیل عنوان بازاری به تضمین درمانی.",
    categorySlugs: [
      "rejuvenation-cocktails",
      "brightening-cocktails",
      "eye-cocktails",
      "hair-cocktails",
    ],
  },
  {
    slug: "professional-support",
    title: "محصولات پشتیبان حرفه‌ای",
    en: "PROFESSIONAL SUPPORT",
    description:
      "فرآورده‌های کمکی کلینیکی با تفکیک روشن از محصولات زیبایی و با تأکید بر نام، قدرت و واحد بسته.",
    categorySlugs: ["hyaluronidase-products"],
  },
];

export const catalogCategories: Category[] = [
  {
    slug: "fillers",
    title: "فیلرها و ژل‌های حجم‌دهنده",
    en: "DERMAL FILLERS",
    group: "injectables",
    groupTitle: "محصولات تزریقی زیبایی",
    description:
      "مقایسه فیلرها و ژل‌های حرفه‌ای بر اساس نام دقیق مدل، حجم درج‌شده و نوع بسته‌بندی.",
    guide:
      "ناحیه، تکنیک و تناسب محصول باید توسط پزشک تعیین شود؛ اطلاعات بازار مرجع نهایی نیست.",
    image: "/images/drive/category-fillers.webp",
    position: "50%",
  },
  {
    slug: "skin-boosters",
    title: "مزوژل و اسکین‌بوستر",
    en: "SKIN BOOSTERS & MESOGELS",
    group: "injectables",
    groupTitle: "محصولات تزریقی زیبایی",
    description:
      "محصولات حرفه‌ای مرتبط با کیفیت و رطوبت پوست، با تفکیک مشخصات قطعی از داده‌های رایج بازار.",
    guide:
      "مزوژل، اسکین‌بوستر و فیلر مترادف نیستند؛ محصول و پروتکل باید جداگانه بررسی شود.",
    image: "/images/drive/category-skinbooster.webp",
    position: "50%",
  },
  {
    slug: "botulinum-toxins",
    title: "بوتاکس و فرآورده‌های بوتولینوم",
    en: "BOTULINUM TOXINS",
    group: "injectables",
    groupTitle: "محصولات تزریقی زیبایی",
    description:
      "نمایه فرآورده‌های بوتولینوم با تأکید بر نام دقیق، واحد، اصالت و بررسی مستقل زنجیره سرد.",
    guide:
      "شرایط نگهداری، شماره بچ، مجوز و صلاحیت مصرف‌کننده حرفه‌ای پیش از عرضه باید تأیید شود.",
    image: "/images/drive/category-botox.webp",
    position: "50%",
  },
  {
    slug: "rejuvenation-cocktails",
    title: "کوکتل‌های جوان‌سازی و کیفیت پوست",
    en: "REJUVENATION COCKTAILS",
    group: "mesotherapy-cocktails",
    groupTitle: "کوکتل‌های حرفه‌ای مزوتراپی",
    description:
      "محصولات دارای عنوان‌های رایج جوان‌سازی، آبرسانی و بهبود ظاهر پوست برای مقایسه حرفه‌ای.",
    guide:
      "این عنوان‌ها دسته‌بندی بازار هستند و نباید به‌عنوان وعده نتیجه یا توصیه عمومی خوانده شوند.",
    image: "/images/drive/product-fusion.webp",
    position: "50%",
  },
  {
    slug: "brightening-cocktails",
    title: "کوکتل‌های روشن‌کننده و ضدلک",
    en: "BRIGHTENING COCKTAILS",
    group: "mesotherapy-cocktails",
    groupTitle: "کوکتل‌های حرفه‌ای مزوتراپی",
    description:
      "مقایسه محصولات دارای عنوان‌های روشن‌کننده و یکنواخت‌کننده رنگ پوست بر اساس اطلاعات بسته.",
    guide:
      "ترکیبات، منع مصرف و روش حرفه‌ای هر محصول باید از بروشور رسمی همان مدل بررسی شود.",
    image: "/images/drive/category-skin.webp",
    position: "50%",
  },
  {
    slug: "eye-cocktails",
    title: "کوکتل‌های تخصصی دور چشم",
    en: "EYE CONTOUR COCKTAILS",
    group: "mesotherapy-cocktails",
    groupTitle: "کوکتل‌های حرفه‌ای مزوتراپی",
    description:
      "محصولات حرفه‌ای مرتبط با پوست اطراف چشم با اطلاعات محتاطانه و مسیر استعلام دقیق.",
    guide:
      "ناحیه اطراف چشم حساس است و انتخاب محصول و پروتکل فقط باید توسط فرد واجد صلاحیت انجام شود.",
    image: "/images/drive/category-mesotherapy.webp",
    position: "50%",
  },
  {
    slug: "hair-cocktails",
    title: "کوکتل‌های مو و پوست سر",
    en: "HAIR & SCALP COCKTAILS",
    group: "mesotherapy-cocktails",
    groupTitle: "کوکتل‌های حرفه‌ای مزوتراپی",
    description:
      "نمایه کوکتل‌های حرفه‌ای مو و پوست سر، همراه با هشدار روشن درباره ضرورت تشخیص علت ریزش.",
    guide:
      "عنوان ضدریزش تضمین نتیجه نیست؛ علت ریزش و تناسب پروتکل باید ابتدا ارزیابی شود.",
    image: "/images/product-hair-care-v2.webp",
    position: "50%",
  },
  {
    slug: "hyaluronidase-products",
    title: "آنزیم‌های هیالورونیداز",
    en: "HYALURONIDASE PRODUCTS",
    group: "professional-support",
    groupTitle: "محصولات پشتیبان حرفه‌ای",
    description:
      "مقایسه آنزیم‌ها بر اساس نام سازنده، قدرت درج‌شده، تعداد ویال یا آمپول و کشور بسته‌بندی.",
    guide:
      "این دسته برای مصرف عمومی یا خانگی نیست؛ قدرت و روش آماده‌سازی هر برند باید از برگه همان بسته خوانده شود.",
    image: "/images/drive/category-supplies.webp",
    position: "50%",
  },
];

/**
 * Initial market baselines for products that do not yet have a WooCommerce
 * price. Live WooCommerce prices always take precedence over these values.
 */
export const marketBaselinePrices: Record<string, number> = {
  "neurafill-deep-lidocaine": 2_450_000,
  "arasti-white": 2_100_000,
  "zishel-rose-glam": 6_400_000,
  "sofiderm-derm-plus": 3_000_000,
  "regenfill-deep": 8_460_000,
  "regenfill-lido": 8_810_000,
  "regenfill-volume": 8_770_000,
  "ejal-40": 3_700_000,
  "mesoheal-plus": 4_500_000,
  "xitritall-hydro": 4_500_000,
  "reyoungel-revital-bioha": 3_500_000,
  "vitten-hydro-plus": 6_100_000,
  "roytrin-skin-booster": 2_500_000,
  "nabota-150": 890_000,
  "siax-100": 4_800_000,
  "siax-200": 8_000_000,
  "neuronox-50": 1_100_000,
  "neuronox-100": 2_000_000,
  myobloc: 900_000,
  antitall: 900_000,
  dysport: 3_000_000,
  "fusion-f-lift-face": 3_850_000,
  "fusion-f-mesomatrix": 6_700_000,
  "dermaheal-hsr": 1_200_000,
  "mesolike-top-age-pro": 980_000,
  "mesolike-lift": 950_000,
  "medicube-pdrn": 4_500_000,
  "fusion-f-radiance": 2_280_000,
  "fusion-f-melaclear": 3_500_000,
  "fusion-f-vitamin-c": 1_900_000,
  "fusion-f-melirutin": 1_750_000,
  "revitacare-532": 3_600_000,
  "mesolike-whitening-shine": 900_000,
  "mesolike-glutathione": 900_000,
  "dermaheal-sb": 1_200_000,
  "genosys-sws": 1_790_000,
  "fusion-f-eye-contour": 3_000_000,
  "mesolike-eye-top": 950_000,
  "fusion-f-hair": 4_200_000,
  "fusion-f-hair-men": 9_200_000,
  "revitacare-haircare": 2_560_000,
  "dermaheal-hl": 1_200_000,
  "mesolike-hair": 900_000,
  "mesolike-hair-men": 950_000,
  "genosys-hr3": 1_790_000,
  "mesolike-dutasteride": 5_150_000,
};

const legacySeeds: ProductSeed[] = [
  {
    slug: "neuramis-deep-lidocaine",
    nameFa: "نورامیس دیپ لیدوکائین",
    nameEn: "Neuramis Deep Lidocaine",
    brand: "Neuramis / Medytox",
    category: "fillers",
    type: "فیلر هیالورونیک اسید کراس‌لینک‌شده حاوی لیدوکائین",
    volume: "۱ سرنگ ۱ میلی‌لیتری",
    badge: "پر‌جست‌وجو در ایران",
    publishedInCatalog: true,
    sourceName: "Medytox — Neuramis®",
    sourceUrl: "https://www.medytox.com/page/neuramis_en?site_id=en",
    reviewedAt: "2026-08-10",
    sourceStatus: "نام مدل، حجم و شرایط نگهداری با صفحه رسمی Medytox تطبیق شد",
    summary:
      "نورامیس دیپ لیدوکائین یکی از مدل‌های شناخته‌شده خانواده Neuramis است. صفحه رسمی Medytox این خانواده را در گروه مواد زیستی ترمیم بافت، به‌صورت ابزار پزشکی استریل و یک‌بارمصرف معرفی می‌کند. انتخاب ناحیه، حجم تزریق و تناسب مدل باید فقط پس از ارزیابی پزشک انجام شود.",
    audience: "پزشکان و مراکز درمانی دارای صلاحیت تزریق فیلر",
    features: [
      "بسته یک‌بارمصرف با حجم ۱ میلی‌لیتر",
      "هیالورونیک اسید کراس‌لینک‌شده همراه لیدوکائین",
      "مدل Deep؛ نام کامل مدل باید روی جعبه و سرنگ یکسان باشد",
    ],
    specs: [
      ["نام رسمی", "Neuramis® Deep Lidocaine"],
      ["سازنده", "Medytox"],
      ["گروه محصول", "فیلر هیالورونیک اسید کراس‌لینک‌شده حاوی لیدوکائین"],
      ["واحد بسته‌بندی", "۱٫۰ میلی‌لیتر؛ یک‌بارمصرف"],
      ["طبقه‌بندی سازنده", "ابزار پزشکی استریل یک‌بارمصرف"],
      ["شرایط نگهداری اعلام‌شده", "۲ تا ۲۵ درجه سانتی‌گراد؛ دور از گرما، یخ‌زدگی و نور مستقیم"],
      ["وضعیت عرضه", "ویژه مصرف حرفه‌ای؛ موجودی و بچ همان بسته باید استعلام شود"],
    ],
    checks: [
      "عبارت Deep Lidocaine و حجم 1.0 mL روی جعبه و سرنگ با سفارش تطبیق داده شود.",
      "بچ‌کد، تاریخ، پلمب و سلامت سرنگ پیش از تحویل ثبت شود.",
      "محصول یخ‌زده، گرم‌شده یا دارای بسته آسیب‌دیده تا بررسی حرفه‌ای مصرف نشود.",
    ],
    faq: [
      {
        question: "نورامیس دیپ لیدوکائین چند سی‌سی است؟",
        answer:
          "واحد بسته‌بندی اعلام‌شده در صفحه رسمی Medytox برای این خانواده ۱٫۰ میلی‌لیتر است. مشخصات روی همان جعبه موجود را پیش از خرید دوباره بررسی کنید.",
      },
      {
        question: "نورامیس دیپ برای لب بهتر است یا خط خنده؟",
        answer:
          "از روی نام محصول نمی‌شود برای یک ناحیه نسخه داد. ضخامت بافت، هدف درمان و تکنیک پزشک تعیین می‌کند کدام مدل و چه حجمی مناسب است.",
      },
      {
        question: "وجود لیدوکائین یعنی تزریق بدون درد است؟",
        answer:
          "خیر. لیدوکائین می‌تواند بر تجربه درد اثر بگذارد، اما درد و تحمل افراد یکسان نیست و بی‌دردبودن تضمین نمی‌شود.",
      },
    ],
  },
  { slug: "neuramis-volume-lidocaine", nameFa: "نورامیس والیوم لیدوکائین", nameEn: "Neuramis Volume Lidocaine", brand: "Neuramis", category: "fillers", type: "فیلر حجم‌دهنده", detail: "حاوی لیدوکائین" },
  { slug: "neuramis-lidocaine", nameFa: "نورامیس لیدو", nameEn: "Neuramis Lidocaine", brand: "Neuramis", category: "fillers", type: "فیلر هیالورونیک اسید", volume: "۱ و ۱۰ سی‌سی؛ گزارش بازار", detail: "حاوی لیدوکائین", warning: "حجم ۱۰ سی‌سی باید با بسته‌بندی رسمی تطبیق داده شود." },
  { slug: "neurafill-deep-lidocaine", nameFa: "نورافیل دیپ لیدوکائین", nameEn: "Neurafill Deep Lidocaine", brand: "Neurafill", category: "fillers", type: "فیلر هیالورونیک اسید", detail: "حاوی لیدوکائین" },
  { slug: "audrey-m", nameFa: "آدری ام", nameEn: "Audrey M", brand: "Audrey", category: "fillers", type: "فیلر", volume: "۱۰ سی‌سی؛ گزارش بازار", country: "کره جنوبی؛ گزارش بازار", detail: "حاوی لیدوکائین", warning: "حجم و کشور سازنده باید با بسته رسمی تأیید شود." },
  { slug: "audrey-h", nameFa: "آدری اچ", nameEn: "Audrey H", brand: "Audrey", category: "fillers", type: "فیلر", volume: "۱۰ میلی‌لیتر؛ گزارش بازار", detail: "حاوی لیدوکائین", warning: "حجم درج‌شده نیازمند تأیید رسمی است." },
  { slug: "arasti-white", nameFa: "آراستی وایت", nameEn: "ARASTI White", brand: "ARASTI", category: "fillers", type: "فیلر", detail: "حاوی لیدوکائین" },
  {
    slug: "revofil-ultra",
    nameFa: "رووفیل اولترا",
    nameEn: "REVOFIL™ Ultra",
    brand: "Revofil / Caregen",
    category: "fillers",
    type: "فیلر هیالورونیک اسید کراس‌لینک‌شده همراه پپتید",
    volume: "۲ سرنگ ۱ میلی‌لیتری",
    badge: "پر‌جست‌وجو در ایران",
    image: "/images/drive/product-revofil.webp",
    imageVerified: true,
    publishedInCatalog: true,
    sourceName: "REVOFIL Ultra — technical product specification",
    sourceUrl: "https://www.directdermasupplies.com/products/revofil/revofil-ultra-1ml",
    reviewedAt: "2026-08-10",
    sourceStatus: "حجم و ترکیب در چند فهرست فنی محصول تطبیق شد؛ بسته موجود مرجع نهایی است",
    summary:
      "رووفیل اولترا فیلر هیالورونیک اسید کراس‌لینک‌شده Caregen است که همراه پپتیدهای Oligopeptide-72 و Oligopeptide-50 معرفی می‌شود. این مدل برای کار حرفه‌ای طراحی شده و انتخاب آن برای حجم‌دهی یا اصلاح خطوط عمیق باید بر اساس معاینه و تکنیک پزشک باشد، نه صرفاً محبوبیت برند.",
    audience: "پزشکان و کلینیک‌های دارای صلاحیت تزریق فیلر",
    features: [
      "غلظت اعلام‌شده هیالورونیک اسید: ۲۳ میلی‌گرم در میلی‌لیتر",
      "حاوی Oligopeptide-72 و Oligopeptide-50",
      "بسته رایج فنی: دو سرنگ ۱ میلی‌لیتری با سوزن 27G",
    ],
    specs: [
      ["نام رسمی", "REVOFIL™ Ultra"],
      ["سازنده", "Caregen Co., Ltd."],
      ["گروه محصول", "فیلر هیالورونیک اسید کراس‌لینک‌شده همراه پپتید"],
      ["غلظت هیالورونیک اسید", "۲۳ میلی‌گرم در میلی‌لیتر"],
      ["پپتیدهای اعلام‌شده", "Oligopeptide-72 و Oligopeptide-50"],
      ["بسته‌بندی مشاهده‌شده در منابع فنی", "۲ سرنگ ۱ میلی‌لیتری و سوزن 27G"],
      ["وضعیت عرضه", "فقط برای مصرف حرفه‌ای؛ بسته و مجوز محل عرضه باید جداگانه بررسی شود"],
    ],
    checks: [
      "نام Ultra را با مدل‌های Fine و Plus اشتباه نگیرید؛ نام کامل باید روی جعبه و سرنگ یکسان باشد.",
      "حجم هر سرنگ، تعداد سرنگ‌ها، بچ‌کد، تاریخ و پلمب همان بسته موجود بررسی شود.",
      "برای اصالت و وضعیت مجاز عرضه به تصویر جعبه اکتفا نشود و مسیر تأمین قابل‌پیگیری باشد.",
    ],
    faq: [
      {
        question: "رووفیل اولترا چند سی‌سی است؟",
        answer:
          "در فهرست‌های فنی بررسی‌شده، بسته به‌صورت دو سرنگ ۱ میلی‌لیتری معرفی شده است. چون بسته‌بندی بازارها ممکن است تفاوت داشته باشد، تعداد و حجم همان بسته موجود را پیش از خرید ببینید.",
      },
      {
        question: "رووفیل اولترا با رووفیل پلاس چه فرقی دارد؟",
        answer:
          "این دو مدل از یک خانواده‌اند اما نام و جایگاه فنی یکسانی ندارند. پزشک باید مدل را بر اساس ناحیه، عمق و هدف انتخاب کند؛ جایگزین‌کردن خودکار آنها درست نیست.",
      },
      {
        question: "ماندگاری رووفیل اولترا دقیقاً چقدر است؟",
        answer:
          "یک عدد ثابت برای همه قابل‌اعتماد نیست. ناحیه، مقدار، تکنیک، ویژگی‌های بافت و شرایط فرد روی نتیجه و دوام آن اثر می‌گذارند.",
      },
    ],
  },
  { slug: "zishel-rose-glam", nameFa: "زیشل رز گلم", nameEn: "Zishel Rose Glam", brand: "Zishel", category: "fillers", type: "فیلر", volume: "۱۰ سی‌سی؛ گزارش بازار" },
  { slug: "sofiderm-derm-plus", nameFa: "سوفیدرم درم پلاس", nameEn: "Sofiderm Derm Plus", brand: "Sofiderm", category: "fillers", type: "ژل هیالورونیک اسید", volume: "۱۰ میلی‌لیتر؛ گزارش بازار" },
  { slug: "regenfill-deep", nameFa: "رجنفیل دیپ", nameEn: "Regenfill Deep", brand: "Regenfill", category: "fillers", type: "فیلر", volume: "۱۱ سی‌سی؛ گزارش برخی آگهی‌ها", warning: "حجم ۱۱ سی‌سی تا مشاهده بسته رسمی قطعی نیست." },
  { slug: "regenfill-lido", nameFa: "رجنفیل لیدو", nameEn: "Regenfill Lido", brand: "Regenfill", category: "fillers", type: "فیلر", detail: "حاوی لیدوکائین" },
  { slug: "regenfill-volume", nameFa: "رجنفیل والیوم", nameEn: "Regenfill Volume", brand: "Regenfill", category: "fillers", type: "فیلر حجم‌دهنده" },
  { slug: "rabianca", nameFa: "رابیانکا", nameEn: "Rabianca", brand: "Rabianca", category: "fillers", type: "فیلر", volume: "۷۰ سی‌سی؛ گزارش برخی آگهی‌ها", warning: "عدد ۷۰ سی‌سی مشکوک است و پیش از انتشار قطعی باید با بسته رسمی تطبیق داده شود." },

  {
    slug: "ejal-40",
    nameFa: "اجال ۴۰",
    nameEn: "EJAL 40",
    brand: "Ejal / Medixa",
    category: "skin-boosters",
    type: "ژل بیورویتالایزر بر پایه هیالورونیک اسید",
    volume: "۱ سرنگ از پیش پرشده ۲ میلی‌لیتری",
    badge: "پر‌جست‌وجو در ایران",
    image: "/images/products/ejal-40.jpg",
    imageAlt: "تصویر واقعی بسته EJAL 40، جعبه قرمز ۴۰ میلی‌گرم در ۲ میلی‌لیتر",
    imageVerified: true,
    publishedInCatalog: true,
    sourceName: "Medixa — EJAL 40",
    sourceUrl: "https://www.medixasrl.com/ejal/",
    reviewedAt: "2026-08-10",
    sourceStatus: "نام محصول با صفحه Medixa و مشخصات فنی با بروشور محصول تطبیق شد",
    summary:
      "اجال ۴۰ یک ژل بیورویتالایزر هیالورونیک اسید از Medixa است. در بروشور فنی، ۴۰ میلی‌گرم هیالورونیک اسید در سرنگ ۲ میلی‌لیتری ذکر شده است. این محصول فیلر حجم‌دهنده کلاسیک نیست و انتخاب پروتکل یا ناحیه آن باید توسط پزشک انجام شود.",
    audience: "پزشکان و متخصصان دارای صلاحیت در درمان‌های تزریقی پوست",
    features: [
      "۴۰ میلی‌گرم هیالورونیک اسید در ۲ میلی‌لیتر",
      "هیالورونیک اسید با وزن مولکولی اعلام‌شده ۱۲۰۰ تا ۱۸۰۰ کیلو دالتون",
      "سرنگ استریل از پیش پرشده برای مصرف حرفه‌ای",
    ],
    specs: [
      ["نام رسمی", "EJAL 40"],
      ["شرکت", "Medixa Srl"],
      ["گروه محصول", "ژل بیورویتالایزر بر پایه هیالورونیک اسید"],
      ["مقدار هیالورونیک اسید", "۴۰ میلی‌گرم در مجموع"],
      ["حجم", "۱ سرنگ از پیش پرشده ۲ میلی‌لیتری"],
      ["وزن مولکولی اعلام‌شده", "۱۲۰۰ تا ۱۸۰۰ کیلو دالتون"],
      ["وضعیت عرضه", "فقط برای مصرف حرفه‌ای؛ بروشور و مجوز همان بسته بررسی شود"],
    ],
    checks: [
      "عبارت EJAL 40، حجم 2 mL و سلامت سرنگ روی بسته موجود بررسی شود.",
      "بچ‌کد، تاریخ، پلمب و شرایط نگهداری درج‌شده روی همان جعبه ثبت شود.",
      "شباهت نامی با محصولات دیگر Ejal باعث جایگزینی خودکار نشود؛ مدل دقیق مبناست.",
    ],
    faq: [
      {
        question: "اجال ۴۰ چند سی‌سی است؟",
        answer:
          "بروشور فنی بررسی‌شده، یک سرنگ از پیش پرشده ۲ میلی‌لیتری با مجموع ۴۰ میلی‌گرم هیالورونیک اسید را معرفی می‌کند.",
      },
      {
        question: "اجال ۴۰ فیلر است یا مزوژل؟",
        answer:
          "در معرفی فنی، ژل بیورویتالایزر بر پایه هیالورونیک اسید است. واژه «مزوژل» در بازار گسترده استفاده می‌شود؛ برای تصمیم، نام و طبقه‌بندی خود محصول مهم‌تر از عنوان بازاری است.",
      },
      {
        question: "اجال ۴۰ برای چه کسی مناسب است؟",
        answer:
          "پاسخ به وضعیت پوست، سابقه پزشکی، هدف و ارزیابی پزشک بستگی دارد. صفحه محصول جایگزین مشاوره یا تعیین پروتکل نیست.",
      },
    ],
  },
  { slug: "kiara-reju", nameFa: "کیارا ریجو", nameEn: "Kiara Reju", brand: "Kiara", category: "skin-boosters", type: "مزوژل و اسکین‌بوستر", volume: "۳ سرنگ ۲٫۲ میلی‌لیتری؛ مجموع ۶٫۶ میلی‌لیتر", country: "کره جنوبی؛ گزارش بازار", detail: "شرکت BioPlus در برخی آگهی‌ها" },
  { slug: "mesoheal-plus", nameFa: "مزوهیل پلاس", nameEn: "Mesoheal Plus", brand: "Mesoheal", category: "skin-boosters", type: "مزوژل جوان‌ساز", country: "کره جنوبی؛ گزارش بازار", detail: "شرکت Krofarma در برخی آگهی‌ها", warning: "شرکت و طبقه‌بندی محصول نیازمند تأیید رسمی است." },
  { slug: "xitritall-hydro", nameFa: "زیتریتال هیدرو", nameEn: "Xitritall Hydro", brand: "Xitritall", category: "skin-boosters", type: "مزوژل آبرسان", volume: "۲ سی‌سی؛ گزارش بازار", warning: "املای لاتین رسمی برند بررسی شود." },
  { slug: "reyoungel-revital-bioha", nameFa: "ری‌یانگل رویتال بایو اچ‌ای", nameEn: "Reyoungel Revital BIOHA", brand: "Reyoungel", category: "skin-boosters", type: "مزوژل جوان‌ساز", volume: "۲ سی‌سی؛ گزارش بازار", warning: "املای لاتین رسمی محصول بررسی شود." },
  { slug: "vitten-hydro-plus", nameFa: "ویتن هیدرو پلاس", nameEn: "Vitten Hydro Plus", brand: "Vitten", category: "skin-boosters", type: "مزوژل آبرسان", volume: "۹ سی‌سی و بسته پنج‌عددی؛ گزارش بازار", country: "کره جنوبی؛ گزارش بازار", warning: "بسته‌بندی و وضعیت مجاز عرضه باید مستقل بررسی شود." },
  { slug: "roytrin-skin-booster", nameFa: "رویترین اسکین‌بوستر", nameEn: "Roytrin Skin Booster", brand: "Roytrin", category: "skin-boosters", type: "مزوژل و اسکین‌بوستر", warning: "نام رسمی، حجم و وضعیت مجاز عرضه باید بررسی شود." },
  {
    slug: "jalupro-hmw",
    nameFa: "جالپرو اچ‌ام‌دبلیو",
    nameEn: "JALUPRO® HMW",
    brand: "Jalupro / Professional Derma",
    category: "skin-boosters",
    type: "بیورویتالایزر حاوی سدیم هیالورونات و آمینواسید",
    volume: "سرنگ ۱٫۵ میلی‌لیتری + ویال ۱ میلی‌لیتری",
    badge: "پر‌جست‌وجو در ایران",
    image: "/images/drive/product-jalupro.webp",
    imageVerified: true,
    publishedInCatalog: true,
    sourceName: "Jalupro — JALUPRO® HMW",
    sourceUrl: "https://md.jalupro.com/?p=25",
    reviewedAt: "2026-08-10",
    sourceStatus: "طبقه‌بندی و ساختار محصول با صفحه رسمی Jalupro تطبیق شد",
    summary:
      "جالپرو HMW یک بیورویتالایزر تزریقی حاوی سدیم هیالورونات با وزن مولکولی بالا و محلول آمینواسید است. بسته بررسی‌شده از یک سرنگ ۱٫۵ میلی‌لیتری و یک ویال ۱ میلی‌لیتری تشکیل می‌شود. این مشخصات برای شناخت مدل است؛ پروتکل درمان را پزشک تعیین می‌کند.",
    audience: "پزشکان و مراکز دارای صلاحیت در درمان‌های تزریقی پوست",
    features: [
      "ترکیب سدیم هیالورونات با محلول آمینواسید",
      "ساختار دو جزئی: سرنگ ۱٫۵ میلی‌لیتری و ویال ۱ میلی‌لیتری",
      "مدل HMW؛ با Jalupro Classic یا مدل‌های دیگر یکسان نیست",
    ],
    specs: [
      ["نام رسمی", "JALUPRO® HMW"],
      ["شرکت", "Professional Derma SA"],
      ["گروه محصول", "بیورویتالایزر پوستی"],
      ["جزء هیالورونیک اسید", "۱ سرنگ ۱٫۵ میلی‌لیتری سدیم هیالورونات"],
      ["جزء آمینواسید", "۱ ویال ۱ میلی‌لیتری محلول آمینواسید"],
      ["غلظت‌های رایج در مشخصات فنی", "سدیم هیالورونات ۲۰ mg/mL و آمینواسید ۸۰ mg/mL"],
      ["وضعیت عرضه", "فقط برای مصرف حرفه‌ای؛ بروشور همان نسخه و بسته مرجع است"],
    ],
    checks: [
      "عبارت HMW را با Classic یا Super Hydro اشتباه نگیرید؛ نام کامل مدل روی جعبه کنترل شود.",
      "وجود هر دو جزء بسته، بچ‌کد، تاریخ و سلامت پلمب پیش از تحویل بررسی شود.",
      "ترکیب، روش آماده‌سازی و شرایط نگهداری فقط از بروشور همان بسته دنبال شود.",
    ],
    faq: [
      {
        question: "جالپرو HMW چند سی‌سی است؟",
        answer:
          "بسته بررسی‌شده شامل یک سرنگ ۱٫۵ میلی‌لیتری و یک ویال ۱ میلی‌لیتری است. این دو جزء نقش یکسانی ندارند و باید مطابق دستور حرفه‌ای همان محصول استفاده شوند.",
      },
      {
        question: "جالپرو HMW با جالپرو کلاسیک فرق دارد؟",
        answer:
          "بله. این‌ها مدل‌های جداگانه‌اند و مشخصات و جایگاه یکسانی ندارند. نام HMW باید روی بسته و سفارش به‌روشنی ذکر شده باشد.",
      },
      {
        question: "جالپرو HMW برای حجم‌دهی است؟",
        answer:
          "این محصول در منبع رسمی به‌عنوان بیورویتالایزر معرفی می‌شود، نه جایگزین خودکار فیلر حجم‌دهنده. هدف درمان را پزشک پس از معاینه مشخص می‌کند.",
      },
    ],
  },
  { slug: "dimono-3ml", nameFa: "دیمونو ۳ سی‌سی", nameEn: "Dimono 3 cc", brand: "Dimono", category: "skin-boosters", type: "مزوژل جوان‌ساز", volume: "۳ سی‌سی؛ گزارش بازار", warning: "با Dimono Mesotherapy از نظر بسته‌بندی تطبیق داده شود." },
  { slug: "dimono-mesotherapy", nameFa: "مزو جوان‌ساز دیمونو", nameEn: "Dimono Mesotherapy", brand: "Dimono", category: "skin-boosters", type: "محصول مزوتراپی و جوان‌سازی", warning: "احتمال نام‌گذاری متفاوت یک محصول وجود دارد؛ بسته رسمی مرجع است." },
  { slug: "luxiva", nameFa: "لوکسیوا", nameEn: "Luxiva", brand: "Luxiva", category: "skin-boosters", type: "کوکتل یا مزوژل جوان‌ساز چندترکیبی", volume: "۱۶ سی‌سی؛ گزارش بازار", warning: "طبقه‌بندی و حجم رسمی پیش از عرضه تأیید شود." },

  { slug: "dyston-500", nameFa: "دیستون ۵۰۰", nameEn: "Dyston 500", brand: "Dyston", category: "botulinum-toxins", type: "سم بوتولینوم", volume: "۵۰۰ واحد؛ گزارش بازار", country: "ایران؛ گزارش بازار", warning: "نام رسمی، مجوز و شرایط زنجیره سرد بررسی شود." },
  { slug: "nabota-150", nameFa: "نابوتا ۱۵۰", nameEn: "Nabota 150", brand: "Nabota", category: "botulinum-toxins", type: "سم بوتولینوم", volume: "۱۵۰ واحد؛ گزارش بازار", country: "کره جنوبی؛ گزارش بازار", warning: "واحد، بسته‌بندی و زنجیره سرد باید مستقل تأیید شود." },
  { slug: "siax-100", nameFa: "سیاکس ۱۰۰", nameEn: "Siax 100", brand: "Siax", category: "botulinum-toxins", type: "سم بوتولینوم", volume: "۱۰۰ واحد؛ گزارش بازار", country: "کره جنوبی؛ گزارش بازار" },
  { slug: "siax-200", nameFa: "سیاکس ۲۰۰", nameEn: "Siax 200", brand: "Siax", category: "botulinum-toxins", type: "سم بوتولینوم", volume: "۲۰۰ واحد؛ گزارش بازار", country: "کره جنوبی؛ گزارش بازار" },
  { slug: "neuronox-50", nameFa: "نرونوکس ۵۰", nameEn: "Neuronox 50", brand: "Neuronox", category: "botulinum-toxins", type: "سم بوتولینوم", volume: "۵۰ واحد؛ گزارش بازار" },
  { slug: "neuronox-100", nameFa: "نرونوکس ۱۰۰", nameEn: "Neuronox 100", brand: "Neuronox", category: "botulinum-toxins", type: "سم بوتولینوم", volume: "۱۰۰ واحد؛ گزارش بازار" },
  { slug: "myobloc", nameFa: "مایوبلاک", nameEn: "Myobloc", brand: "Myobloc", category: "botulinum-toxins", type: "فرآورده سم بوتولینوم", country: "فرانسه؛ گزارش برخی آگهی‌ها", warning: "کشور، نوع فرآورده و بسته‌بندی رسمی باید تأیید شود." },
  { slug: "antitall", nameFa: "آنتایتل", nameEn: "Antitall", brand: "Antitall", category: "botulinum-toxins", type: "بوتاکس کره‌ای؛ عنوان بازار", warning: "املای لاتین رسمی، سازنده و مجوز نیازمند بررسی است.", publishedInCatalog: false },
  {
    slug: "dysport",
    nameFa: "دیسپورت ۵۰۰ واحد",
    nameEn: "Dysport® 500 units",
    brand: "Dysport / Ipsen",
    category: "botulinum-toxins",
    type: "پودر سم بوتولینوم نوع A برای تهیه محلول تزریق",
    volume: "۱ ویال ۵۰۰ واحدی",
    badge: "پر‌جست‌وجو در ایران",
    publishedInCatalog: true,
    sourceName: "Dysport 500 units — official SmPC",
    sourceUrl: "https://www.medicines.org.uk/emc/product/7261/smpc",
    reviewedAt: "2026-08-10",
    sourceStatus: "واحد، شکل فرآورده و شرایط نگهداری با خلاصه رسمی مشخصات محصول تطبیق شد",
    summary:
      "دیسپورت ۵۰۰ یک فرآورده بوتولینوم نوع A به‌شکل پودر برای تهیه محلول تزریق است. واحدهای فرآورده‌های مختلف بوتولینوم را نباید معادل هم فرض کرد. خرید، حمل، آماده‌سازی و مصرف آن فقط باید در زنجیره حرفه‌ای و طبق بروشور همان بسته انجام شود.",
    audience: "پزشکان، داروسازان و مراکز درمانی مجاز با امکان حفظ زنجیره سرد",
    features: [
      "ویال ۵۰۰ واحدی پودر برای تهیه محلول تزریق",
      "نیازمند کنترل مستقل زنجیره سرد و ثبت زمان تحویل",
      "واحد Dysport قابل تبدیل خودکار به واحد برندهای دیگر نیست",
    ],
    specs: [
      ["نام رسمی", "Dysport® 500 units"],
      ["ماده فعال", "Botulinum toxin type A"],
      ["شکل فرآورده", "پودر برای تهیه محلول تزریق"],
      ["مقدار", "۵۰۰ واحد در ویال"],
      ["بسته‌بندی", "بسته‌های ۱ یا ۲ ویال ممکن است عرضه شوند"],
      ["نگهداری در منبع بررسی‌شده", "در یخچال ۲ تا ۸ درجه سانتی‌گراد؛ از انجماد خودداری شود"],
      ["وضعیت عرضه", "داروی حرفه‌ای؛ مجوز، نسخه بازار و بروشور همان بسته باید بررسی شود"],
    ],
    checks: [
      "نام Dysport، عدد 500 units، بچ‌کد و تاریخ روی جعبه و ویال تطبیق داده شود.",
      "سابقه دمایی، سلامت پلمب و زمان تحویل پیش از پذیرش ثبت شود.",
      "واحد، رقیق‌سازی و دستور مصرف از برند دیگری کپی نشود.",
    ],
    faq: [
      {
        question: "دیسپورت ۵۰۰ چند واحد است؟",
        answer:
          "این صفحه درباره ویال ۵۰۰ واحدی است. تعداد ویال در بسته ممکن است با بازار تفاوت داشته باشد؛ همان بسته موجود باید بررسی شود.",
      },
      {
        question: "۵۰۰ واحد دیسپورت با ۵۰۰ واحد مصپورت یکی است؟",
        answer:
          "نباید واحد دو فرآورده را صرفاً به‌خاطر عدد مشابه معادل دانست. تصمیم دوز و آماده‌سازی فقط بر اساس بروشور همان محصول و نظر پزشک انجام می‌شود.",
      },
      {
        question: "اگر زنجیره سرد دیسپورت نامعلوم باشد چه کنیم؟",
        answer:
          "محصول تا بررسی مسئول فنی یا منبع قابل‌اعتماد مصرف نشود. ظاهر سالم جعبه به‌تنهایی سابقه دمایی را ثابت نمی‌کند.",
      },
    ],
  },
  {
    slug: "masport",
    nameFa: "مصپورت ۵۰۰ واحد",
    nameEn: "MASPORT® 500",
    brand: "Masport",
    category: "botulinum-toxins",
    type: "سم بوتولینوم نوع A خالص‌شده و لیوفیلیزه",
    volume: "۱ ویال ۵۰۰ واحدی ۳ میلی‌لیتری همراه حلال",
    badge: "پر‌جست‌وجو در ایران",
    publishedInCatalog: true,
    sourceName: "MASPORT® 500 — اطلاعات فنی محصول",
    reviewedAt: "2026-08-10",
    sourceStatus: "واحد، شکل فرآورده و بسته‌بندی با اطلاعات فنی محصول تطبیق شد",
    summary:
      "مصپورت ۵۰۰ یک فرآورده ایرانی سم بوتولینوم نوع A است که به‌صورت ویال ۵۰۰ واحدی پودر لیوفیلیزه همراه حلال عرضه می‌شود. عدد واحد یا شباهت نام، مجوز جایگزینی با برند دیگر نیست و مصرف باید کاملاً حرفه‌ای باشد.",
    audience: "پزشکان و مراکز درمانی مجاز با فرایند ثبت و کنترل زنجیره سرد",
    features: [
      "۵۰۰ واحد سم بوتولینوم نوع A در هر ویال",
      "ویال ۳ میلی‌لیتری پودر لیوفیلیزه همراه حلال",
      "محصول ایران برای مصرف حرفه‌ای",
    ],
    specs: [
      ["نام رسمی", "MASPORT® 500"],
      ["کشور محصول", "ایران؛ نام دارنده مجوز روی همان بسته بررسی شود"],
      ["ماده فعال", "سم بوتولینوم نوع A خالص‌شده"],
      ["شکل فرآورده", "پودر استریل لیوفیلیزه برای تزریق"],
      ["مقدار", "۵۰۰ واحد در ویال"],
      ["بسته‌بندی اعلام‌شده", "ویال ۳ میلی‌لیتری همراه حلال"],
      ["وضعیت عرضه", "داروی حرفه‌ای؛ برچسب، بروشور و مجوز همان بچ مرجع است"],
    ],
    checks: [
      "عبارت MASPORT® 500، بچ‌کد و تاریخ روی ویال و جعبه تطبیق داده شود.",
      "شرایط حمل، سلامت پلمب و حلال همراه پیش از تحویل ثبت شود.",
      "واحد و دستور آماده‌سازی با محصول دیگری جایگزین یا تبدیل خودکار نشود.",
    ],
    faq: [
      {
        question: "مصپورت ۵۰۰ ساخت کجاست؟",
        answer:
          "MASPORT® 500 محصول ایران است. نام دارنده مجوز و مشخصات سازنده را روی همان جعبه موجود بررسی کنید.",
      },
      {
        question: "بسته مصپورت ۵۰۰ شامل چیست؟",
        answer:
          "سازنده یک ویال ۳ میلی‌لیتری حاوی ۵۰۰ واحد پودر لیوفیلیزه را همراه حلال معرفی می‌کند. اقلام همان بسته موجود را پیش از پذیرش کنترل کنید.",
      },
      {
        question: "مصپورت بهتر است یا دیسپورت؟",
        answer:
          "«بهتر» بودن بدون مشخص‌کردن هدف، سابقه فرد و نظر پزشک جواب دقیقی ندارد. واحدها، بروشورها و پروتکل‌ها نیز نباید خودکار معادل فرض شوند.",
      },
    ],
  },

  { slug: "fusion-f-lift-face", nameFa: "فیوژن اف لیفت پلاس فیس", nameEn: "Fusion F-LIFT+FACE", brand: "Fusion", category: "rejuvenation-cocktails", type: "کوکتل جوان‌سازی و لیفت ظاهری پوست", image: "/images/drive/product-fusion.webp", imageVerified: true, badge: "تصویر موجود" },
  { slug: "fusion-f-mesomatrix", nameFa: "فیوژن اف مزوماتریکس", nameEn: "Fusion F-MESOMATRIX", brand: "Fusion", category: "rejuvenation-cocktails", type: "کوکتل جوان‌سازی و کیفیت پوست", volume: "۵ میلی‌لیتر؛ گزارش بازار", image: "/images/drive/product-fusion.webp", imageVerified: true },
  { slug: "dermaheal-hsr", nameFa: "درماهیل اچ‌اس‌آر", nameEn: "Dermaheal HSR", brand: "Dermaheal", category: "rejuvenation-cocktails", type: "کوکتل جوان‌سازی و آبرسانی", volume: "۵ میلی‌لیتر؛ گزارش بازار" },
  { slug: "mesolike-top-age-pro", nameFa: "مزولایک تاپ ایج پرو", nameEn: "Mesolike Top Age Pro", brand: "Mesolike", category: "rejuvenation-cocktails", type: "کوکتل جوان‌سازی" },
  { slug: "mesolike-lift", nameFa: "مزولایک لیفت", nameEn: "Mesolike Lift", brand: "Mesolike", category: "rejuvenation-cocktails", type: "کوکتل لیفت و جوان‌سازی", volume: "۱۰ میلی‌لیتر؛ گزارش بازار" },
  { slug: "medicube-pdrn", nameFa: "پی‌دی‌آر‌ان مدی‌کیوب", nameEn: "Medicube PDRN", brand: "Medicube", category: "rejuvenation-cocktails", type: "کوکتل جوان‌سازی حاوی PDRN؛ عنوان بازار", volume: "۲ میلی‌لیتر، بسته ۱۰ عددی؛ گزارش بازار", warning: "نوع محصول، ترکیبات و روش مصرف رسمی تأیید شود." },

  { slug: "fusion-f-radiance", nameFa: "فیوژن اف رادیانس", nameEn: "Fusion F-RADIANCE", brand: "Fusion", category: "brightening-cocktails", type: "کوکتل روشن‌کننده و شفاف‌کننده" },
  {
    slug: "fusion-f-melaclear",
    nameFa: "فیوژن اف ملاکلیر",
    nameEn: "Fusion F-MELACLEAR",
    brand: "Fusion Meso",
    category: "brightening-cocktails",
    type: "ویال استریل حرفه‌ای برای لک و ناهماهنگی رنگ پوست",
    volume: "۵ ویال ۱۰ میلی‌لیتری",
    badge: "مشخصات رسمی",
    publishedInCatalog: true,
    sourceName: "Fusion Meso — F-MELACLEAR",
    sourceUrl: "https://fusionmeso.com/product/f-melaclear-sterile-serum-vials-for-pigmentation-dark-spots/",
    reviewedAt: "2026-08-10",
    sourceStatus: "تطبیق‌شده با صفحه رسمی Fusion Meso در ۱۹ مرداد ۱۴۰۵",
    summary:
      "فیوژن اف ملاکلیر مجموعه‌ای از ویال‌های استریل حرفه‌ای برای لک‌های موضعی و ناهماهنگی رنگ پوست است. ترکیب‌های اعلام‌شده سازنده شامل نیاسینامید، ترانگزامیک اسید، رزورسینول، گلوتاتیون و آربوتین است؛ تناسب روش استفاده باید برای هر مراجعه‌کننده جداگانه بررسی شود.",
    audience: "پزشکان و متخصصان واجد صلاحیت در درمان‌های حرفه‌ای پوست",
    features: [
      "بسته رسمی اعلام‌شده: ۵ ویال ۱۰ میلی‌لیتری",
      "فهرست ترکیبات فعال بر اساس صفحه رسمی سازنده",
      "تمرکز بر لک موضعی؛ بدون وعده پاک‌شدن قطعی یا دائمی لک",
    ],
    specs: [
      ["نام رسمی", "F-MELACLEAR"],
      ["برند", "Fusion Meso"],
      ["شکل محصول", "ویال استریل حرفه‌ای"],
      ["تعداد و حجم", "۵ ویال، هر ویال ۱۰ میلی‌لیتر"],
      ["ترکیبات فعال اعلام‌شده", "نیاسینامید، ترانگزامیک اسید، رزورسینول، گلوتاتیون و آربوتین"],
      ["موارد هدف اعلام‌شده", "ملاسما، تیرگی موضعی، هایپرپیگمنتیشن و ناهماهنگی رنگ پوست"],
      ["وضعیت عرضه", "مصرف حرفه‌ای؛ روش کاربرد از بروشور همان بسته بررسی شود"],
    ],
    checks: [
      "نام F-MELACLEAR و بسته 5 × 10 ml با محصول تحویلی تطبیق داده شود.",
      "فهرست ترکیبات، بچ‌کد، تاریخ و پلمب روی همان بسته بررسی شود.",
      "علت لک، نوع پوست، منع مصرف و روش کاربرد پیش از شروع کار توسط فرد متخصص ارزیابی شود.",
    ],
    faq: [
      {
        question: "ترکیبات اصلی اف ملاکلیر چیست؟",
        answer:
          "صفحه رسمی Fusion Meso نیاسینامید، ترانگزامیک اسید، رزورسینول، گلوتاتیون و آربوتین را به‌عنوان ترکیبات فعال نام می‌برد. برچسب همان بچ، مرجع نهایی تحویل است.",
      },
      {
        question: "آیا اف ملاکلیر هر نوع لکی را از بین می‌برد؟",
        answer:
          "خیر. لک علت‌های متفاوتی دارد و پاسخ پوست‌ها یکسان نیست. تشخیص علت، محافظت در برابر آفتاب و انتخاب پروتکل مناسب باید پیش از خرید محصول در نظر گرفته شود.",
      },
      {
        question: "این محصول برای مصرف خانگی است؟",
        answer:
          "این صفحه نسخه ویال استریل حرفه‌ای را معرفی می‌کند. روش کاربرد و صلاحیت مصرف‌کننده باید از بروشور رسمی و مقررات محل عرضه بررسی شود.",
      },
    ],
  },
  { slug: "fusion-f-vitamin-c", nameFa: "فیوژن اف ویتامین سی", nameEn: "Fusion F-VITAMIN C", brand: "Fusion", category: "brightening-cocktails", type: "کوکتل حاوی ویتامین C" },
  { slug: "fusion-f-melirutin", nameFa: "فیوژن اف ملی‌روتین", nameEn: "Fusion F-MELIRUTIN", brand: "Fusion", category: "brightening-cocktails", type: "کوکتل ضدلک", volume: "۱۰ میلی‌لیتر؛ گزارش بازار" },
  { slug: "revitacare-532", nameFa: "رویتاکر ۵۳۲", nameEn: "Revitacare 532", brand: "Revitacare", category: "brightening-cocktails", type: "کوکتل روشن‌کننده و ضدلک", volume: "نسخه ۵ میلی‌لیتری؛ گزارش بازار", warning: "نسخه و نوع رسمی محصول تأیید شود." },
  { slug: "mesolike-whitening-shine", nameFa: "مزولایک وایتنینگ شاین", nameEn: "Mesolike Whitening Shine", brand: "Mesolike", category: "brightening-cocktails", type: "کوکتل روشن‌کننده", volume: "۱۰ میلی‌لیتر؛ گزارش بازار" },
  { slug: "mesolike-glutathione", nameFa: "مزولایک گلوتاتیون", nameEn: "Mesolike Glutathione", brand: "Mesolike", category: "brightening-cocktails", type: "کوکتل حاوی گلوتاتیون", volume: "۱۰ میلی‌لیتر؛ گزارش بازار" },
  { slug: "dermaheal-sb", nameFa: "درماهیل اس‌بی", nameEn: "Dermaheal SB", brand: "Dermaheal", category: "brightening-cocktails", type: "کوکتل روشن‌کننده و ضدلک", volume: "۵ میلی‌لیتر؛ گزارش بازار" },
  { slug: "genosys-sws", nameFa: "ژنوسیس اس‌دبلیو‌اس", nameEn: "Genosys SWS", brand: "Genosys", category: "brightening-cocktails", type: "کوکتل روشن‌کننده", volume: "۲ میلی‌لیتر؛ گزارش بازار" },

  { slug: "fusion-f-eye-contour", nameFa: "فیوژن اف آی کانتور", nameEn: "Fusion F-EYE CONTOUR", brand: "Fusion", category: "eye-cocktails", type: "کوکتل تخصصی اطراف چشم", volume: "۵ میلی‌لیتر؛ گزارش بازار" },
  { slug: "mesolike-eye-top", nameFa: "مزولایک آی تاپ", nameEn: "Mesolike Eye Top", brand: "Mesolike", category: "eye-cocktails", type: "کوکتل دور چشم", volume: "۵ میلی‌لیتر؛ گزارش بازار" },

  { slug: "fusion-f-hair", nameFa: "فیوژن اف هیر", nameEn: "Fusion F-HAIR", brand: "Fusion", category: "hair-cocktails", type: "کوکتل مو", volume: "نسخه‌های متفاوت در بازار" },
  {
    slug: "fusion-f-hair-men",
    nameFa: "فیوژن اف هیر من",
    nameEn: "Fusion F-HAIR MEN",
    brand: "Fusion Meso",
    category: "hair-cocktails",
    type: "ویال استریل حرفه‌ای مو و پوست سر",
    volume: "۵ ویال ۵ میلی‌لیتری",
    badge: "مشخصات رسمی",
    publishedInCatalog: true,
    sourceName: "Fusion Meso — F-HAIR MEN",
    sourceUrl: "https://fusionmeso.com/product/f-hair-men-sterile-vials-for-androgenic-alopecia-hair-loss/",
    reviewedAt: "2026-08-10",
    sourceStatus: "تطبیق‌شده با صفحه رسمی Fusion Meso در ۱۹ مرداد ۱۴۰۵",
    summary:
      "فیوژن اف هیر من یک مجموعه ویال استریل حرفه‌ای برای مراقبت‌های تخصصی مو و پوست سر است. سازنده آن را برای ریزش موی آندروژنتیک و نازک‌شدن مو معرفی می‌کند، اما انتخاب محصول نباید جای تشخیص علت ریزش توسط پزشک را بگیرد.",
    audience: "پزشکان و متخصصان واجد صلاحیت در درمان‌های مو و پوست سر",
    features: [
      "بسته رسمی اعلام‌شده: ۵ ویال ۵ میلی‌لیتری",
      "ترکیب پپتیدها، فاکتورهای رشد، سیلیسیوم آلی، دکسپانتنول و هیالورونیک اسید",
      "مناسب برای بررسی حرفه‌ای پس از تشخیص علت ریزش؛ نه نسخه عمومی",
    ],
    specs: [
      ["نام رسمی", "F-HAIR MEN"],
      ["برند", "Fusion Meso"],
      ["شکل محصول", "ویال استریل حرفه‌ای"],
      ["تعداد و حجم", "۵ ویال، هر ویال ۵ میلی‌لیتر"],
      ["پپتیدها و عصاره", "استیل تتراپپتید-۳، عصاره شبدر، تری‌پپتید مس-۱ و دکاپپتید-۴"],
      ["سایر ترکیبات اعلام‌شده", "FGF، VEGF، سیلیسیوم آلی، کارنوزین، دکسپانتنول و هیالورونیک اسید"],
      ["موارد هدف اعلام‌شده", "ریزش موی آندروژنتیک، نازک‌شدن مو و مراقبت حرفه‌ای پوست سر"],
      ["وضعیت عرضه", "مصرف حرفه‌ای؛ پروتکل از بروشور همان بسته بررسی شود"],
    ],
    checks: [
      "نام F-HAIR MEN و بسته 5 × 5 ml با محصول تحویلی تطبیق داده شود.",
      "ترکیبات، بچ‌کد، تاریخ و سلامت ویال‌ها روی همان بسته بررسی و ثبت شود.",
      "پیش از انتخاب کوکتل، علت ریزش و گزینه‌های درمانی مبتنی بر شواهد توسط پزشک بررسی شود.",
    ],
    faq: [
      {
        question: "اف هیر من برای چه نوع ریزشی معرفی شده است؟",
        answer:
          "سازنده از ریزش موی آندروژنتیک، نازک‌شدن مو و مراقبت از پوست سر نام می‌برد. با این حال، نام محصول به‌تنهایی تشخیص پزشکی نیست.",
      },
      {
        question: "بسته اف هیر من چند ویال دارد؟",
        answer:
          "طبق صفحه رسمی سازنده، بسته شامل ۵ ویال استریل ۵ میلی‌لیتری است. هنگام سفارش، تعداد، حجم و نام مدل را روی بسته موجود دوباره کنترل کنید.",
      },
      {
        question: "آیا اف هیر من جایگزین درمان پزشکی ریزش مو است؟",
        answer:
          "خیر. ابتدا باید علت ریزش مشخص شود. پزشک ممکن است بر اساس تشخیص، درمان‌های دیگری را مقدم بداند یا این محصول را مناسب نداند.",
      },
    ],
  },
  { slug: "revitacare-haircare", nameFa: "رویتاکر هیرکر", nameEn: "Revitacare Haircare", brand: "Revitacare", category: "hair-cocktails", type: "کوکتل مو", volume: "چند نسخه متفاوت در بازار", warning: "نسخه دقیق روی بسته مبنای سفارش است." },
  { slug: "dermaheal-hl", nameFa: "درماهیل اچ‌ال", nameEn: "Dermaheal HL", brand: "Dermaheal", category: "hair-cocktails", type: "کوکتل مو", volume: "۵ میلی‌لیتر؛ گزارش بازار" },
  { slug: "mesolike-hair", nameFa: "مزولایک ضدریزش مو", nameEn: "Mesolike Hair", brand: "Mesolike", category: "hair-cocktails", type: "کوکتل مو", volume: "۱۰ میلی‌لیتر؛ گزارش بازار" },
  { slug: "mesolike-hair-men", nameFa: "مزولایک هیر من", nameEn: "Mesolike Hair Men", brand: "Mesolike", category: "hair-cocktails", type: "کوکتل موی مردانه", volume: "۱۰ میلی‌لیتر؛ گزارش بازار" },
  { slug: "genosys-hr3", nameFa: "ژنوسیس اچ‌آر ۳", nameEn: "Genosys HR3", brand: "Genosys", category: "hair-cocktails", type: "کوکتل مو", volume: "۵ میلی‌لیتر؛ گزارش بازار" },
  { slug: "mesolike-dutasteride", nameFa: "مزولایک دوتاستراید", nameEn: "Mesolike Dutasteride", brand: "Mesolike", category: "hair-cocktails", type: "کوکتل مو", volume: "۱۰ میلی‌لیتر؛ گزارش بازار", warning: "کاربرد فقط با نظر فرد متخصص و پس از بررسی منع مصرف است." },

];

const currentInventorySlugs = new Set(
  [
    ...currentInventorySeeds.map((seed) => seed.slug),
    ...Object.keys(currentInventoryLegacyAliases),
  ],
);

const seeds: ProductSeed[] = [
  ...legacySeeds.filter((seed) => !currentInventorySlugs.has(seed.slug)),
  ...currentInventorySeeds,
];

const shortBenefits: Record<string, string> = {
  fillers: "مقایسه مدل، حجم و بسته‌بندی فیلر",
  "skin-boosters": "مقایسه حرفه‌ای کیفیت پوست و آبرسانی",
  "botulinum-toxins": "استعلام اصالت، واحد و شرایط نگهداری",
  "rejuvenation-cocktails": "عنوان رایج بازار: جوان‌سازی و کیفیت پوست",
  "brightening-cocktails": "عنوان رایج بازار: روشن‌کنندگی و یکنواختی رنگ",
  "eye-cocktails": "محصول حرفه‌ای مرتبط با پوست اطراف چشم",
  "hair-cocktails": "محصول حرفه‌ای مرتبط با مو و پوست سر",
  "hyaluronidase-products": "مقایسه قدرت، تعداد و سازنده آنزیم",
};

const fallbackImages: Record<string, string> = Object.fromEntries(
  catalogCategories.map((category) => [category.slug, category.image]),
);

const editorialFamilyImages: Record<string, string> = {
  fillers: "/images/products/editorial/fillers-family.webp",
  "skin-boosters": "/images/products/editorial/skin-boosters-family.webp",
  "botulinum-toxins": "/images/products/editorial/botulinum-family.webp",
  "rejuvenation-cocktails": "/images/products/editorial/rejuvenation-family.webp",
  "brightening-cocktails": "/images/products/editorial/brightening-family.webp",
  "eye-cocktails": "/images/products/editorial/eye-family.webp",
  "hair-cocktails": "/images/products/editorial/hair-family.webp",
};

function marketReferenceImage(
  assetName: string,
  imageAlt: string,
): Pick<ProductSeed, "image" | "imageAlt" | "imageVerified" | "imageKind"> {
  return {
    // Market research starts with Torob, but the reviewed product image is
    // stored with the storefront. This prevents a third-party hotlink failure
    // from turning a relevant pack shot back into a blank or editorial card.
    image: `/images/products/market-reference/${assetName}.webp`,
    imageAlt,
    imageVerified: false,
    imageKind: "market-reference",
  };
}

const officialImageOverrides: Record<
  string,
  Pick<ProductSeed, "image" | "imageAlt" | "imageVerified" | "imageKind">
> = {
  "mesoheal-plus": marketReferenceImage(
    "mesoheal-plus",
    "نمای بسته مزوژل مزوهیل پلاس",
  ),
  "xitritall-hydro": marketReferenceImage(
    "xitritall-hydro",
    "نمای بسته مزوژل زیتریتال هیدرو",
  ),
  "reyoungel-revital-bioha": marketReferenceImage(
    "reyoungel-revital-bioha",
    "نمای بازار از بسته مزوژل رویتال ۲ سی‌سی",
  ),
  "vitten-hydro-plus": marketReferenceImage(
    "vitten-hydro-plus",
    "نمای بسته مزوژل ویتن هیدرو پلاس",
  ),
  "roytrin-skin-booster": marketReferenceImage(
    "roytrin-skin-booster",
    "نمای بسته مزوژل رویترین اسکین‌بوستر",
  ),
  "neuramis-volume-lidocaine": {
    image: "/images/products/sourced/neuramis-volume-lidocaine.webp",
    imageAlt: "نمای بسته نورامیس والیوم لیدوکائین",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "neuramis-lidocaine": {
    image: "/images/products/sourced/neuramis-lidocaine.webp",
    imageAlt: "نمای بسته نورامیس لیدوکائین",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "neurafill-deep-lidocaine": {
    image: "/images/products/sourced/norafill-deep.webp",
    imageAlt: "تصویر بسته نورافیل دیپ لیدوکائین یک میلی‌لیتری",
    imageVerified: true,
    imageKind: "official",
  },
  "arasti-white": {
    image: "/images/products/sourced/arasti-white.webp",
    imageAlt: "تصویر بسته آراستی وایت و سرنگ یک‌میلی‌لیتری",
    imageVerified: true,
    imageKind: "official",
  },
  "sofiderm-derm-plus": {
    image: "/images/products/sourced/sofiderm-derm-plus.webp",
    imageAlt: "تصویر بسته و سرنگ سوفیدرم درم پلاس",
    imageVerified: true,
    imageKind: "official",
  },
  "zishel-rose-glam": {
    image: "/images/products/sourced/zishel-rose-glam.webp",
    imageAlt: "نمای بسته زیشل رز گلم",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "regenfill-deep": {
    image: "/images/products/sourced/regenfill-deep.webp",
    imageAlt: "نمای بسته رجنفیل دیپ",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "regenfill-lido": {
    image: "/images/products/sourced/regenfill-lido.webp",
    imageAlt: "نمای بسته رجنفیل لیدو",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "regenfill-volume": {
    image: "/images/products/sourced/regenfill-volume.webp",
    imageAlt: "نمای بسته رجنفیل والیوم",
    imageVerified: false,
    imageKind: "market-reference",
  },
  rabianca: {
    image: "/images/products/sourced/rabianca.webp",
    imageAlt: "نمای بسته بادی رابیانکا ۷۰ سی‌سی",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "nabota-150": {
    image: "/images/products/sourced/nabota-150.webp",
    imageAlt: "نمای بسته بوتاکس نابوتا ۱۵۰ واحد",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "siax-100": {
    image: "/images/products/sourced/siax-100.webp",
    imageAlt: "نمای بسته بوتاکس سیاکس ۱۰۰ واحد",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "siax-200": {
    image: "/images/products/sourced/siax-200.webp",
    imageAlt: "نمای بسته بوتاکس سیاکس ۲۰۰ واحد",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "neuronox-50": marketReferenceImage(
    "neuronox-reference",
    "نمای مرجع بسته نورونوکس؛ واحد محصول هنگام استعلام تطبیق می‌شود",
  ),
  "neuronox-100": marketReferenceImage(
    "neuronox-reference",
    "نمای بسته نورونوکس ۱۰۰ واحد",
  ),
  myobloc: {
    image: "/images/products/sourced/myobloc.webp",
    imageAlt: "نمای بسته بوتاکس مایوبلاک",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "dermaheal-hsr": {
    image: "/images/products/sourced/dermaheal-hsr.webp",
    imageAlt: "نمای بسته کوکتل درماهیل HSR",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "mesolike-top-age-pro": {
    image: "/images/products/sourced/mesolike-top-age-pro.webp",
    imageAlt: "نمای بسته کوکتل مزولایک تاپ ایج پرو",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "mesolike-lift": {
    image: "/images/products/sourced/mesolike-lift.webp",
    imageAlt: "نمای بسته کوکتل مزولایک لیفت",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "medicube-pdrn": marketReferenceImage(
    "medicube-pdrn",
    "نمای ویال مدی‌کیوب PDRN",
  ),
  "fusion-f-mesomatrix": {
    image: "/images/products/sourced/f-mesomatrix.webp",
    imageAlt: "نمای بسته و ویال فیوژن اف مزوماتریکس",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "fusion-f-radiance": {
    image: "/images/products/sourced/fusion-f-radiance.webp",
    imageAlt: "نمای بسته و ویال فیوژن اف رادیانس",
    imageVerified: true,
    imageKind: "official",
  },
  "fusion-f-lift-face": {
    image: "/images/products/sourced/fusion-lift-face.webp",
    imageAlt: "تصویر ویال فیوژن اف لیفت پلاس فیس",
    imageVerified: true,
    imageKind: "official",
  },
  "fusion-f-melaclear": {
    image: "/images/products/sourced/fusion-melaclear.webp",
    imageAlt: "تصویر بسته و ویال‌های فیوژن اف ملاکلیر",
    imageVerified: true,
    imageKind: "official",
  },
  "fusion-f-vitamin-c": {
    image: "/images/products/sourced/f-vitamin-c.webp",
    imageAlt: "نمای بسته و ویال فیوژن اف ویتامین سی",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "fusion-f-melirutin": {
    image: "/images/products/sourced/f-melirutin.webp",
    imageAlt: "نمای بسته و ویال فیوژن اف ملی‌روتین",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "fusion-f-eye-contour": {
    image: "/images/products/sourced/f-eye-contour.webp",
    imageAlt: "نمای بسته و ویال فیوژن اف آی کانتور",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "fusion-f-hair": {
    image: "/images/products/sourced/f-hair.webp",
    imageAlt: "نمای بسته و ویال فیوژن اف هیر",
    imageVerified: false,
    imageKind: "market-reference",
  },
  "revitacare-532": marketReferenceImage(
    "revitacare-532",
    "نمای بسته کوکتل رویتاکر ۵۳۲",
  ),
  "mesolike-whitening-shine": marketReferenceImage(
    "mesolike-whitening-shine",
    "نمای بسته کوکتل مزولایک وایتنینگ شاین",
  ),
  "mesolike-glutathione": marketReferenceImage(
    "mesolike-glutathione",
    "نمای بسته کوکتل مزولایک گلوتاتیون",
  ),
  "dermaheal-sb": marketReferenceImage(
    "dermaheal-sb",
    "نمای بسته کوکتل درماهیل SB",
  ),
  "genosys-sws": marketReferenceImage(
    "genosys-sws",
    "نمای بسته کوکتل ژنوسیس SWS",
  ),
  "mesolike-eye-top": marketReferenceImage(
    "mesolike-eye-top",
    "نمای بسته کوکتل مزولایک آی تاپ",
  ),
  "revitacare-haircare": marketReferenceImage(
    "revitacare-haircare",
    "نمای بسته کوکتل رویتاکر هیرکر",
  ),
  "dermaheal-hl": marketReferenceImage(
    "dermaheal-hl",
    "نمای بسته کوکتل درماهیل HL",
  ),
  "mesolike-hair": marketReferenceImage(
    "mesolike-hair",
    "نمای بسته کوکتل ضدریزش مو مزولایک",
  ),
  "mesolike-hair-men": marketReferenceImage(
    "mesolike-hair-men",
    "نمای بسته کوکتل مزولایک هیرمن",
  ),
  "genosys-hr3": marketReferenceImage(
    "genosys-hr3",
    "نمای بسته کوکتل ژنوسیس HR3",
  ),
  "mesolike-dutasteride": marketReferenceImage(
    "mesolike-dutasteride",
    "نمای بسته کوکتل مزولایک دوتاستراید",
  ),
  "fusion-f-hair-men": {
    image: "/images/products/sourced/fusion-hair-men.webp",
    imageAlt: "تصویر بسته فیوژن اف هیر من و ویال‌های آن",
    imageVerified: true,
    imageKind: "official",
  },
  dysport: {
    image: "/images/products/sourced/dysport-500.webp",
    imageAlt: "تصویر بسته و ویال دیسپورت ۵۰۰ واحد",
    imageVerified: true,
    imageKind: "official",
  },
};

function makeProduct(seed: ProductSeed): Product {
  const category = catalogCategories.find((item) => item.slug === seed.category)!;
  const imageOverride = officialImageOverrides[seed.slug];
  const resolvedImage =
    imageOverride?.image ||
    (seed.image && !/(?:category-|product-hair-care-v2)/iu.test(seed.image)
      ? seed.image
      : editorialFamilyImages[seed.category]) ||
    fallbackImages[seed.category];
  const resolvedImageKind =
    imageOverride?.imageKind ||
    seed.imageKind ||
    (resolvedImage === editorialFamilyImages[seed.category]
      ? "editorial-family"
      : seed.imageVerified
        ? "official"
        : undefined);
  const resolvedImageVerified =
    imageOverride?.imageVerified ??
    seed.imageVerified ??
    false;
  const variants = seed.variants?.map((variant) =>
    ["10ml", "deep-10ml", "lido-10ml"].includes(variant.id)
      ? {
          ...variant,
          imageAlt: `نمای مرجع بسته ${variant.nameFa}؛ حجم و جزئیات بسته هنگام استعلام تطبیق می‌شود`,
          imageVerified: false,
          imageKind: "market-reference" as const,
          imageApproved: true,
        }
      : variant,
  );
  const sourceStatus = seed.sourceStatus ?? (seed.warning
    ? "نیازمند تطبیق پیش از انتشار قطعی"
    : "اطلاعات اولیه بازار؛ در انتظار تطبیق رسمی");
  const specs: Array<[string, string]> = seed.specs ?? [
    ["گروه محصول", seed.type],
    ["برند", seed.brand],
  ];
  const baselinePrice = marketBaselinePrices[seed.slug];
  if (seed.volume) specs.push(["حجم یا واحد مشاهده‌شده", seed.volume]);
  if (seed.country) specs.push(["کشور درج‌شده در بازار", seed.country]);
  if (seed.detail) specs.push(["ویژگی درج‌شده", seed.detail]);
  if (seed.warning) specs.push(["یادداشت بررسی", seed.warning]);

  return {
    slug: seed.slug,
    nameFa: seed.nameFa,
    nameEn: seed.nameEn,
    brand: seed.brand,
    category: seed.category,
    categoryTitle: category.title,
    group: category.group,
    groupTitle: category.groupTitle,
    badge: seed.badge,
    image: resolvedImage,
    imageVerified: resolvedImageVerified,
    imageKind: resolvedImageKind,
    imageApproved:
      seed.imageApproved ??
      (resolvedImageKind === "editorial-family" ||
        resolvedImageKind === "market-reference"),
    imageAlt:
      imageOverride?.imageAlt ||
      seed.imageAlt ||
      (resolvedImageKind === "editorial-family"
        ? `تصویر ادیتوریال هم‌خانواده برای ${seed.nameFa}؛ بسته دقیق هنگام استعلام تطبیق می‌شود`
        : resolvedImageVerified
          ? `تصویر بسته ${seed.nameEn}`
          : `تصویر مفهومی گروه ${category.title}`),
    position: "50%",
    volume: seed.volume,
    priceToman: seed.priceToman ?? baselinePrice,
    priceNote:
      seed.priceNote ??
      (baselinePrice
        ? "قیمت پایهٔ بازار؛ قیمت زندهٔ فروشگاه و بررسی‌های روزانه بر آن اولویت دارند."
        : undefined),
    sourceStatus,
    warning: seed.warning,
    summary:
      seed.summary ??
      `${seed.nameFa} در گروه ${category.title} قرار می‌گیرد. این صفحه برای مقایسه فنی، بررسی بسته‌بندی و استعلام اطلاعات همان بچ آماده شده است.`,
    shortBenefit: shortBenefits[seed.category],
    audience: seed.audience ?? "پزشکان، کلینیک‌ها و مسئولان خرید حرفه‌ای",
    features: seed.features ?? [
      "تطبیق نام کامل مدل با بسته موجود پیش از سفارش",
      "درخواست تصویر بچ‌کد، تاریخ و پلمب قابل مشاهده",
      "تفکیک اطلاعات بازار از مشخصات تأییدشده سازنده",
    ],
    specs,
    checks: seed.checks ?? [
      "نام محصول، مدل و مشخصات روی جعبه با سفارش تطبیق داده شود.",
      "بچ‌کد، تاریخ، پلمب و سلامت بسته‌بندی پیش از تحویل بررسی شود.",
      seed.warning ??
        "ترکیبات، مجوز و شرایط نگهداری از روی بسته و بروشور رسمی همان محصول تأیید شود.",
    ],
    faq: seed.faq ?? [
      {
        question: `اطلاعات ${seed.nameFa} در این صفحه قطعی است؟`,
        answer:
          "خیر. بخشی از داده‌ها از عنوان‌های عمومی بازار جمع‌آوری شده‌اند. بسته‌بندی رسمی، بروشور سازنده و مجوزهای قابل استعلام مرجع نهایی هستند.",
      },
      {
        question: "برای استعلام این محصول چه اطلاعاتی دریافت می‌کنم؟",
        answer:
          "در صورت موجودی، نام دقیق مدل، تصویر قابل‌ارائه از بسته، بچ‌کد و تاریخ قابل مشاهده و شرایط تحویل بررسی می‌شود.",
      },
    ],
    publishedInCatalog: seed.publishedInCatalog ?? true,
    sourceName: seed.sourceName,
    sourceUrl: seed.sourceUrl,
    reviewedAt: seed.reviewedAt,
    variants,
  };
}

export const catalogProducts: Product[] = seeds.map(makeProduct);

export const getCatalogGroup = (slug: string) =>
  catalogGroups.find((group) => group.slug === slug);

export const getGroupForCategory = (categorySlug: string) =>
  catalogGroups.find((group) => group.categorySlugs.includes(categorySlug));

export const productHref = (product: Pick<Product, "slug">) =>
  `/product/${product.slug}`;