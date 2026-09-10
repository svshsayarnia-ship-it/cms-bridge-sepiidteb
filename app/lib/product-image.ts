const PRODUCT_ROOT = "/images/products/";
const CUTOUT_ROOT = "/images/products/cutouts/";
const SOURCED_CUTOUT_ROOT = `${CUTOUT_ROOT}sourced/`;
const DRIVE_PRODUCT_ROOT = "/images/drive/product-";
const TOP_AGE_PRO_SOURCE = "/images/products/sourced/mesolike-top-age-pro.webp";
const TOP_AGE_PRO_CUTOUT = "/images/products/cutouts/sourced/mesolike-top-age-pro.webp";
const TOP_AGE_PRO_CLEAN_CUTOUT = "/images/products/cutouts/sourced/mesolike-top-age-pro-clean.svg";

/**
 * Checked-in cutouts are migration fallbacks only. When the CMS/WooCommerce
 * product supplies an explicit remote image, that image is authoritative and
 * must be allowed to reach ProductVisual.
 */
const PRODUCT_SLUG_CUTOUT_ALIASES = new Map<string, string>([
  ["fusion-f-mesomatrix", "f-mesomatrix.webp"],
  ["fusion-f-lift-face", "fusion-lift-face.webp"],
  ["fusion-f-radiance", "fusion-f-radiance.webp"],
  ["fusion-f-melaclear", "fusion-melaclear.webp"],
  ["fusion-f-vitamin-c", "f-vitamin-c.webp"],
  ["fusion-f-melirutin", "f-melirutin.webp"],
  ["fusion-f-eye-contour", "f-eye-contour.webp"],
  ["fusion-f-hair", "f-hair.webp"],
  ["fusion-f-hair-men", "fusion-hair-men.webp"],
]);

const MASTER_SPEC_CUTOUT_ALIASES = new Map<string, string>([
  ["f-mesomatrix.webp", "f-mesomatrix.webp"],
  ["fusion-f-mesomatrix.webp", "f-mesomatrix.webp"],
  ["fusion-lift-face.webp", "fusion-lift-face.webp"],
  ["fusion-f-lift-face.webp", "fusion-lift-face.webp"],
  ["fusion-f-radiance.webp", "fusion-f-radiance.webp"],
  ["fusion-melaclear.webp", "fusion-melaclear.webp"],
  ["fusion-f-melaclear.webp", "fusion-melaclear.webp"],
  ["f-vitamin-c.webp", "f-vitamin-c.webp"],
  ["fusion-f-vitamin-c.webp", "f-vitamin-c.webp"],
  ["f-melirutin.webp", "f-melirutin.webp"],
  ["fusion-f-melirutin.webp", "f-melirutin.webp"],
  ["f-eye-contour.webp", "f-eye-contour.webp"],
  ["fusion-f-eye-contour.webp", "f-eye-contour.webp"],
  ["f-hair.webp", "f-hair.webp"],
  ["fusion-f-hair.webp", "f-hair.webp"],
  ["fusion-hair-men.webp", "fusion-hair-men.webp"],
  ["fusion-f-hair-men.webp", "fusion-hair-men.webp"],
]);

function filenameFromSrc(src: string) {
  const pathOnly = src.split(/[?#]/u, 1)[0] ?? src;
  const filename = pathOnly.split("/").pop();

  if (!filename) return "";

  try {
    return decodeURIComponent(filename).toLowerCase();
  } catch {
    return filename.toLowerCase();
  }
}

function resolveProductSlugCutout(slug?: string | null) {
  const normalizedSlug = slug?.trim().toLowerCase();
  if (!normalizedSlug) return null;

  const target = PRODUCT_SLUG_CUTOUT_ALIASES.get(normalizedSlug);
  return target ? `${SOURCED_CUTOUT_ROOT}${target}` : null;
}

function resolveMasterSpecCutout(src: string) {
  const target = MASTER_SPEC_CUTOUT_ALIASES.get(filenameFromSrc(src));
  return target ? `${SOURCED_CUTOUT_ROOT}${target}` : null;
}

function isRemoteImage(src: string) {
  return /^(?:https?:)?\/\//iu.test(src.trim());
}

/**
 * Resolve the product image used by ProductVisual.
 *
 * CMS/WooCommerce media is the source of truth whenever an explicit remote
 * image exists. Local transparent cutouts remain as safe migration fallbacks
 * for products that have not yet received a CMS image.
 */
export function getProductCutoutSrc(
  src?: string | null,
  productSlug?: string | null,
): string {
  const cleanSrc = src?.trim() ?? "";

  // ProductVisual renders remote media with a native <img>, so allowing the
  // CMS URL here does not depend on Next/Image remotePatterns.
  if (cleanSrc && isRemoteImage(cleanSrc)) return cleanSrc;

  if (cleanSrc) {
    const masterSpecCutout = resolveMasterSpecCutout(cleanSrc);
    if (masterSpecCutout) return masterSpecCutout;

    if (cleanSrc === TOP_AGE_PRO_SOURCE || cleanSrc === TOP_AGE_PRO_CUTOUT) {
      return TOP_AGE_PRO_CLEAN_CUTOUT;
    }

    if (cleanSrc.startsWith(CUTOUT_ROOT)) return cleanSrc;

    if (
      cleanSrc.startsWith(PRODUCT_ROOT) &&
      !cleanSrc.startsWith(`${PRODUCT_ROOT}editorial/`)
    ) {
      const relative = cleanSrc
        .slice(PRODUCT_ROOT.length)
        .replace(/\.(?:png|jpe?g|webp)$/iu, ".webp");
      return `${CUTOUT_ROOT}${relative}`;
    }

    if (cleanSrc.startsWith(DRIVE_PRODUCT_ROOT)) {
      const filename = cleanSrc
        .split("/")
        .pop()
        ?.replace(/\.(?:png|jpe?g|webp)$/iu, ".webp");
      return filename ? `${CUTOUT_ROOT}drive/${filename}` : "";
    }
  }

  // A checked-in slug cutout is only a fallback. It must never override an
  // image that the editor explicitly selected in the CMS.
  return resolveProductSlugCutout(productSlug) ?? "";
}

export function hasLocalProductCutout(
  src?: string | null,
  productSlug?: string | null,
): boolean {
  const resolved = getProductCutoutSrc(src, productSlug);
  return Boolean(resolved && !isRemoteImage(resolved));
}
