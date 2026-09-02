export const MARKET_PROVIDERS = [
  "sayancenter",
  "rokateb",
  "torob",
  "emalls",
  "noavaransalamat",
  "direct",
] as const;

export type MarketProvider = (typeof MARKET_PROVIDERS)[number];

export const MARKET_PROVIDER_LABELS: Record<MarketProvider, string> = {
  sayancenter: "سایان سنتر",
  rokateb: "روکاطب",
  torob: "ترب",
  emalls: "ایمالز",
  noavaransalamat: "نوآوران سلامت",
  direct: "فروشگاه مستقیم",
};

export type MarketSourceConfig = {
  provider: MarketProvider;
  url: string;
  enabled: boolean;
  discovered?: boolean;
};

export type MarketSampleClassification = "verified" | "review" | "suspicious";
export type MarketAuthenticityRisk = "low" | "medium" | "high";

export type MarketPriceSample = {
  provider: MarketProvider;
  sourceLabel: string;
  url: string;
  productName: string;
  priceToman: number;
  checkedAt: string;
  inStock: boolean;
  matchScore: number;
  sellerName?: string;
  trustScore?: number;
  confidenceScore?: number;
  classification?: MarketSampleClassification;
  exclusionReason?: string;
  deviationPercent?: number;
};

export type MarketPriceSnapshot = {
  checkedAt: string;
  referencePriceToman: number | null;
  observedMinPriceToman: number | null;
  observedMaxPriceToman: number | null;
  verifiedMinPriceToman: number | null;
  verifiedMaxPriceToman: number | null;
  verifiedMarketPriceToman: number | null;
  confidenceScore: number;
  observedSampleCount: number;
  verifiedSampleCount: number;
  suspiciousSampleCount: number;
  trustedSellerCount: number;
  authenticityRisk: MarketAuthenticityRisk;
  observedSamples: MarketPriceSample[];
  verifiedSamples: MarketPriceSample[];
  suspiciousSamples: MarketPriceSample[];
  summary: string;
};

export type MarketPriceProposal = {
  id: string;
  status: "pending";
  createdAt: string;
  currentPriceToman: number | null;
  proposedPriceToman: number;
  rawAverageToman: number;
  samples: MarketPriceSample[];
  excludedSamples: MarketPriceSample[];
  note: string;
  observedMinPriceToman: number | null;
  observedMaxPriceToman: number | null;
  verifiedMinPriceToman: number | null;
  verifiedMaxPriceToman: number | null;
  verifiedMedianToman: number | null;
  marketConfidenceScore: number;
  observedSampleCount: number;
  verifiedSampleCount: number;
  suspiciousSampleCount: number;
  trustedSellerCount: number;
  authenticityRisk: MarketAuthenticityRisk;
};

export type MarketPriceHistoryEntry = {
  id: string;
  createdAt: string;
  proposedPriceToman: number;
  currentPriceToman: number | null;
  sampleCount: number;
  decision: "approved" | "initial_applied" | "rejected" | "superseded";
  decidedAt: string;
};

export type CmsPricingState = {
  sources: MarketSourceConfig[];
  proposal: MarketPriceProposal | null;
  history: MarketPriceHistoryEntry[];
  lastMarketSnapshot: MarketPriceSnapshot | null;
  lastCheckedAt: string;
  initialAppliedAt: string;
  lastStatus: "never" | "pending" | "insufficient" | "error" | "approved" | "rejected";
  lastMessage: string;
};

export function emptyPricingState(): CmsPricingState {
  return {
    sources: MARKET_PROVIDERS.map((provider) => ({
      provider,
      url: "",
      enabled: true,
    })),
    proposal: null,
    history: [],
    lastMarketSnapshot: null,
    lastCheckedAt: "",
    initialAppliedAt: "",
    lastStatus: "never",
    lastMessage: "هنوز بررسی قیمت انجام نشده است.",
  };
}

