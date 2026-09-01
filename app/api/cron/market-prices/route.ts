import { listNewMarketPricingProposalAlerts } from "@/app/lib/market-pricing";
import { runTorobMarketPricingBatch } from "@/app/lib/market-pricing-comprehensive";
import { sendMarketPriceAlerts } from "@/app/lib/market-price-alerts";
import { ensureMarketPriceTelegramWebhook } from "@/app/lib/market-price-telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function intParam(url: URL, name: string, fallback: number): number {
  const value = Number(url.searchParams.get(name));
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("finalize") === "1") {
    const startedAt = url.searchParams.get("startedAt") ?? "";
    const time = Date.parse(startedAt);
    if (!Number.isFinite(time)) {
      return Response.json({ ok: false, error: "Invalid startedAt" }, { status: 400 });
    }
    const telegramWebhook = await ensureMarketPriceTelegramWebhook();
    const alerts = await listNewMarketPricingProposalAlerts(new Date(time).toISOString());
    const deliveries = await sendMarketPriceAlerts(alerts);
    return Response.json({ ok: true, finalized: true, alertCount: alerts.length, deliveries, telegramWebhook });
  }

  try {
    const cursor = intParam(url, "cursor", 0);
    const limit = intParam(url, "limit", 10);
    const summary = await runTorobMarketPricingBatch(cursor, limit);
    return Response.json({ ok: true, scanMode: "batched-torob-v2", summary });
  } catch (error) {
    console.error("[market-pricing] batched cron scan failed", error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Market pricing batch failed",
      },
      { status: 500 },
    );
  }
}
