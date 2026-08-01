import { cmsApiGuard } from "@/app/lib/cms-auth";
import { errorResponse, uploadMedia, WooCommerceError } from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new WooCommerceError("فایل تصویر ارسال نشده است.", 400, "missing_file");
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new WooCommerceError("فرمت تصویر مجاز نیست.", 415, "invalid_image_type");
    }
    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      throw new WooCommerceError("حجم هر تصویر باید کمتر از ۱۰ مگابایت باشد.", 413, "image_too_large");
    }

    const image = await uploadMedia(file, String(form.get("alt") ?? ""));
    return Response.json({ image }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
