const PRODUCT_ROOT = "/images/products/";
const CUTOUT_ROOT = "/images/products/cutouts/";
const DRIVE_PRODUCT_ROOT = "/images/drive/product-";
const TOP_AGE_PRO_SOURCE = "/images/products/sourced/mesolike-top-age-pro.webp";
const TOP_AGE_PRO_CUTOUT = "/images/products/cutouts/sourced/mesolike-top-age-pro.webp";
const TOP_AGE_PRO_CLEAN_CUTOUT = "/images/products/cutouts/sourced/mesolike-top-age-pro-clean.svg";

// Fusion Meso cartons are predominantly white. Background-removal models can
// mistake the carton face for the backdrop, leaving a faded or incomplete box.
// Keep the reviewed source photograph for these exact catalog assets. The
// presentation layer applies the white-carton treatment by matching the clean
// asset path, so the URL itself stays valid for Next/Image and browser caches.
const WHITE_CARTON_SOURCE_ASSETS = new Set([
  "/images/products/sourced/f-mesomatrix.webp",
  "/images/products/sourced/fusion-f-radiance.webp",
  "/images/products/sourced/fusion-lift-face.webp",
  "/images/products/sourced/fusion-melaclear.webp",
  "/images/products/sourced/f-vitamin-c.webp",
  "/images/products/sourced/f-melirutin.webp",
  "/images/products/sourced/f-eye-contour.webp",
  "/images/products/sourced/f-hair.webp",
  "/images/products/sourced/fusion-hair-men.webp",
]);

function withoutQuery(src: string): string {
  return src.split("?", 1)[0];
}

function resolveWhiteCartonSource(src: string): string | null {
  const cleanSrc = withoutQuery(src);

  if (WHITE_CARTON_SOURCE_ASSETS.has(cleanSrc)) {
    return cleanSrc;
  }

  if (cleanSrc.startsWith(CUTOUT_ROOT)) {
    const sourceCandidate = `${PRODUCT_ROOT}${cleanSrc.slice(CUTOUT_ROOT.length)}`;
    if (WHITE_CARTON_SOURCE_ASSETS.has(sourceCandidate)) {
      return sourceCandidate;
    }
  }

  return null;
}

/** Resolve an approved local product photograph to its normalized alpha cutout. */
export function getProductCutoutSrc(src?: string | null): string {
  if (!src) return "";

  const whiteCartonSource = resolveWhiteCartonSource(src);
  if (whiteCartonSource) {
    return whiteCartonSource;
  }

  if (src === TOP_AGE_PRO_SOURCE || src === TOP_AGE_PRO_CUTOUT) {
    return TOP_AGE_PRO_CLEAN_CUTOUT;
  }

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
    src.startsWith(CUTOUT_ROOT) ||
    (src.startsWith(PRODUCT_ROOT) &&
      !src.startsWith(`${PRODUCT_ROOT}editorial/`)) ||
    src.startsWith(DRIVE_PRODUCT_ROOT)
  );
}
