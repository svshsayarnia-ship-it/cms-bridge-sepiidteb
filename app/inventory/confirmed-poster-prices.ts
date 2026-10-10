import type { ProductSeed } from "../product-seed";

// Owner-confirmed October price list. These values are the migration fallback;
// confirmed CMS product/model prices still take precedence in storefront-catalog.
const prices: Record<string, { base: number; variants?: Record<string, number> }> = {
  "alcarisa-family": { base: 6_700_000, variants: { "16": 6_700_000, "20": 6_700_000, "24": 6_850_000 } },
  "neurafill-deep-lidocaine": { base: 5_500_000, variants: { deep: 5_500_000, volume: 5_600_000, lido: 4_700_000 } },
  "neuramis-deep-lidocaine": { base: 3_300_000, variants: { "deep-1ml": 3_300_000, "lido-1ml": 3_100_000, "deep-10ml": 6_800_000, "lido-10ml": 6_800_000, "volume-10ml": 6_800_000 } },
  "eptq-1ml": { base: 3_800_000, variants: { s100: 3_800_000, s500: 5_200_000 } },
  "audrey-m": { base: 3_900_000, variants: { m: 3_900_000, h: 4_100_000 } },
  "inovosense-family": { base: 8_450_000, variants: { smile: 8_450_000, style: 8_600_000, shape: 8_750_000, scalp: 4_900_000 } },
  "revofil-ultra": { base: 7_400_000, variants: { "1ml": 7_400_000, "10ml": 7_700_000 } },
  rabianca: { base: 20_450_000 },
  "hyamax-contour": { base: 7_400_000 },
  masport: { base: 1_200_000 },
  "dyston-500": { base: 950_000 },
  myobloc: { base: 1_000_000 },
};

export function withConfirmedPosterPrices(seed: ProductSeed): ProductSeed {
  const confirmed = prices[seed.slug];
  if (!confirmed) return seed;
  return {
    ...seed,
    priceToman: confirmed.base,
    variants: seed.variants?.map((variant) => ({
      ...variant,
      priceToman: confirmed.variants?.[variant.id] ?? variant.priceToman,
    })),
  };
}
