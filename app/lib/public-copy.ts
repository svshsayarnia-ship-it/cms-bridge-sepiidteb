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

function canonicalCompactBrandLabel(value: string): string {
  if (/^fusion(?:\s+meso)?$/iu.test(value)) {
    return "Fusion";
  }

  return value;
}

export function getCompactBrandLabel(
  value: string,
): string {
  const label = getEnglishBrandLabel(value)
    .split("/")[0]
    .trim();

  return canonicalCompactBrandLabel(label);
}

export function toPublicCopy(value: string): string {
  return value
    .replace(/\bMasoon\s+Darou\b/giu, "تولیدکننده")
    .replace(/(?:شرکت\s+داروسازی\s+)?(?:مصون|مسون)[\s‌-]*دارو/gu, "تولیدکننده")
    .replace(/\bWooCommerce\b/giu, "فروشگاه")
    .replace(/\bCMS\b/giu, "فروشگاه")
    .replace(/ووکامرس/gu, "فروشگاه")
    .replace(/قیمت ثبت[‌ ]شده در سایت/gu, "قیمت فعلی این مدل")
    .replace(/قیمت فهرست(?: موجودی)?/gu, "قیمت فعلی")
    .replace(/طبق فهرست موجودی/gu, "در این صفحه")
    .replace(/در فهرست موجودی/gu, "در سپید بیوتی")
    .replace(/فهرست موجودی/gu, "محصولات سپید بیوتی")
    .replace(/محصول منتشر[‌ ]شده/gu, "محصول")
    .replace(/نمایه فرآورده‌ها/gu, "محصولات این گروه")
    .replace(/نمایه محصولات/gu, "محصولات این گروه")
    .replace(/مسیر استعلام/gu, "راه ارتباط با سپید")
    .replace(/استعلام همان روز/gu, "قیمت امروز")
    .replace(/موجودی همان بچ استعلام شود/gu, "موجودی همان مدل را پیش از سفارش چک کنید")
    .replace(/هنگام استعلام/gu, "وقتی درباره محصول سؤال می‌کنید")
    .replace(/در مرحله استعلام/gu, "قبل از نهایی‌کردن سفارش")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function getPublicVolumeLabel(value?: string): string {
  if (!value) return "";

  const cleanValue = value
    .replace(
      /(?:؛|،)?\s*(?:گزارش(?:\s+برخی\s+آگهی‌ها|\s+بازار)?|طبق\s+فهرست(?:\s+موجودی)?).*$/u,
      "",
    )
    .replace(/^(?:نسخه‌های|چند نسخه)\s+متفاوت\s+در\s+بازار$/u, "")
    .trim();

  return cleanValue ? toPublicCopy(cleanValue) : "";
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