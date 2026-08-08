import "server-only";

import { cache } from "react";
import { articles } from "../data";
import { getSitePresentation as getRemotePresentation } from "./woocommerce";

export type NavItem = { label: string; href: string };
export type ArticlePresentation = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  lead: string;
  notice: string;
};
export type SitePresentation = {
  header: {
    brandTagline: string;
    consultationLabel: string;
    navigation: NavItem[];
  };
  footer: {
    supportEyebrow: string;
    supportTitle: string;
    supportText: string;
    supportButtonLabel: string;
    brandDescription: string;
    phone: string;
    hours: string;
    legalNotice: string;
  };
  home: {
    hero: {
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
  };
  articles: ArticlePresentation[];
};

export const DEFAULT_SITE_PRESENTATION: SitePresentation = {
  header: {
    brandTagline: "سپید بیوتی · انتخاب حرفه‌ای",
    consultationLabel: "مشاوره و استعلام",
    navigation: [
      { href: "/shop", label: "فروشگاه" },
      { href: "/brands", label: "برندها" },
      { href: "/guides", label: "راهنمای انتخاب" },
      { href: "/magazine", label: "مجله سپید" },
      { href: "/professional", label: "همکاری با کلینیک‌ها" },
      { href: "/contact", label: "تماس" },
    ],
  },
  footer: {
    supportEyebrow: "SUPPORT / پشتیبانی",
    supportTitle: "قبل از خرید، سؤال درست را بپرسید.",
    supportText: "برای موجودی، مشخصات بسته و شرایط تحویل، مستقیم با تیم ما گفت‌وگو کنید.",
    supportButtonLabel: "شروع گفت‌وگو",
    brandDescription: "مرجع انتخاب و استعلام محصولات حرفه‌ای زیبایی با تمرکز بر اصالت، اطلاعات شفاف و پشتیبانی انسانی.",
    phone: "09037251266",
    hours: "شنبه تا پنجشنبه · ۹ تا ۲۰",
    legalNotice: "محتوای سایت آموزشی است. محصولات تزریقی باید فقط توسط افراد واجد صلاحیت انتخاب و استفاده شوند.",
  },
  home: { hero: {
    eyebrow: "فروشگاه تخصصی و مجله تصمیم‌یار زیبایی",
    title: "از انتخاب اول تا آخرین لحظه با شما هستیم.",
    description: "محصول، مشخصات و استعلام موجودی را سریع و مرتب در یک‌جا ببینید.",
    primaryCtaLabel: "دیدن محصولات", primaryCtaHref: "/shop",
    secondaryCtaLabel: "راهنمای پنج‌سؤالی", secondaryCtaHref: "/guides",
    microproofItems: ["اطلاعات بچ پیش از خرید", "مسیر ویژه کلینیک", "مقالات منبع‌دار"],
    image: "/images/drive/hero-rejuvenation.webp",
    imageAlt: "تصویر ادیتوریال جوان‌سازی پوست از مجموعه Sepiid Beauty",
    editorialLabel: "SEPIID EDITORIAL / 01", editorialCaption: "علم، ظرافت و انتخاب مسئولانه",
    qualityTitle: "بررسی قبل از ارسال", qualitySubtitle: "PACK / LOT / CONDITION",
  } },
  articles: articles.map(({ slug, title, excerpt, category, lead, notice }) => ({
    slug, title, excerpt, category, lead, notice: notice ?? "",
  })),
};

function mergePresentation(value: Partial<SitePresentation> | null): SitePresentation {
  if (!value) return DEFAULT_SITE_PRESENTATION;
  return {
    header: { ...DEFAULT_SITE_PRESENTATION.header, ...value.header },
    footer: { ...DEFAULT_SITE_PRESENTATION.footer, ...value.footer },
    home: { hero: { ...DEFAULT_SITE_PRESENTATION.home.hero, ...value.home?.hero } },
    articles: value.articles?.length ? value.articles : DEFAULT_SITE_PRESENTATION.articles,
  };
}

export const getSitePresentation = cache(async () => {
  try {
    return mergePresentation(await getRemotePresentation());
  } catch {
    return DEFAULT_SITE_PRESENTATION;
  }
});

export function applyArticlePresentation<T extends { slug: string }>(items: T[], presentation: SitePresentation) {
  const overrides = new Map(presentation.articles.map((item) => [item.slug, item]));
  return items.map((item) => ({ ...item, ...overrides.get(item.slug) }));
}
