import type { CmsImage } from "./cms-types";

/**
 * Public storefront media is always served by Sepiid itself. The CMS may
 * store the attachment in WordPress, but that origin URL must never leak into
 * browser HTML, client payloads, carts, metadata, or image requests.
 */
export function cmsMediaSrc(id: number): string {
  return `/api/cms/public-media?id=${encodeURIComponent(String(id))}&cutout=3`;
}

export function isCmsMediaSrc(value?: string | null): boolean {
  const source = value?.trim();
  if (!source) return false;
  try {
    const url = new URL(source, "https://sepiidbeauty.ir");
    return ["sepiidbeauty.ir", "www.sepiidbeauty.ir", "cms.sepiidbeauty.ir"].includes(url.hostname)
      && url.pathname === "/api/cms/public-media";
  } catch {
    return false;
  }
}

export function normalizeCmsImage(image: CmsImage): CmsImage {
  return image.id > 0
    ? { ...image, src: cmsMediaSrc(image.id) }
    : image;
}

export function normalizeCmsImages(images: CmsImage[]): CmsImage[] {
  return images.map(normalizeCmsImage);
}