function isProvider(value: unknown): value is MarketProvider {
  return typeof value === "string" && MARKET_PROVIDERS.includes(value as MarketProvider);
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function score(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : fallback;
}

function isClassification(value: unknown): value is MarketSampleClassification {
  return ["verified", "review", "suspicious"].includes(String(value));
}

function isAuthenticityRisk(value: unknown): value is MarketAuthenticityRisk {
  return ["low", "medium", "high"].includes(String(value));
}

function parseSample(value: unknown): MarketPriceSample | null {
  if (!value || typeof value !== "object") return null;
  const sample = value as Partial<MarketPriceSample>;
  if (
    !isProvider(sample.provider) ||
    typeof sample.url !== "string" ||
    typeof sample.productName !== "string" ||
    typeof sample.checkedAt !== "string" ||
    typeof sample.priceToman !== "number" ||
    !Number.isFinite(sample.priceToman)
  ) {
    return null;
  }
  return {
    provider: sample.provider,
    sourceLabel:
      typeof sample.sourceLabel === "string"
        ? sample.sourceLabel
        : MARKET_PROVIDER_LABELS[sample.provider],
    url: sample.url,
    productName: sample.productName,
    priceToman: sample.priceToman,
    checkedAt: sample.checkedAt,
    inStock: sample.inStock !== false,
    matchScore:
      typeof sample.matchScore === "number" && Number.isFinite(sample.matchScore)
        ? Math.max(0, Math.min(1, sample.matchScore))
        : 0,
    sellerName: typeof sample.sellerName === "string" ? sample.sellerName : undefined,
    trustScore: sample.trustScore === undefined ? undefined : score(sample.trustScore),
    confidenceScore:
      sample.confidenceScore === undefined ? undefined : score(sample.confidenceScore),
    classification: isClassification(sample.classification)
      ? sample.classification
      : undefined,
    exclusionReason:
      typeof sample.exclusionReason === "string" ? sample.exclusionReason : undefined,
    deviationPercent:
      typeof sample.deviationPercent === "number" && Number.isFinite(sample.deviationPercent)
        ? sample.deviationPercent
        : undefined,
  };
}

function parseSamples(value: unknown): MarketPriceSample[] {
  return (Array.isArray(value) ? value : [])
    .map(parseSample)
    .filter((sample): sample is MarketPriceSample => Boolean(sample));
}

function parseSnapshot(value: unknown): MarketPriceSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<MarketPriceSnapshot>;
  if (typeof raw.checkedAt !== "string") return null;
  const observedSamples = parseSamples(raw.observedSamples);
  const verifiedSamples = parseSamples(raw.verifiedSamples);
  const suspiciousSamples = parseSamples(raw.suspiciousSamples);
  return {
    checkedAt: raw.checkedAt,
    referencePriceToman: numberOrNull(raw.referencePriceToman),
    observedMinPriceToman: numberOrNull(raw.observedMinPriceToman),
    observedMaxPriceToman: numberOrNull(raw.observedMaxPriceToman),
    verifiedMinPriceToman: numberOrNull(raw.verifiedMinPriceToman),
    verifiedMaxPriceToman: numberOrNull(raw.verifiedMaxPriceToman),
    verifiedMarketPriceToman: numberOrNull(raw.verifiedMarketPriceToman),
    confidenceScore: score(raw.confidenceScore),
    observedSampleCount:
      typeof raw.observedSampleCount === "number" ? raw.observedSampleCount : observedSamples.length,
    verifiedSampleCount:
      typeof raw.verifiedSampleCount === "number" ? raw.verifiedSampleCount : verifiedSamples.length,
    suspiciousSampleCount:
      typeof raw.suspiciousSampleCount === "number" ? raw.suspiciousSampleCount : suspiciousSamples.length,
    trustedSellerCount:
      typeof raw.trustedSellerCount === "number" ? raw.trustedSellerCount : 0,
    authenticityRisk: isAuthenticityRisk(raw.authenticityRisk)
      ? raw.authenticityRisk
      : "medium",
    observedSamples,
    verifiedSamples,
    suspiciousSamples,
    summary: typeof raw.summary === "string" ? raw.summary : "",
  };
}

