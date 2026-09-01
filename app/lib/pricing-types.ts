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

export type MarketPriceSample = {
  provider: MarketProvider;
  sourceLabel: string;
  url: string;
  productName: string;
  priceToman: number;
  checkedAt: string;
  inStock: boolean;
  matchScore: number;
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
      const samples = (Array.isArray(raw.samples) ? raw.samples : [])
        .map(parseSample)
        .filter((sample): sample is MarketPriceSample => Boolean(sample));
      const excludedSamples = (Array.isArray(raw.excludedSamples) ? raw.excludedSamples : [])
        .map(parseSample)
        .filter((sample): sample is MarketPriceSample => Boolean(sample));
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
