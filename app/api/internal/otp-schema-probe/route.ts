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

function summarizeRoute(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const route = value as Record<string, unknown>;
  const endpoints = Array.isArray(route.endpoints) ? route.endpoints : [];
  return {
    namespace: typeof route.namespace === "string" ? route.namespace : null,
    methods: Array.from(new Set(endpoints.flatMap((endpoint) => {
      if (!endpoint || typeof endpoint !== "object") return [] as string[];
      const methods = (endpoint as Record<string, unknown>).methods;
      if (Array.isArray(methods)) return methods.filter((item): item is string => typeof item === "string");
      if (methods && typeof methods === "object") return Object.keys(methods as Record<string, unknown>);
      return [] as string[];
    }))),
    args: Array.from(new Set(endpoints.flatMap((endpoint) => {
      if (!endpoint || typeof endpoint !== "object") return [] as string[];
      const args = (endpoint as Record<string, unknown>).args;
      return args && typeof args === "object" ? Object.keys(args as Record<string, unknown>) : [] as string[];
    }))),
  };
}

export async function GET() {
  const base = safeBase();
  if (!base) return Response.json({ ok: false, stage: "config" }, { status: 503 });
  try {
    const root = await fetch(`${base}/wp-json`, {
      headers: { accept: "application/json", "cache-control": "no-store" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await root.json().catch(() => null) as { routes?: Record<string, unknown> } | null;
    if (!root.ok || !payload?.routes) return Response.json({ ok: false, stage: "index", status: root.status }, { status: 502 });

    const terms = /(sms|otp|ippanel|razban|pattern|message)/i;
    const matching = Object.entries(payload.routes)
      .filter(([path]) => terms.test(path))
      .map(([path, route]) => ({ path, ...summarizeRoute(route) }))
      .slice(0, 50);

    const exact = payload.routes["/sepiid/v1/auth/otp/request"] ?? null;
    return Response.json({
      ok: true,
      exact: summarizeRoute(exact),
      matching,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ ok: false, stage: error instanceof Error ? error.name : "unknown" }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
