import { revalidatePath, revalidateTag } from "next/cache";
import { cmsApiGuard } from "@/app/lib/cms-auth";
import { DEFAULT_SITE_PRESENTATION, normalizeSitePresentation, type SitePresentation } from "@/app/lib/site-presentation";
import { encodeArticleHtml } from "@/app/lib/article-html";
import { errorResponse, getSitePresentation, updateSitePresentation } from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";

function plainText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlSection(html: string, pattern: string) {
  const match = html.match(new RegExp(`<h2[^>]*>${pattern}<\\/h2>([\\s\\S]*?)(?=<h2\\b|$)`, "i"));
  return match?.[1] ?? "";
}

function extractHtmlArticleData(html: string) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "";
  const firstParagraph = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "";
  const faqBlock = htmlSection(html, "[^<]*(?:سوالات|سؤال‌های|سوال‌های|پرسش‌های|faq)[^<]*");
  const sourceBlock = htmlSection(html, "[^<]*(?:منابع|references|sources)[^<]*");
  const faq = [...faqBlock.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => ({ question: plainText(match[1]), answer: plainText(match[2]) }))
    .filter((item) => item.question && item.answer);
  const sources = [...sourceBlock.matchAll(/<a[^>]+href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({ href: match[1].trim(), label: plainText(match[2]) }))
    .filter((item) => (item.href.startsWith("/") || item.href.startsWith("https://")) && item.label);
  return { title: plainText(h1), excerpt: plainText(firstParagraph), faq, sources };
}

function automaticSlug(value: string) {
  return value
    .toLocaleLowerCase("fa-IR")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export async function GET(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;
  try {
    const presentation = await getSitePresentation();
    return Response.json({ presentation: normalizeSitePresentation(presentation ?? DEFAULT_SITE_PRESENTATION) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;
  try {
    const presentation = await request.json() as SitePresentation;
    const preparedArticles = presentation.articles.map((article) => {
      const extracted = article.contentMode === "html"
        ? extractHtmlArticleData(article.htmlContent ?? "")
        : { title: "", excerpt: "", faq: [], sources: [] };
      return {
      ...article,
      title: article.title.trim() || extracted.title,
      excerpt: article.excerpt.trim() || extracted.excerpt.slice(0, 220),
      lead: article.lead.trim() || extracted.excerpt,
      sources: (article.sources?.length ? article.sources : extracted.sources).filter((source) => source.label.trim() && source.href.trim()),
      faq: (article.faq?.length ? article.faq : extracted.faq).filter((item) => item.question.trim() && item.answer.trim()),
      relatedProducts: (article.relatedProducts ?? []).filter(Boolean),
      relatedArticles: (article.relatedArticles ?? []).filter(Boolean),
      brandSlugs: (article.brandSlugs ?? []).filter(Boolean),
      cta: article.cta?.label.trim() && article.cta.href.trim() ? article.cta : undefined,
      htmlContent: undefined,
      htmlContentChunks: article.contentMode === "html"
        ? encodeArticleHtml(article.htmlContent ?? "")
        : [],
      sections: (article.sections ?? []).map((section) => ({
        ...section,
        paragraphs: (section.paragraphs ?? []).filter(Boolean),
        bullets: (section.bullets ?? []).filter(Boolean),
        links: (section.links ?? []).filter((link) => link.label.trim() && link.href.trim()),
        subsections: (section.subsections ?? []).filter((item) => item.heading.trim()),
      })),
    };
    });
    const usedSlugs = new Set<string>();
    presentation.articles = preparedArticles.map((article) => {
      const baseSlug = article.slug.trim() || automaticSlug(article.title) || "article";
      let slug = baseSlug;
      let suffix = 2;
      while (usedSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`;
      usedSlugs.add(slug);
      return { ...article, slug };
    });
    const published = presentation.articles.filter((article) => article.status !== "draft");
    const invalid = published.find((article) => !article.title?.trim() || !article.slug?.trim() || !article.excerpt?.trim());
    if (invalid) {
      return Response.json(
        { error: "برای انتشار مقاله، عنوان، نامک و خلاصه کارت باید کامل باشد." },
        { status: 400 },
      );
    }
    const emptyBody = published.find((article) => article.contentMode === "html"
      ? !(article.htmlContentChunks?.length)
      : !(article.sections?.some((section) => section.heading.trim() && section.paragraphs.some(Boolean))));
    if (emptyBody) {
      return Response.json({ error: "بدنه مقاله منتشرشده نباید خالی باشد." }, { status: 400 });
    }
    const slugs = published.map((article) => article.slug.trim());
    if (new Set(slugs).size !== slugs.length) {
      return Response.json({ error: "نامک مقاله‌ها باید یکتا باشد." }, { status: 400 });
    }
    const saved = await updateSitePresentation(presentation);
    revalidateTag("site-presentation", "max");
    revalidatePath("/", "layout");
    revalidatePath("/magazine");
    revalidatePath("/magazine/[slug]", "page");
    revalidatePath("/brands/[slug]", "page");
    revalidatePath("/sitemap.xml");
    return Response.json({ presentation: normalizeSitePresentation(saved) });
  } catch (error) {
    return errorResponse(error);
  }
}
