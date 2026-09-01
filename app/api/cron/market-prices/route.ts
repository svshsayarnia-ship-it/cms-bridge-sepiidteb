import { listNewMarketPricingProposalAlerts } from "@/app/lib/market-pricing";
import { runComprehensiveMarketPricingScan } from "@/app/lib/market-pricing-comprehensive";
import { sendMarketPriceAlerts } from "@/app/lib/market-price-alerts";
import { ensureMarketPriceTelegramWebhook } from "@/app/lib/market-price-telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const telegramWebhook = await ensureMarketPriceTelegramWebhook();

  try {
    const summary = await runComprehensiveMarketPricingScan();
    const alerts = await listNewMarketPricingProposalAlerts(summary.startedAt);
    const deliveries = await sendMarketPriceAlerts(alerts);
    return Response.json({ ok: true, summary, deliveries, telegramWebhook });
  } catch (error) {
    console.error("[market-pricing] daily scan failed", error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Market pricing scan failed",
        telegramWebhook,
      },
      { status: 500 },
    );
  }
}
