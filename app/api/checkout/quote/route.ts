import { NextResponse } from "next/server";
import { CheckoutOrderError, getCheckoutQuote } from "../../../lib/checkout-woocommerce";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ prices: await getCheckoutQuote(body.lines) }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof CheckoutOrderError ? error.message : "دریافت قیمت تازه کامل نشد." }, { status: error instanceof CheckoutOrderError ? error.status : 502, headers: { "cache-control": "no-store" } });
  }
}
