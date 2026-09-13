import { revalidatePath, revalidateTag } from "next/cache";
import { cmsApiGuard } from "@/app/lib/cms-auth";
import {
  sendMarketPriceAlerts,
  sendMarketPriceChangeAlert,
  sendMarketPriceAlertTest,
} from "@/app/lib/market-price-alerts";
import { getMarketPricingDashboardDirect } from "@/app/lib/market-pricing-dashboard-direct";
import { quickPriceEditorId, isQuickPriceEditorId } from "@/app/lib/quick-price-id";
import { STOREFRONT_CATALOG_TAG } from "@/app/lib/storefront-catalog";
import {
  approveMarketProposal,
  listNewMarketPricingProposalAlerts,
  rejectMarketProposal,
  runMarketPricingScan,
  saveMarketSources,
  type MarketPricingProduct,
} from "@/app/lib/market-pricing";
import {
  listQuickPriceItems,
  saveQuickPrice,
  type QuickPriceItem,
} from "@/app/lib/variant-pricing";
import {
  errorResponse,
  getProduct,
  updateProductPriceFields,
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

async function resolveSyntheticQuickPriceItem(id: number): Promise<QuickPriceItem> {
  const items = await listQuickPriceItems();
  const matches = items.filter(
    (item) => item.kind !== "product" && quickPriceEditorId(item.key) === id,
  );

  if (matches.length !== 1) {
    throw new WooCommerceError(
      "این واریانت دیگر در فهرست قیمت پیدا نشد؛ صفحه را تازه‌سازی کنید.",
      409,
      "stale_quick_price_variant",
    );
  }
  return matches[0];
}

function quickItemAsMarketProduct(
  editorId: number,
  item: QuickPriceItem,
  pricing: MarketPricingProduct["pricing"],
): MarketPricingProduct {
  return {
    id: editorId,
    name: item.name,
    slug: item.slug,
    sku: item.sku,
    price: item.price,
    regularPrice: item.regularPrice,
    salePrice: item.salePrice,
    pricing,
  };
}

export async function GET(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;
  try {
    // Use a narrow WooCommerce projection for the pricing dashboard. Variant
    // rows are added by the direct dashboard adapter without changing the
    // market-scan product collection.
    return Response.json(await getMarketPricingDashboardDirect());
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
    if (body.action === "test-alert") {
      return Response.json({ deliveries: await sendMarketPriceAlertTest() });
    }

    const id = productId(body.productId);

    if (body.action === "save-price") {
      const regularPrice = priceValue(body.regularPrice, "قیمت عادی");
      const salePrice = priceValue(body.salePrice, "قیمت فروش ویژه");

      if (isQuickPriceEditorId(id)) {
        const quickItem = await resolveSyntheticQuickPriceItem(id);
        const parentId = quickItem.parentId ?? quickItem.productId;
        const currentParent = await getProduct(parentId);
        const savedItem = await saveQuickPrice({
          kind: quickItem.kind,
          productId: quickItem.productId,
          parentId: quickItem.parentId,
          variantKey: quickItem.variantKey,
          regularPrice,
          salePrice,
        });

        // Refresh the parent snapshot after the Woo/meta mutation. Catalog
        // variant values are served from their dedicated meta map, while the
        // normal storefront snapshot stays coherent for price, stock and copy.
        const refreshedParent = await getProduct(parentId);
        await rememberStorefrontProduct(refreshedParent, { requirePersistence: true });
        invalidatePricePages(savedItem.slug || currentParent.slug);

        const deliveries = await sendMarketPriceChangeAlert({
          productName: savedItem.name,
          productSlug: savedItem.slug || currentParent.slug,
          previousRegularPriceToman: Number(quickItem.regularPrice) || null,
          previousSalePriceToman: Number(quickItem.salePrice) || null,
          regularPriceToman: Number(savedItem.regularPrice) || null,
          salePriceToman: Number(savedItem.salePrice) || null,
          reason: "manual",
        });

        return Response.json({
          product: quickItemAsMarketProduct(id, savedItem, currentParent.pricing),
          deliveries,
        });
      }

      const current = await getProduct(id);
      const product = await updateProductPriceFields(id, regularPrice, salePrice);

      // Never report success unless WooCommerce itself returned the exact values requested.
      assertPricePersisted(product, regularPrice, salePrice);

      // The public site can keep serving this confirmed value if WooCommerce
      // later becomes slow or unavailable for reads.
      await rememberStorefrontProduct(product, { requirePersistence: true });

      // Invalidate both the tagged catalog and route-level caches so the new price is visible immediately.
      invalidatePricePages(product.slug || current.slug);

      const deliveries = await sendMarketPriceChangeAlert({
        productName: product.name || current.name,
        productSlug: product.slug || current.slug,
        previousRegularPriceToman: Number(current.regularPrice) || null,
        previousSalePriceToman: Number(current.salePrice) || null,
        regularPriceToman: Number(product.regularPrice) || null,
        salePriceToman: Number(product.salePrice) || null,
        reason: "manual",
      });

      return Response.json({ product, deliveries });
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
      const current = await getProduct(id);
      const product = await approveMarketProposal(id, body.proposalId);
      return Response.json({
        product,
        deliveries: await sendMarketPriceChangeAlert({
          productName: product.name || current.name,
          productSlug: product.slug || current.slug,
          previousRegularPriceToman: Number(current.regularPrice) || null,
          previousSalePriceToman: Number(current.salePrice) || null,
          regularPriceToman: Number(product.regularPrice) || null,
          salePriceToman: Number(product.salePrice) || null,
          reason: "approved-proposal",
        }),
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
