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

function collectSenderFields(value: unknown, path = "root", out: Array<{ path: string; value: string }> = []) {
  if (!value || typeof value !== "object") return out;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectSenderFields(item, `${path}[${index}]`, out));
    return out;
  }
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = `${path}.${key}`;
    if (/^(sender|from|sender_id|sender_number|from_number)$/i.test(key) && typeof item === "string") {
      out.push({ path: nextPath, value: item.slice(0, 80) });
    } else if (item && typeof item === "object") {
      collectSenderFields(item, nextPath, out);
    }
  }
  return out.slice(0, 20);
}

export async function GET() {
  const base = safeBase();
  if (!base) return Response.json({ ok: false, stage: "config" }, { status: 503 });
  try {
    const response = await fetch(`${base}/wp-json/wpsms/v1/settings/gateways`, {
      headers: { accept: "application/json", "cache-control": "no-store" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await response.json().catch(() => null) as unknown;
    return Response.json({
      ok: response.ok,
      status: response.status,
      authRequired: response.status === 401 || response.status === 403,
      senderFields: response.ok ? collectSenderFields(payload) : [],
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ ok: false, stage: error instanceof Error ? error.name : "unknown" }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
