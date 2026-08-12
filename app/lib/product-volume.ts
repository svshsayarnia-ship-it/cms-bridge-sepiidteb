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
 * Returns true when a filler has at least one stated syringe or vial volume
 * above 2 mL. Package counts such as "2 syringes × 1 mL" remain 1 mL and do
 * not get promoted to the high-volume filter.
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
}): boolean {
  return product.category === "fillers" && hasVolumeAboveTwoMl(product.volume);
}
