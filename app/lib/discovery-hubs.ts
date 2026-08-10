import type { Product } from "../data";
import { getCompactBrandLabel } from "./public-copy";

export type GuideTopic = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  intro: string;
  checklist: string[];
  categorySlugs: string[];
  articleSlugs: string[];
  concernSlugs: string[];
};

export type ConcernTopic = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  intro: string;
  decisionQuestions: string[];
  categorySlugs: string[];
  articleSlugs: string[];
  guideSlugs: string[];
};

export const guideTopics: GuideTopic[] = [
  {
    slug: "filler-buying-guide",
    title: "راهنمای مقایسه و خرید فیلر",
    eyebrow: "FILLER DECISION GUIDE",
    description:
      "مسیر مقایسه فیلرها بر اساس نام دقیق مدل، حجم بسته، اطلاعات قابل استعلام و مرز میان خرید محصول و تصمیم پزشکی.",
    intro:
      "برای مقایسه فیلر، نام برند به‌تنهایی کافی نیست. مدل دقیق، حجم واقعی، اطلاعات بسته و تناسب محصول باید جداگانه بررسی شوند. این راهنما برای مرتب‌کردن اطلاعات خرید است و جای ارزیابی پزشک را نمی‌گیرد.",
    checklist: [
      "نام کامل مدل و حجم درج‌شده روی بسته را مشخص کنید.",
      "مدل‌های یک خانواده را به‌عنوان یک محصول واحد در نظر نگیرید.",
      "بچ‌کد، تاریخ، سلامت بسته و مسیر تأمین را پیش از پرداخت بررسی کنید.",
      "انتخاب ناحیه، مقدار و تکنیک تزریق را به پزشک واجد صلاحیت بسپارید.",
    ],
    categorySlugs: ["fillers", "body-fillers"],
    articleSlugs: ["verify-dermal-filler-authenticity"],
    concernSlugs: ["volume-contour", "fine-lines-aging"],
  },
  {
    slug: "skin-booster-mesogel",
    title: "راهنمای مزوژل و اسکین‌بوستر",
    eyebrow: "SKIN QUALITY GUIDE",
    description:
      "راهنمای شناخت تفاوت نام‌های بازاری مزوژل، اسکین‌بوستر و محصولات مرتبط با کیفیت پوست، بدون تبدیل آن‌ها به توصیه درمانی.",
    intro:
      "واژه‌های مزوژل و اسکین‌بوستر همیشه تعریف یکسانی ندارند. بهتر است به‌جای تکیه بر نام دسته، محصول مشخص، ترکیبات درج‌شده، اطلاعات سازنده و هدف گفت‌وگو با پزشک را بررسی کنید.",
    checklist: [
      "هدف را از نام محصول جدا کنید: کیفیت پوست، رطوبت، فرم یا موضوع دیگر؟",
      "نام کامل محصول و ترکیبات درج‌شده همان مدل را بخوانید.",
      "ادعاهای تبلیغاتی را از اطلاعات رسمی محصول تفکیک کنید.",
      "موارد منع مصرف و تناسب محصول را در ارزیابی پزشکی بررسی کنید.",
    ],
    categorySlugs: ["skin-boosters", "rejuvenation-cocktails"],
    articleSlugs: ["skin-booster-vs-mesogel-guide"],
    concernSlugs: ["skin-hydration-quality", "fine-lines-aging"],
  },
  {
    slug: "botulinum-product-check",
    title: "راهنمای بررسی فرآورده‌های بوتولینوم",
    eyebrow: "BOTULINUM PRODUCT GUIDE",
    description:
      "چک‌لیست خرید حرفه‌ای برای بررسی نام محصول، واحد، بسته‌بندی، اصالت و شرایط نگهداری فرآورده‌های بوتولینوم.",
    intro:
      "در فرآورده‌های بوتولینوم، مقایسه صرفاً با عدد روی جعبه می‌تواند گمراه‌کننده باشد. نام دقیق فرآورده، واحد درج‌شده، اطلاعات بسته و شرایط نگهداری همان محصول باید کنار هم دیده شوند.",
    checklist: [
      "نام دقیق فرآورده و واحد درج‌شده را با سفارش تطبیق دهید.",
      "بچ‌کد، تاریخ و سلامت بسته را پیش از تحویل ثبت کنید.",
      "شرایط نگهداری را از برچسب یا بروشور همان محصول بخوانید.",
      "استفاده و دوز را فقط در مسیر حرفه‌ای و توسط فرد واجد صلاحیت انجام دهید.",
    ],
    categorySlugs: ["botulinum-toxins"],
    articleSlugs: ["verify-dermal-filler-authenticity"],
    concernSlugs: ["fine-lines-aging"],
  },
  {
    slug: "clinic-product-authenticity",
    title: "راهنمای اصالت و خرید کلینیکی",
    eyebrow: "AUTHENTICITY / CLINIC BUYING",
    description:
      "فرایند عملی برای بررسی منبع تأمین، سلامت بسته، بچ‌کد، تاریخ و ثبت اطلاعات خرید محصولات حرفه‌ای زیبایی.",
    intro:
      "اصالت یک ادعا یا یک هولوگرام نیست؛ نتیجه کنار هم گذاشتن منبع تأمین، اطلاعات بسته و امکان پیگیری است. این صفحه یک مسیر خرید و کنترل موجودی برای کلینیک‌ها و خریداران حرفه‌ای می‌سازد.",
    checklist: [
      "نام دقیق محصول، مدل و تعداد را پیش از پرداخت ثبت کنید.",
      "تصویر قابل‌خواندن بچ‌کد و تاریخ را برای اقلام حساس درخواست کنید.",
      "بسته آسیب‌دیده، ناخوانا یا ناسازگار را وارد چرخه مصرف نکنید.",
      "اطلاعات هر بچ را در زمان تحویل برای پیگیری بعدی نگه دارید.",
    ],
    categorySlugs: [
      "fillers",
      "body-fillers",
      "skin-boosters",
      "botulinum-toxins",
      "rejuvenation-cocktails",
      "brightening-cocktails",
      "eye-cocktails",
      "hair-cocktails",
      "hyaluronidase-products",
    ],
    articleSlugs: ["verify-dermal-filler-authenticity"],
    concernSlugs: [],
  },
  {
    slug: "hair-mesotherapy-products",
    title: "راهنمای محصولات حرفه‌ای مو و پوست سر",
    eyebrow: "HAIR / SCALP GUIDE",
    description:
      "مسیر شناخت محصولات حرفه‌ای مو و پوست سر با تأکید بر تشخیص علت ریزش، نام دقیق محصول و پرهیز از وعده‌های قطعی.",
    intro:
      "ریزش یا کم‌پشتی مو علت‌های متفاوتی دارد و نام یک کوکتل نمی‌تواند جای تشخیص را بگیرد. این راهنما کمک می‌کند اطلاعات محصول را برای گفت‌وگو با پزشک یا خرید حرفه‌ای منظم کنید.",
    checklist: [
      "ابتدا علت ریزش یا کم‌پشتی در ارزیابی پزشکی بررسی شود.",
      "نام کامل محصول، حجم و ترکیبات درج‌شده همان مدل را ثبت کنید.",
      "ادعای نتیجه قطعی را معیار انتخاب قرار ندهید.",
      "پروتکل و موارد منع مصرف را از مسیر حرفه‌ای بررسی کنید.",
    ],
    categorySlugs: ["hair-cocktails"],
    articleSlugs: [],
    concernSlugs: ["hair-thinning"],
  },
];

