import type { CmsImage } from "./cms-types";

/**
 * Public storefront media is always served by Sepiid itself. The CMS may
 * store the attachment in WordPress, but that origin URL must never leak into
 * browser HTML, client payloads, carts, metadata, or image requests.
 */
export function cmsMediaSrc(id: number): string {
  return `/api/cms/public-media?id=${encodeURIComponent(String(id))}`;
}

export function isCmsMediaSrc(value?: string | null): boolean {
  return Boolean(value?.trim().startsWith("/api/cms/public-media"));
}

export function normalizeCmsImage(image: CmsImage): CmsImage {
  return image.id > 0
    ? { ...image, src: cmsMediaSrc(image.id) }
    : image;
}

export function normalizeCmsImages(images: CmsImage[]): CmsImage[] {
  return images.map(normalizeCmsImage);
}
