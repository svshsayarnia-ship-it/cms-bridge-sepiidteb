const PRODUCT_ROOT = "/images/products/";
const CUTOUT_ROOT = "/images/products/cutouts/";
const SOURCED_CUTOUT_ROOT = `${CUTOUT_ROOT}sourced/`;
const DRIVE_PRODUCT_ROOT = "/images/drive/product-";
const TOP_AGE_PRO_SOURCE = "/images/products/sourced/mesolike-top-age-pro.webp";
const TOP_AGE_PRO_CUTOUT = "/images/products/cutouts/sourced/mesolike-top-age-pro.webp";
const TOP_AGE_PRO_CLEAN_CUTOUT = "/images/products/cutouts/sourced/mesolike-top-age-pro-clean.svg";

/**
 * Known source/editorial filenames that already have an approved transparent
 * master in `public/images/products/cutouts/sourced`. Keeping the mapping here
 * prevents a baked editorial background from becoming the foreground inside
 * ProductVisual while preserving the category stage, scale and frame.
 */
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

function resolveMasterSpecCutout(src: string) {
  const target = MASTER_SPEC_CUTOUT_ALIASES.get(filenameFromSrc(src));
  return target ? `${SOURCED_CUTOUT_ROOT}${target}` : null;
}

/** Resolve an approved local product photograph to its normalized alpha cutout. */
export function getProductCutoutSrc(src?: string | null): string {
  if (!src) return "";

  if (src === TOP_AGE_PRO_SOURCE || src === TOP_AGE_PRO_CUTOUT) {
    return TOP_AGE_PRO_CLEAN_CUTOUT;
  }

  const masterSpecCutout = resolveMasterSpecCutout(src);
  if (masterSpecCutout) return masterSpecCutout;

  if (src.startsWith(CUTOUT_ROOT)) return src;

  if (
    src.startsWith(PRODUCT_ROOT) &&
    !src.startsWith(`${PRODUCT_ROOT}editorial/`)
  ) {
    const relative = src
      .slice(PRODUCT_ROOT.length)
      .replace(/\.(?:png|jpe?g|webp)$/iu, ".webp");
    return `${CUTOUT_ROOT}${relative}`;
  }

  if (src.startsWith(DRIVE_PRODUCT_ROOT)) {
    const filename = src
      .split("/")
      .pop()
      ?.replace(/\.(?:png|jpe?g|webp)$/iu, ".webp");
    return filename ? `${CUTOUT_ROOT}drive/${filename}` : src;
  }

  return src;
}

export function hasLocalProductCutout(src?: string | null): boolean {
  if (!src) return false;
  return (
    Boolean(resolveMasterSpecCutout(src)) ||
    src.startsWith(CUTOUT_ROOT) ||
    (src.startsWith(PRODUCT_ROOT) &&
      !src.startsWith(`${PRODUCT_ROOT}editorial/`)) ||
    src.startsWith(DRIVE_PRODUCT_ROOT)
  );
}
