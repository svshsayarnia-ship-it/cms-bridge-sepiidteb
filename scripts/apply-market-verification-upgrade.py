from pathlib import Path
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f"missing patch target: {label}")
    return text.replace(old, new, 1)


def regex_once(text: str, pattern: str, new: str, label: str) -> str:
    updated, count = re.subn(pattern, new, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f"regex patch target {label}: expected 1, got {count}")
    return updated

# --- comprehensive / Telegram scanner ---
p = Path("app/lib/market-pricing-comprehensive.ts")
text = p.read_text(encoding="utf-8")
text = replace_once(
    text,
    'import { CURATED_TOROB_URLS } from "./market-pricing";\n',
    'import { CURATED_TOROB_URLS } from "./market-pricing";\nimport { verifyMarketSamples } from "./market-price-verification";\n',
    "comprehensive verification import",
)
new_verifier = r'''function verifiedMarketProposal(
  product: CmsProduct,
  samples: MarketPriceSample[],
  checkedAt: string,
): { proposal: MarketPriceProposal | null; snapshot: ReturnType<typeof verifyMarketSamples>["snapshot"] } {
  const verification = verifyMarketSamples({
    slug: canonicalProductSlug(product),
    samples,
    checkedAt,
    currentPriceToman: currentPrice(product),
  });
  const proposed = verification.verifiedMarketPriceToman;
  if (!proposed || !verification.verifiedSamples.length) {
    return { proposal: null, snapshot: verification.snapshot };
  }
  const snapshot = verification.snapshot;
  return {
    snapshot,
    proposal: {
      id: crypto.randomUUID(),
      status: "pending",
      createdAt: checkedAt,
      currentPriceToman: currentPrice(product),
      proposedPriceToman: proposed,
      rawAverageToman: Math.round(
        verification.rawWeightedMarketPriceToman ?? proposed,
      ),
      samples: verification.verifiedSamples,
      excludedSamples: verification.excludedSamples,
      note: snapshot.summary,
      observedMinPriceToman: snapshot.observedMinPriceToman,
      observedMaxPriceToman: snapshot.observedMaxPriceToman,
      verifiedMinPriceToman: snapshot.verifiedMinPriceToman,
      verifiedMaxPriceToman: snapshot.verifiedMaxPriceToman,
      verifiedMedianToman: snapshot.verifiedMarketPriceToman,
      marketConfidenceScore: snapshot.confidenceScore,
      observedSampleCount: snapshot.observedSampleCount,
      verifiedSampleCount: snapshot.verifiedSampleCount,
      suspiciousSampleCount: snapshot.suspiciousSampleCount,
      trustedSellerCount: snapshot.trustedSellerCount,
      authenticityRisk: snapshot.authenticityRisk,
    },
  };
}

async function markUnresolved(
  product: CmsProduct,
  checkedAt: string,
  snapshot?: ReturnType<typeof verifyMarketSamples>["snapshot"],
): Promise<void> {
  await updateProductPricingState(product.id, {
    ...product.pricing,
    lastMarketSnapshot: snapshot ?? product.pricing.lastMarketSnapshot,
    lastCheckedAt: checkedAt,
    lastStatus: product.pricing.proposal ? "pending" : "insufficient",
    lastMessage: snapshot?.observedSampleCount
      ? snapshot.summary
      : product.pricing.proposal
        ? "در این نوبت قیمت معتبر جدید در منابع بازار پیدا نشد؛ پیشنهاد قبلی حفظ شد."
        : "در این نوبت قیمت معتبر محصول در منابع بازار پیدا نشد؛ در اسکن بعدی دوباره تلاش می‌شود.",
  });
}'''
text = regex_once(
    text,
    r'function marketProposal\([\s\S]*?\n}\n\nasync function markUnresolved\([\s\S]*?\n}\n\nasync function scanProductMarket',
    new_verifier + '\n\nasync function scanProductMarket',
    "comprehensive proposal verifier",
)
text = replace_once(
    text,
    '    const proposal = marketProposal(product, samples, checkedAt);\n    if (!proposal) {\n      await markUnresolved(product, checkedAt);',
    '    const verification = verifiedMarketProposal(product, samples, checkedAt);\n    const proposal = verification.proposal;\n    if (!proposal) {\n      await markUnresolved(product, checkedAt, verification.snapshot);',
    "comprehensive verification call",
)
text = text.replace(
    '        sources,\n        proposal: null,\n        history: supersededHistory(product, checkedAt),',
    '        sources,\n        proposal: null,\n        lastMarketSnapshot: verification.snapshot,\n        history: supersededHistory(product, checkedAt),',
    1,
)
text = text.replace(
    '        sources,\n        lastCheckedAt: checkedAt,\n        lastStatus: "pending",',
    '        sources,\n        lastMarketSnapshot: verification.snapshot,\n        lastCheckedAt: checkedAt,\n        lastStatus: "pending",',
    1,
)
text = text.replace(
    '      sources,\n      proposal,\n      history: supersededHistory(product, checkedAt),',
    '      sources,\n      proposal,\n      lastMarketSnapshot: verification.snapshot,\n      history: supersededHistory(product, checkedAt),',
    1,
)
text = text.replace(
    '`قیمت فعلی با میانگین ${proposal.samples.length} قیمت معتبر بازار برابر است؛ تغییر لازم نیست.`',
    '`قیمت فعلی با قیمت معتبر وزن‌دار بازار (${proposal.samples.length} نمونه) برابر است؛ تغییر لازم نیست.`',
)
text = text.replace(
    '`پیشنهاد قیمت با ${proposal.samples.length} نمونه معتبر بازار آماده تأیید است.`',
    '`قیمت معتبر بازار با اطمینان ${proposal.marketConfidenceScore}٪ و ${proposal.samples.length} نمونه آماده تأیید است.`',
)
p.write_text(text, encoding="utf-8")

