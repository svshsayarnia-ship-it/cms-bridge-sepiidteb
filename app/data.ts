import { catalogCategories, catalogProducts } from "./catalog";

export type Category = {
  slug: string;
  title: string;
  en: string;
  group?: string;
  groupTitle?: string;
  description: string;
  guide: string;
  image: string;
  position: string;
};

export type Product = {
  slug: string;
  nameFa: string;
  nameEn: string;
  brand: string;
  category: string;
  categoryTitle: string;
  group?: string;
  groupTitle?: string;
  badge?: string;
  image: string;
  imageAlt?: string;
  imageVerified?: boolean;
  imageKind?: "official" | "editorial-family";
  imageApproved?: boolean;
  position: string;
  volume?: string;
  priceToman?: number;
  priceNote?: string;
  sourceStatus?: string;
  warning?: string;
  summary: string;
  shortBenefit: string;
  audience: string;
  features: string[];
  specs: Array<[string, string]>;
  checks: string[];
  faq: Array<{ question: string; answer: string }>;
  publishedInCatalog?: boolean;
  sourceName?: string;
  sourceUrl?: string;
  reviewedAt?: string;
  variants?: ProductVariant[];
};

export type ProductVariant = {
  id: string;
  label: string;
  nameFa: string;
  nameEn: string;
  image: string;
  imageAlt: string;
  imageVerified?: boolean;
  imageKind?: "official" | "editorial-family";
  imageApproved?: boolean;
  volume: string;
  summary: string;
  features: string[];
  specs: Array<[string, string]>;
  priceToman: number;
  priceNote: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceStatus?: string;
};

export type ArticleSubsection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type ArticleSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  subsections?: ArticleSubsection[];
  table?: {
    headers: string[];
    rows: string[][];
  };
};

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  imagePosition?: string;
  imageAlt?: string;
  imageCaption?: string;
  lead: string;
  notice: string;
  sections: ArticleSection[];
  sources: Array<{ label: string; href: string }>;
  relatedProducts: string[];
  relatedArticles?: string[];
  faq?: Array<{ question: string; answer: string }>;
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  datePublished?: string;
  dateModified?: string;
};

// The live catalog is maintained in app/catalog.ts.
export const categories = catalogCategories;
export const products = catalogProducts;

