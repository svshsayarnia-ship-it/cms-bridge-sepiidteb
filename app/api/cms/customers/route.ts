import { cmsApiGuard } from "@/app/lib/cms-auth";
import { errorResponse, listCustomers } from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    return Response.json(await listCustomers({
      page: Number(url.searchParams.get("page") ?? 1),
      perPage: Number(url.searchParams.get("perPage") ?? 30),
      search: url.searchParams.get("search") ?? "",
    }));
  } catch (error) {
    return errorResponse(error);
  }
}
