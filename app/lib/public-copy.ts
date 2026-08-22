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
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Storefront copy should sound like a person explaining a product, not like a
 * catalogue export. These edits are intentionally small and conservative so
 * product facts, names and units remain unchanged.
 */
export function toNaturalPersianCopy(value: string): string {
  return toPublicCopy(value)
    .replace(/می‌باشد/gu, "است")
    .replace(/می‌گردد/gu, "می‌شود")
    .replace(/می‌نماید/gu, "می‌کند")
    .replace(/به منظور/gu, "برای")
    .replace(/در راستای/gu, "برای")
    .replace(/قابل مشاهده/gu, "قابل دیدن")
    .replace(/قابل ارائه/gu, "که می‌توان ارائه کرد")
    .replace(/مورد بررسی قرار می‌گیرد/gu, "بررسی می‌شود")
    .replace(/می‌بایست/gu, "باید")
    .replace(/دارا می‌باشد/gu, "دارد")
    .replace(/محصولات حرفه‌ای زیبایی/gu, "محصولات زیبایی")
    .replace(/اطلاعات تکمیلی/gu, "توضیحات بیشتر")
    .replace(/فرآیند/gu, "روند")
    .replace(/فرایند/gu, "روند")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function toReaderFriendlyCopy(value: string): string {
  return toNaturalPersianCopy(value)
    .replace(/فرآورده‌های بوتولینوم/gu, "محصولات بوتاکس")
    .replace(/فرآورده‌های/gu, "محصولات")
    .replace(/فرآورده/gu, "محصول")
    .replace(/پروتکل/gu, "روش کار")
    .replace(/موارد منع مصرف/gu, "شرایطی که نباید استفاده شود")
    .replace(/واجد صلاحیت/gu, "دارای صلاحیت")
    .replace(/زنجیره تأمین/gu, "مسیر خرید")
    .replace(/دستورالعمل/gu, "راهنمای")
    .replace(/ناحیه/gu, "محل")
    .replace(/برچسب/gu, "نوشته روی بسته")
    .replace(/ترکیبات درج‌شده/gu, "ترکیبات نوشته‌شده روی بسته")
    .replace(/به‌کارگیری/gu, "استفاده")
    .replace(/به‌کار بردن/gu, "استفاده کردن")
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
