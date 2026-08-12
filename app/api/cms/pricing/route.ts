import { cmsApiGuard } from "@/app/lib/cms-auth";
import {
  approveMarketProposal,
  getMarketPricingDashboard,
  rejectMarketProposal,
  runMarketPricingScan,
  saveMarketSources,
} from "@/app/lib/market-pricing";
import { errorResponse, WooCommerceError } from "@/app/lib/woocommerce";

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
    };

    if (body.action === "run") {
      return Response.json({ summary: await runMarketPricingScan() });
    }
    if (body.action === "initial-apply") {
      return Response.json({
        summary: await runMarketPricingScan("initial-apply"),
      });
    }

    const id = productId(body.productId);
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
