import { revalidatePath } from "next/cache";
import { cmsApiGuard } from "@/app/lib/cms-auth";
import { DEFAULT_SITE_PRESENTATION, normalizeSitePresentation, type SitePresentation } from "@/app/lib/site-presentation";
import { encodeArticleHtml } from "@/app/lib/article-html";
import { errorResponse, getSitePresentation, updateSitePresentation } from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";

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
    presentation.articles = presentation.articles.map((article) => ({
      ...article,
      sources: (article.sources ?? []).filter((source) => source.label.trim() && source.href.trim()),
      faq: (article.faq ?? []).filter((item) => item.question.trim() && item.answer.trim()),
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
    }));
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
