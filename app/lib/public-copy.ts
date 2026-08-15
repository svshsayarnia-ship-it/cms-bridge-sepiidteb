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

export function getCompactBrandLabel(
  value: string,
): string {
  return getEnglishBrandLabel(value)
    .split("/")[0]
    .trim();
}

export function toPublicCopy(value: string): string {
  return value
    .replace(/\bMasoon\s+Darou\b/giu, "تولیدکننده")
    .replace(/(?:شرکت\s+داروسازی\s+)?(?:مصون|مسون)[\s‌-]*دارو/gu, "تولیدکننده")
    .replace(/\bWooCommerce\b/giu, "سامانه فروش")
    .replace(/\bCMS\b/giu, "سامانه فروش")
    .replace(/ووکامرس/gu, "سامانه فروش")
    .replace(/قیمت ثبت[‌ ]شده در سایت/gu, "قیمت فعلی این مدل")
    .replace(/قیمت فهرست(?: موجودی)?/gu, "قیمت فعلی")
    .replace(/طبق فهرست موجودی/gu, "در این صفحه")
    .replace(/در فهرست موجودی/gu, "در سپید بیوتی")
    .replace(/فهرست موجودی/gu, "محصولات سپید بیوتی")
    .replace(/محصول منتشر[‌ ]شده/gu, "محصول")
    .replace(/مسیر استعلام/gu, "مسیر خرید")
    .replace(/استعلام همان روز/gu, "بررسی قیمت امروز")
    .replace(/موجودی همان بچ استعلام شود/gu, "موجودی همان مدل پیش از سفارش بررسی شود")
    .replace(/هنگام استعلام/gu, "پیش از سفارش")
    .replace(/در مرحله استعلام/gu, "پیش از نهایی‌کردن سفارش")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function getPublicSourceUrl(value: string): string {
  return /masoon[\s-]*darou/iu.test(value) ? "" : value;
}

export function getPublicPackagingLabel(value?: string): string | null {
  if (!value) return null;

  return /(?:[۰-۹0-9]{1,2})\s*(?:×\s*)?سرنگ(?:ی)?/u.test(value) ||
    /(?:\b[2-9]|\b10)\s*(?:x\s*)?syringes?/iu.test(value)
    ? "تکی و جعبه‌ای"
    : null;
}
