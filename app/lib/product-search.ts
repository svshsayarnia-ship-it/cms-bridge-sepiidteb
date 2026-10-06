type SearchProduct = {
  nameFa?: string; nameEn?: string; brand?: string; categoryTitle?: string;
  shortBenefit?: string; volume?: string;
  variants?: Array<{ nameFa?: string; nameEn?: string; label?: string }>;
};

export function normalizeProductSearch(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("fa")
    .replace(/[يى]/gu, "ی").replace(/ك/gu, "ک")
    .replace(/[\u064B-\u065F\u0670]/gu, "")
    .replace(/[۰-۹]/gu, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/gu, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\s\u200c\u200d_-]+/gu, " ").trim();
}

export function matchesProductSearch(product: SearchProduct, query: string): boolean {
  const words = normalizeProductSearch(query).split(" ").filter(Boolean);
  const text = normalizeProductSearch([
    product.nameFa, product.nameEn, product.brand, product.categoryTitle,
    product.shortBenefit, product.volume,
    ...(product.variants ?? []).flatMap((variant) => [variant.nameFa, variant.nameEn, variant.label]),
  ].filter(Boolean).join(" "));
  const compact = text.replace(/ /gu, "");
  return words.every((word) => text.includes(word) || compact.includes(word));
}
