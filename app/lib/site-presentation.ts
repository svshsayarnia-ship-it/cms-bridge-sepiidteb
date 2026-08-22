import "server-only";

import { unstable_cache } from "next/cache";
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
    brandTagline: "سپید بیوتی · اطلاعات روشن برای خرید بهتر",
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
    supportEyebrow: "پشتیبانی سپید",
    supportTitle: "اگر چیزی روشن نیست، از ما بپرسید.",
    supportText: "نام مدل، تعداد و شهر مقصد را بفرستید تا درباره قیمت روز، موجودی و بسته همان محصول جواب بدهیم.",
    supportButtonLabel: "پیام به سپید",
    brandDescription: "اینجا مشخصات بسته‌ها، قیمت روز و راه خرید را ساده و روشن کنار هم می‌بینید.",
    phone: "09037251266",
    hours: "شنبه تا پنجشنبه · ۹ تا ۲۰",
    legalNotice: "این سایت برای شناخت محصول و خرید است. انتخاب و استفاده از محصولات تزریقی باید توسط پزشک یا فرد واجد صلاحیت انجام شود.",
  },
  home: { hero: {
    eyebrow: "محصولات زیبایی برای خرید حرفه‌ای",
    title: "مدل درست را راحت‌تر پیدا کنید.",
    description: "نام محصول، حجم بسته و قیمت روز را یک‌جا ببینید. اگر چیزی برایتان روشن نبود، از ما بپرسید.",
    primaryCtaLabel: "دیدن محصولات", primaryCtaHref: "/shop",
    secondaryCtaLabel: "راهنمای انتخاب", secondaryCtaHref: "/guides",
    microproofItems: ["نام و حجم هر بسته روشن است", "قیمت و موجودی روز را می‌پرسید", "پاسخ‌گویی واقعی در واتساپ"],
    image: "/images/drive/hero-rejuvenation.webp",
    imageAlt: "تصویر ادیتوریال جوان‌سازی پوست از مجموعه Sepiid Beauty",
    editorialLabel: "سپید بیوتی / ۰۱", editorialCaption: "اطلاعات روشن، خرید آرام‌تر",
    qualityTitle: "قبل از ارسال چک می‌کنیم", qualitySubtitle: "نام · بسته · وضعیت",
  } },
  articles: articles.map(({ slug, title, excerpt, category, lead, notice }) => ({
    slug, title, excerpt, category, lead, notice: notice ?? "",
  })),
};

function restoreCanonicalKeys(value: unknown, template: unknown): unknown {
  if (Array.isArray(value)) {
    const itemTemplate = Array.isArray(template) ? template[0] : undefined;
    return value.map((item) => restoreCanonicalKeys(item, itemTemplate));
  }
  if (!value || typeof value !== "object" || !template || typeof template !== "object") return value;
  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [canonicalKey, templateValue] of Object.entries(template)) {
    const actualKey = Object.keys(source).find((key) => key.toLowerCase() === canonicalKey.toLowerCase());
    if (actualKey) result[canonicalKey] = restoreCanonicalKeys(source[actualKey], templateValue);
  }
  return result;
}

function mergePresentation(rawValue: Partial<SitePresentation> | null): SitePresentation {
  const value = rawValue
    ? restoreCanonicalKeys(rawValue, DEFAULT_SITE_PRESENTATION) as Partial<SitePresentation>
    : null;
  if (!value) return DEFAULT_SITE_PRESENTATION;
  return {
    header: { ...DEFAULT_SITE_PRESENTATION.header, ...value.header },
    footer: { ...DEFAULT_SITE_PRESENTATION.footer, ...value.footer },
    home: { hero: { ...DEFAULT_SITE_PRESENTATION.home.hero, ...value.home?.hero } },
    articles: value.articles?.length ? value.articles : DEFAULT_SITE_PRESENTATION.articles,
  };
}

async function loadSitePresentation() {
  try {
    return mergePresentation(
      await getRemotePresentation({
        requestTimeoutMs: 2_500,
        requestMaxAttempts: 1,
      }),
    );
  } catch {
    return DEFAULT_SITE_PRESENTATION;
  }
}

const getCachedSitePresentation = unstable_cache(
  loadSitePresentation,
  ["site-presentation-v2"],
  { revalidate: 300 },
);

export const getSitePresentation = cache(
  getCachedSitePresentation,
);

export function applyArticlePresentation<T extends { slug: string }>(items: T[], presentation: SitePresentation) {
  const overrides = new Map(presentation.articles.map((item) => [item.slug, item]));
  return items.map((item) => ({ ...item, ...overrides.get(item.slug) }));
}
