import type { CmsImage, CmsProductInput } from "./cms-types";
import { WooCommerceError } from "./woocommerce";

const STATUSES = ["draft", "pending", "private", "publish"] as const;
const VISIBILITIES = ["visible", "catalog", "search", "hidden"] as const;
const STOCK_STATUSES = ["instock", "outofstock", "onbackorder"] as const;

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
    description: text(input.description),
    shortDescription: text(input.shortDescription),
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
