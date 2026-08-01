import { cmsApiGuard } from "@/app/lib/cms-auth";
import { parseProductInput } from "@/app/lib/cms-input";
import {
  createProduct,
  errorResponse,
  listProducts,
} from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    return Response.json(
      await listProducts({
        page: Number(url.searchParams.get("page") ?? 1),
        perPage: Number(url.searchParams.get("perPage") ?? 30),
        search: url.searchParams.get("search") ?? "",
        status: url.searchParams.get("status") ?? "all",
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    const product = await createProduct(parseProductInput(await request.json()));
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
