const baseUrl = new URL(
  process.env.SEO_BASE_URL ?? "http://127.0.0.1:3000",
);

const privateRoutes = [
  "/cart",
  "/checkout",
  "/account",
  "/account/login",
  "/account/register",
  "/account/profile",
  "/cms",
  "/cms/login",
];

function tags(html, name) {
  return [
    ...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi")),
  ].map((match) => match[0]);
}

function attribute(tag, name) {
  return (
    tag.match(
      new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"),
    )?.[1] ?? ""
  );
}

function robotsMeta(html) {
  const tag = tags(html, "meta").find(
    (candidate) => attribute(candidate, "name").toLowerCase() === "robots",
  );
  return attribute(tag ?? "", "content");
}

async function get(path) {
  const response = await fetch(new URL(path, baseUrl), {
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
    headers: {
      "user-agent": "SepiidPrivateRouteSeoAudit/1.0",
    },
  });

  return {
    response,
    text: await response.text(),
  };
}

const issues = [];
const sitemap = await get("/sitemap.xml");

if (!sitemap.response.ok) {
  console.error(
    `Private-route SEO audit failed: sitemap returned ${sitemap.response.status}.`,
  );
  process.exit(1);
}

const sitemapPaths = new Set(
  [...sitemap.text.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => {
    try {
      return new URL(match[1]).pathname.replace(/\/$/, "") || "/";
    } catch {
      return "";
    }
  }),
);

for (const path of privateRoutes) {
  try {
    const { response, text } = await get(path);
    const robots = robotsMeta(text);

    if (response.status !== 200) {
      issues.push(`${path} returned ${response.status}`);
      continue;
    }

    if (!/\bnoindex\b/i.test(robots)) {
      issues.push(`${path} is missing robots noindex`);
    }

    if (sitemapPaths.has(path)) {
      issues.push(`${path} must not be present in sitemap.xml`);
    }
  } catch (error) {
    issues.push(
      `${path} request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

console.log(
  JSON.stringify(
    {
      checkedRoutes: privateRoutes,
      issues,
      passed: issues.length === 0,
    },
    null,
    2,
  ),
);

process.exitCode = issues.length ? 1 : 0;
