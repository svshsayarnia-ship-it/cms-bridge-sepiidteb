import { cmsApiGuard } from "@/app/lib/cms-auth";
import {
  getMarketPriceAlertConfigStatus,
  updateMarketPriceAlertConfig,
  type MarketPriceAlertConfigInput,
} from "@/app/lib/market-price-alert-config";
import { errorResponse } from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;
  try {
    return Response.json(await getMarketPriceAlertConfigStatus());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as MarketPriceAlertConfigInput;
    return Response.json(await updateMarketPriceAlertConfig(body));
  } catch (error) {
    return errorResponse(error);
  }
}
