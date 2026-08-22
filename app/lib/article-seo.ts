export type ArticleSeoCheck = {
  id: string;
  label: string;
  detail: string;
  state: "pass" | "warning";
};

export type ArticleSeoInput = {
  title: string;
  metaDescription?: string;
  excerpt?: string;
  html: string;
  image?: string;
  imageAlt?: string;
};

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function countMatches(value: string, expression: RegExp) {
  return [...value.matchAll(expression)].length;
}

function articleLinks(html: string) {
  return [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function imagesWithoutAlt(html: string) {
  return [...html.matchAll(/<img\b([^>]*)>/gi)].filter((match) => {
    const alt = match[1].match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1]?.trim();
    return !alt;
  }).length;
}

/**
 * A small, dependency-free editorial lint that runs in the browser as the
 * editor writes. It deliberately guides rather than blocks publishing: an
 * editor can still publish a time-sensitive article after making an informed
 * decision.
 */
export function analyzeArticleSeo(input: ArticleSeoInput): ArticleSeoCheck[] {
  const html = input.html ?? "";
  const bodyText = stripHtml(html);
  const titleLength = input.title.trim().length;
  const description = (input.metaDescription?.trim() || input.excerpt?.trim() || "");
  const descriptionLength = description.length;
  const h2Count = countMatches(html, /<h2\b/gi);
  const firstH2 = html.search(/<h2\b/i);
  const firstH3 = html.search(/<h3\b/i);
  const links = articleLinks(html);
  const internalLinkCount = links.filter((href) =>
    href.startsWith("/") || /^https:\/\/(?:www\.)?sepiidbeauty\.ir(?:\/|$)/i.test(href),
  ).length;
  const sourceLinkCount = links.filter((href) =>
    /^https:\/\//i.test(href) && !/^https:\/\/(?:www\.)?sepiidbeauty\.ir(?:\/|$)/i.test(href),
  ).length;
  const unsafeClaims = ["درمان قطعی", "بدون عارضه", "تضمین نتیجه", "مناسب برای همه", "بهترین محصول برای"];
  const unsafeClaim = unsafeClaims.find((claim) => bodyText.includes(claim));

  return [
    {
      id: "title",
      label: "عنوان سئو",
      detail: titleLength >= 30 && titleLength <= 70
        ? `${titleLength} نویسه؛ در بازهٔ مناسب است.`
        : `${titleLength} نویسه؛ بهتر است بین ۳۰ تا ۷۰ نویسه باشد.`,
      state: titleLength >= 30 && titleLength <= 70 ? "pass" : "warning",
    },
    {
      id: "description",
      label: "توضیح متا / خلاصه کارت",
      detail: descriptionLength >= 70 && descriptionLength <= 170
        ? `${descriptionLength} نویسه؛ برای نتیجهٔ جست‌وجو مناسب است.`
        : `${descriptionLength} نویسه؛ بهتر است بین ۷۰ تا ۱۷۰ نویسه باشد.`,
      state: descriptionLength >= 70 && descriptionLength <= 170 ? "pass" : "warning",
    },
    {
      id: "body",
      label: "عمق محتوا",
      detail: bodyText.split(/\s+/u).filter(Boolean).length >= 350
        ? "بدنهٔ مقاله برای یک صفحهٔ مستقل، عمق اولیهٔ مناسبی دارد."
        : "بدنه هنوز کوتاه است؛ برای موضوعات رقابتی، توضیح واقعی و کاربردی اضافه کن.",
      state: bodyText.split(/\s+/u).filter(Boolean).length >= 350 ? "pass" : "warning",
    },
    {
      id: "headings",
      label: "ساختار تیترها",
      detail: h2Count >= 2 && !(firstH3 >= 0 && (firstH2 < 0 || firstH3 < firstH2))
        ? `${h2Count} تیتر H2 با ترتیب درست ثبت شده است.`
        : "حداقل دو H2 اضافه کن و H3 را فقط زیر یک H2 بیاور.",
      state: h2Count >= 2 && !(firstH3 >= 0 && (firstH2 < 0 || firstH3 < firstH2)) ? "pass" : "warning",
    },
    {
      id: "links",
      label: "لینک‌سازی داخلی",
      detail: internalLinkCount >= 3
        ? `${internalLinkCount} لینک داخلی مرتبط دارد.`
        : `${internalLinkCount} لینک داخلی دارد؛ هدف این صفحه حداقل ۳ لینک زمینه‌ای است.`,
      state: internalLinkCount >= 3 ? "pass" : "warning",
    },
    {
      id: "sources",
      label: "منبع قابل بررسی",
      detail: sourceLinkCount >= 1
        ? `${sourceLinkCount} منبع HTTPS خارجی دارد.`
        : "برای ادعاهای آموزشی، دست‌کم یک منبع رسمی یا علمی HTTPS اضافه کن.",
      state: sourceLinkCount >= 1 ? "pass" : "warning",
    },
    {
      id: "images",
      label: "تصویر و ALT",
      detail: input.image?.trim() && input.imageAlt?.trim() && imagesWithoutAlt(html) === 0
        ? "تصویر شاخص و ALT تصاویر کامل است."
        : "برای تصویر شاخص و هر تصویر داخل متن، ALT توصیفی وارد کن.",
      state: input.image?.trim() && input.imageAlt?.trim() && imagesWithoutAlt(html) === 0 ? "pass" : "warning",
    },
    {
      id: "claims",
      label: "لحن ایمن و قابل اتکا",
      detail: unsafeClaim
        ? `عبارت «${unsafeClaim}» ادعای قطعی به نظر می‌رسد؛ بازنویسی‌اش کن.`
        : "ادعای قطعیِ شناخته‌شده‌ای در متن دیده نشد.",
      state: unsafeClaim ? "warning" : "pass",
    },
  ];
}
