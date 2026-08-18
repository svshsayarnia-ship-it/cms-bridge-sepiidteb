import { cmsApiGuard } from "@/app/lib/cms-auth";
import { normalizeCmsProductImage } from "@/app/lib/product-image-normalizer";
import { errorResponse, uploadMedia, WooCommerceError } from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const correlationId = crypto.randomUUID();
  const startedAt = performance.now();
  console.info("[sepiid-media] next_request_received", {
    correlationId,
    elapsedMs: 0,
  });

  const denied = await cmsApiGuard(request);
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get("file");
    console.info("[sepiid-media] next_form_data_completed", {
      correlationId,
      fileSize: file instanceof File ? file.size : 0,
      mimeType: file instanceof File ? file.type : "unknown",
      elapsedMs: Math.round(performance.now() - startedAt),
    });
    if (!(file instanceof File)) {
      throw new WooCommerceError("فایل تصویر ارسال نشده است.", 400, "missing_file");
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new WooCommerceError("فرمت تصویر مجاز نیست.", 415, "invalid_image_type");
    }
    if (file.size <= 0) {
      throw new WooCommerceError("فایل تصویر خالی است.", 400, "empty_image");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new WooCommerceError(
        "حجم هر تصویر برای آپلود از CMS باید کمتر از ۴ مگابایت باشد. تصویر را فشرده کن و دوباره آپلود کن.",
        413,
        "image_too_large",
      );
    }

    let normalized;
    try {
      normalized = await normalizeCmsProductImage(file);
    } catch (normalizationError) {
      console.warn("[sepiid-media] normalization_failed", {
        correlationId,
        elapsedMs: Math.round(performance.now() - startedAt),
        error:
          normalizationError instanceof Error
            ? normalizationError.message
            : "unknown",
      });
      throw new WooCommerceError(
        "آماده‌سازی خودکار تصویر محصول ناموفق بود. یک تصویر واضح PNG، JPG یا WebP دوباره آپلود کن.",
        422,
        "product_image_normalization_failed",
      );
    }

    console.info("[sepiid-media] product_image_normalized", {
      correlationId,
      inputBytes: file.size,
      outputBytes: normalized.file.size,
      removedBackground: normalized.removedBackground,
      removalRatio: normalized.removalRatio,
      validatedCutout: normalized.validatedCutout,
      elapsedMs: Math.round(performance.now() - startedAt),
    });

    if (!normalized.validatedCutout) {
      throw new WooCommerceError(
        "این تصویر هنوز بک‌گراند یا صحنه‌ی پیچیده دارد و برای قرارگیری روی هویت بصری دسته مناسب نیست. یک عکس واضح از خود محصول با پس‌زمینه ساده یا فایل PNG/WebP شفاف انتخاب کن؛ CMS اجازه نمی‌دهد بک‌گراند عکس، طراحی دسته را خراب کند.",
        422,
        "product_image_background_not_isolated",
      );
    }

    const image = await uploadMedia(
      normalized.file,
      String(form.get("alt") ?? ""),
      correlationId,
    );
    return Response.json(
      {
        image,
        normalization: {
          transparentCutout: true,
          removedBackground: normalized.removedBackground,
          removalRatio: normalized.removalRatio,
          validatedCutout: normalized.validatedCutout,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
