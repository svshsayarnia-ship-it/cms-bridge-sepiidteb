from pathlib import Path

p = Path('app/lib/market-pricing-comprehensive.ts')
text = p.read_text(encoding='utf-8')

old = '''  MARKET_PROVIDER_LABELS,\n  type MarketPriceHistoryEntry,\n  type MarketPriceProposal,\n  type MarketPriceSample,\n  type MarketSourceConfig,\n} from "./pricing-types";'''
new = '''  MARKET_PROVIDER_LABELS,\n  type MarketPriceHistoryEntry,\n  type MarketPriceProposal,\n  type MarketPriceSample,\n  type MarketProvider,\n  type MarketSourceConfig,\n} from "./pricing-types";'''
if old not in text:
    raise SystemExit('pricing import target missing')
text = text.replace(old, new, 1)

marker = '''const CURATED_DIRECT_SOURCES: Record<string, CuratedDirectSource> = {'''
idx = text.index(marker)
end_marker = '''};\n\nconst GENERIC_TOKENS'''
end = text.index(end_marker, idx)
block = text[idx:end+3]
stores = '''\n\ntype WooMarketStore = {\n  provider: Extract<MarketProvider, "sayancenter" | "rokateb" | "noavaransalamat">;\n  baseUrl: string;\n};\n\nconst WOO_MARKET_STORES: WooMarketStore[] = [\n  { provider: "sayancenter", baseUrl: "https://sayancenter.com" },\n  { provider: "rokateb", baseUrl: "https://rokateb.ir" },\n  { provider: "noavaransalamat", baseUrl: "https://noavaransalamat.ir" },\n];\n\ntype WooStoreProduct = {\n  name?: string;\n  permalink?: string;\n  is_in_stock?: boolean;\n  is_purchasable?: boolean;\n  prices?: {\n    price?: string;\n    currency_code?: string;\n    currency_minor_unit?: number;\n  };\n};\n'''
text = text[:end+3] + stores + text[end+3:]

price_marker = '''function parseToman(value: unknown): number | null {\n  const normalized = toLatinDigits(String(value ?? ""))\n    .replace(/[^0-9.]/gu, "")\n    .trim();\n  const parsed = Number(normalized);\n  const rounded = Math.round(parsed);\n  return Number.isFinite(rounded) &&\n    rounded >= MIN_VALID_PRICE_TOMAN &&\n    rounded <= MAX_VALID_PRICE_TOMAN\n    ? rounded\n    : null;\n}\n'''
price_add = price_marker + '''\nfunction wooStorePrice(\n  value: unknown,\n  currency = "IRT",\n  minorUnit = 0,\n): number | null {\n  const normalized = toLatinDigits(String(value ?? ""))\n    .replace(/[٬،,\\s]/gu, "")\n    .replace(/٫/gu, ".");\n  const parsed = Number(normalized);\n  if (!Number.isFinite(parsed)) return null;\n  let amount = parsed / 10 ** Math.max(0, minorUnit);\n  if (currency.toUpperCase() === "IRR") amount /= 10;\n  const rounded = Math.round(amount);\n  return rounded >= MIN_VALID_PRICE_TOMAN && rounded <= MAX_VALID_PRICE_TOMAN\n    ? rounded\n    : null;\n}\n'''
if price_marker not in text:
    raise SystemExit('parseToman target missing')
text = text.replace(price_marker, price_add, 1)

