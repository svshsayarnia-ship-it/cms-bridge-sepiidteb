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
    .replace(/سفید بیوتی/gu, "سپید بیوتی")
    .replace(/سپیدطب/gu, "سپید بیوتی")
    .replace(/در کاتالوگ فعلی سپید بیوتی/gu, "در سپید بیوتی")
    .replace(/در کاتالوگ سپید بیوتی/gu, "در سپید بیوتی")
    .replace(/طبق کاتالوگ فعلی سپید بیوتی/gu, "در این مدل")
    .replace(/مطابق کاتالوگ فعلی سپید بیوتی/gu, "در این مدل")
    .replace(/ثبت[‌ ]شده در کاتالوگ فعلی سپید بیوتی/gu, "موجود در سپید بیوتی")
    .replace(/ثبت[‌ ]شده در کاتالوگ سپید بیوتی/gu, "موجود در سپید بیوتی")
    .replace(/ثبت[‌ ]شده در سپید بیوتی/gu, "موجود در سپید بیوتی")
    .replace(/قیمت ثبت[‌ ]شده در سایت/gu, "قیمت فعلی این مدل")
    .replace(/قیمت فهرست(?: موجودی)?/gu, "قیمت فعلی")
    .replace(/قیمت مرجع سپید بیوتی(?: در [^؛.!؟]+)?؛?\s*قیمت زنده فروشگاه اولویت دارد/gu, "قیمت نهایی هنگام سفارش بررسی می‌شود")
    .replace(/قیمت مرجع سپید بیوتی/gu, "قیمت فعلی")
    .replace(/قیمت زنده فروشگاه اولویت دارد/gu, "قیمت نهایی هنگام سفارش بررسی می‌شود")
    .replace(/طبق فهرست موجودی/gu, "در این صفحه")
    .replace(/در فهرست موجودی/gu, "در سپید بیوتی")
    .replace(/فهرست موجودی/gu, "محصولات سپید بیوتی")
    .replace(/موجودی مرجع سپید بیوتی/gu, "فروشگاه سپید بیوتی")
    .replace(/محصول منتشر[‌ ]شده/gu, "محصول")
    .replace(/نمایه فرآورده‌ها/gu, "محصولات این گروه")
    .replace(/نمایه محصولات/gu, "محصولات این گروه")
    .replace(/مسیر استعلام/gu, "راه ارتباط با سپید")
    .replace(/استعلام همان روز/gu, "قیمت امروز")
    .replace(/موجودی همان بچ استعلام شود/gu, "موجودی همان مدل را پیش از سفارش چک کنید")
    .replace(/هنگام استعلام/gu, "قبل از سفارش")
    .replace(/در مرحله استعلام/gu, "قبل از نهایی‌کردن سفارش")
    .replace(/مدل انتخابی قبل از سفارش کنترل شود/gu, "برای موجودی و قیمت همان مدل پیام بدهید")
    .replace(/حجم روی بسته همان موجودی کنترل می‌شود/gu, "حجم دقیق روی بسته را پیش از سفارش ببینید")
    .replace(/تصویر و حجم دقیق همان بسته پیش از سفارش کنترل می‌شود/gu, "قبل از سفارش، مدل و حجم روی بسته را ببینید")
    .replace(/تصویر دقیق همان بچ قبل از سفارش کنترل می‌شود/gu, "قبل از سفارش، تصویر و مدل روی بسته را ببینید")
    .replace(/مطابق [^.!؟؛]+ در سپید بیوتی اضافه شده است/gu, "یکی از گزینه‌های موجود این محصول است")
    .replace(/مطابق [^.!؟؛]+ در انتخاب[‌-]?گر محصول قرار دارد/gu, "یکی از مدل‌های موجود این محصول است")
    .replace(/در صفحه فعلی سپید بیوتی قابل انتخاب است/gu, "یکی از مدل‌های موجود است")
    .replace(/صفحه سپید بیوتی این [^.!؟]+ را زیر یک خانواده نگه می‌دارد تا ساختار و هویت بصری فعلی سایت تغییر نکند\.?/gu, "")
    .replace(/انتخاب مدل در همین صفحه انجام می‌شود و طراحی، چیدمان و هویت بصری فعلی محصول بدون تغییر باقی می‌ماند\.?/gu, "مدل موردنظر را از همین صفحه انتخاب کنید.")
    .replace(/هر دو مدل در همان صفحه محصول سپید بیوتی نمایش داده می‌شوند تا طراحی و ساختار فعلی حفظ شود\.?/gu, "هر دو مدل را می‌توانید از همین صفحه ببینید.")
    .replace(/هر شش ترکیب در انتخاب[‌-]?گر یکپارچه سپید بیوتی نگه داشته می‌شوند بدون تغییر در ساختار صفحه\.?/gu, "هر شش ترکیب را می‌توانید از همین صفحه انتخاب کنید.")
    .replace(/تا زمان ثبت پک[‌-]?شات اختصاصی، از تصویر ادیتوریال هم[‌-]?خانواده استفاده می‌شود تا هویت بصری دسته[‌-]?بندی تغییر نکند و تصویر نادرست به محصول نسبت داده نشود\.?/gu, "تا وقتی تصویر دقیق این مدل در دسترس نباشد، تصویر هم‌خانواده نمایش داده می‌شود.")
    .replace(/به فروشگاه سپید بیوتی اضافه شده است/gu, "در سپید بیوتی موجود است")
    .replace(/\s+([.!؟؛،])/g, "$1")
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