import { cmsApiGuard } from "@/app/lib/cms-auth";
import { connectionStatus, errorResponse } from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    return Response.json(await connectionStatus());
  } catch (error) {
    return errorResponse(error);
  }
}
