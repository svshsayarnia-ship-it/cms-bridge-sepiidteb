import { cmsApiGuard } from "@/app/lib/cms-auth";
import { errorResponse, updateCustomer } from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const customerId = Number(id);
    if (!Number.isSafeInteger(customerId) || customerId <= 0) {
      return Response.json({ error: "شناسه مشتری معتبر نیست." }, { status: 400 });
    }
    return Response.json({ customer: await updateCustomer(customerId, await request.json()) });
  } catch (error) {
    return errorResponse(error);
  }
}
