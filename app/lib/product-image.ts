const PRODUCT_ROOT = "/images/products/";
const CUTOUT_ROOT = "/images/products/cutouts/";
const DRIVE_PRODUCT_ROOT = "/images/drive/product-";
const TOP_AGE_PRO_SOURCE = "/images/products/sourced/mesolike-top-age-pro.webp";
const TOP_AGE_PRO_CUTOUT = "/images/products/cutouts/sourced/mesolike-top-age-pro.webp";
const TOP_AGE_PRO_CLEAN_CUTOUT = "/images/products/cutouts/sourced/mesolike-top-age-pro-clean.svg";

/** Resolve an approved local product photograph to its normalized alpha cutout. */
export function getProductCutoutSrc(src?: string | null): string {
  if (!src) return "";

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
