import { NextResponse } from "next/server";
import { isAbanConfigured, isAbanWebhookConfigured } from "../../../../lib/aban-gateway";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_API_BASE = "https://abangateway.ir";

export async function GET() {
  const relatedEnvKeys = Object.keys(process.env)
    .filter((key) => /ABAN|GATEWAY/i.test(key))
    .sort();
  const paymentStartReady = isAbanConfigured();
  const webhookReady = isAbanWebhookConfigured();
  const token = (process.env.ABAN_API_TOKEN ?? "").trim();
  const rawBase = (process.env.ABAN_BASE_URL ?? DEFAULT_API_BASE).trim().replace(/\/$/, "");

  if (!paymentStartReady || !token) {
    return NextResponse.json(
      {
        provider: "aban",
        relatedEnvKeys,
        paymentStartReady: false,
        webhookReady,
        reachable: false,
        authAccepted: false,
        reason: "api_token_missing",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  let base: URL;
  try {
    base = new URL(rawBase);
  } catch {
    return NextResponse.json(
      {
        provider: "aban",
        relatedEnvKeys,
        paymentStartReady: true,
        webhookReady,
        reachable: false,
        authAccepted: false,
        reason: "invalid_base_url",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  if (base.protocol !== "https:" || base.hostname !== "abangateway.ir") {
    return NextResponse.json(
      {
        provider: "aban",
        relatedEnvKeys,
        paymentStartReady: true,
        webhookReady,
        reachable: false,
        authAccepted: false,
        reason: "invalid_base_domain",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      base.toString().replace(/\/$/, "") + "/api/v1/invoices/__sepiid_connectivity_probe__",
      {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: "Bearer " + token,
        },
        cache: "no-store",
        signal: controller.signal,
      },
    );

    const authAccepted = response.status !== 401 && response.status !== 403;
    return NextResponse.json(
      {
        provider: "aban",
        relatedEnvKeys,
        paymentStartReady: true,
        webhookReady,
        reachable: true,
        authAccepted,
        upstreamStatus: response.status,
      },
      {
        status: authAccepted ? 200 : 503,
        headers: { "cache-control": "no-store" },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        provider: "aban",
        relatedEnvKeys,
        paymentStartReady: true,
        webhookReady,
        reachable: false,
        authAccepted: false,
        reason: error instanceof Error && error.name === "AbortError"
          ? "probe_timeout"
          : "probe_failed",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  } finally {
    clearTimeout(timeout);
  }
}
