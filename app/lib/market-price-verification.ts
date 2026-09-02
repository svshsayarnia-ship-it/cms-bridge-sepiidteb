import { marketBaselinePrices } from "../catalog";
import type {
  MarketAuthenticityRisk,
  MarketPriceSample,
  MarketPriceSnapshot,
  MarketProvider,
} from "./pricing-types";

const PROVIDER_BASE_TRUST: Record<MarketProvider, number> = {
  direct: 94,
  sayancenter: 88,
  rokateb: 86,
  noavaransalamat: 86,
  emalls: 72,
  torob: 58,
};

const AUTHENTICITY_SENSITIVE_SLUGS = [
  /^fusion-/u,
  /^mesolike-/u,
  /^audrey-/u,
  /^neuramis-/u,
  /^eptq-/u,
  /^revofil-/u,
  /^dermaheal-/u,
  /^genosys-/u,
  /^revitacare-/u,
  /^nabota-/u,
  /^neuronox-/u,
  /^dysport/u,
];

export type MarketVerificationResult = {
  snapshot: MarketPriceSnapshot;
  verifiedSamples: MarketPriceSample[];
  excludedSamples: MarketPriceSample[];
  verifiedMarketPriceToman: number | null;
  rawWeightedMarketPriceToman: number | null;
};

