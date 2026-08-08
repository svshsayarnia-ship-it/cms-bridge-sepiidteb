import { revalidatePath } from "next/cache";
import { cmsApiGuard } from "@/app/lib/cms-auth";
import { DEFAULT_SITE_PRESENTATION, type SitePresentation } from "@/app/lib/site-presentation";
import { errorResponse, getSitePresentation, updateSitePresentation } from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;
  try {
    const presentation = await getSitePresentation();
    return Response.json({ presentation: presentation ?? DEFAULT_SITE_PRESENTATION });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;
  try {
    const presentation = await request.json() as SitePresentation;
    const saved = await updateSitePresentation(presentation);
    revalidatePath("/", "layout");
    return Response.json({ presentation: saved });
  } catch (error) {
    return errorResponse(error);
  }
}
