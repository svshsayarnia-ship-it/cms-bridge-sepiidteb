import { isCmsMediaSrc } from "./cms-media";

const PRODUCT_ROOT = "/images/products/";
const CUTOUT_ROOT = "/images/products/cutouts/";
const SOURCED_CUTOUT_ROOT = `${CUTOUT_ROOT}sourced/`;
const DRIVE_PRODUCT_ROOT = "/images/drive/product-";
const TOP_AGE_PRO_SOURCE = "/images/products/sourced/mesolike-top-age-pro.webp";
const TOP_AGE_PRO_CUTOUT = "/images/products/cutouts/sourced/mesolike-top-age-pro.webp";
const TOP_AGE_PRO_CLEAN_CUTOUT = "/images/products/cutouts/sourced/mesolike-top-age-pro-clean.svg";
const REMOTE_IMAGE_CACHE_VERSION = "20260910-cms-role-only-1";
const CMS_ROLE_TOKEN = "sepiid-role-";

/**
 * Legacy cutout mappings remain checked in for migration tooling and visual
 * reference, but public ProductVisual rendering no longer consumes them. Public
 * product media is controlled exclusively by CMS role uploads.
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

// Retained for migration/reference audits. Public rendering intentionally does
// not call these legacy resolvers anymore.
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

function withRemoteImageCacheVersion(src: string) {
  const hashIndex = src.indexOf("#");
  const base = hashIndex >= 0 ? src.slice(0, hashIndex) : src;
  const hash = hashIndex >= 0 ? src.slice(hashIndex) : "";
  const separator = base.includes("?") ? "&" : "?";

  return `${base}${separator}sbv=${REMOTE_IMAGE_CACHE_VERSION}${hash}`;
}

/**
 * True only for media uploaded into a Sepiid CMS product role slot. The role
 * token is embedded in the CMS-generated file name, so arbitrary WooCommerce
 * featured/gallery images cannot pass this check.
 */
export function isCmsManagedProductImageSrc(src?: string | null): boolean {
  const cleanSrc = src?.trim() ?? "";
  return Boolean(
    cleanSrc &&
      (isCmsMediaSrc(cleanSrc) || filenameFromSrc(cleanSrc).includes(CMS_ROLE_TOKEN)),
  );
}

/**
 * Resolve the image used by every ProductVisual consumer.
 *
 * This is the final render-boundary guard: only CMS role media is accepted.
 * Legacy checked-in product cutouts and ordinary WooCommerce media return an
 * empty source. Category/background artwork is handled separately and is not
 * affected by this product-media rule.
 */
export function getProductCutoutSrc(
  src?: string | null,
  _productSlug?: string | null,
): string {
  void _productSlug;
  const cleanSrc = src?.trim() ?? "";
  if (!isCmsManagedProductImageSrc(cleanSrc)) return "";

  if (isRemoteImage(cleanSrc)) {
    return withRemoteImageCacheVersion(cleanSrc);
  }

  // A future CMS storage adapter may return a same-origin role URL. Preserve it
  // as-is; the embedded role token is the authority check.
  return cleanSrc;
}

/**
 * Resolve the approved transparent foreground paired with a catalog source.
 * The CMS role remains the authority for the product and its current media;
 * this presentation-only asset prevents a composed CMS scene from being
 * rendered as a second background inside the category stage.
 */
export function getTransparentProductCutoutSrc(
  src?: string | null,
): string {
  const cleanSrc = src?.trim() ?? "";
  if (!cleanSrc.startsWith(PRODUCT_ROOT)) return "";

  const relative = cleanSrc.slice(PRODUCT_ROOT.length);
  if (!relative || relative.includes("..")) return "";

  return `${CUTOUT_ROOT}${relative.replace(/^cutouts\\//u, "")}`;
}

export function hasLocalProductCutout(
  src?: string | null,
  productSlug?: string | null,
): boolean {
  const resolved = getProductCutoutSrc(src, productSlug);
  return Boolean(resolved && !isRemoteImage(resolved));
}

// Keep legacy symbols referenced so migration tooling can still inspect the
// approved historical mappings without granting them storefront authority.
void PRODUCT_ROOT;
void DRIVE_PRODUCT_ROOT;
void TOP_AGE_PRO_SOURCE;
void TOP_AGE_PRO_CUTOUT;
void TOP_AGE_PRO_CLEAN_CUTOUT;
void resolveProductSlugCutout;
void resolveMasterSpecCutout;
