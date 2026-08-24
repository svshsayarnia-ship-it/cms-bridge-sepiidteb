const legacyArticleSlugRedirects = {
  "فیلر-نورامیس-چیست-راهنمای-کامل-مدل-ها-کاربردها-و-تشخیص-اصالت":
    "neuramis-filler-guide",
  "۱۰-فیلر-برتر-بازار-ایران-راهنمای-انتخاب-آگاهانه":
    "best-fillers-iran-guide",
} as const;

const persianLetters: Record<string, string> = {
  آ: "a",
  ا: "a",
  ب: "b",
  پ: "p",
  ت: "t",
  ث: "s",
  ج: "j",
  چ: "ch",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "z",
  ر: "r",
  ز: "z",
  ژ: "zh",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "z",
  ط: "t",
  ظ: "z",
  ع: "",
  غ: "gh",
  ف: "f",
  ق: "gh",
  ک: "k",
  گ: "g",
  ل: "l",
  م: "m",
  ن: "n",
  و: "v",
  ه: "h",
  ی: "y",
  ء: "",
  ة: "h",
  ؤ: "v",
  ئ: "y",
};

const persianDigits: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

export function normalizeArticleSlug(value: string) {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // An invalid URL escape sequence cannot be an intentional published slug.
  }

  return decoded.normalize("NFC").trim();
}

export function canonicalArticleSlug(value: string) {
  const normalized = normalizeArticleSlug(value);
  return legacyArticleSlugRedirects[
    normalized as keyof typeof legacyArticleSlugRedirects
  ] ?? normalized;
}

export function isLegacyArticleSlug(value: string) {
  const normalized = normalizeArticleSlug(value);
  return canonicalArticleSlug(normalized) !== normalized;
}

export function articlePath(value: string) {
  return `/magazine/${canonicalArticleSlug(value)}`;
}

export function articleSlugForStorage(value: string) {
  const canonicalSlug = canonicalArticleSlug(value);
  const legacy = Object.entries(legacyArticleSlugRedirects).find(
    ([, destination]) => destination === canonicalSlug,
  );

  return legacy?.[0] ?? canonicalSlug;
}

// The CMS allows editors to leave the slug blank. Generate an ASCII fallback
// so newly created articles do not introduce encoded Persian URLs again. An
// editor can still choose a more specific keyword-focused English slug.
export function toAsciiArticleSlug(value: string) {
  const transliterated = [...value.normalize("NFC")]
    .map((character) => persianDigits[character] ?? persianLetters[character] ?? character)
    .join("");

  return transliterated
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export const articleSlugRedirects = legacyArticleSlugRedirects;
