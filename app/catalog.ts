import type { Category, Product } from "./data";

export type CatalogGroup = {
  slug: "injectables" | "mesotherapy-cocktails";
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
];

export const catalogCategories: Category[] = [
  {
    slug: "fillers",
    title: "فیلرها و ژل‌های حجم‌دهنده",
    en: "DERMAL FILLERS",
    group: "injectables",
    groupTitle: "محصولات تزریقی زیبایی",
    description:
      "مقایسه فیلرها و ژل‌های حرفه‌ای بر اساس نام دقیق مدل، حجم درج‌شده و وضعیت اطلاعات بسته‌بندی.",
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
];

type ProductSeed = {
  slug: string;
  nameFa: string;
  nameEn: string;
  brand: string;
  category: string;
  type: string;
  volume?: string;
  country?: string;
  detail?: string;
  badge?: string;
  warning?: string;
  image?: string;
  imageVerified?: boolean;
};

const seeds: ProductSeed[] = [
  { slug: "neuramis-deep-lidocaine", nameFa: "نورامیس دیپ لیدوکائین", nameEn: "Neuramis Deep Lidocaine", brand: "Neuramis", category: "fillers", type: "فیلر هیالورونیک اسید", volume: "۱ میلی‌لیتر", detail: "حاوی لیدوکائین", badge: "پر‌استعلام" },
  { slug: "neuramis-volume-lidocaine", nameFa: "نورامیس والیوم لیدوکائین", nameEn: "Neuramis Volume Lidocaine", brand: "Neuramis", category: "fillers", type: "فیلر حجم‌دهنده", detail: "حاوی لیدوکائین" },
  { slug: "neuramis-lidocaine", nameFa: "نورامیس لیدو", nameEn: "Neuramis Lidocaine", brand: "Neuramis", category: "fillers", type: "فیلر هیالورونیک اسید", volume: "۱ و ۱۰ سی‌سی؛ گزارش بازار", detail: "حاوی لیدوکائین", warning: "حجم ۱۰ سی‌سی باید با بسته‌بندی رسمی تطبیق داده شود." },
  { slug: "neurafill-deep-lidocaine", nameFa: "نورافیل دیپ لیدوکائین", nameEn: "Neurafill Deep Lidocaine", brand: "Neurafill", category: "fillers", type: "فیلر هیالورونیک اسید", detail: "حاوی لیدوکائین" },
  { slug: "audrey-m", nameFa: "آدری ام", nameEn: "Audrey M", brand: "Audrey", category: "fillers", type: "فیلر", volume: "۱۰ سی‌سی؛ گزارش بازار", country: "کره جنوبی؛ گزارش بازار", detail: "حاوی لیدوکائین", warning: "حجم و کشور سازنده باید با بسته رسمی تأیید شود." },
  { slug: "audrey-h", nameFa: "آدری اچ", nameEn: "Audrey H", brand: "Audrey", category: "fillers", type: "فیلر", volume: "۱۰ میلی‌لیتر؛ گزارش بازار", detail: "حاوی لیدوکائین", warning: "حجم درج‌شده نیازمند تأیید رسمی است." },
  { slug: "arasti-white", nameFa: "آراستی وایت", nameEn: "ARASTI White", brand: "ARASTI", category: "fillers", type: "فیلر", detail: "حاوی لیدوکائین" },
  { slug: "revofil-ultra", nameFa: "رووفیل اولترا", nameEn: "Revofil Ultra", brand: "Revofil", category: "fillers", type: "فیلر", volume: "۱۰ سی‌سی؛ گزارش برخی آگهی‌ها", warning: "حجم گزارش‌شده با بسته‌بندی رسمی تطبیق داده شود.", image: "/images/drive/product-revofil.webp", imageVerified: true, badge: "تصویر موجود" },
  { slug: "zishel-rose-glam", nameFa: "زیشل رز گلم", nameEn: "Zishel Rose Glam", brand: "Zishel", category: "fillers", type: "فیلر", volume: "۱۰ سی‌سی؛ گزارش بازار" },
  { slug: "sofiderm-derm-plus", nameFa: "سوفیدرم درم پلاس", nameEn: "Sofiderm Derm Plus", brand: "Sofiderm", category: "fillers", type: "ژل هیالورونیک اسید", volume: "۱۰ میلی‌لیتر؛ گزارش بازار" },
  { slug: "regenfill-deep", nameFa: "رجنفیل دیپ", nameEn: "Regenfill Deep", brand: "Regenfill", category: "fillers", type: "فیلر", volume: "۱۱ سی‌سی؛ گزارش برخی آگهی‌ها", warning: "حجم ۱۱ سی‌سی تا مشاهده بسته رسمی قطعی نیست." },
  { slug: "regenfill-lido", nameFa: "رجنفیل لیدو", nameEn: "Regenfill Lido", brand: "Regenfill", category: "fillers", type: "فیلر", detail: "حاوی لیدوکائین" },
  { slug: "regenfill-volume", nameFa: "رجنفیل والیوم", nameEn: "Regenfill Volume", brand: "Regenfill", category: "fillers", type: "فیلر حجم‌دهنده" },
  { slug: "rabianca", nameFa: "رابیانکا", nameEn: "Rabianca", brand: "Rabianca", category: "fillers", type: "فیلر", volume: "۷۰ سی‌سی؛ گزارش برخی آگهی‌ها", warning: "عدد ۷۰ سی‌سی مشکوک است و پیش از انتشار قطعی باید با بسته رسمی تطبیق داده شود." },

  { slug: "profhilo", nameFa: "پروفایلو", nameEn: "Profhilo", brand: "Profhilo", category: "skin-boosters", type: "محصول بیورمدلینگ بر پایه هیالورونیک اسید", volume: "۲ میلی‌لیتر؛ گزارش بازار", country: "ایتالیا؛ گزارش بازار", badge: "شناخته‌شده" },
  { slug: "ejal-40", nameFa: "اجال ۴۰", nameEn: "Ejal 40", brand: "Ejal", category: "skin-boosters", type: "اسکین‌بوستر و مزوژل آبرسان" },
  { slug: "kiara-reju", nameFa: "کیارا ریجو", nameEn: "Kiara Reju", brand: "Kiara", category: "skin-boosters", type: "مزوژل و اسکین‌بوستر", volume: "۳ سرنگ ۲٫۲ میلی‌لیتری؛ مجموع ۶٫۶ میلی‌لیتر", country: "کره جنوبی؛ گزارش بازار", detail: "شرکت BioPlus در برخی آگهی‌ها" },
  { slug: "mesoheal-plus", nameFa: "مزوهیل پلاس", nameEn: "Mesoheal Plus", brand: "Mesoheal", category: "skin-boosters", type: "مزوژل جوان‌ساز", country: "کره جنوبی؛ گزارش بازار", detail: "شرکت Krofarma در برخی آگهی‌ها", warning: "شرکت و طبقه‌بندی محصول نیازمند تأیید رسمی است." },
  { slug: "xitritall-hydro", nameFa: "زیتریتال هیدرو", nameEn: "Xitritall Hydro", brand: "Xitritall", category: "skin-boosters", type: "مزوژل آبرسان", volume: "۲ سی‌سی؛ گزارش بازار", warning: "املای لاتین رسمی برند بررسی شود." },
  { slug: "reyoungel-revital-bioha", nameFa: "ری‌یانگل رویتال بایو اچ‌ای", nameEn: "Reyoungel Revital BIOHA", brand: "Reyoungel", category: "skin-boosters", type: "مزوژل جوان‌ساز", volume: "۲ سی‌سی؛ گزارش بازار", warning: "املای لاتین رسمی محصول بررسی شود." },
  { slug: "vitten-hydro-plus", nameFa: "ویتن هیدرو پلاس", nameEn: "Vitten Hydro Plus", brand: "Vitten", category: "skin-boosters", type: "مزوژل آبرسان", volume: "۹ سی‌سی و بسته پنج‌عددی؛ گزارش بازار", country: "کره جنوبی؛ گزارش بازار", warning: "بسته‌بندی و وضعیت مجاز عرضه باید مستقل بررسی شود." },
  { slug: "roytrin-skin-booster", nameFa: "رویترین اسکین‌بوستر", nameEn: "Roytrin Skin Booster", brand: "Roytrin", category: "skin-boosters", type: "مزوژل و اسکین‌بوستر", warning: "نام رسمی، حجم و وضعیت مجاز عرضه باید بررسی شود." },
  { slug: "jalupro-hmw", nameFa: "جالپرو اچ‌ام‌دبلیو", nameEn: "Jalupro HMW", brand: "Jalupro", category: "skin-boosters", type: "مزوژل حاوی هیالورونیک اسید و آمینواسید", image: "/images/drive/product-jalupro.webp", imageVerified: true, badge: "تصویر موجود" },
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
  { slug: "antitall", nameFa: "آنتایتل", nameEn: "Antitall", brand: "Antitall", category: "botulinum-toxins", type: "بوتاکس کره‌ای؛ عنوان بازار", warning: "املای لاتین رسمی، سازنده و مجوز نیازمند بررسی است." },
  { slug: "dysport", nameFa: "دیسپورت", nameEn: "Dysport", brand: "Dysport", category: "botulinum-toxins", type: "سم بوتولینوم", warning: "شرایط زنجیره سرد، شماره بچ و مجوز پیش از عرضه بررسی شود.", badge: "زنجیره سرد" },
  { slug: "masport", nameFa: "مصپورت", nameEn: "Masport", brand: "Masport", category: "botulinum-toxins", type: "فرآورده بوتولینوم", volume: "عنوان مبهم «۵۰۰ بسته ۵۰ عددی» در برخی آگهی‌ها", warning: "واحد و بسته‌بندی تا مشاهده منبع رسمی قطعی نیست." },

  { slug: "fusion-f-lift-face", nameFa: "فیوژن اف لیفت پلاس فیس", nameEn: "Fusion F-LIFT+FACE", brand: "Fusion", category: "rejuvenation-cocktails", type: "کوکتل جوان‌سازی و لیفت ظاهری پوست", image: "/images/drive/product-fusion.webp", imageVerified: true, badge: "تصویر موجود" },
  { slug: "fusion-f-mesomatrix", nameFa: "فیوژن اف مزوماتریکس", nameEn: "Fusion F-MESOMATRIX", brand: "Fusion", category: "rejuvenation-cocktails", type: "کوکتل جوان‌سازی و کیفیت پوست", volume: "۵ میلی‌لیتر؛ گزارش بازار", image: "/images/drive/product-fusion.webp", imageVerified: true },
  { slug: "dermaheal-hsr", nameFa: "درماهیل اچ‌اس‌آر", nameEn: "Dermaheal HSR", brand: "Dermaheal", category: "rejuvenation-cocktails", type: "کوکتل جوان‌سازی و آبرسانی", volume: "۵ میلی‌لیتر؛ گزارش بازار" },
  { slug: "mesolike-top-age-pro", nameFa: "مزولایک تاپ ایج پرو", nameEn: "Mesolike Top Age Pro", brand: "Mesolike", category: "rejuvenation-cocktails", type: "کوکتل جوان‌سازی" },
  { slug: "mesolike-lift", nameFa: "مزولایک لیفت", nameEn: "Mesolike Lift", brand: "Mesolike", category: "rejuvenation-cocktails", type: "کوکتل لیفت و جوان‌سازی", volume: "۱۰ میلی‌لیتر؛ گزارش بازار" },
  { slug: "medicube-pdrn", nameFa: "پی‌دی‌آر‌ان مدی‌کیوب", nameEn: "Medicube PDRN", brand: "Medicube", category: "rejuvenation-cocktails", type: "کوکتل جوان‌سازی حاوی PDRN؛ عنوان بازار", volume: "۲ میلی‌لیتر، بسته ۱۰ عددی؛ گزارش بازار", warning: "نوع محصول، ترکیبات و روش مصرف رسمی تأیید شود." },

  { slug: "fusion-f-radiance", nameFa: "فیوژن اف رادیانس", nameEn: "Fusion F-RADIANCE", brand: "Fusion", category: "brightening-cocktails", type: "کوکتل روشن‌کننده و شفاف‌کننده" },
  { slug: "fusion-f-melaclear", nameFa: "فیوژن اف ملاکلیر", nameEn: "Fusion F-MELACLEAR", brand: "Fusion", category: "brightening-cocktails", type: "کوکتل ضدلک و یکنواخت‌کننده رنگ پوست" },
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
  { slug: "fusion-f-hair-men", nameFa: "فیوژن اف هیر من", nameEn: "Fusion F-Hair Men", brand: "Fusion", category: "hair-cocktails", type: "کوکتل موی مردانه" },
  { slug: "revitacare-haircare", nameFa: "رویتاکر هیرکر", nameEn: "Revitacare Haircare", brand: "Revitacare", category: "hair-cocktails", type: "کوکتل مو", volume: "چند نسخه متفاوت در بازار", warning: "نسخه دقیق روی بسته مبنای سفارش است." },
  { slug: "dermaheal-hl", nameFa: "درماهیل اچ‌ال", nameEn: "Dermaheal HL", brand: "Dermaheal", category: "hair-cocktails", type: "کوکتل مو", volume: "۵ میلی‌لیتر؛ گزارش بازار" },
  { slug: "mesolike-hair", nameFa: "مزولایک ضدریزش مو", nameEn: "Mesolike Hair", brand: "Mesolike", category: "hair-cocktails", type: "کوکتل مو", volume: "۱۰ میلی‌لیتر؛ گزارش بازار" },
  { slug: "mesolike-hair-men", nameFa: "مزولایک هیر من", nameEn: "Mesolike Hair Men", brand: "Mesolike", category: "hair-cocktails", type: "کوکتل موی مردانه", volume: "۱۰ میلی‌لیتر؛ گزارش بازار" },
  { slug: "genosys-hr3", nameFa: "ژنوسیس اچ‌آر ۳", nameEn: "Genosys HR3", brand: "Genosys", category: "hair-cocktails", type: "کوکتل مو", volume: "۵ میلی‌لیتر؛ گزارش بازار" },
  { slug: "mesolike-dutasteride", nameFa: "مزولایک دوتاستراید", nameEn: "Mesolike Dutasteride", brand: "Mesolike", category: "hair-cocktails", type: "کوکتل مو", volume: "۱۰ میلی‌لیتر؛ گزارش بازار", warning: "کاربرد فقط با نظر فرد متخصص و پس از بررسی منع مصرف است." },

];

const shortBenefits: Record<string, string> = {
  fillers: "مقایسه مشخصات فیلر و وضعیت اطلاعات بسته",
  "skin-boosters": "مقایسه حرفه‌ای کیفیت پوست و آبرسانی",
  "botulinum-toxins": "استعلام اصالت، واحد و شرایط نگهداری",
  "rejuvenation-cocktails": "عنوان رایج بازار: جوان‌سازی و کیفیت پوست",
  "brightening-cocktails": "عنوان رایج بازار: روشن‌کنندگی و یکنواختی رنگ",
  "eye-cocktails": "محصول حرفه‌ای مرتبط با پوست اطراف چشم",
  "hair-cocktails": "محصول حرفه‌ای مرتبط با مو و پوست سر",
};

const fallbackImages: Record<string, string> = Object.fromEntries(
  catalogCategories.map((category) => [category.slug, category.image]),
);

function makeProduct(seed: ProductSeed): Product {
  const category = catalogCategories.find((item) => item.slug === seed.category)!;
  const sourceStatus = seed.warning
    ? "نیازمند تطبیق پیش از انتشار قطعی"
    : "اطلاعات اولیه بازار؛ در انتظار تطبیق رسمی";
  const specs: Array<[string, string]> = [
    ["گروه محصول", seed.type],
    ["برند", seed.brand],
    ["وضعیت اطلاعات", sourceStatus],
  ];
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
    image: seed.image ?? fallbackImages[seed.category],
    imageVerified: seed.imageVerified ?? false,
    imageAlt: seed.imageVerified
      ? `تصویر مجموعه ${seed.nameEn}`
      : `تصویر مفهومی گروه ${category.title}`,
    position: "50%",
    volume: seed.volume,
    sourceStatus,
    warning: seed.warning,
    summary:
      `${seed.nameFa} در گروه ${category.title} قرار می‌گیرد. این صفحه برای مقایسه فنی، بررسی بسته‌بندی و استعلام اطلاعات همان بچ آماده شده است.`,
    shortBenefit: shortBenefits[seed.category],
    audience: "پزشکان، کلینیک‌ها و مسئولان خرید حرفه‌ای",
    features: [
      "تطبیق نام کامل مدل با بسته موجود پیش از سفارش",
      "درخواست تصویر بچ‌کد، تاریخ و پلمب قابل مشاهده",
      "تفکیک اطلاعات بازار از مشخصات تأییدشده سازنده",
    ],
    specs,
    checks: [
      "نام محصول، مدل و مشخصات روی جعبه با سفارش تطبیق داده شود.",
      "بچ‌کد، تاریخ، پلمب و سلامت بسته‌بندی پیش از تحویل بررسی شود.",
      seed.warning ??
        "ترکیبات، مجوز و شرایط نگهداری از روی بسته و بروشور رسمی همان محصول تأیید شود.",
    ],
    faq: [
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
  };
}

export const catalogProducts: Product[] = seeds.map(makeProduct);

export const getCatalogGroup = (slug: string) =>
  catalogGroups.find((group) => group.slug === slug);

export const getGroupForCategory = (categorySlug: string) =>
  catalogGroups.find((group) => group.categorySlugs.includes(categorySlug));

export const productHref = (product: Pick<Product, "slug">) =>
  `/product/${product.slug}`;
