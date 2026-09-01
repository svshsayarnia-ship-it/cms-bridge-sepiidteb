import { verifyGithubActionsOidc } from "@/app/lib/github-actions-oidc";
import { listNewMarketPricingProposalAlerts } from "@/app/lib/market-pricing";
import { runTorobMarketPricingBatch } from "@/app/lib/market-pricing-comprehensive";
import { sendMarketPriceAlerts } from "@/app/lib/market-price-alerts";
import { ensureMarketPriceTelegramWebhook } from "@/app/lib/market-price-telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SCAN_MODE = "batched-torob-v4-curated-priority";

function intParam(url: URL, name: string, fallback: number): number {
  const value = Number(url.searchParams.get(name));
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
}

function validStartedAt(value: string | null): string | null {
  if (!value) return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  const age = Date.now() - time;
  if (age < -60_000 || age > 2 * 60 * 60 * 1000) return null;
  return new Date(time).toISOString();
}

export async function POST(request: Request) {
  if (!(await verifyGithubActionsOidc(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("health") === "1") {
    const telegramWebhook = await ensureMarketPriceTelegramWebhook();
    return Response.json({
      ok: true,
      authorized: true,
      scanMode: SCAN_MODE,
      telegramWebhook,
    });
  }

  if (url.searchParams.get("finalize") === "1") {
    const startedAt = validStartedAt(url.searchParams.get("startedAt"));
    if (!startedAt) {
      return Response.json({ ok: false, error: "Invalid startedAt" }, { status: 400 });
    }
    const telegramWebhook = await ensureMarketPriceTelegramWebhook();
    const alerts = await listNewMarketPricingProposalAlerts(startedAt);
    const deliveries = await sendMarketPriceAlerts(alerts);
    return Response.json({
      ok: true,
      finalized: true,
      scanMode: SCAN_MODE,
      alertCount: alerts.length,
      deliveries,
      telegramWebhook,
    });
  }

  try {
    const cursor = intParam(url, "cursor", 0);
    const limit = intParam(url, "limit", 10);
    const summary = await runTorobMarketPricingBatch(cursor, limit);
    return Response.json({ ok: true, scanMode: SCAN_MODE, summary });
  } catch (error) {
    console.error("[market-pricing] GitHub batched scan failed", error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Market pricing batch failed",
        scanMode: SCAN_MODE,
      },
      { status: 500 },
    );
  }
}
