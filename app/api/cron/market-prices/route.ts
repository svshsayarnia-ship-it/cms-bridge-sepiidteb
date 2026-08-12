import { runMarketPricingScan } from "@/app/lib/market-pricing";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return Response.json({ ok: true, summary: await runMarketPricingScan() });
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