fetch_marker = '''function candidateName(candidate: TorobSearchCandidate): string {'''
woo_fn = '''async function discoverWooMarketSample(\n  product: CmsProduct,\n  store: WooMarketStore,\n): Promise<{ provider: MarketProvider; sourceUrl: string; sample: MarketPriceSample } | null> {\n  // Search Persian storefront name first, then canonical English/model identity if needed.\n  const queries = [product.name, ...discoveryQueries(product)].filter(Boolean).slice(0, 2);\n  const candidates = new Map<string, { item: WooStoreProduct; score: number }>();\n\n  for (const query of queries) {\n    try {\n      const url = new URL("/wp-json/wc/store/v1/products", store.baseUrl);\n      url.searchParams.set("search", query);\n      url.searchParams.set("per_page", "12");\n      const response = await fetchJson<WooStoreProduct[]>(url.toString());\n      if (!Array.isArray(response)) continue;\n      for (const item of response) {\n        const name = item.name?.trim() ?? "";\n        const permalink = item.permalink?.trim() ?? "";\n        if (!name || !permalink || item.is_in_stock === false || item.is_purchasable === false) continue;\n        const score = candidateScore(product, name);\n        if (score < 0.62) continue;\n        const previous = candidates.get(permalink);\n        if (!previous || score > previous.score) candidates.set(permalink, { item, score });\n      }\n      const bestNow = [...candidates.values()].sort((a, b) => b.score - a.score)[0];\n      if (bestNow?.score && bestNow.score >= 0.9) break;\n    } catch {\n      // One store/query failing must not block the other independent market sources.\n    }\n  }\n\n  const ranked = [...candidates.values()].sort((a, b) => b.score - a.score);\n  const best = ranked[0];\n  if (!best?.item.permalink || !best.item.prices?.price) return null;\n  const second = ranked[1];\n  if (second && best.score < 0.86 && second.score >= best.score - 0.045) return null;\n\n  const priceToman = wooStorePrice(\n    best.item.prices.price,\n    best.item.prices.currency_code,\n    best.item.prices.currency_minor_unit,\n  );\n  if (!priceToman) return null;\n\n  return {\n    provider: store.provider,\n    sourceUrl: best.item.permalink,\n    sample: {\n      provider: store.provider,\n      sourceLabel: MARKET_PROVIDER_LABELS[store.provider],\n      url: best.item.permalink,\n      productName: best.item.name ?? product.name,\n      priceToman,\n      checkedAt: new Date().toISOString(),\n      inStock: true,\n      matchScore: best.score,\n      sellerName: MARKET_PROVIDER_LABELS[store.provider],\n    },\n  };\n}\n\n'''
if fetch_marker not in text:
    raise SystemExit('candidate marker missing')
text = text.replace(fetch_marker, woo_fn + fetch_marker, 1)

source_marker = '''function updateTorobSource(\n  sources: MarketSourceConfig[],\n  sourceUrl: string,\n): MarketSourceConfig[] {'''
source_fn = '''function updateProviderSource(\n  sources: MarketSourceConfig[],\n  provider: MarketProvider,\n  sourceUrl: string,\n): MarketSourceConfig[] {\n  const next = sources.map((source) => ({ ...source }));\n  const existing = next.find((source) => source.provider === provider);\n  if (existing) {\n    existing.url = sourceUrl;\n    existing.enabled = true;\n    existing.discovered = true;\n  } else {\n    next.push({ provider, url: sourceUrl, enabled: true, discovered: true });\n  }\n  return next;\n}\n\n'''
if source_marker not in text:
    raise SystemExit('source marker missing')
text = text.replace(source_marker, source_fn + source_marker, 1)

scan_marker = '''    const direct = await directMarketSample(product);\n    if (direct) {\n      samples.push(direct.sample);\n      sources = updateDirectSource(sources, direct.sourceUrl);\n    }\n\n    const verification = verifiedMarketProposal(product, samples, checkedAt);'''
scan_new = '''    const independent = await Promise.all(\n      WOO_MARKET_STORES.map((store) => discoverWooMarketSample(product, store)),\n    );\n    for (const result of independent) {\n      if (!result) continue;\n      samples.push(result.sample);\n      sources = updateProviderSource(sources, result.provider, result.sourceUrl);\n    }\n\n    const direct = await directMarketSample(product);\n    if (direct) {\n      samples.push(direct.sample);\n      sources = updateDirectSource(sources, direct.sourceUrl);\n    }\n\n    const verification = verifiedMarketProposal(product, samples, checkedAt);'''
if scan_marker not in text:
    raise SystemExit('scan target missing')
text = text.replace(scan_marker, scan_new, 1)

p.write_text(text, encoding='utf-8')
print('added independent WooCommerce market sources')
