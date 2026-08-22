import { cmsApiGuard } from "@/app/lib/cms-auth";
import { errorResponse, uploadMedia, WooCommerceError } from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * Article imagery is intentionally not sent through the product-cutout pipeline.
 * Editorial photos need to retain their composition, background, and crop.
 */
export async function POST(request: Request) {
  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const alt = String(form.get("alt") ?? "").trim();

    if (!(file instanceof File)) {
      throw new WooCommerceError("فایل تصویر ارسال نشده است.", 400, "missing_file");
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new WooCommerceError("فرمت تصویر مجاز نیست. JPG، PNG، WebP یا GIF انتخاب کن.", 415, "invalid_image_type");
    }
    if (file.size <= 0) {
      throw new WooCommerceError("فایل تصویر خالی است.", 400, "empty_image");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new WooCommerceError("حجم تصویر مقاله باید کمتر از ۴ مگابایت باشد.", 413, "image_too_large");
    }

    const image = await uploadMedia(file, alt, crypto.randomUUID());
    return Response.json({ image }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