# --- legacy CMS multi-source scanner ---
p = Path("app/lib/market-pricing.ts")
text = p.read_text(encoding="utf-8")
text = replace_once(
    text,
    'import { STOREFRONT_CATALOG_TAG } from "./storefront-catalog";\n',
    'import { STOREFRONT_CATALOG_TAG } from "./storefront-catalog";\nimport { verifyMarketSamples } from "./market-price-verification";\n',
    "legacy verification import",
)
legacy_replacement = r'''  const unique = Array.from(
    new Map(
      samples.map((sample) => [
        `${sample.provider}:${sample.sourceLabel}:${sample.priceToman}`,
        sample,
      ]),
    ).values(),
  );
  const activePrice = currentPrice(product);
  const verification = verifyMarketSamples({
    slug: canonicalMarketProductSlug(product),
    samples: unique,
    checkedAt,
    currentPriceToman: activePrice,
  });
  const snapshot = verification.snapshot;
  const included = verification.verifiedSamples;
  const excluded = verification.excludedSamples;
  const proposed = verification.verifiedMarketPriceToman;
  const rawAverage = verification.rawWeightedMarketPriceToman;
  const oldHistory = supersededHistory(product.pricing, checkedAt);

  if (!proposed || included.length < MIN_VALID_SAMPLES) {
    await updateProductPricingState(product.id, {
      ...product.pricing,
      sources,
      proposal: null,
      lastMarketSnapshot: snapshot,
      history: oldHistory,
      lastCheckedAt: checkedAt,
      lastStatus: errors.length && !snapshot.observedSampleCount ? "error" : "insufficient",
      lastMessage: snapshot.observedSampleCount
        ? snapshot.summary
        : errors.slice(0, 3).join(" | ") || "قیمت معتبر کافی پیدا نشد.",
    });
    return errors.length && !snapshot.observedSampleCount ? "failed" : "insufficient";
  }

  if (activePrice === proposed) {
    await updateProductPricingState(product.id, {
      ...product.pricing,
      sources,
      proposal: null,
      lastMarketSnapshot: snapshot,
      history: oldHistory,
      lastCheckedAt: checkedAt,
      initialAppliedAt:
        mode === "initial-apply" && !product.pricing.initialAppliedAt
          ? checkedAt
          : product.pricing.initialAppliedAt,
      lastStatus: "insufficient",
      lastMessage: `قیمت فعلی با قیمت معتبر وزن‌دار بازار برابر است؛ ${snapshot.summary}`,
    });
    return "insufficient";
  }

  if (product.pricing.proposal?.proposedPriceToman === proposed) {
    await updateProductPricingState(product.id, {
      ...product.pricing,
      sources,
      lastMarketSnapshot: snapshot,
      lastCheckedAt: checkedAt,
      lastStatus: "pending",
      lastMessage: `پیشنهاد قبلی هنوز معتبر است؛ ${snapshot.summary}`,
    });
    return "skipped";
  }

  const proposal: MarketPriceProposal = {
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: checkedAt,
    currentPriceToman: activePrice,
    proposedPriceToman: proposed,
    rawAverageToman: Math.round(rawAverage ?? proposed),
    samples: included,
    excludedSamples: excluded,
    note: snapshot.summary,
    observedMinPriceToman: snapshot.observedMinPriceToman,
    observedMaxPriceToman: snapshot.observedMaxPriceToman,
    verifiedMinPriceToman: snapshot.verifiedMinPriceToman,
    verifiedMaxPriceToman: snapshot.verifiedMaxPriceToman,
    verifiedMedianToman: snapshot.verifiedMarketPriceToman,
    marketConfidenceScore: snapshot.confidenceScore,
    observedSampleCount: snapshot.observedSampleCount,
    verifiedSampleCount: snapshot.verifiedSampleCount,
    suspiciousSampleCount: snapshot.suspiciousSampleCount,
    trustedSellerCount: snapshot.trustedSellerCount,
    authenticityRisk: snapshot.authenticityRisk,
  };
'''
text = regex_once(
    text,
    r'  const unique = Array\.from\([\s\S]*?  const proposal: MarketPriceProposal = \{[\s\S]*?\n  \};\n(?=\n  if \(mode === "initial-apply")',
    legacy_replacement.rstrip(),
    "legacy verification block",
)
text = replace_once(
    text,
    '      sources,\n      proposal: null,\n      history: [',
    '      sources,\n      proposal: null,\n      lastMarketSnapshot: snapshot,\n      history: [',
    "legacy initial snapshot",
)
text = replace_once(
    text,
    '      lastMessage: `قیمت اولیه با مجوز مدیر از میانگین ${included.length} قیمت فروشنده معتبر اعمال شد.`,',
    '      lastMessage: `قیمت اولیه با مجوز مدیر از قیمت معتبر بازار و اطمینان ${snapshot.confidenceScore}٪ اعمال شد.`,',
    "legacy initial message",
)
text = replace_once(
    text,
    '    sources,\n    proposal,\n    history: oldHistory,',
    '    sources,\n    proposal,\n    lastMarketSnapshot: snapshot,\n    history: oldHistory,',
    "legacy proposal snapshot",
)
text = replace_once(
    text,
    '    lastMessage: `پیشنهاد جدید بر اساس ${included.length} قیمت معتبر آماده تأیید است.`,',
    '    lastMessage: `قیمت معتبر بازار با اطمینان ${snapshot.confidenceScore}٪ و ${included.length} نمونه آماده تأیید است.`,',
    "legacy proposal message",
)
p.write_text(text, encoding="utf-8")

