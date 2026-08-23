const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
const volumePattern =
  /(\d+(?:[.,]\d+)?)\s*(?:میلی[‌\s-]?لیتر(?:ی)?|ml|m\.l\.?|سی[‌\s-]?سی|cc)/giu;

function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/٫/g, ".");
}

/**
 * Returns true when a stated product, vial, syringe, or package volume is
 * above 2 mL. A 10 × 1 mL option is included only when its own variant label
 * explicitly states the 10 mL package total.
 */
export function hasVolumeAboveTwoMl(volume?: string | null): boolean {
  if (!volume) return false;

  const normalized = normalizeDigits(volume);

  return Array.from(normalized.matchAll(volumePattern)).some((match) => {
    const numericValue = Number(match[1].replace(",", "."));
    return Number.isFinite(numericValue) && numericValue > 2;
  });
}

export function isHighVolumeFiller(product: {
  category: string;
  volume?: string | null;
  variantVolumes?: Array<string | null | undefined>;
}): boolean {
  if (product.category !== "fillers") return false;

  return [product.volume, ...(product.variantVolumes ?? [])].some(
    hasVolumeAboveTwoMl,
  );
}