type VerificationInput = {
  slug: string;
  samples: MarketPriceSample[];
  checkedAt: string;
  currentPriceToman?: number | null;
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function canonicalSlug(slug: string): string {
  const duplicate = slug.match(/^(.*)-(\d+)$/u);
  if (!duplicate) return slug;
  const suffix = Number(duplicate[2]);
  return Number.isInteger(suffix) && suffix >= 2 && suffix <= 20 ? duplicate[1] : slug;
}

function normalized(value: string): string {
  return value
    .toLocaleLowerCase("fa")
    .replace(/ي|ى/gu, "ی")
    .replace(/ك/gu, "ک")
    .replace(/[\u200c\u200d\u200e\u200f]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function configuredSellerFragments(key: string): string[] {
  return (process.env[key] ?? "")
    .split(/[,،\n]/u)
    .map((item) => normalized(item))
    .filter(Boolean);
}

function sellerName(sample: MarketPriceSample): string {
  if (sample.sellerName?.trim()) return sample.sellerName.trim();
  const parts = sample.sourceLabel.split("·").map((item) => item.trim()).filter(Boolean);
  return parts.length > 1 ? parts.slice(1).join(" · ") : "";
}

function sellerTrust(sample: MarketPriceSample): number {
  const seller = normalized(sellerName(sample));
  const trusted = configuredSellerFragments("MARKET_TRUSTED_SELLERS");
  const lowTrust = configuredSellerFragments("MARKET_LOW_TRUST_SELLERS");
  let trust = PROVIDER_BASE_TRUST[sample.provider];

  if (sample.provider === "direct") trust = Math.max(trust, 94);
  if (seller && trusted.some((fragment) => seller.includes(fragment))) trust = Math.max(trust, 94);
  if (seller && lowTrust.some((fragment) => seller.includes(fragment))) trust = Math.min(trust, 25);
  if (sample.matchScore >= 0.92) trust += 4;
  if (sample.matchScore < 0.7) trust -= 10;
  if (sample.matchScore < 0.55) trust -= 15;
  return Math.round(clamp(trust, 5, 100));
}

function sampleWeight(sample: MarketPriceSample): number {
  const trust = (sample.trustScore ?? sellerTrust(sample)) / 100;
  const match = clamp(sample.matchScore, 0.35, 1);
  return Math.max(0.05, trust * trust * match);
}

function weightedMedian(samples: MarketPriceSample[]): number | null {
  if (!samples.length) return null;
  const rows = samples
    .map((sample) => ({ sample, weight: sampleWeight(sample) }))
    .sort((a, b) => a.sample.priceToman - b.sample.priceToman);
  const total = rows.reduce((sum, row) => sum + row.weight, 0);
  let cumulative = 0;
  for (const row of rows) {
    cumulative += row.weight;
    if (cumulative >= total / 2) return row.sample.priceToman;
  }
  return rows.at(-1)?.sample.priceToman ?? null;
}

function observedRange(samples: MarketPriceSample[]): [number | null, number | null] {
  if (!samples.length) return [null, null];
  const prices = samples.map((sample) => sample.priceToman);
  return [Math.min(...prices), Math.max(...prices)];
}

function roundMarketPrice(value: number): number {
  return Math.round(value / 10_000) * 10_000;
}

function uniqueSamples(samples: MarketPriceSample[]): MarketPriceSample[] {
  return Array.from(
    new Map(
      samples
        .filter((sample) => Number.isFinite(sample.priceToman) && sample.priceToman > 0)
        .map((sample) => [
          `${sample.provider}:${normalized(sample.sourceLabel)}:${sample.priceToman}`,
          sample,
        ]),
    ).values(),
  );
}

function providerCount(samples: MarketPriceSample[]): number {
  return new Set(samples.map((sample) => sample.provider)).size;
}

function verificationSummary(
  observed: number,
  verified: number,
  excluded: number,
  confidence: number,
): string {
  if (!observed) return "هیچ قیمت قابل‌استفاده‌ای از بازار دریافت نشد.";
  if (!verified) {
    return `${observed} قیمت در بازار دیده شد اما هیچ‌کدام برای قیمت‌گذاری خودکار اطمینان کافی نداشتند؛ ${excluded} مورد خارج از محاسبه ماند.`;
  }
  return `${observed} قیمت بازار بررسی شد؛ ${verified} قیمت معتبر وارد محاسبه شد و ${excluded} قیمت مشکوک یا کم‌اطمینان کنار گذاشته شد. اطمینان بازار ${confidence}٪ است.`;
}

export function verifyMarketSamples({
  slug,
  samples,
  checkedAt,
  currentPriceToman = null,
}: VerificationInput): MarketVerificationResult {
  const canonical = canonicalSlug(slug);
  const baseline = marketBaselinePrices[canonical] ?? null;
  const sensitive = AUTHENTICITY_SENSITIVE_SLUGS.some((pattern) => pattern.test(canonical));
  const unique = uniqueSamples(samples).map((sample) => ({
    ...sample,
    sellerName: sellerName(sample) || undefined,
    trustScore: sellerTrust(sample),
  }));

  const highTrust = unique.filter(
    (sample) => (sample.trustScore ?? 0) >= 82 && sample.matchScore >= 0.64,
  );
  const providers = providerCount(unique);
  let reference = weightedMedian(highTrust.length ? highTrust : unique);

  // A single marketplace can be dominated by suspiciously cheap listings. For
  // authenticity-sensitive products, a historical Sepiid baseline is only an
  // anomaly guard: it never becomes the proposal price, but it prevents a
  // low-price cluster from redefining the whole market without corroboration.
  if (reference && baseline && providers <= 1 && !highTrust.length) {
    if (sensitive && reference < baseline * 0.82) {
      reference = Math.max(reference, baseline * 0.9);
    } else if (reference < baseline * 0.62) {
      reference = Math.max(reference, baseline * 0.82);
    }
  }

  if (!reference && baseline) reference = baseline;
  if (!reference && currentPriceToman) reference = currentPriceToman;

  const classified = unique.map((sample): MarketPriceSample => {
    const trust = sample.trustScore ?? sellerTrust(sample);
    const ratio = reference ? sample.priceToman / reference : 1;
    const deviationPercent = reference ? (ratio - 1) * 100 : 0;
    const consistency = reference
      ? clamp(1 - Math.abs(Math.log(Math.max(ratio, 0.01))) / Math.log(1.8), 0, 1)
      : 0.7;
    const confidence = Math.round(
      clamp(sample.matchScore, 0, 1) * 40 +
      (trust / 100) * 30 +
      consistency * 30,
    );

    const veryLow = ratio < (sensitive ? 0.72 : 0.62) && trust < 90;
    const baselineLow = Boolean(
      baseline && sample.priceToman < baseline * (sensitive ? 0.58 : 0.48) && trust < 90,
    );
    const veryHigh = ratio > 1.7 && trust < 90;
    const weakMatch = sample.matchScore < 0.52;

    if (veryLow || baselineLow || veryHigh || weakMatch) {
      const reason = weakMatch
        ? "تطابق نام/مدل برای ورود به محاسبه کافی نیست."
        : veryLow || baselineLow
          ? "قیمت به‌طور غیرعادی پایین‌تر از مرکز معتبر بازار است؛ احتمال تفاوت اصالت، بسته یا شرایط فروش باید بررسی شود."
          : "قیمت به‌طور غیرعادی بالاتر از مرکز معتبر بازار است و به‌عنوان پرت کنار گذاشته شد.";
      return {
        ...sample,
        confidenceScore: confidence,
        classification: "suspicious",
        exclusionReason: reason,
        deviationPercent,
      };
    }

    const reviewLow = ratio < (sensitive ? 0.84 : 0.75);
    const reviewHigh = ratio > 1.45;
    if (reviewLow || reviewHigh || confidence < 70) {
      return {
        ...sample,
        confidenceScore: confidence,
        classification: "review",
        exclusionReason:
          reviewLow
            ? "قیمت پایین‌تر از محدوده امن است و برای جلوگیری از اثر کالای نامطمئن وارد قیمت پیشنهادی نشد."
            : reviewHigh
              ? "قیمت بالاتر از محدوده معمول بازار است و نیاز به بررسی دارد."
              : "امتیاز اطمینان این نمونه برای ورود خودکار به محاسبه کافی نیست.",
        deviationPercent,
      };
    }

    return {
      ...sample,
      confidenceScore: confidence,
      classification: "verified",
      exclusionReason: undefined,
      deviationPercent,
    };
  });

  let verified = classified.filter((sample) => sample.classification === "verified");

  // One anonymous marketplace listing is not enough to move a professional
  // product price. A single sample is accepted only when its source is already
  // high-trust; otherwise we require corroboration from another seller/source.
  if (verified.length === 1 && (verified[0].trustScore ?? 0) < 82) {
    verified = [];
  }

  const excluded = classified.filter((sample) => !verified.includes(sample));
  const suspicious = classified.filter((sample) => sample.classification === "suspicious");
  const trustedSellerCount = classified.filter((sample) => (sample.trustScore ?? 0) >= 82).length;
  const rawWeighted = weightedMedian(verified);
  const verifiedMarketPriceToman = rawWeighted ? roundMarketPrice(rawWeighted) : null;
  const [observedMinPriceToman, observedMaxPriceToman] = observedRange(classified);
  const [verifiedMinPriceToman, verifiedMaxPriceToman] = observedRange(verified);
  const verifiedProviders = providerCount(verified);
  const averageConfidence = verified.length
    ? verified.reduce((sum, sample) => sum + (sample.confidenceScore ?? 0), 0) / verified.length
    : 0;
  const marketConfidence = Math.round(
    clamp(
      averageConfidence * 0.65 +
      Math.min(15, verified.length * 5) +
      Math.min(10, verifiedProviders * 5) +
      (trustedSellerCount ? 10 : 0),
      0,
      100,
    ),
  );

  let authenticityRisk: MarketAuthenticityRisk = "low";
  if (suspicious.length || (sensitive && excluded.length)) authenticityRisk = "high";
  else if (excluded.length || marketConfidence < 75) authenticityRisk = "medium";

  const snapshot: MarketPriceSnapshot = {
    checkedAt,
    referencePriceToman: reference ? Math.round(reference) : null,
    observedMinPriceToman,
    observedMaxPriceToman,
    verifiedMinPriceToman,
    verifiedMaxPriceToman,
    verifiedMarketPriceToman,
    confidenceScore: marketConfidence,
    observedSampleCount: classified.length,
    verifiedSampleCount: verified.length,
    suspiciousSampleCount: suspicious.length,
    trustedSellerCount,
    authenticityRisk,
    observedSamples: classified,
    verifiedSamples: verified,
    suspiciousSamples: suspicious,
    summary: verificationSummary(
      classified.length,
      verified.length,
      excluded.length,
      marketConfidence,
    ),
  };

  return {
    snapshot,
    verifiedSamples: verified,
    excludedSamples: excluded,
    verifiedMarketPriceToman,
    rawWeightedMarketPriceToman: rawWeighted,
  };
}
