export const dynamic = "force-dynamic";

function safeBase() {
  const configured = (process.env.WORDPRESS_URL ?? "").trim().replace(/\/$/, "");
  if (!configured) return null;
  try {
    const url = new URL(configured);
    return url.protocol === "https:" || url.hostname === "localhost" ? url.origin + url.pathname.replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const base = safeBase();
  if (!base) return Response.json({ ok: false, stage: "config" }, { status: 503 });
  try {
    const response = await fetch(`${base}/wp-json/wpsms/v1/send`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json", "cache-control": "no-store" },
      body: JSON.stringify({ recipients: "numbers", numbers: [], message: "" }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
    const code = payload && typeof payload.code === "string" ? payload.code : null;
    const message = payload && typeof payload.message === "string" ? payload.message.slice(0, 160) : null;
    return Response.json({
      ok: true,
      status: response.status,
      authRequired: response.status === 401 || response.status === 403,
      code,
      message,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ ok: false, stage: error instanceof Error ? error.name : "unknown" }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