export const articles: Article[] = [
  {
    slug: "verify-dermal-filler-authenticity",
    title: "چطور اصالت فیلر را پیش از خرید بررسی کنیم؟",
    excerpt:
      "یک چک‌لیست عملی برای بررسی بسته‌بندی، منبع تأمین، برچسب و مسیر مصرف حرفه‌ای—بدون تکیه بر ظاهر جعبه به‌تنهایی.",
    category: "ایمنی و اصالت",
    date: "به‌روزرسانی: مرداد ۱۴۰۵",
    readTime: "۷ دقیقه",
    image: "/images/editorial-detail.webp",
    lead:
      "اصالت یک محصول تزریقی را نمی‌توان فقط از روی رنگ جعبه یا یک کد در شبکه‌های اجتماعی تأیید کرد. بررسی معتبر، مجموعه‌ای از نشانه‌ها و یک زنجیره تأمین قابل‌پیگیری است.",
    notice:
      "این راهنما برای تصمیم خرید و کاهش ریسک است و جایگزین مقررات محلی، نظر مسئول فنی یا دستورالعمل سازنده نیست.",
    sections: [
      {
        heading: "از منبع خرید شروع کنید، نه از ظاهر جعبه",
        paragraphs: [
          "مهم‌ترین پرسش این است که محصول از چه مسیر قابل‌پیگیری تهیه شده است. فروشنده باید بتواند عنوان دقیق، وضعیت بسته، تاریخ و اطلاعات قابل‌مشاهده همان بچ را پیش از نهایی‌شدن سفارش ارائه کند.",
          "ادعاهایی مانند «کاملاً اصل» بدون مدرک قابل بررسی، به‌تنهایی معیار کافی نیستند. برای محصولات تزریقی، استفاده باید فقط در محیط حرفه‌ای و توسط فرد واجد صلاحیت انجام شود.",
        ],
        bullets: [
          "نام کامل مدل و برند را با سفارش تطبیق دهید.",
          "بچ‌کد و تاریخ باید خوانا، بدون دست‌کاری و روی اجزای مرتبط سازگار باشند.",
          "پلمب، سلامت جعبه و شرایط حمل را بررسی کنید.",
          "به محصولی که برای مصرف خانگی یا تزریق توسط فرد فاقد صلاحیت تبلیغ می‌شود اعتماد نکنید.",
        ],
      },
      {
        heading: "چرا اسکن یک کد کافی نیست؟",
        paragraphs: [
          "کد، هولوگرام یا QR فقط یکی از نشانه‌هاست و ممکن است کپی شود یا به صفحه‌ای غیررسمی هدایت کند. نتیجه را با اطلاعات روی بسته، اسناد خرید و کانال رسمی سازنده یا نهاد ناظر تطبیق دهید.",
          "اگر اطلاعات با هم سازگار نیست، تزریق را متوقف کنید و موضوع را با تأمین‌کننده، مسئول فنی و در صورت نیاز نهاد ناظر مطرح کنید.",
        ],
      },
      {
        heading: "چک‌لیست تحویل در کلینیک",
        paragraphs: [
          "در زمان تحویل، از هر بچ یک ثبت ساده شامل تصویر جعبه، تاریخ، بچ‌کد، زمان دریافت و نام مسئول تحویل نگه دارید. این فرایند هم برای کنترل موجودی و هم برای پیگیری احتمالی بعدی مفید است.",
        ],
        bullets: [
          "بسته آسیب‌دیده یا ناخوانا را قرنطینه کنید.",
          "شرایط نگهداری درج‌شده روی بسته را مبنا قرار دهید.",
          "اطلاعات محصول مصرف‌شده را در پرونده مراجعه‌کننده ثبت کنید.",
        ],
      },
    ],
    sources: [
      {
        label: "FDA — Dermal Fillers (Soft Tissue Fillers)",
        href: "https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers",
      },
      {
        label: "FDA — The Risks of Buying Unapproved Fillers",
        href: "https://www.fda.gov/consumers/consumer-updates/using-dermal-fillers-safely",
      },
    ],
    relatedProducts: ["neuramis-deep-lidocaine", "revofil-ultra"],
  },
  {
    slug: "skin-booster-vs-mesogel-guide",
    title: "اسکین‌بوستر، مزوژل و فیلر؛ اسم‌ها کجا گمراه‌کننده می‌شوند؟",
    seoTitle: "تفاوت اسکین‌بوستر، مزوژل و فیلر چیست؟",
    excerpt:
      "به‌جای تکیه بر نام‌های بازاری، ترکیب، هدف، مجوز، پروتکل و فرد استفاده‌کننده را مقایسه کنید.",
    category: "راهنمای انتخاب",
    date: "به‌روزرسانی: مرداد ۱۴۰۵",
    readTime: "۸ دقیقه",
    image: "/images/hero-editorial-portrait.webp",
    imagePosition: "center 34%",
    lead:
      "در بازار زیبایی، واژه‌هایی مثل اسکین‌بوستر و مزوژل همیشه تعریف مقرراتی یکسانی ندارند. تصمیم ایمن‌تر از خواندن برچسب، شناخت محصول مشخص و گفت‌وگو با پزشک شروع می‌شود.",
    notice:
      "هیچ دسته‌ای برای همه مناسب نیست. تشخیص وضعیت پوست، موارد منع مصرف و انتخاب پروتکل باید توسط پزشک انجام شود.",
    sections: [
      {
        heading: "نام دسته، نسخه درمانی نیست",
        paragraphs: [
          "ممکن است دو محصول با عنوان تجاری مشابه، ترکیب یا شیوه استفاده متفاوتی داشته باشند. بنابراین مقایسه درست باید روی نام کامل محصول، ترکیبات درج‌شده، اطلاعات سازنده و دستورالعمل رسمی همان محصول انجام شود.",
          "فیلرهای پوستی معمولاً برای اهدافی مانند ایجاد حجم یا اصلاح برخی خطوط استفاده می‌شوند، اما همه محصولات مبتنی بر هیالورونیک اسید رفتار یا کاربرد یکسانی ندارند.",
          "مرور سیستماتیک منتشرشده در ۲۰۲۳ نتایج مرتبط با کیفیت پوست را امیدوارکننده توصیف کرده، اما به مطالعات بزرگ‌تر نیاز دانسته است. یک مطالعه split-face در ۲۰۲۵ نیز برخی شاخص‌ها را بهبود‌یافته گزارش کرده؛ این یافته‌ها را نباید به همه محصولات یا همه افراد تعمیم داد.",
        ],
      },
      {
        heading: "پنج سؤال قبل از انتخاب",
        paragraphs: [
          "یک مشاوره حرفه‌ای باید از هدف واقعی و وضعیت سلامت شروع شود، نه از نام محصول محبوب در شبکه‌های اجتماعی.",
        ],
        bullets: [
          "هدف دقیق چیست: حجم، کیفیت ظاهر پوست یا موضوع دیگری؟",
          "محصول مشخص چه ترکیبی دارد و برای چه استفاده‌ای عرضه شده است؟",
          "چه فردی با چه صلاحیتی آن را استفاده می‌کند؟",
          "موارد منع مصرف و عوارض احتمالی چگونه مرور می‌شوند؟",
          "برای عارضه احتمالی چه برنامه پیگیری وجود دارد؟",
        ],
      },
      {
        heading: "نشانه یک صفحه محصول مسئولانه",
        paragraphs: [
          "صفحه مسئولانه به‌جای تضمین نتیجه، مشخص می‌کند اطلاعات برای چه مخاطبی است، موجودی و اصالت چگونه بررسی می‌شود و تصمیم پزشکی کجا از فرایند خرید جدا می‌شود.",
        ],
      },
    ],
    sources: [
      {
        label: "FDA — Dermal Fillers: Benefits and Risks",
        href: "https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers",
      },
      {
        label: "PubMed — Systematic Review of Injectable Hyaluronic Acid for Skin Quality (2023)",
        href: "https://pubmed.ncbi.nlm.nih.gov/37038447/",
      },
      {
        label: "PubMed — Randomized Split-Face Study (2025)",
        href: "https://pubmed.ncbi.nlm.nih.gov/40304039/",
      },
      {
        label: "PubMed — Retraction Notice for a 2024 Skin Booster Review",
        href: "https://pubmed.ncbi.nlm.nih.gov/41271445/",
      },
    ],
    relatedProducts: ["jalupro-hmw", "ejal-40"],
  },
  {
    slug: "before-after-dermal-filler-care",
    title: "پیش و پس از تزریق فیلر چه سؤال‌هایی باید بپرسیم؟",
    excerpt:
      "فهرست گفت‌وگو با پزشک؛ از سوابق پزشکی و محصول مصرفی تا علائم هشدار و مسیر پیگیری.",
    category: "مراقبت آگاهانه",
    date: "به‌روزرسانی: مرداد ۱۴۰۵",
    readTime: "۹ دقیقه",
    image: "/images/editorial-detail.webp",
    lead:
      "مراقبت خوب با یک فهرست عمومی از باید و نبایدها تمام نمی‌شود. مهم‌تر از همه، انتخاب فرد واجد صلاحیت، مرور سوابق و داشتن برنامه روشن برای پیگیری عارضه احتمالی است.",
    notice:
      "در صورت درد غیرعادی یا شدید، تغییر رنگ پوست، اختلال بینایی یا علائم نگران‌کننده پس از تزریق، فوراً با پزشک یا خدمات اورژانسی تماس بگیرید.",
    sections: [
      {
        heading: "پیش از تزریق",
        paragraphs: [
          "تمام سوابق پزشکی، حساسیت‌ها، داروها و مکمل‌های مصرفی را صادقانه با پزشک مرور کنید. درباره نام دقیق محصول، تجربه فرد تزریق‌کننده و برنامه برخورد با عوارض سؤال کنید.",
        ],
        bullets: [
          "چه محصولی و با چه هدفی پیشنهاد شده است؟",
          "عوارض شایع و عوارض جدی احتمالی چیست؟",
          "اگر نتیجه یا عارضه‌ای پیش آمد، چه کسی و چگونه پاسخ‌گو است؟",
          "آیا تصویر بسته و اطلاعات محصول در پرونده ثبت می‌شود؟",
        ],
      },
      {
        heading: "پس از تزریق",
        paragraphs: [
          "دستورالعمل شخصی پزشک را بر توصیه‌های عمومی اینترنتی مقدم بدانید. تورم یا کبودی ممکن است رخ دهد، اما شدت و زمان آن باید در گفت‌وگوی پیش از درمان توضیح داده شود.",
          "برای تماس بعد از ساعات کاری و علائمی که نیازمند اقدام فوری‌اند، شماره مشخص داشته باشید.",
        ],
      },
      {
        heading: "علائم هشدار را جدی بگیرید",
        paragraphs: [
          "سازمان غذا و داروی آمریکا هشدار می‌دهد که ورود ناخواسته فیلر به رگ می‌تواند پیامدهای جدی داشته باشد. درد غیرمعمول، تغییر رنگ پوست یا علائم بینایی نیازمند ارزیابی فوری‌اند.",
        ],
      },
    ],
    sources: [
      {
        label: "FDA — Dermal Filler Risks and Safety",
        href: "https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers",
      },
      {
        label: "NHS — Dermal Fillers: Choosing a Practitioner and Risks",
        href: "https://www.nhs.uk/conditions/cosmetic-procedures/non-surgical-cosmetic-procedures/dermal-fillers/",
      },
      {
        label: "American Academy of Dermatology — Fillers: Preparation",
        href: "https://www.aad.org/public/cosmetic/wrinkles/fillers-preparation",
      },
      {
        label: "American Academy of Dermatology — Fillers: FAQs",
        href: "https://www.aad.org/public/cosmetic/wrinkles/fillers-faqs",
      },
    ],
    relatedProducts: ["neuramis-deep-lidocaine", "revofil-ultra"],
  },
  {
    slug: "clinic-purchase-checklist",
    title: "چک‌لیست خرید حرفه‌ای برای کلینیک زیبایی",
    excerpt:
      "از تعریف حداقل موجودی و ثبت بچ‌کد تا تحویل، انبارش و سفارش تکرارشونده.",
    category: "مدیریت کلینیک",
    date: "مرداد ۱۴۰۵",
    readTime: "۶ دقیقه",
    image: "/images/product-category-panorama.webp",
    imagePosition: "100% center",
    lead:
      "خرید حرفه‌ای فقط پیدا کردن محصول نیست؛ باید بتوانید بدانید چه چیزی، از کدام مسیر، در چه زمانی و با چه شناسه‌ای وارد موجودی شده است.",
    notice:
      "فرایند داخلی هر مرکز باید با قوانین محلی و مسئولیت‌های مسئول فنی همان مرکز تطبیق داده شود.",
    sections: [
      {
        heading: "سبد را بر اساس مصرف واقعی بسازید",
        paragraphs: [
          "برای هر گروه، حداقل موجودی، نقطه سفارش مجدد و زمان تقریبی تأمین را ثبت کنید. محصول پرفروش اما نامرتبط با پروتکل مرکز، لزوماً خرید خوبی نیست.",
        ],
      },
      {
        heading: "ثبت هنگام تحویل",
        paragraphs: [
          "یک الگوی ثابت برای ثبت تاریخ، تعداد، بچ‌کد، سلامت بسته و نام تحویل‌گیرنده داشته باشید.",
        ],
        bullets: [
          "تطبیق فاکتور با کالای فیزیکی",
          "تفکیک اقلام آسیب‌دیده یا مشکوک",
          "ثبت شرایط نگهداری و محل انبار",
          "تعریف مسئول پیگیری سفارش",
        ],
      },
    ],
    sources: [
      {
        label: "WHO — Good Storage and Distribution Practices",
        href: "https://www.who.int/publications/m/item/trs-1025-annex-7",
      },
    ],
    relatedProducts: ["neuramis-deep-lidocaine", "jalupro-hmw", "dysport"],
  },
  {
    slug: "botulinum-cold-chain-checklist",
    title: "زنجیره سرد بوتولینوم؛ چه چیزی باید پیش از تحویل بررسی شود؟",
    seoTitle: "راهنمای زنجیره سرد بوتولینوم پیش از تحویل",
    excerpt:
      "راهنمای عملی برای پرسیدن سؤال‌های درست درباره دما، بسته‌بندی، بچ‌کد و تحویل فرآورده‌های بوتولینوم.",
    category: "ایمنی و نگهداری",
    date: "مرداد ۱۴۰۵",
    readTime: "۷ دقیقه",
    image: "/images/drive/category-botox.webp",
    imagePosition: "50% center",
    lead:
      "شرایط نگهداری همه فرآورده‌ها را نباید از روی نام عمومی «بوتاکس» حدس زد. برچسب و اطلاعات رسمی همان محصول، به‌همراه شواهد مسیر حمل، مرجع تصمیم است.",
    notice:
      "این مقاله دستور نگهداری یا مصرف یک برند مشخص نیست. برای هر محصول، بسته‌بندی رسمی، بروشور تأییدشده و مقررات محل عرضه اولویت دارد.",
    sections: [
      {
        heading: "زنجیره سرد فقط یک یخدان نیست",
        paragraphs: [
          "در یک مسیر قابل‌پیگیری باید بتوان مشخص کرد محصول در چه بازه دمایی نگهداری شده، پایش چگونه انجام شده و تحویل چه زمانی صورت گرفته است. سازمان جهانی بهداشت، کنترل و پایش شرایط نگهداری و توزیع را بخشی از مدیریت ریسک زنجیره تأمین محصولات پزشکی می‌داند.",
          "وجود بسته خنک به‌تنهایی نشان نمی‌دهد دمای مناسب در تمام مسیر حفظ شده است. نوع ظرف حمل، مدت مسیر، وضعیت پلمب و امکان مشاهده داده پایش، تصویر کامل‌تری می‌سازد.",
        ],
      },
      {
        heading: "دما را از روی برند دیگر کپی نکنید",
        paragraphs: [
          "حتی در میان فرآورده‌های شناخته‌شده، دستور نگهداری و مدت قابل استفاده پس از آماده‌سازی می‌تواند متفاوت باشد. برای نمونه، برچسب رسمی Dysport منتشرشده توسط FDA نگهداری در ظرف اصلی و یخچال با دمای ۲ تا ۸ درجه سانتی‌گراد را ذکر می‌کند؛ اما این عدد نباید خودکار به تمام محصولات دیگر تعمیم داده شود.",
        ],
        bullets: [
          "نام دقیق فرآورده و واحد روی ویال را ثبت کنید.",
          "دستور نگهداری همان بسته و بروشور رسمی را بخوانید.",
          "اگر سابقه دمایی نامعلوم است، از حدس‌زدن درباره سلامت محصول خودداری کنید.",
          "محصول مشکوک، یخ‌زده یا دارای پلمب آسیب‌دیده را تا بررسی مصرف نکنید.",
        ],
      },
      {
        heading: "چک‌لیست کوتاه هنگام تحویل",
        paragraphs: [
          "پیش از بازکردن بسته، نام محصول، واحد، بچ‌کد، تاریخ، سلامت ویال و جعبه را با سفارش تطبیق دهید. سپس زمان تحویل و شرایط ظاهری محفظه حمل را ثبت کنید. اگر دستور رسمی محصول به محافظت از نور یا منع انجماد اشاره دارد، همان مورد نیز باید در فرایند مرکز دیده شود.",
          "در صورت مغایرت یا نبود اطلاعات کافی، بهترین اقدام توقف مصرف و پیگیری از تأمین‌کننده، مسئول فنی یا مرجع قابل استعلام است؛ نه جبران‌کردن با افزایش یا تغییر دوز.",
        ],
      },
    ],
    sources: [
      {
        label: "WHO — Good storage and distribution practices for medical products",
        href: "https://www.who.int/publications/m/item/trs-1025-annex-7",
      },
      {
        label: "FDA — DYSPORT Prescribing Information",
        href: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2016/125274s107lbl.pdf",
      },
      {
        label: "FDA — BOTOX Cosmetic Prescribing Information (2024)",
        href: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/103000s5316s5319s5323s5326s5331lbl.pdf",
      },
    ],
    relatedProducts: ["dysport", "dyston-500", "nabota-150"],
  },
  {
    slug: "neuramis-vs-revofil-guide",
    title: "نورامیس بهتر است یا رووفیل؟ اول مدل دقیق را مقایسه کنیم",
    seoTitle: "نورامیس بهتره یا رووفیل؟ مقایسه دیپ و اولترا",
    metaDescription:
      "مقایسه ساده و مسئولانه نورامیس دیپ لیدوکائین و رووفیل اولترا؛ از حجم و ترکیب تا سؤال‌های مهم پیش از انتخاب فیلر.",
    focusKeyword: "نورامیس بهتره یا رووفیل",
    excerpt:
      "اسم برند به‌تنهایی جواب نمی‌دهد. نورامیس دیپ و رووفیل اولترا را از نظر مدل، حجم، ترکیب و مسیر بررسی بسته مقایسه می‌کنیم.",
    category: "راهنمای انتخاب فیلر",
    date: "۱۹ مرداد ۱۴۰۵",
    datePublished: "2026-08-10",
    dateModified: "2026-08-10",
    readTime: "۷ دقیقه",
    image: "/images/storyboard/fillers-triptych.webp",
    imagePosition: "50% center",
    imageAlt: "مقایسه ادیتوریال بسته و سرنگ فیلرهای هیالورونیک اسید",
    imageCaption: "برای مقایسه فیلر، نام کامل مدل و مشخصات همان بسته مهم‌تر از شهرت کلی برند است.",
    lead:
      "«نورامیس بهتره یا رووفیل؟» سؤال رایجی است، اما کمی شبیه این است که بپرسیم کدام کفش بهتر است و نگوییم برای پیاده‌روی می‌خواهیم یا دویدن. هر دو برند چند مدل دارند. اینجا مشخصاً نورامیس دیپ لیدوکائین را کنار رووفیل اولترا می‌گذاریم تا مقایسه از حالت کلی و تبلیغاتی خارج شود.",
    notice:
      "این مقاله برند برنده اعلام نمی‌کند و برای یک فرد محصول انتخاب نمی‌کند. فیلر تزریقی باید فقط توسط فرد واجد صلاحیت، پس از بررسی سابقه پزشکی، ناحیه، ریسک‌ها و اصالت همان بسته استفاده شود.",
    sections: [
      {
        heading: "اول یک سوءتفاهم ساده را کنار بگذاریم",
        paragraphs: [
          "نورامیس نام یک خانواده محصول است و رووفیل هم چند مدل دارد. بنابراین تجربه یک نفر از یک مدل را نمی‌شود به تمام محصولات آن برند تعمیم داد. مقایسه منصفانه وقتی شروع می‌شود که نام کامل روی جعبه روشن باشد.",
          "در این مقایسه، نورامیس دیپ لیدوکائین یک فیلر هیالورونیک اسید کراس‌لینک‌شده حاوی لیدوکائین است. رووفیل اولترا نیز فیلر هیالورونیک اسید کراس‌لینک‌شده است که در مشخصات فنی همراه دو پپتید معرفی می‌شود. همین تفاوت‌ها نشان می‌دهد تصمیم فقط با شنیدن نام برند کامل نمی‌شود.",
        ],
      },
      {
        heading: "تفاوت مشخصات در یک نگاه",
        paragraphs: [
          "این جدول برای شناخت بسته و مدل است، نه تعیین ناحیه تزریق یا برتری درمانی. موجودی بازار می‌تواند بسته‌بندی متفاوتی داشته باشد، پس جعبه واقعی سفارش باید دوباره کنترل شود.",
        ],
        table: {
          headers: ["موضوع", "نورامیس دیپ لیدوکائین", "رووفیل اولترا"],
          rows: [
            ["سازنده", "Medytox", "Caregen"],
            ["گروه", "فیلر هیالورونیک اسید کراس‌لینک‌شده حاوی لیدوکائین", "فیلر هیالورونیک اسید کراس‌لینک‌شده همراه پپتید"],
            ["حجم بررسی‌شده", "۱ سرنگ ۱ میلی‌لیتری", "۲ سرنگ ۱ میلی‌لیتری در فهرست‌های فنی بررسی‌شده"],
            ["ترکیب شاخص اعلام‌شده", "هیالورونیک اسید کراس‌لینک‌شده و لیدوکائین", "۲۳ mg/mL هیالورونیک اسید، Oligopeptide-72 و Oligopeptide-50"],
            ["نکته خرید", "عبارت Deep Lidocaine روی بسته کنترل شود", "مدل Ultra با Plus و Fine اشتباه نشود"],
          ],
        },
      },
      {
        heading: "پس کدام‌یک برای من بهتر است؟",
        paragraphs: [
          "اگر جواب این سؤال بدون دیدن صورت، سابقه پزشکی و هدف شما داده شود، بیشتر شبیه حدس است تا راهنمایی. نوع بافت، عمق موردنیاز، مقدار اصلاح، سابقه تزریق و تجربه پزشک در انتخاب نقش دارند.",
          "حتی دو نفر که هر دو می‌گویند «برای خط خنده فیلر می‌خواهم» ممکن است به تصمیم یکسانی نرسند. بهتر است به‌جای درخواست یک برند خاص، از پزشک بپرسید چرا این مدل برای این ناحیه و این هدف پیشنهاد شده است.",
        ],
        subsections: [
          {
            heading: "یک نشانه خوب در مشاوره",
            paragraphs: [
              "پاسخ حرفه‌ای معمولاً شامل نام کامل محصول، دلیل انتخاب، مقدار تقریبی، عوارض قابل انتظار و مسیر پیگیری است. عبارت‌هایی مثل «این بهترین ژل دنیاست» بدون توضیح، اطلاعات کافی برای تصمیم نیست.",
            ],
          },
        ],
      },
      {
        heading: "موقع تحویل چه چیزهایی را ببینیم؟",
        paragraphs: [
          "ظاهر جعبه مهم است، اما کافی نیست. مسیر تأمین قابل‌پیگیری، هماهنگی مشخصات روی جعبه و سرنگ و ثبت اطلاعات همان بچ کنار هم معنا پیدا می‌کنند.",
        ],
        bullets: [
          "نام برند و مدل کامل روی جعبه و سرنگ یکی باشد.",
          "حجم، تعداد سرنگ و اقلام داخل بسته با سفارش تطبیق داشته باشد.",
          "بچ‌کد، تاریخ و پلمب خوانا و سالم باشند.",
          "شرایط نگهداری درج‌شده روی همان محصول رعایت شده باشد.",
          "نام محصول مصرف‌شده در پرونده مراجعه‌کننده ثبت شود.",
        ],
      },
      {
        heading: "جمع‌بندی کوتاه و بی‌طرفانه",
        paragraphs: [
          "نورامیس دیپ لیدوکائین و رووفیل اولترا هر دو محصول حرفه‌ای‌اند، اما مدل و مشخصات یکسانی ندارند. انتخاب بهتر از روی جدول محبوبیت یا قیمت تنها به دست نمی‌آید. اول هدف و ناحیه روشن می‌شود، بعد مدل مناسب بررسی می‌شود و در پایان اصالت و وضعیت همان بسته کنترل می‌شود.",
        ],
      },
    ],
    faq: [
      {
        question: "نورامیس بهتره یا رووفیل؟",
        answer:
          "برای همه یک برنده ثابت وجود ندارد. باید مدل دقیق، ناحیه، هدف، وضعیت پوست و نظر پزشک کنار هم بررسی شوند. این مقاله نورامیس دیپ لیدوکائین و رووفیل اولترا را از نظر مشخصات مقایسه می‌کند، نه نتیجه فردی.",
      },
      {
        question: "نورامیس دیپ چند سی‌سی است؟",
        answer:
          "صفحه رسمی Medytox واحد بسته‌بندی ۱٫۰ میلی‌لیتر را ذکر می‌کند. حجم همان بسته موجود را پیش از خرید کنترل کنید.",
      },
      {
        question: "رووفیل اولترا چند سرنگ دارد؟",
        answer:
          "در فهرست‌های فنی بررسی‌شده، بسته شامل دو سرنگ ۱ میلی‌لیتری است. چون عرضه بازارها می‌تواند تفاوت داشته باشد، بسته واقعی سفارش مرجع نهایی است.",
      },
    ],
    sources: [
      {
        label: "Medytox — Neuramis® official product information",
        href: "https://www.medytox.com/page/neuramis_en?site_id=en",
      },
      {
        label: "REVOFIL Ultra — technical product specification",
        href: "https://www.directdermasupplies.com/products/revofil/revofil-ultra-1ml",
      },
      {
        label: "FDA — Dermal Fillers: Benefits and Risks",
        href: "https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers",
      },
    ],
    relatedProducts: ["neuramis-deep-lidocaine", "revofil-ultra"],
    relatedArticles: ["verify-dermal-filler-authenticity", "before-after-dermal-filler-care"],
  },
  {
    slug: "male-hair-loss-before-mesotherapy",
    title: "ریزش موی مردانه؛ پیش از انتخاب کوکتل مو چه بدانیم؟",
    seoTitle: "ریزش موی مردانه و کوکتل مو؛ راهنمای انتخاب آگاهانه",
    metaDescription:
      "قبل از خرید یا انتخاب کوکتل مو، علت ریزش، الگوی آندروژنتیک، درمان‌های اصلی و مشخصات محصول را بشناسید. راهنمای ساده و منبع‌دار.",
    focusKeyword: "کوکتل ریزش موی مردانه",
    excerpt:
      "ریزش مو همیشه یک علت ندارد. پیش از انتخاب کوکتل، باید الگوی ریزش، تشخیص پزشک، ترکیبات محصول و انتظار واقع‌بینانه روشن باشد.",
    category: "مو و پوست سر",
    date: "۱۹ مرداد ۱۴۰۵",
    datePublished: "2026-08-10",
    dateModified: "2026-08-10",
    readTime: "۹ دقیقه",
    image: "/images/storyboard/hair-triptych.webp",
    imagePosition: "50% center",
    imageAlt: "تصویر ادیتوریال بررسی مو و پوست سر در کلینیک",
    imageCaption: "بررسی علت ریزش مو، قدم اول انتخاب هر محصول یا پروتکل حرفه‌ای است.",
    lead:
      "وقتی موها کم‌پشت می‌شوند، وسوسه خرید سریع یک کوکتل یا ویال طبیعی است. اما ریزش موی ارثی، ریزش ناگهانی، کمبودها و بیماری‌های پوست سر یک مسیر درمانی مشترک ندارند. انتخاب محصول از تشخیص شروع می‌شود، نه از اسم روی جعبه.",
    notice:
      "ریزش ناگهانی، تکه‌ای، همراه با التهاب یا خارش شدید، یا ریزشی که پس از بیماری و داروی جدید شروع شده است باید توسط پزشک بررسی شود. این مقاله نسخه درمانی ارائه نمی‌کند.",
    sections: [
      {
        heading: "اول مشخص کنیم با چه نوع ریزشی روبه‌رو هستیم",
        paragraphs: [
          "ریزش موی آندروژنتیک در مردان معمولاً آهسته پیش می‌رود و می‌تواند با عقب‌رفتن خط رویش یا کم‌پشتی فرق سر دیده شود. اما هر کم‌پشتی‌ای ارثی نیست. ریزش تکه‌ای، ریزش منتشر پس از استرس یا بیماری و التهاب پوست سر به بررسی متفاوتی نیاز دارند.",
          "آکادمی پوست آمریکا تأکید می‌کند درمان مؤثر با پیدا کردن علت شروع می‌شود. این نکته ساده جلوی یک اشتباه رایج را می‌گیرد: انتخاب چند محصول پشت سر هم، بدون اینکه معلوم باشد دقیقاً چه چیزی را درمان می‌کنیم.",
        ],
        subsections: [
          {
            heading: "سپید بیوتی توضیح می‌دهد: اسم «هیر من» تشخیص نیست",
            paragraphs: [
              "عبارت‌هایی مثل هیر، ضدریزش یا مردانه دسته‌بندی محصول‌اند. این واژه‌ها ثابت نمی‌کنند که محصول برای علت ریزش شما مناسب است. قبل از مقایسه قیمت و تعداد ویال، الگوی ریزش و سابقه پزشکی باید روشن شود.",
            ],
          },
        ],
      },
      {
        heading: "کوکتل مو کجای مسیر تصمیم قرار می‌گیرد؟",
        paragraphs: [
          "کوکتل‌ها و ویال‌های حرفه‌ای ترکیب‌های یکسانی ندارند و سطح شواهد آنها هم برابر نیست. بعضی محصولات برای کار حرفه‌ای روی پوست سر معرفی می‌شوند، اما معرفی سازنده را نباید با اثبات نتیجه قطعی یا جایگزینی درمان‌های اصلی اشتباه گرفت.",
          "برای ریزش موی مردانه، منابع بالینی معتبر گزینه‌های درمانی مشخصی مانند ماینوکسیدیل و فیناستراید را مطرح می‌کنند؛ این داروها هم برای همه مناسب نیستند و به بررسی عوارض و منع مصرف نیاز دارند. هر پروتکل مکمل باید در کنار این تصویر کلی سنجیده شود.",
        ],
        table: {
          headers: ["پرسش", "پاسخ مسئولانه"],
          rows: [
            ["آیا کوکتل برای هر ریزشی مناسب است؟", "خیر؛ علت ریزش و وضعیت پوست سر اول باید مشخص شود."],
            ["آیا وجود چند ماده فعال نتیجه را تضمین می‌کند؟", "خیر؛ فرمول، روش استفاده، شواهد و شرایط فرد مهم‌اند."],
            ["آیا می‌توان درمان تجویزشده را خودسرانه قطع کرد؟", "خیر؛ تغییر درمان باید با پزشک هماهنگ شود."],
            ["آیا عکس قبل و بعد کافی است؟", "خیر؛ نور، زاویه، طول مو و زمان ثبت می‌تواند برداشت را تغییر دهد."],
          ],
        },
      },
      {
        heading: "اف هیر من چه مشخصاتی دارد؟",
        paragraphs: [
          "Fusion Meso در صفحه رسمی F-HAIR MEN، بسته ۵ ویال ۵ میلی‌لیتری را معرفی می‌کند. فهرست ترکیبات اعلام‌شده شامل استیل تتراپپتید-۳ و عصاره شبدر، FGF و VEGF، تری‌پپتید مس-۱، دکاپپتید-۴، سیلیسیوم آلی، کارنوزین، دکسپانتنول و هیالورونیک اسید است.",
          "این اطلاعات برای تطبیق مدل و بسته مفید است؛ نه برای نسخه‌نویسی. روش استفاده، منع مصرف و تناسب آن باید از بروشور همان بسته و نظر فرد واجد صلاحیت به دست بیاید.",
        ],
      },
      {
        heading: "قبل از خرید، این سؤال‌ها را بپرسید",
        paragraphs: [
          "اگر پاسخ‌ها مبهم‌اند، خرید سریع کمکی به تصمیم نمی‌کند. چند سؤال روشن معمولاً ارزش بیشتری از یک فهرست بلند ادعاها دارد.",
        ],
        bullets: [
          "تشخیص یا علت احتمالی ریزش چیست و چه بررسی‌هایی انجام شده؟",
          "نام کامل محصول، تعداد ویال و حجم هر ویال چیست؟",
          "ترکیبات روی بسته با صفحه رسمی سازنده هم‌خوان است؟",
          "این محصول قرار است مکمل کدام برنامه درمانی باشد؟",
          "معیار ارزیابی نتیجه چیست و عکس‌ها چگونه استاندارد ثبت می‌شوند؟",
          "اگر التهاب، درد یا واکنش غیرعادی رخ داد، مسیر پیگیری چیست؟",
        ],
      },
      {
        heading: "چه وقت مراجعه را عقب نیندازیم؟",
        paragraphs: [
          "ریزش ناگهانی یا تکه‌ای، زخم و ترشح، درد، پوسته‌ریزی شدید، درگیری ابرو یا ریش، یا همراهی با علائم عمومی نیاز به ارزیابی دارد. اگر ریزش بعد از شروع دارو یا یک بیماری تازه آغاز شده، این زمان‌بندی را هم به پزشک بگویید.",
          "حتی در ریزش ارثی هم شروع زودتر ارزیابی می‌تواند مفید باشد؛ چون هدف همیشه رویش کامل نیست و گاهی کندکردن روند یا حفظ موهای موجود، انتظار واقع‌بینانه‌تری است.",
        ],
      },
    ],
    faq: [
      {
        question: "کوکتل مو برای ریزش ارثی مردانه جواب می‌دهد؟",
        answer:
          "نمی‌توان برای همه یک پاسخ قطعی داد. ابتدا تشخیص، شدت ریزش و درمان‌های اصلی بررسی می‌شوند؛ سپس پزشک درباره نقش احتمالی یک محصول مکمل تصمیم می‌گیرد.",
      },
      {
        question: "اف هیر من چند ویال دارد؟",
        answer:
          "طبق صفحه رسمی Fusion Meso، بسته F-HAIR MEN شامل ۵ ویال ۵ میلی‌لیتری است. مشخصات همان بسته موجود باید پیش از خرید تطبیق داده شود.",
      },
      {
        question: "برای ریزش مو اول آزمایش لازم است؟",
        answer:
          "برای همه یک فهرست آزمایش ثابت وجود ندارد. پزشک بر اساس الگوی ریزش، شرح حال، معاینه و علائم همراه تصمیم می‌گیرد چه بررسی‌ای لازم است.",
      },
    ],
    sources: [
      {
        label: "American Academy of Dermatology — Hair loss diagnosis and treatment",
        href: "https://www.aad.org/public/diseases/hair-loss/treatment/diagnosis-treat",
      },
      {
        label: "American Academy of Dermatology — Male pattern hair loss treatment",
        href: "https://www.aad.org/public/diseases/hair-loss/treatment/male-pattern-hair-loss-treatment",
      },
      {
        label: "NHS — Hair loss",
        href: "https://www.nhs.uk/symptoms/hair-loss/",
      },
      {
        label: "Fusion Meso — F-HAIR MEN official product information",
        href: "https://fusionmeso.com/product/f-hair-men-sterile-vials-for-androgenic-alopecia-hair-loss/",
      },
    ],
    relatedProducts: ["fusion-f-hair-men", "mesolike-dutasteride", "fusion-f-hair"],
    relatedArticles: ["clinic-purchase-checklist", "verify-dermal-filler-authenticity"],
  },
];

export const getProduct = (slug: string) =>
  products.find((product) => product.slug === slug);

export const getCategory = (slug: string) =>
  categories.find((category) => category.slug === slug);

export const getArticle = (slug: string) =>
  articles.find((article) => article.slug === slug);

export const whatsappHref = (message = "سلام، برای استعلام محصول پیام می‌دهم.") =>
  `https://wa.me/989037251266?text=${encodeURIComponent(message)}`;
