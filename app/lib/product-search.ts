import type { PublicProduct } from "./public-product";

const digitMap: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

export function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("fa")
    .replace(/[۰-۹٠-٩]/gu, (digit) => digitMap[digit] ?? digit)
    .replace(/[يى]/gu, "ی")
    .replace(/ك/gu, "ک")
    .replace(/[ۀة]/gu, "ه")
    .replace(/[أإٱ]/gu, "ا")
    .replace(/[ؤ]/gu, "و")
    .replace(/[\u064B-\u065F\u0670\u200c\u200d]/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function editDistance(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const before = previous[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + cost,
      );
      diagonal = before;
    }
  }
  return previous[b.length];
}

function fuzzyTokenMatch(queryToken: string, candidateToken: string) {
  if (candidateToken.includes(queryToken) || queryToken.includes(candidateToken)) return true;
  if (queryToken.length < 4 || candidateToken.length < 4) return false;
  const tolerance = Math.max(1, Math.floor(Math.max(queryToken.length, candidateToken.length) / 5));
  return editDistance(queryToken, candidateToken) <= tolerance;
}

function searchableFields(product: PublicProduct) {
  const specs = product.specs?.flatMap(([label, value]) => [label, value]) ?? [];
  return [
    product.nameFa,
    product.nameEn,
    product.brand,
    product.categoryTitle,
    product.volume ?? "",
    ...(product.variantVolumes?.filter(Boolean) as string[] | undefined ?? []),
    product.sku ?? "",
    product.shortBenefit,
    ...specs,
  ].filter(Boolean);
}

export function productSearchScore(product: PublicProduct, rawQuery: string) {
  const query = normalizeSearchText(rawQuery);
  if (!query) return 1;

  const normalizedNameFa = normalizeSearchText(product.nameFa);
  const normalizedNameEn = normalizeSearchText(product.nameEn);
  const normalizedSku = normalizeSearchText(product.sku ?? "");
  const normalizedBrand = normalizeSearchText(product.brand);
  const normalizedVolume = normalizeSearchText(
    [product.volume, ...(product.variantVolumes ?? [])].filter(Boolean).join(" "),
  );
  const haystack = normalizeSearchText(searchableFields(product).join(" "));

  if (normalizedNameFa === query || normalizedNameEn === query || normalizedSku === query) return 120;
  if (normalizedNameFa.includes(query) || normalizedNameEn.includes(query)) return 105;
  if (normalizedSku && normalizedSku.includes(query)) return 100;
  if (normalizedBrand.includes(query)) return 90;
  if (normalizedVolume.includes(query)) return 78;
  if (haystack.includes(query)) return 70;

  const queryTokens = query.split(" ").filter(Boolean);
  const candidateTokens = haystack.split(" ").filter(Boolean);
  const matched = queryTokens.filter((token) =>
    candidateTokens.some((candidate) => fuzzyTokenMatch(token, candidate)),
  ).length;

  if (!matched) return 0;
  if (matched === queryTokens.length) return 55 + matched;
  return matched / queryTokens.length >= 0.6 ? 35 + matched : 0;
}

export function searchPublicProducts(products: PublicProduct[], query: string) {
  return products
    .map((product, index) => ({
      product,
      index,
      score: productSearchScore(product, query),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.product);
}
