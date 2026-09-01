from pathlib import Path

path = Path("app/lib/market-pricing-comprehensive.ts")
s = path.read_text(encoding="utf-8")

if 'const CURATED_DIRECT_SOURCES:' not in s:
    anchor = 'const MAX_BATCH_SIZE = 12;\n'
    if anchor not in s:
        raise SystemExit('constants anchor missing')
    block = '''const MAX_BATCH_SIZE = 12;

type CuratedDirectSource = {
  url: string;
  label: string;
  expectedName: string;
};

const CURATED_DIRECT_SOURCES: Record<string, CuratedDirectSource> = {
  "ejal-40": {
    url: "https://tebsoo.co/product/%D9%85%D8%B2%D9%88%DA%98%D9%84-%D8%A7%D8%AC%D8%A7%D9%84/",
    label: "طب‌سو",
    expectedName: "مزوژل اجال Ejal 40 2ml",
  },
  perleux: {
    url: "https://tebsoo.co/product/perleux/",
    label: "طب‌سو",
    expectedName: "مزو ژل پرلوکس Perleux 2ml",
  },
  "audrey-m": {
    url: "https://mesotop.com/product/%DA%98%D9%84-%D8%A7%D9%88%D8%AF%D8%B1%DB%8C-10-%D8%B3%DB%8C-%D8%B3%DB%8C-%D9%85%D8%AF%D9%84-%D8%A7%D9%85/",
    label: "Mesotop",
    expectedName: "ژل اودری ام Audrey M 10ml",
  },
  "siax-100": {
    url: "https://capsoll.ir/product/%D8%A8%D9%88%D8%AA%D8%A7%DA%A9%D8%B3-%D8%B3%DB%8C%D8%A7%DA%A9%D8%B3/",
    label: "کپسول",
    expectedName: "بوتاکس سیاکس Siax 100U",
  },
};
'''
    s = s.replace(anchor, block, 1)

if 'async function fetchText(url: string)' not in s:
    anchor = 'async function fetchJson<T>(url: string): Promise<T> {\n'
    if anchor not in s:
        raise SystemExit('fetchJson anchor missing')
    block = '''async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "accept-language": "fa-IR,fa;q=0.9,en-US;q=0.7,en;q=0.6",
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson<T>(url: string): Promise<T> {
'''
    s = s.replace(anchor, block, 1)

if 'async function directMarketSample(' not in s:
    anchor = 'function median(values: number[]): number {\n'
    if anchor not in s:
        raise SystemExit('median anchor missing')
    block = r'''function stripHtml(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&nbsp;|&#160;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;|&#34;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/\s+/gu, " ")
    .trim();
}

function directPriceNumber(value: string): number | null {
  const normalized = toLatinDigits(value)
    .replace(/[٬،,\/\s]/gu, "")
    .replace(/\.(?=\d{3}(?:\D|$))/gu, "")
    .replace(/[^0-9.]/gu, "")
    .trim();
  const parsed = Math.round(Number(normalized));
  return Number.isFinite(parsed) &&
    parsed >= MIN_VALID_PRICE_TOMAN &&
    parsed <= MAX_VALID_PRICE_TOMAN
    ? parsed
    : null;
}

function directPagePrice(html: string): number | null {
  const visible: number[] = [];
  const h1Index = html.search(/<h1\b/iu);
  const scope = h1Index >= 0 ? html.slice(h1Index, h1Index + 45_000) : html.slice(0, 45_000);
  for (const match of stripHtml(scope).matchAll(/([۰-۹٠-٩0-9][۰-۹٠-٩0-9.,٬،\/\s]{3,20})\s*(?:تومان|تومن)/giu)) {
    const value = directPriceNumber(match[1] ?? "");
    if (value) visible.push(value);
  }
  if (visible.length) return Math.min(...visible);

  const structured: number[] = [];
  for (const match of html.matchAll(/"price"\s*:\s*"?([۰-۹٠-٩0-9][۰-۹٠-٩0-9.,٬،\/\s]{2,20})"?/giu)) {
    const value = directPriceNumber(match[1] ?? "");
    if (value) structured.push(value);
  }
  if (!structured.length) return null;
  const minimum = Math.min(...structured);
  return minimum > 20_000_000 ? Math.round(minimum / 10) : minimum;
}

function directPageName(html: string): string {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]{0,600}?)<\/h1>/iu)?.[1];
  if (h1) return stripHtml(h1);
  const title = html.match(/<title\b[^>]*>([\s\S]{0,600}?)<\/title>/iu)?.[1];
  return title ? stripHtml(title) : "";
}

async function directMarketSample(
  product: CmsProduct,
): Promise<{ sourceUrl: string; sample: MarketPriceSample } | null> {
  const source = CURATED_DIRECT_SOURCES[canonicalProductSlug(product)];
  if (!source) return null;
  try {
    const html = await fetchText(source.url);
    const pageName = directPageName(html);
    const identity = pageName || source.expectedName;
    const score = candidateScore(product, `${identity} ${source.expectedName}`);
    if (score < 0.62) return null;
    const priceToman = directPagePrice(html);
    if (!priceToman) return null;
    return {
      sourceUrl: source.url,
      sample: {
        provider: "direct",
        sourceLabel: `${MARKET_PROVIDER_LABELS.direct} · ${source.label}`,
        url: source.url,
        productName: identity,
        priceToman,
        checkedAt: new Date().toISOString(),
        inStock: true,
        matchScore: Math.min(1, score),
      },
    };
  } catch {
    return null;
  }
}

function median(values: number[]): number {
'''
    s = s.replace(anchor, block, 1)

