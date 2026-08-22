import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { articles, type Article } from "../data";
import { decodeArticleHtml } from "./article-html";
import { getSitePresentation as getRemotePresentation } from "./woocommerce";

export type NavItem = { label: string; href: string };
export type ArticlePresentation = Article;
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
    brandTagline: "",
    consultationLabel: "موجودی و قیمت",
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
    supportEyebrow: "یک سؤال مانده؟",
    supportTitle: "اسم محصول را بفرستید؛ جزئیاتش را با هم چک می‌کنیم.",
    supportText: "برای موجودی، قیمت، مدل دقیق، تعداد داخل بسته یا شرایط ارسال، مستقیم به تیم سپید پیام بدهید.",
    supportButtonLabel: "پیام به سپید",
    brandDescription: "سپید بیوتی برای دیدن و مقایسه محصولات حرفه‌ای زیبایی ساخته شده؛ مدل، حجم، بسته‌بندی و قیمت را ساده و روشن کنار هم می‌بینید تا قبل از خرید ابهام کمتری داشته باشید.",
    phone: "09037251266",
    hours: "شنبه تا پنجشنبه · ۹ تا ۲۰",
    legalNotice: "اطلاعات این سایت برای شناخت و مقایسه محصول است. انتخاب و استفاده از محصولات تزریقی باید توسط فرد واجد صلاحیت انجام شود.",
  },
  home: { hero: {
    eyebrow: "برای انتخاب دقیق‌تر محصولات حرفه‌ای زیبایی",
    title: "قبل از خرید، محصول را درست بشناسید.",
    description: "فیلر، مزوژل، اسکین‌بوستر، بوتولینوم و کوکتل‌های تخصصی را با مدل، حجم، نوع بسته و قیمت کنار هم ببینید و راحت‌تر مقایسه کنید.",
    primaryCtaLabel: "دیدن محصولات", primaryCtaHref: "/shop",
    secondaryCtaLabel: "اگر بین مدل‌ها مردد هستید", secondaryCtaHref: "/guides",
    microproofItems: ["مدل و حجم مشخص", "قیمت جلوی چشم", "پاسخ‌گویی واقعی"],
    image: "/images/drive/hero-rejuvenation.webp",
    imageAlt: "تصویر ادیتوریال سپید بیوتی برای محصولات حرفه‌ای زیبایی",
    editorialLabel: "SEPIID EDITORIAL / 01", editorialCaption: "کمتر حدس بزنید، دقیق‌تر انتخاب کنید",
    qualityTitle: "چیزی که واقعاً می‌خرید", qualitySubtitle: "MODEL / PACK / PRICE",
  } },
  articles: articles.map((article) => ({ ...article, status: "publish" })),
};

const EDITORIAL_IDENTITY_COPY = {
  header: {
    brandTagline: DEFAULT_SITE_PRESENTATION.header.brandTagline,
    consultationLabel: DEFAULT_SITE_PRESENTATION.header.consultationLabel,
  },
  footer: {
    supportEyebrow: DEFAULT_SITE_PRESENTATION.footer.supportEyebrow,
    supportTitle: DEFAULT_SITE_PRESENTATION.footer.supportTitle,
    supportText: DEFAULT_SITE_PRESENTATION.footer.supportText,
    supportButtonLabel: DEFAULT_SITE_PRESENTATION.footer.supportButtonLabel,
    brandDescription: DEFAULT_SITE_PRESENTATION.footer.brandDescription,
    legalNotice: DEFAULT_SITE_PRESENTATION.footer.legalNotice,
  },
  home: {
    hero: {
      eyebrow: DEFAULT_SITE_PRESENTATION.home.hero.eyebrow,
      title: DEFAULT_SITE_PRESENTATION.home.hero.title,
      description: DEFAULT_SITE_PRESENTATION.home.hero.description,
      primaryCtaLabel: DEFAULT_SITE_PRESENTATION.home.hero.primaryCtaLabel,
      primaryCtaHref: DEFAULT_SITE_PRESENTATION.home.hero.primaryCtaHref,
      secondaryCtaLabel: DEFAULT_SITE_PRESENTATION.home.hero.secondaryCtaLabel,
      secondaryCtaHref: DEFAULT_SITE_PRESENTATION.home.hero.secondaryCtaHref,
      microproofItems: DEFAULT_SITE_PRESENTATION.home.hero.microproofItems,
      editorialCaption: DEFAULT_SITE_PRESENTATION.home.hero.editorialCaption,
      qualityTitle: DEFAULT_SITE_PRESENTATION.home.hero.qualityTitle,
      qualitySubtitle: DEFAULT_SITE_PRESENTATION.home.hero.qualitySubtitle,
    },
  },
};