export const concernTopics: ConcernTopic[] = [
  {
    slug: "skin-hydration-quality",
    title: "کیفیت، شادابی و کم‌آبی پوست",
    eyebrow: "SKIN QUALITY / HYDRATION",
    description:
      "مسیر اطلاعات برای کاربری که درباره کیفیت ظاهری، رطوبت و شادابی پوست جست‌وجو می‌کند؛ بدون پیشنهاد خودکار محصول یا درمان.",
    intro:
      "کم‌آبی یا تغییر کیفیت ظاهر پوست می‌تواند دلایل و مسیرهای متفاوتی داشته باشد. این صفحه فقط دسته‌های مرتبط و سؤال‌های مناسب برای بررسی حرفه‌ای را کنار هم قرار می‌دهد.",
    decisionQuestions: [
      "مسئله اصلی خشکی و کم‌آبی است یا تغییر بافت و ظاهر پوست؟",
      "آیا بیماری زمینه‌ای، دارو یا حساسیت پوستی وجود دارد؟",
      "هدف از بررسی، مراقبت پوستی است یا یک روش حرفه‌ای در کلینیک؟",
      "چه نتیجه‌ای واقع‌بینانه است و چه چیزی نیاز به ارزیابی پزشکی دارد؟",
    ],
    categorySlugs: ["skin-boosters", "rejuvenation-cocktails"],
    articleSlugs: ["skin-booster-vs-mesogel-guide"],
    guideSlugs: ["skin-booster-mesogel"],
  },
  {
    slug: "volume-contour",
    title: "حجم و فرم صورت یا بدن",
    eyebrow: "VOLUME / CONTOUR",
    description:
      "صفحه نیازمحور برای شناخت دسته‌های مرتبط با حجم و فرم، با تفکیک روشن میان مرور محصول و انتخاب پزشکی.",
    intro:
      "وقتی هدف کاربر با واژه‌هایی مثل حجم، فرم یا کانتور بیان می‌شود، مهم است قبل از نام برند، ناحیه و هدف دقیق روشن شود. نمایش محصولات در این صفحه به معنی توصیه برای تزریق نیست.",
    decisionQuestions: [
      "هدف دقیق افزایش حجم است یا اصلاح فرم؟",
      "ناحیه موردنظر و محدودیت‌های آن چیست؟",
      "آیا محصول مدنظر برای همان کاربرد توسط پزشک مناسب تشخیص داده می‌شود؟",
      "مدل، حجم بسته و اطلاعات قابل استعلام محصول چیست؟",
    ],
    categorySlugs: ["fillers", "body-fillers"],
    articleSlugs: ["verify-dermal-filler-authenticity"],
    guideSlugs: ["filler-buying-guide"],
  },
  {
    slug: "fine-lines-aging",
    title: "خطوط صورت و نشانه‌های افزایش سن",
    eyebrow: "LINES / AGEING CONCERNS",
    description:
      "مسیر آموزشی برای شناخت دسته‌های محصولی که کاربران معمولاً هنگام جست‌وجوی خطوط و تغییرات مرتبط با سن با آن‌ها روبه‌رو می‌شوند.",
    intro:
      "خطوط صورت یک مسئله واحد نیستند و روش مناسب به نوع خط، حرکت عضله، حجم بافت، وضعیت پوست و ارزیابی بالینی بستگی دارد. این صفحه فقط مسیرهای اطلاعاتی مرتبط را نشان می‌دهد.",
    decisionQuestions: [
      "خطوط بیشتر در حالت حرکت دیده می‌شوند یا در حالت استراحت؟",
      "هدف اصلی کیفیت پوست است، حجم است یا موضوع دیگری؟",
      "چه گزینه‌هایی پس از ارزیابی پزشک قابل بررسی هستند؟",
      "برای هر محصول چه اطلاعاتی باید پیش از خرید کنترل شود؟",
    ],
    categorySlugs: ["botulinum-toxins", "fillers", "skin-boosters"],
    articleSlugs: ["skin-booster-vs-mesogel-guide"],
    guideSlugs: ["botulinum-product-check", "filler-buying-guide", "skin-booster-mesogel"],
  },
  {
    slug: "under-eye",
    title: "نگرانی‌های ظاهری دور چشم",
    eyebrow: "EYE CONTOUR CONCERNS",
    description:
      "مسیر محتاطانه برای شناخت محصولات و دسته‌های مرتبط با ناحیه دور چشم، بدون تقلیل همه نگرانی‌ها به یک محصول یا روش.",
    intro:
      "تیرگی، گودی، پف یا تغییر کیفیت پوست دور چشم علت و مسیر یکسانی ندارند. این ناحیه حساس است و انتخاب محصول یا روش باید پس از ارزیابی فرد واجد صلاحیت انجام شود.",
    decisionQuestions: [
      "نگرانی اصلی تیرگی، گودی، پف یا کیفیت پوست است؟",
      "آیا علت زمینه‌ای یا محدودیت پزشکی باید ابتدا بررسی شود؟",
      "محصول مشخص چه اطلاعات رسمی و چه محدودیت‌هایی دارد؟",
      "چه کسی مسئول انتخاب روش و مدیریت عارضه احتمالی است؟",
    ],
    categorySlugs: ["eye-cocktails", "skin-boosters"],
    articleSlugs: ["skin-booster-vs-mesogel-guide"],
    guideSlugs: ["skin-booster-mesogel"],
  },
  {
    slug: "hair-thinning",
    title: "کم‌پشتی و ریزش مو",
    eyebrow: "HAIR THINNING / LOSS",
    description:
      "صفحه نیازمحور برای مرتب‌کردن سؤال‌های مرتبط با کم‌پشتی و ریزش مو پیش از بررسی محصولات حرفه‌ای مو و پوست سر.",
    intro:
      "ریزش مو می‌تواند علت‌های مختلف داشته باشد و محصول حرفه‌ای نباید جای تشخیص علت را بگیرد. این صفحه مسیر بررسی را از مسئله کاربر به اطلاعات محصول وصل می‌کند.",
    decisionQuestions: [
      "الگوی ریزش و مدت آن چگونه است؟",
      "آیا علت‌های پزشکی، هورمونی، تغذیه‌ای یا دارویی بررسی شده‌اند؟",
      "محصول موردنظر دقیقاً چه ترکیبات و چه دستورالعملی دارد؟",
      "نتیجه مورد انتظار و محدودیت شواهد چگونه توضیح داده می‌شود؟",
    ],
    categorySlugs: ["hair-cocktails"],
    articleSlugs: [],
    guideSlugs: ["hair-mesotherapy-products"],
  },
  {
    slug: "uneven-tone",
    title: "لک و یکنواخت نبودن رنگ پوست",
    eyebrow: "TONE / PIGMENT CONCERNS",
    description:
      "مسیر شناخت دسته‌های حرفه‌ای مرتبط با لک و یکنواختی رنگ پوست، همراه با تأکید بر تشخیص علت و محدودیت ادعاهای بازاری.",
    intro:
      "تغییر رنگ پوست و لک دلایل مختلفی دارند. عنوان‌هایی مثل روشن‌کننده یا ضدلک، تشخیص علت یا تضمین نتیجه نیستند و باید از اطلاعات رسمی محصول و ارزیابی حرفه‌ای جدا نشوند.",
    decisionQuestions: [
      "نوع و علت احتمالی تغییر رنگ پوست بررسی شده است؟",
      "آیا مراقبت پایه و محافظت در برابر نور به‌درستی انجام می‌شود؟",
      "محصول مشخص چه ترکیبات و محدودیت‌هایی دارد؟",
      "چه ادعاهایی رسمی هستند و کدام فقط عبارت بازاری محسوب می‌شوند؟",
    ],
    categorySlugs: ["brightening-cocktails", "rejuvenation-cocktails"],
    articleSlugs: [],
    guideSlugs: ["skin-booster-mesogel"],
  },
];

export function toBrandSlug(label: string): string {
  return label
    .normalize("NFKD")
    .toLocaleLowerCase("en")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getBrandEntries(
  products: Array<Pick<Product, "brand">>,
): Array<{ label: string; slug: string }> {
  const brands = new Map<string, string>();

  products.forEach((product) => {
    const label = getCompactBrandLabel(product.brand);
    const slug = toBrandSlug(label);

    if (label && slug && !brands.has(slug)) {
      brands.set(slug, label);
    }
  });

  return Array.from(brands, ([slug, label]) => ({ slug, label })).sort(
    (first, second) => first.label.localeCompare(second.label, "en"),
  );
}

export function getGuideTopic(slug: string): GuideTopic | undefined {
  return guideTopics.find((topic) => topic.slug === slug);
}

export function getConcernTopic(slug: string): ConcernTopic | undefined {
  return concernTopics.find((topic) => topic.slug === slug);
}
