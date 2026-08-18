const PRODUCT_ROOT = "/images/products/";
const CUTOUT_ROOT = "/images/products/cutouts/";
const DRIVE_PRODUCT_ROOT = "/images/drive/product-";
const TOP_AGE_PRO_SOURCE = "/images/products/sourced/mesolike-top-age-pro.webp";
const TOP_AGE_PRO_CUTOUT = "/images/products/cutouts/sourced/mesolike-top-age-pro.webp";
const TOP_AGE_PRO_CLEAN_CUTOUT = "/images/products/cutouts/sourced/mesolike-top-age-pro-clean.svg";

// Master Spec Rule_02: Fusion foreground assets must always resolve to the
// normalized transparent cutout. This also covers WooCommerce-hosted copies of
// the same filename so a stale Featured Image cannot reintroduce a baked-in
// background on cards or PDPs while the CMS media library is being cleaned up.
const MASTER_SPEC_CUTOUT_FILENAMES = new Set([
  "f-mesomatrix.webp",
  "fusion-f-radiance.webp",
  "fusion-lift-face.webp",
  "fusion-melaclear.webp",
  "f-vitamin-c.webp",
  "f-melirutin.webp",
  "f-eye-contour.webp",
  "f-hair.webp",
  "fusion-hair-men.webp",
]);

function withoutQuery(src: string): string {
  return src.split("?", 1)[0];
}

function filenameFromSrc(src: string): string {
  const cleanSrc = withoutQuery(src);

  try {
    const pathname = cleanSrc.startsWith("http://") || cleanSrc.startsWith("https://")
      ? new URL(cleanSrc).pathname
      : cleanSrc;
    return decodeURIComponent(pathname.split("/").pop() ?? "");
  } catch {
    return cleanSrc.split("/").pop() ?? "";
  }
}

function resolveMasterSpecCutout(src: string): string | null {
  const filename = filenameFromSrc(src);
  return MASTER_SPEC_CUTOUT_FILENAMES.has(filename)
    ? `${CUTOUT_ROOT}sourced/${filename}`
    : null;
}

/** Resolve an approved local product photograph to its normalized alpha cutout. */
export function getProductCutoutSrc(src?: string | null): string {
  if (!src) return "";

  const cleanSrc = withoutQuery(src);
  const masterSpecCutout = resolveMasterSpecCutout(cleanSrc);
  if (masterSpecCutout) {
    return masterSpecCutout;
  }

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
    return filename ? `${CUTOUT_ROOT}drive/${filename}` : cleanSrc;
  }

  return cleanSrc;
}

export function hasLocalProductCutout(src?: string | null): boolean {
  if (!src) return false;
  const cleanSrc = withoutQuery(src);
  return (
    Boolean(resolveMasterSpecCutout(cleanSrc)) ||
    cleanSrc.startsWith(CUTOUT_ROOT) ||
    (cleanSrc.startsWith(PRODUCT_ROOT) &&
      !cleanSrc.startsWith(`${PRODUCT_ROOT}editorial/`)) ||
    cleanSrc.startsWith(DRIVE_PRODUCT_ROOT)
  );
}
