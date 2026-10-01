import { ensureApprovedInventoryProductsAvailable } from "@/app/lib/inventory-woo-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await ensureApprovedInventoryProductsAvailable([
      "fusion-f-vitamin-c",
    ]);
    return Response.json({ ok: true, result }, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
