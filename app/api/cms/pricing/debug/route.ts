import { cmsApiGuard } from "@/app/lib/cms-auth";
import { errorResponse, getProduct, updateProduct, WooCommerceError } from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function asPrice(value: unknown): string {
  const normalized = String(value ?? "").replace(/[\s,،]/g, "").trim();
  if (!/^\d+$/.test(normalized) || Number(normalized) <= 0) {
    throw new WooCommerceError("قیمت تست معتبر نیست.", 400, "invalid_debug_price");
  }
  return String(Number(normalized));
}

export async function POST(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    const body = (await request.json()) as { productId?: unknown; price?: unknown };
    const id = Number(body.productId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new WooCommerceError("شناسه محصول معتبر نیست.", 400, "invalid_product_id");
    }

    const before = await getProduct(id);
    const price = asPrice(body.price);
    const updated = await updateProduct(id, {
      name: before.name,
      slug: before.slug,
      sku: before.sku,
      status: before.status,
      catalogVisibility: before.catalogVisibility,
      featured: before.featured,
      description: before.description,
      shortDescription: before.shortDescription,
      seoTitle: before.seoTitle,
      metaDescription: before.metaDescription,
      focusKeyword: before.focusKeyword,
      sourceName: before.sourceName,
      sourceUrl: before.sourceUrl,
      reviewerName: before.reviewerName,
      reviewerRole: before.reviewerRole,
      reviewedAt: before.reviewedAt,
      regularPrice: price,
      salePrice: "",
      manageStock: before.manageStock,
      stockQuantity: before.stockQuantity,
      stockStatus: before.stockStatus,
      categoryIds: before.categories.map((category) => category.id),
      images: before.images,
      expectedModifiedGmt: before.dateModifiedGmt || undefined,
    });

    const fresh = await getProduct(id);
    return Response.json({
      before: { id, regularPrice: before.regularPrice, salePrice: before.salePrice, dateModifiedGmt: before.dateModifiedGmt },
      putResponse: { regularPrice: updated.regularPrice, salePrice: updated.salePrice, dateModifiedGmt: updated.dateModifiedGmt },
      freshGet: { regularPrice: fresh.regularPrice, salePrice: fresh.salePrice, dateModifiedGmt: fresh.dateModifiedGmt },
      requested: { regularPrice: price, salePrice: "" },
      consistent: fresh.regularPrice === price && fresh.salePrice === "",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
