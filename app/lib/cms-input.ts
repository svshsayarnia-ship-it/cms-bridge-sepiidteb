import type { CmsImage, CmsProductInput } from "./cms-types";
import { WooCommerceError } from "./woocommerce";

const STATUSES = ["draft", "pending", "private", "publish"] as const;
const VISIBILITIES = ["visible", "catalog", "search", "hidden"] as const;
const STOCK_STATUSES = ["instock", "outofstock", "onbackorder"] as const;
const ALLOWED_RICH_TEXT_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "a",
]);

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeRichText(value: unknown): string {
  let html = text(value)
    .replace(/\0/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();

  html = html.replace(
    /<(script|style|iframe|object|embed|form|svg|math)[^>]*>[\s\S]*?<\/\1\s*>/gi,
    "",
  );

  html = html.replace(
    /<(script|style|iframe|object|embed|form|input|button|svg|math|link|meta)[^>]*\/?>/gi,
    "",
  );

  html = html.replace(
    /<([a-z0-9-]+)\b([^>]*)>/gi,
    (_match, rawTag: string, rawAttributes: string) => {
      const tag = rawTag.toLowerCase();

      if (!ALLOWED_RICH_TEXT_TAGS.has(tag)) {
        return "";
      }

      if (tag === "br") {
        return "<br>";
      }

      if (tag !== "a") {
        return `<${tag}>`;
      }

      const quotedHref = rawAttributes.match(
        /\bhref\s*=\s*(["'])(.*?)\1/i,
      );

      const plainHref = rawAttributes.match(
        /\bhref\s*=\s*([^\s"'=<>`]+)/i,
      );

      const href =
        quotedHref?.[2]?.trim() ||
        plainHref?.[1]?.trim() ||
        "";

      const isSafeHref =
        /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(
          href,
        );

      if (!isSafeHref) {
        return "<a>";
      }

      return `<a href="${escapeHtmlAttribute(
        href,
      )}" rel="noopener noreferrer">`;
    },
  );

  html = html.replace(
    /<\/([a-z0-9-]+)\s*>/gi,
    (_match, rawTag: string) => {
      const tag = rawTag.toLowerCase();

      if (
        !ALLOWED_RICH_TEXT_TAGS.has(tag) ||
        tag === "br"
      ) {
        return "";
      }

      return `</${tag}>`;
    },
  );

  return html
    .replace(
      /<p>(?:\s|&nbsp;|<br>)*<\/p>/gi,
      "",
    )
    .replace(
      /(?:<br>\s*){3,}/gi,
      "<br><br>",
    )
    .replace(
      /(?:\s*<p>\s*<\/p>\s*)+/gi,
      "",
    )
    .trim();
}
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function oneOf<T extends readonly string[]>(
  value: unknown,
  values: T,
  fallback: T[number],
): T[number] {
  return typeof value === "string" && values.includes(value)
    ? (value as T[number])
    : fallback;
}

function images(value: unknown): CmsImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const image = item as Record<string, unknown>;
      const src = text(image.src).trim();
      const id = Number(image.id ?? 0);
      if (!src && id <= 0) return null;
      return {
        id: Number.isSafeInteger(id) && id > 0 ? id : 0,
        src,
        name: text(image.name),
        alt: text(image.alt),
      };
    })
    .filter((image): image is CmsImage => image !== null);
}

export function parseProductInput(value: unknown): CmsProductInput {
  if (!value || typeof value !== "object") {
    throw new WooCommerceError("اطلاعات محصول معتبر نیست.", 400, "invalid_product");
  }

  const input = value as Record<string, unknown>;
  const name = text(input.name).trim();
  if (!name) {
    throw new WooCommerceError("نام محصول الزامی است.", 400, "missing_name");
  }

  const categoryIds = Array.isArray(input.categoryIds)
    ? input.categoryIds
        .map(Number)
        .filter((id) => Number.isSafeInteger(id) && id > 0)
    : [];
  const stockQuantity =
    input.stockQuantity === null || input.stockQuantity === ""
      ? null
      : Number(input.stockQuantity);

  return {
    name,
    slug: text(input.slug),
    sku: text(input.sku),
    status: oneOf(input.status, STATUSES, "draft"),
    catalogVisibility: oneOf(input.catalogVisibility, VISIBILITIES, "visible"),
    featured: input.featured === true,
    description: normalizeRichText(
  input.description,
),
shortDescription: normalizeRichText(
  input.shortDescription,
),
    seoTitle: text(input.seoTitle).trim(),
metaDescription: text(input.metaDescription).trim(),
focusKeyword: text(input.focusKeyword).trim(),

sourceName: text(input.sourceName).trim(),
sourceUrl: text(input.sourceUrl).trim(),

reviewerName: text(input.reviewerName).trim(),
reviewerRole: text(input.reviewerRole).trim(),
reviewedAt: text(input.reviewedAt).trim(),
    regularPrice: text(input.regularPrice),
    salePrice: text(input.salePrice),
    manageStock: input.manageStock === true,
    stockQuantity:
      stockQuantity !== null && Number.isFinite(stockQuantity)
        ? Math.max(0, Math.trunc(stockQuantity))
        : null,
    stockStatus: oneOf(input.stockStatus, STOCK_STATUSES, "instock"),
    categoryIds: Array.from(new Set(categoryIds)),
    images: images(input.images),
    expectedModifiedGmt: text(input.expectedModifiedGmt) || undefined,
  };
}