function restoreCanonicalKeys(value: unknown, template: unknown): unknown {
  if (Array.isArray(value)) {
    const itemTemplate = Array.isArray(template) ? template[0] : undefined;
    return value.map((item) => restoreCanonicalKeys(item, itemTemplate));
  }
  if (!value || typeof value !== "object" || !template || typeof template !== "object") return value;
  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [actualKey, actualValue] of Object.entries(source)) {
    const canonicalEntry = Object.entries(template).find(
      ([canonicalKey]) => canonicalKey.toLowerCase() === actualKey.toLowerCase(),
    );
    const outputKey = canonicalEntry?.[0] ?? actualKey;
    result[outputKey] = restoreCanonicalKeys(actualValue, canonicalEntry?.[1]);
  }
  return result;
}

function normalizeArticle(value: Partial<Article>, base?: Article): Article {
  const fallback: Article = base ?? {
    slug: "", title: "", excerpt: "", category: "راهنمای انتخاب",
    date: "", readTime: "۵ دقیقه", image: "/images/magazine-authenticity-v2.webp",
    lead: "", notice: "", sections: [], sources: [], relatedProducts: [],
  };
  return {
    ...fallback,
    ...value,
    sections: value.sections ?? fallback.sections ?? [],
    sources: value.sources ?? fallback.sources ?? [],
    relatedProducts: value.relatedProducts ?? fallback.relatedProducts ?? [],
    relatedArticles: value.relatedArticles ?? fallback.relatedArticles ?? [],
    faq: value.faq ?? fallback.faq ?? [],
    brandSlugs: value.brandSlugs ?? fallback.brandSlugs ?? [],
    status: value.status ?? fallback.status ?? "publish",
    contentMode: value.contentMode ?? fallback.contentMode ?? "structured",
    htmlContent: value.htmlContent ?? decodeArticleHtml(value.htmlContentChunks),
    htmlContentChunks: value.htmlContentChunks ?? [],
  };
}

export function normalizeSitePresentation(rawValue: Partial<SitePresentation> | null): SitePresentation {
  const value = rawValue
    ? restoreCanonicalKeys(rawValue, DEFAULT_SITE_PRESENTATION) as Partial<SitePresentation>
    : null;
  if (!value) return DEFAULT_SITE_PRESENTATION;

  const remoteArticles = value.articles ?? [];
  const remoteBySlug = new Map(remoteArticles.map((article) => [article.slug, article]));
  const staticSlugs = new Set(articles.map((article) => article.slug));
  const normalizedArticles = [
    ...articles.map((article) => normalizeArticle(remoteBySlug.get(article.slug) ?? {}, article)),
    ...remoteArticles.filter((article) => !staticSlugs.has(article.slug)).map((article) => normalizeArticle(article)),
  ];

  const merged: SitePresentation = {
    header: { ...DEFAULT_SITE_PRESENTATION.header, ...value.header },
    footer: { ...DEFAULT_SITE_PRESENTATION.footer, ...value.footer },
    home: { hero: { ...DEFAULT_SITE_PRESENTATION.home.hero, ...value.home?.hero } },
    articles: normalizedArticles,
  };

  return {
    ...merged,
    header: {
      ...merged.header,
      ...EDITORIAL_IDENTITY_COPY.header,
    },
    footer: {
      ...merged.footer,
      ...EDITORIAL_IDENTITY_COPY.footer,
    },
    home: {
      hero: {
        ...merged.home.hero,
        ...EDITORIAL_IDENTITY_COPY.home.hero,
      },
    },
  };
}

async function loadSitePresentation() {
  try {
    return normalizeSitePresentation(
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
  ["site-presentation-v3-editorial"],
  { revalidate: 300, tags: ["site-presentation"] },
);

export const getSitePresentation = cache(
  getCachedSitePresentation,
);

export function applyArticlePresentation<T extends { slug: string }>(items: T[], presentation: SitePresentation) {
  const overrides = new Map(presentation.articles.map((item) => [item.slug, item]));
  const merged = items.map((item) => ({ ...item, ...overrides.get(item.slug) }));
  const known = new Set(items.map((item) => item.slug));
  const created = presentation.articles.filter((item) => !known.has(item.slug));
  return [...merged, ...created] as Array<T & ArticlePresentation>;
}

export function getManagedArticles(
  presentation: SitePresentation,
  options: { includeDrafts?: boolean } = {},
) {
  const managed = applyArticlePresentation(articles, presentation);
  return options.includeDrafts ? managed : managed.filter((article) => article.status !== "draft");
}
