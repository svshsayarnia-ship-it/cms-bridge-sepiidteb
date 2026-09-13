const QUICK_PRICE_ID_BASE = 1_000_000_000_000;

function hash32(value: string, seed: number): number {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

/**
 * The legacy pricing UI selects rows by a positive numeric product id. Catalog
 * variants are not standalone WooCommerce products, so give them a stable,
 * collision-resistant numeric editor id without changing the public product id.
 */
export function quickPriceEditorId(key: string): number {
  const primary = hash32(key, 2166136261);
  const secondary = hash32(key, 2246822519) % 1000;
  return QUICK_PRICE_ID_BASE + primary * 1000 + secondary;
}

export function isQuickPriceEditorId(value: number): boolean {
  return Number.isSafeInteger(value) && value >= QUICK_PRICE_ID_BASE;
}
