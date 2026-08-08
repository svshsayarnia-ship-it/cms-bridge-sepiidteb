export type HomeHeroPresentation = {
  eyebrow: string;
  title: string;
  description: string;

  primaryCtaLabel: string;
  primaryCtaHref: string;

  secondaryCtaLabel: string;
  secondaryCtaHref: string;

  microproofItems: string[];

  image: string;
  imageAlt: string;

  editorialLabel: string;
  editorialCaption: string;

  qualityTitle: string;
  qualitySubtitle: string;
};

export type SitePresentation = {
  home: {
    hero: HomeHeroPresentation;
  };
};

export const DEFAULT_SITE_PRESENTATION: SitePresentation = {
  home: {
    hero: {
      eyebrow:
        "فروشگاه تخصصی و مجله تصمیم‌یار زیبایی",

      title:
        "از انتخاب اول تا آخرین لحظه با شما هستیم.",

      description:
        "محصول، مشخصات و استعلام موجودی را سریع و مرتب در یک‌جا ببینید.",

      primaryCtaLabel:
        "دیدن محصولات",

      primaryCtaHref:
        "/shop",

      secondaryCtaLabel:
        "راهنمای پنج‌سؤالی",

      secondaryCtaHref:
        "/guides",

      microproofItems: [
        "اطلاعات بچ پیش از خرید",
        "مسیر ویژه کلینیک",
        "مقالات منبع‌دار",
      ],

      image:
        "/images/drive/hero-rejuvenation.webp",

      imageAlt:
        "تصویر ادیتوریال جوان‌سازی پوست از مجموعه Sepiid Beauty",

      editorialLabel:
        "SEPIID EDITORIAL / 01",

      editorialCaption:
        "علم، ظرافت و انتخاب مسئولانه",

      qualityTitle:
        "بررسی قبل از ارسال",

      qualitySubtitle:
        "PACK / LOT / CONDITION",
    },
  },
};