# --- CMS pricing UI ---
p = Path("app/cms/PricingManager.tsx")
text = p.read_text(encoding="utf-8")
text = text.replace(
    '<span>میانگین پیشنهادی</span>',
    '<span>قیمت معتبر بازار</span>',
)
old = '''                <div className="spb-price-samples">
                  {proposal.samples.map((sample) => (
                    <a href={sample.url} target="_blank" rel="noreferrer" key={sample.provider}>
                      <span>{sample.sourceLabel}</span>
                      <strong>{money(sample.priceToman)}</strong>
                      <small>{sample.productName}</small>
                    </a>
                  ))}
                </div>'''
new = '''                <div className="spb-price-proposal__verification">
                  <span>اطمینان بازار: <strong>{proposal.marketConfidenceScore}٪</strong></span>
                  <span>معتبر: <strong>{proposal.verifiedSampleCount}</strong> از {proposal.observedSampleCount}</span>
                  <span>مشکوک: <strong>{proposal.suspiciousSampleCount}</strong></span>
                  <span>
                    بازه معتبر: <strong>{money(proposal.verifiedMinPriceToman)} تا {money(proposal.verifiedMaxPriceToman)}</strong>
                  </span>
                  <span>
                    کل بازار دیده‌شده: {money(proposal.observedMinPriceToman)} تا {money(proposal.observedMaxPriceToman)}
                  </span>
                </div>
                <div className="spb-price-samples">
                  {proposal.samples.map((sample) => (
                    <a
                      href={sample.url}
                      target="_blank"
                      rel="noreferrer"
                      key={`${sample.provider}-${sample.sourceLabel}-${sample.priceToman}`}
                    >
                      <span>{sample.sourceLabel}</span>
                      <strong>{money(sample.priceToman)}</strong>
                      <small>{sample.productName}</small>
                      <small>اعتماد {sample.trustScore ?? 0}٪ · اطمینان {sample.confidenceScore ?? 0}٪</small>
                    </a>
                  ))}
                </div>
                {proposal.excludedSamples.length > 0 && (
                  <details className="spb-price-excluded">
                    <summary>قیمت‌های خارج‌شده از محاسبه ({proposal.excludedSamples.length})</summary>
                    <div className="spb-price-samples">
                      {proposal.excludedSamples.map((sample) => (
                        <a
                          href={sample.url}
                          target="_blank"
                          rel="noreferrer"
                          key={`excluded-${sample.provider}-${sample.sourceLabel}-${sample.priceToman}`}
                        >
                          <span>{sample.sourceLabel}</span>
                          <strong>{money(sample.priceToman)}</strong>
                          <small>{sample.exclusionReason || "نیازمند بررسی دستی"}</small>
                        </a>
                      ))}
                    </div>
                  </details>
                )}'''
