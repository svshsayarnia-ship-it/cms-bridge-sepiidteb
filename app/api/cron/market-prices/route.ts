import {
  listNewMarketPricingProposalAlerts,
  runMarketPricingScan,
} from "@/app/lib/market-pricing";
import { sendMarketPriceAlerts } from "@/app/lib/market-price-alerts";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runMarketPricingScan();
    const alerts = await listNewMarketPricingProposalAlerts(summary.startedAt);
    const deliveries = await sendMarketPriceAlerts(alerts);
    return Response.json({ ok: true, summary, deliveries });
  } catch (error) {
    console.error("[market-pricing] daily scan failed", error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Market pricing scan failed",
      },
      { status: 500 },
    );
  }
}
