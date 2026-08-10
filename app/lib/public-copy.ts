const persianCharacters = /[\u0600-\u06ff]/u;
const latinCharacters = /[a-z]/iu;

export function getEnglishBrandLabel(value: string): string {
  return value
    .split("/")
    .map((part) => part.trim())
    .filter(
      (part) =>
        latinCharacters.test(part) &&
        !persianCharacters.test(part),
    )
    .join(" / ");
}

export function toPublicCopy(value: string): string {
  return value
    .replace(/\bMasoon\s+Darou\b/giu, "تولیدکننده")
    .replace(/(?:شرکت\s+داروسازی\s+)?(?:مصون|مسون)[\s‌-]*دارو/gu, "تولیدکننده")
    .replace(/\bWooCommerce\b/giu, "سامانه فروش")
    .replace(/\bCMS\b/giu, "سامانه فروش")
    .replace(/ووکامرس/gu, "سامانه فروش")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function getPublicSourceUrl(value: string): string {
  return /masoon[\s-]*darou/iu.test(value) ? "" : value;
}
