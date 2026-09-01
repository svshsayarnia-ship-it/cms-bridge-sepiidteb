import { NextResponse } from "next/server";

const CHATGPT_SOURCE = "chatgpt.com";

type AiReferralPayload = {
  source?: unknown;
  via?: unknown;
  landingPath?: unknown;
};

function cleanPath(value: unknown) {
  if (typeof value !== "string") return "";
  const clean = value.trim();
  if (!clean.startsWith("/") || clean.length > 300) return "";
  return clean.split("?")[0]?.split("#")[0] ?? "";
}

export async function POST(request: Request) {
  let payload: AiReferralPayload;

  try {
    payload = (await request.json()) as AiReferralPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const source = typeof payload.source === "string" ? payload.source.toLowerCase() : "";
  const via = payload.via === "utm_source" || payload.via === "referrer" ? payload.via : "";
  const landingPath = cleanPath(payload.landingPath);

  if (source !== CHATGPT_SOURCE || !via || !landingPath) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  console.info(
    "ai_referral",
    JSON.stringify({ source: CHATGPT_SOURCE, via, landingPath }),
  );

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
