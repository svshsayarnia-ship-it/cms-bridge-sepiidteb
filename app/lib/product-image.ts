const PRODUCT_ROOT = "/images/products/";
const CUTOUT_ROOT = "/images/products/cutouts/";
const DRIVE_PRODUCT_ROOT = "/images/drive/product-";

/** Resolve an approved local product photograph to its normalized alpha cutout. */
export function getProductCutoutSrc(src?: string | null): string {
  if (!src) return "";
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