if 'function updateDirectSource(' not in s:
    anchor = 'function supersededHistory(product: CmsProduct, decidedAt: string): MarketPriceHistoryEntry[] {\n'
    if anchor not in s:
        raise SystemExit('history anchor missing')
    block = '''function updateDirectSource(
  sources: MarketSourceConfig[],
  sourceUrl: string,
): MarketSourceConfig[] {
  const next = sources.map((source) => ({ ...source }));
  const direct = next.find((source) => source.provider === "direct");
  if (direct) {
    direct.url = sourceUrl;
    direct.enabled = true;
    direct.discovered = true;
  } else {
    next.push({ provider: "direct", url: sourceUrl, enabled: true, discovered: true });
  }
  return next;
}

function supersededHistory(product: CmsProduct, decidedAt: string): MarketPriceHistoryEntry[] {
'''
    s = s.replace(anchor, block, 1)

s = s.replace('`${excluded.length} قیمت پرت ترب از محاسبه کنار گذاشته شد.`', '`${excluded.length} قیمت پرت بازار از محاسبه کنار گذاشته شد.`')
s = s.replace('`میانگین از ${included.length} قیمت معتبر فروشنده‌های ترب محاسبه شد.`', '`میانگین از ${included.length} قیمت معتبر بازار محاسبه شد.`')
s = s.replace('"در این نوبت تطبیق مطمئن جدید در ترب پیدا نشد؛ پیشنهاد قبلی حفظ شد."', '"در این نوبت قیمت معتبر جدید در منابع بازار پیدا نشد؛ پیشنهاد قبلی حفظ شد."')
s = s.replace('"در این نوبت تطبیق مطمئن محصول در ترب پیدا نشد؛ در اسکن بعدی دوباره تلاش می‌شود."', '"در این نوبت قیمت معتبر محصول در منابع بازار پیدا نشد؛ در اسکن بعدی دوباره تلاش می‌شود."')

if 'async function scanProductMarket(' not in s:
    start = s.find('async function scanProductWithTorob(product: CmsProduct): Promise<ProductScanResult> {')
    end = s.find('\nasync function mapWithConcurrency', start)
    if start < 0 or end < 0:
        raise SystemExit('scan function boundaries missing')
    block = '''async function scanProductMarket(product: CmsProduct): Promise<ProductScanResult> {
  const checkedAt = new Date().toISOString();
  try {
    let sources = product.pricing.sources;
    const samples: MarketPriceSample[] = [];

    const ranked = curatedTorobCandidate(product) ?? (await discoverTorobCandidate(product));
    if (ranked) {
      const torob = await torobSamples(product, ranked);
      samples.push(...torob.samples);
      if (torob.samples.length) sources = updateTorobSource(sources, torob.sourceUrl);
    }

    const direct = await directMarketSample(product);
    if (direct) {
      samples.push(direct.sample);
      sources = updateDirectSource(sources, direct.sourceUrl);
    }

    const proposal = marketProposal(product, samples, checkedAt);
    if (!proposal) {
      await markUnresolved(product, checkedAt);
      return { slug: product.slug, status: "unresolved" };
    }

    if (proposal.currentPriceToman === proposal.proposedPriceToman) {
      await updateProductPricingState(product.id, {
        ...product.pricing,
        sources,
        proposal: null,
        history: supersededHistory(product, checkedAt),
        lastCheckedAt: checkedAt,
        lastStatus: "insufficient",
        lastMessage: `قیمت فعلی با میانگین ${proposal.samples.length} قیمت معتبر بازار برابر است؛ تغییر لازم نیست.`,
      });
      return { slug: product.slug, status: "market-equal" };
    }

    if (product.pricing.proposal?.proposedPriceToman === proposal.proposedPriceToman) {
      await updateProductPricingState(product.id, {
        ...product.pricing,
        sources,
        lastCheckedAt: checkedAt,
        lastStatus: "pending",
        lastMessage: `پیشنهاد قبلی با ${proposal.samples.length} قیمت معتبر بازار دوباره تأیید شد.`,
      });
      return { slug: product.slug, status: "same-proposal" };
    }

    await updateProductPricingState(product.id, {
      ...product.pricing,
      sources,
      proposal,
      history: supersededHistory(product, checkedAt),
      lastCheckedAt: checkedAt,
      lastStatus: "pending",
      lastMessage: `پیشنهاد قیمت با ${proposal.samples.length} نمونه معتبر بازار آماده تأیید است.`,
    });
    return { slug: product.slug, status: "proposal" };
  } catch (error) {
    console.error("[market-pricing] Product market scan failed", {
      slug: product.slug,
      error: error instanceof Error ? error.message : String(error),
    });
    return { slug: product.slug, status: "failed" };
  }
}
'''
    s = s[:start] + block + s[end:]

s = s.replace('mapWithConcurrency(batch, 4, scanProductWithTorob)', 'mapWithConcurrency(batch, 4, scanProductMarket)')

path.write_text(s, encoding="utf-8")
