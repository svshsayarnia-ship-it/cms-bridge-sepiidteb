import { verifyGithubActionsOidc } from "@/app/lib/github-actions-oidc";
import {
  listNewMarketPricingProposalAlerts,
  runMarketPricingScan,
} from "@/app/lib/market-pricing";
import { sendMarketPriceAlerts } from "@/app/lib/market-price-alerts";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!(await verifyGithubActionsOidc(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runMarketPricingScan();
    const alerts = await listNewMarketPricingProposalAlerts(summary.startedAt);
    const deliveries = await sendMarketPriceAlerts(alerts);
    return Response.json({ ok: true, summary, deliveries });
  } catch (error) {
    console.error("[market-pricing] GitHub scheduled scan failed", error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Market pricing scan failed",
      },
      { status: 500 },
    );
  }
}