text = replace_once(text, old, new, "CMS proposal evidence")
marker = '''      <details className="spb-pricing-panel">
        <summary>
          <span>تنظیمات پیشرفته منابع</span>'''
snapshot_panel = '''      {selected?.pricing.lastMarketSnapshot && (
        <details className="spb-pricing-panel" open>
          <summary>
            <span>آخرین تصویر واقعی بازار</span>
            <b>{selected.pricing.lastMarketSnapshot.confidenceScore}٪</b>
          </summary>
          <div className="spb-market-snapshot">
            <p>{selected.pricing.lastMarketSnapshot.summary}</p>
            <div className="spb-price-proposal__verification">
              <span>قیمت معتبر بازار: <strong>{money(selected.pricing.lastMarketSnapshot.verifiedMarketPriceToman)}</strong></span>
              <span>بازه معتبر: <strong>{money(selected.pricing.lastMarketSnapshot.verifiedMinPriceToman)} تا {money(selected.pricing.lastMarketSnapshot.verifiedMaxPriceToman)}</strong></span>
              <span>بازه مشاهده‌شده: {money(selected.pricing.lastMarketSnapshot.observedMinPriceToman)} تا {money(selected.pricing.lastMarketSnapshot.observedMaxPriceToman)}</span>
              <span>نمونه معتبر: {selected.pricing.lastMarketSnapshot.verifiedSampleCount} از {selected.pricing.lastMarketSnapshot.observedSampleCount}</span>
              <span>قیمت مشکوک: {selected.pricing.lastMarketSnapshot.suspiciousSampleCount}</span>
            </div>
          </div>
        </details>
      )}

'''
text = replace_once(text, marker, snapshot_panel + marker, "CMS snapshot panel")
p.write_text(text, encoding="utf-8")

# --- Telegram/email proposal alerts ---
p = Path("app/lib/market-price-alerts.ts")
text = p.read_text(encoding="utf-8")
text = replace_once(
    text,
    '    `قیمت پیشنهادی: ${toman(proposal.proposedPriceToman)}`,\n    `بررسی و تأیید: ${cmsUrl()}`,',
    '    `قیمت معتبر بازار: ${toman(proposal.proposedPriceToman)}`,\n    `بازه معتبر: ${toman(proposal.verifiedMinPriceToman)} تا ${toman(proposal.verifiedMaxPriceToman)}`,\n    `اطمینان بازار: ${proposal.marketConfidenceScore}٪`,\n    `نمونه معتبر: ${proposal.verifiedSampleCount} از ${proposal.observedSampleCount}`,\n    `قیمت مشکوک حذف‌شده: ${proposal.suspiciousSampleCount}`,\n    `بررسی و تأیید: ${cmsUrl()}`,',
    "alert verification details",
)
p.write_text(text, encoding="utf-8")

# --- compact styling for the new evidence blocks ---
p = Path("app/cms/cms.css")
text = p.read_text(encoding="utf-8")
css = '''\n/* Verified market pricing evidence */\n.spb-price-proposal__verification { display:flex; flex-wrap:wrap; gap:8px 14px; padding:10px 12px; margin:10px 0; border-radius:12px; background:rgba(15,118,110,.06); font-size:.84rem; }\n.spb-price-proposal__verification span { display:inline-flex; gap:4px; align-items:center; }\n.spb-price-excluded { margin-top:10px; border:1px dashed rgba(180,83,9,.28); border-radius:12px; padding:8px 10px; }\n.spb-price-excluded > summary { cursor:pointer; color:#92400e; font-weight:700; }\n.spb-market-snapshot { padding:14px; }\n.spb-market-snapshot > p { margin:0 0 10px; line-height:1.9; }\n'''
if "/* Verified market pricing evidence */" not in text:
    text += css
p.write_text(text, encoding="utf-8")

print("market verification upgrade patched")