export function parsePricingState(value: string): CmsPricingState {
  const fallback = emptyPricingState();
  if (!value.trim()) return fallback;

  try {
    const parsed = JSON.parse(value) as Partial<CmsPricingState>;
    const sourceMap = new Map<MarketProvider, MarketSourceConfig>();
    for (const source of Array.isArray(parsed.sources) ? parsed.sources : []) {
      if (!source || !isProvider(source.provider)) continue;
      sourceMap.set(source.provider, {
        provider: source.provider,
        url: typeof source.url === "string" ? source.url : "",
        enabled: source.enabled !== false,
        discovered: source.discovered === true,
      });
    }

    const sources = MARKET_PROVIDERS.map(
      (provider) =>
        sourceMap.get(provider) ?? {
          provider,
          url: "",
          enabled: true,
        },
    );

    let proposal: MarketPriceProposal | null = null;
    if (parsed.proposal && typeof parsed.proposal === "object") {
      const raw = parsed.proposal as Partial<MarketPriceProposal>;
      const samples = parseSamples(raw.samples);
      const excludedSamples = parseSamples(raw.excludedSamples);
      if (
        typeof raw.id === "string" &&
        typeof raw.createdAt === "string" &&
        typeof raw.proposedPriceToman === "number" &&
        Number.isFinite(raw.proposedPriceToman) &&
        typeof raw.rawAverageToman === "number" &&
        Number.isFinite(raw.rawAverageToman)
      ) {
        proposal = {
          id: raw.id,
          status: "pending",
          createdAt: raw.createdAt,
          currentPriceToman: numberOrNull(raw.currentPriceToman),
          proposedPriceToman: raw.proposedPriceToman,
          rawAverageToman: raw.rawAverageToman,
          samples,
          excludedSamples,
          note: typeof raw.note === "string" ? raw.note : "",
          observedMinPriceToman: numberOrNull(raw.observedMinPriceToman),
          observedMaxPriceToman: numberOrNull(raw.observedMaxPriceToman),
          verifiedMinPriceToman:
            numberOrNull(raw.verifiedMinPriceToman) ??
            (samples.length ? Math.min(...samples.map((sample) => sample.priceToman)) : null),
          verifiedMaxPriceToman:
            numberOrNull(raw.verifiedMaxPriceToman) ??
            (samples.length ? Math.max(...samples.map((sample) => sample.priceToman)) : null),
          verifiedMedianToman: numberOrNull(raw.verifiedMedianToman) ?? raw.proposedPriceToman,
          marketConfidenceScore: score(raw.marketConfidenceScore, samples.length ? 60 : 0),
          observedSampleCount:
            typeof raw.observedSampleCount === "number"
              ? raw.observedSampleCount
              : samples.length + excludedSamples.length,
          verifiedSampleCount:
            typeof raw.verifiedSampleCount === "number" ? raw.verifiedSampleCount : samples.length,
          suspiciousSampleCount:
            typeof raw.suspiciousSampleCount === "number"
              ? raw.suspiciousSampleCount
              : excludedSamples.length,
          trustedSellerCount:
            typeof raw.trustedSellerCount === "number" ? raw.trustedSellerCount : 0,
          authenticityRisk: isAuthenticityRisk(raw.authenticityRisk)
            ? raw.authenticityRisk
            : "medium",
        };
      }
    }

    const history = (Array.isArray(parsed.history) ? parsed.history : [])
      .filter((entry): entry is MarketPriceHistoryEntry => {
        if (!entry || typeof entry !== "object") return false;
        const item = entry as Partial<MarketPriceHistoryEntry>;
        return (
          typeof item.id === "string" &&
          typeof item.createdAt === "string" &&
          typeof item.decidedAt === "string" &&
          typeof item.proposedPriceToman === "number" &&
          typeof item.sampleCount === "number" &&
          ["approved", "initial_applied", "rejected", "superseded"].includes(
            String(item.decision),
          )
        );
      })
      .slice(0, 30);

    const statuses: CmsPricingState["lastStatus"][] = [
      "never",
      "pending",
      "insufficient",
      "error",
      "approved",
      "rejected",
    ];

    return {
      sources,
      proposal,
      history,
      lastMarketSnapshot: parseSnapshot(parsed.lastMarketSnapshot),
      lastCheckedAt: typeof parsed.lastCheckedAt === "string" ? parsed.lastCheckedAt : "",
      initialAppliedAt:
        typeof parsed.initialAppliedAt === "string" ? parsed.initialAppliedAt : "",
      lastStatus: statuses.includes(parsed.lastStatus as CmsPricingState["lastStatus"])
        ? (parsed.lastStatus as CmsPricingState["lastStatus"])
        : "never",
      lastMessage:
        typeof parsed.lastMessage === "string"
          ? parsed.lastMessage
          : fallback.lastMessage,
    };
  } catch {
    return fallback;
  }
}
