import { revalidatePath, revalidateTag } from "next/cache";
import { cmsApiGuard } from "@/app/lib/cms-auth";
import { sendMarketPriceAlerts } from "@/app/lib/market-price-alerts";
import { STOREFRONT_CATALOG_TAG } from "@/app/lib/storefront-catalog";
import {
  approveMarketProposal,
  getMarketPricingDashboard,
  listNewMarketPricingProposalAlerts,
  rejectMarketProposal,
  runMarketPricingScan,
  saveMarketSources,
} from "@/app/lib/market-pricing";
import {
  errorResponse,
  getProduct,
  updateProduct,
  WooCommerceError,
} from "@/app/lib/woocommerce";
import { rememberStorefrontProduct } from "@/app/lib/storefront-product-snapshots";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function productId(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new WooCommerceError(
      "شناسه محصول معتبر نیست.",
      400,
      "invalid_product_id",
    );
  }
  return parsed;
}

function priceValue(value: unknown, label: string): string {
  if (value === null || value === undefined || value === "") return "";

  const normalized = String(value).replace(/[\s,،]/g, "").trim();
  if (!normalized) return "";

  if (!/^\d+$/.test(normalized)) {
    throw new WooCommerceError(
      `${label} باید فقط شامل عدد باشد.`,
      400,
      "invalid_manual_price",
    );
  }

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new WooCommerceError(
      `${label} معتبر نیست.`,
      400,
      "invalid_manual_price",
    );
  }

  return String(parsed);
}

function assertPricePersisted(
  product: Awaited<ReturnType<typeof getProduct>>,
  regularPrice: string,
  salePrice: string,
) {
  if (product.regularPrice !== regularPrice || product.salePrice !== salePrice) {
    throw new WooCommerceError(
      "قیمت در ووکامرس با مقدار ثبت‌شده یکسان نیست؛ ذخیره نهایی تأیید نشد.",
      502,
      "price_persistence_mismatch",
    );
  }
}

function invalidatePricePages(slug: string) {
  revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/shop");
  if (slug) revalidatePath(`/product/${slug}`);
}

async function runPricingScanWithAlerts(mode: "review" | "initial-apply" = "review") {
  const summary = await runMarketPricingScan(mode);
  const alerts = await listNewMarketPricingProposalAlerts(summary.startedAt);
  const deliveries = await sendMarketPriceAlerts(alerts);
  return { summary, deliveries };
}

export async function GET(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;
  try {
    return Response.json(await getMarketPricingDashboard());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as {
      action?: string;
      productId?: unknown;
      proposalId?: unknown;
      sources?: unknown;
      regularPrice?: unknown;
      salePrice?: unknown;
    };

    if (body.action === "run") {
      return Response.json(await runPricingScanWithAlerts());
    }
    if (body.action === "initial-apply") {
      return Response.json(await runPricingScanWithAlerts("initial-apply"));
    }

    const id = productId(body.productId);

    if (body.action === "save-price") {
      const current = await getProduct(id);
      const regularPrice = priceValue(body.regularPrice, "قیمت عادی");
      const salePrice = priceValue(body.salePrice, "قیمت فروش ویژه");

      const product = await updateProduct(id, {
        name: current.name,
        slug: current.slug,
        sku: current.sku,
        status: current.status,
        catalogVisibility: current.catalogVisibility,
        featured: current.featured,
        description: current.description,
        shortDescription: current.shortDescription,
        seoTitle: current.seoTitle,
        metaDescription: current.metaDescription,
        focusKeyword: current.focusKeyword,
        sourceName: current.sourceName,
        sourceUrl: current.sourceUrl,
        reviewerName: current.reviewerName,
        reviewerRole: current.reviewerRole,
        reviewedAt: current.reviewedAt,
        regularPrice,
        salePrice,
        manageStock: current.manageStock,
        stockQuantity: current.stockQuantity,
        stockStatus: current.stockStatus,
        categoryIds: current.categories.map((category) => category.id),
        images: current.images,
        expectedModifiedGmt: current.dateModifiedGmt || undefined,
      });

      // Never report success unless WooCommerce itself returned the exact values requested.
      assertPricePersisted(product, regularPrice, salePrice);

      // The public site can keep serving this confirmed value if WooCommerce
      // later becomes slow or unavailable for reads.
      await rememberStorefrontProduct(product, { requirePersistence: true });

      // Invalidate both the tagged catalog and route-level caches so the new price is visible immediately.
      invalidatePricePages(product.slug || current.slug);

      return Response.json({ product });
    }

    if (body.action === "save-sources") {
      return Response.json({ product: await saveMarketSources(id, body.sources) });
    }

    if (typeof body.proposalId !== "string" || !body.proposalId) {
      throw new WooCommerceError(
        "شناسه پیشنهاد معتبر نیست.",
        400,
        "invalid_market_proposal",
      );
    }

    if (body.action === "approve") {
      return Response.json({
        product: await approveMarketProposal(id, body.proposalId),
      });
    }
    if (body.action === "reject") {
      return Response.json({
        product: await rejectMarketProposal(id, body.proposalId),
      });
    }

    throw new WooCommerceError(
      "عملیات قیمت‌گذاری شناخته‌شده نیست.",
      400,
      "invalid_market_action",
    );
  } catch (error) {
    return errorResponse(error);
  }
}
