const baseUrl = new URL(
  process.env.SEO_BASE_URL ??
    "http://127.0.0.1:3000",
);
const canonicalOrigin = (
  process.env.SEO_CANONICAL_ORIGIN ??
  "https://www.sepiidbeauty.ir"
).replace(/\/$/, "");
const skipLinkCheck =
  process.env.SEO_SKIP_LINK_CHECK === "1";
const assertPublicRedirects =
  process.env.SEO_ASSERT_PUBLIC_REDIRECTS === "1";

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function tags(html, name) {
  return [
    ...html.matchAll(
      new RegExp(`<${name}\\b[^>]*>`, "gi"),
    ),
  ].map((match) => match[0]);
}

function attribute(tag, name) {
  return decodeHtml(
    tag.match(
      new RegExp(
        `\\b${name}\\s*=\\s*["']([^"']*)["']`,
        "i",
      ),
    )?.[1] ?? "",
  );
}

function meta(html, key, value) {
  return attribute(
    tags(html, "meta").find(
      (tag) =>
        attribute(tag, key).toLowerCase() ===
        value.toLowerCase(),
    ) ?? "",
    "content",
  );
}

function link(html, rel) {
  return attribute(
    tags(html, "link").find((tag) =>
      attribute(tag, "rel")
        .toLowerCase()
        .split(/\s+/)
        .includes(rel),
    ) ?? "",
    "href",
  );
}

function elementText(html, name) {
  const match = html.match(
    new RegExp(
      `<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`,
      "i",
    ),
  );

  return decodeHtml(
    (match?.[1] ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function normalizeUrl(value, base) {
  const url = new URL(value, base);
  url.hash = "";

  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/$/, "");
  }

  return url.toString();
}

function jsonLdErrors(html) {
  const scripts = [
    ...html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];

  return scripts.filter((match) => {
    try {
      JSON.parse(match[1]);
      return false;
    } catch {
      return true;
    }
  }).length;
}

function internalLinks(html, pageUrl) {
  const links = new Set();

  for (const tag of tags(html, "a")) {
    const href = attribute(tag, "href");
    if (
      !href ||
      href.startsWith("#") ||
      /^(?:mailto|tel|javascript):/i.test(href)
    ) {
      continue;
    }

    const url = new URL(href, pageUrl);
    if (
      [baseUrl.hostname, "sepiidbeauty.ir", "www.sepiidbeauty.ir"].includes(
        url.hostname,
      )
    ) {
      links.add(
        new URL(
          `${url.pathname}${url.search}`,
          baseUrl,
        ).toString(),
      );
    }
  }

  return [...links];
}

async function get(url) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
      headers: {
        "user-agent":
          "SepiidTechnicalSeoAudit/1.0",
      },
    });

    return {
      response,
      html: await response.text(),
      error: "",
    };
  } catch (error) {
    return {
      response: {
        ok: false,
        status: 0,
        url: String(url),
      },
      html: "",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
}

async function getManualRedirect(url) {
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
      headers: {
        "user-agent": "SepiidTechnicalSeoAudit/1.0",
      },
    });

    return { response, error: "" };
  } catch (error) {
    return {
      response: {
        status: 0,
        headers: new Headers(),
      },
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
}

async function mapInBatches(
  items,
  batchSize,
  operation,
) {
  const results = [];

  for (
    let index = 0;
    index < items.length;
    index += batchSize
  ) {
    results.push(
      ...(await Promise.all(
        items
          .slice(index, index + batchSize)
          .map(operation),
      )),
    );
  }

  return results;
}

const sitemapUrl = new URL(
  "/sitemap.xml",
  baseUrl,
);
const { response: sitemapResponse, html: sitemapXml } =
  await get(sitemapUrl);

if (!sitemapResponse.ok) {
  console.error(
    `SEO audit failed: sitemap returned ${sitemapResponse.status}.`,
  );
  process.exit(1);
}

const sitemapUrls = [
  ...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g),
].map((match) => decodeHtml(match[1]));
const duplicateSitemapUrls = sitemapUrls.filter(
  (url, index, urls) =>
    urls.indexOf(url) !== index,
);

const discoveredLinks = new Set();

const pageResults = await mapInBatches(
  sitemapUrls,
  6,
  async (sitemapEntry) => {
  const pathname = new URL(sitemapEntry).pathname;
  const requestUrl = new URL(pathname, baseUrl);
  const { response, html, error } =
    await get(requestUrl);
  const title = elementText(html, "title");
  const description = meta(
    html,
    "name",
    "description",
  );
  const canonical = link(html, "canonical");
  const robots = meta(html, "name", "robots");
  const htmlTag = tags(html, "html")[0] ?? "";
  const h1Count = (
    html.match(/<h1\b/gi) ?? []
  ).length;
  const missingAlt = tags(html, "img").filter(
    (tag) => !/\balt\s*=/i.test(tag),
  ).length;
  const expectedCanonical = `${canonicalOrigin}${pathname === "/" ? "/" : pathname.replace(/\/$/, "")}`;
  const issues = [];
  const warnings = [];

  if (response.status !== 200) {
    issues.push(`HTTP ${response.status}`);
  }
  if (error) {
    issues.push(`request failed: ${error}`);
  }
  if (!title) issues.push("missing title");
  if (!description) issues.push("missing description");
  if (!canonical) issues.push("missing canonical");
  if (
    canonical &&
    normalizeUrl(canonical) !==
      normalizeUrl(expectedCanonical)
  ) {
    issues.push(
      `canonical mismatch: ${canonical}`,
    );
  }
  if (h1Count !== 1) {
    issues.push(`H1 count ${h1Count}`);
  }
  if (attribute(htmlTag, "lang") !== "fa") {
    issues.push("html lang is not fa");
  }
  if (attribute(htmlTag, "dir") !== "rtl") {
    issues.push("html dir is not rtl");
  }
  if (/noindex/i.test(robots)) {
    issues.push("indexable URL has noindex");
  }
  if (jsonLdErrors(html)) {
    issues.push("invalid JSON-LD");
  }
  if (missingAlt) {
    issues.push(`${missingAlt} image(s) missing alt`);
  }

  const requiredSocialTags = [
    ["property", "og:title"],
    ["property", "og:description"],
    ["property", "og:url"],
    ["property", "og:image"],
    ["name", "twitter:card"],
    ["name", "twitter:title"],
    ["name", "twitter:description"],
    ["name", "twitter:image"],
  ];

  for (const [key, value] of requiredSocialTags) {
    if (!meta(html, key, value)) {
      issues.push(`missing ${value}`);
    }
  }

  if (title && (title.length < 20 || title.length > 70)) {
    warnings.push(`title length ${title.length}`);
  }
  if (
    description &&
    (description.length < 70 ||
      description.length > 170)
  ) {
    warnings.push(
      `description length ${description.length}`,
    );
  }

  for (const href of internalLinks(
    html,
    requestUrl,
  )) {
    discoveredLinks.add(href);
  }

  return {
    path: pathname,
    title,
    description,
    canonical,
    issues,
    warnings,
  };
  },
);

const duplicateTitles = pageResults.filter(
  (page, index, pages) =>
    pages.findIndex(
      (candidate) =>
        candidate.title === page.title,
    ) !== index,
);
const duplicateDescriptions = pageResults.filter(
  (page, index, pages) =>
    pages.findIndex(
      (candidate) =>
        candidate.description ===
        page.description,
    ) !== index,
);

const brokenLinks = skipLinkCheck
  ? []
  : (
  await mapInBatches(
    [...discoveredLinks],
    8,
    async (href) => {
  const { response, error } = await get(href);

  if (error) {
    return {
      href: new URL(href).pathname,
      status: 0,
      error,
    };
  }

  if (response.status >= 400) {
    return {
      href: new URL(href).pathname,
      status: response.status,
    };
  }

      return null;
    },
  )
).filter(Boolean);

const technicalIssues = [];
const { response: robotsResponse, html: robotsText } =
  await get(new URL("/robots.txt", baseUrl));

if (robotsResponse.status !== 200) {
  technicalIssues.push(
    `robots.txt returned ${robotsResponse.status}`,
  );
}
for (const directive of [
  "Disallow: /api/",
  "Disallow: /cms/",
  `Sitemap: ${canonicalOrigin}/sitemap.xml`,
]) {
  if (!robotsText.includes(directive)) {
    technicalIssues.push(
      `robots.txt missing ${directive}`,
    );
  }
}

for (const deprecatedTag of ["<priority>", "<changefreq>"]) {
  if (sitemapXml.includes(deprecatedTag)) {
    technicalIssues.push(
      `sitemap should not emit ${deprecatedTag}`,
    );
  }
}

for (const [path, expectedCanonical] of [
  ["/shop/fillers?brand=neuramis", "/shop/fillers"],
  ["/shop/fillers?page=2", "/shop/fillers"],
  [
    "/product/neuramis-deep-lidocaine?variant=deep-1ml",
    "/product/neuramis-deep-lidocaine",
  ],
]) {
  const { response, html, error } = await get(
    new URL(path, baseUrl),
  );
  const canonical = link(html, "canonical");
  const robots = meta(html, "name", "robots");
  const expected = `${canonicalOrigin}${expectedCanonical}`;

  if (response.status !== 200 || error) {
    technicalIssues.push(
      `${path} did not return a crawlable 200 response`,
    );
  } else if (normalizeUrl(canonical) !== normalizeUrl(expected)) {
    technicalIssues.push(
      `${path} canonical mismatch: ${canonical}`,
    );
  } else if (!/noindex/i.test(robots)) {
    technicalIssues.push(
      `${path} should be noindex`,
    );
  }
}

if (assertPublicRedirects) {
  const apexOrigin = process.env.SEO_NON_WWW_ORIGIN ?? "https://sepiidbeauty.ir";
  const { response, error } = await getManualRedirect(
    new URL("/", apexOrigin),
  );
  const destination = response.headers.get("location") ?? "";

  if (
    error ||
    ![301, 308].includes(response.status) ||
    !destination ||
    normalizeUrl(destination, apexOrigin) !== normalizeUrl(`${canonicalOrigin}/`)
  ) {
    technicalIssues.push(
      `non-www host must redirect permanently to ${canonicalOrigin}/`,
    );
  }

  for (const [legacySlug, canonicalSlug] of [
    [
      "فیلر-نورامیس-چیست-راهنمای-کامل-مدل-ها-کاربردها-و-تشخیص-اصالت",
      "neuramis-filler-guide",
    ],
    [
      "۱۰-فیلر-برتر-بازار-ایران-راهنمای-انتخاب-آگاهانه",
      "best-fillers-iran-guide",
    ],
  ]) {
    const { response: redirectResponse, error: redirectError } =
      await getManualRedirect(
        new URL(`/magazine/${legacySlug}`, baseUrl),
      );
    const redirectLocation = redirectResponse.headers.get("location") ?? "";
    const expectedLocation = `${canonicalOrigin}/magazine/${canonicalSlug}`;

    if (
      redirectError ||
      ![301, 308].includes(redirectResponse.status) ||
      !redirectLocation ||
      normalizeUrl(redirectLocation, baseUrl) !== normalizeUrl(expectedLocation)
    ) {
      technicalIssues.push(
        `legacy article ${legacySlug} is not permanently redirected`,
      );
    }
  }
}

for (const path of [
  "/account",
  "/account/login",
  "/account/register",
  "/account/profile",
  "/cms",
  "/cms/login",
]) {
  const { response, html } = await get(
    new URL(path, baseUrl),
  );
  const robots = meta(
    html,
    "name",
    "robots",
  );

  if (response.status !== 200) {
    technicalIssues.push(
      `${path} returned ${response.status}`,
    );
  } else if (!/noindex/i.test(robots)) {
    technicalIssues.push(
      `${path} is missing noindex`,
    );
  }
}

const unpublishedProduct = await get(
  new URL(
    "/product/seo-audit-nonexistent-product",
    baseUrl,
  ),
);
const unpublishedRobots = meta(
  unpublishedProduct.html,
  "name",
  "robots",
);
if (
  unpublishedProduct.response.status !== 404 &&
  !/noindex/i.test(unpublishedRobots)
) {
  technicalIssues.push(
    `unknown product returned ${unpublishedProduct.response.status} without noindex`,
  );
}

const pagesWithIssues = pageResults.filter(
  (page) => page.issues.length,
);
const pagesWithWarnings = pageResults.filter(
  (page) => page.warnings.length,
);
const criticalCount =
  pagesWithIssues.length +
  duplicateTitles.length +
  duplicateDescriptions.length +
  brokenLinks.length +
  technicalIssues.length +
  duplicateSitemapUrls.length;

console.log(
  JSON.stringify(
    {
      baseUrl: baseUrl.toString(),
      canonicalOrigin,
      sitemapUrls: sitemapUrls.length,
      crawledPages: pageResults.length,
      discoveredInternalLinks:
        discoveredLinks.size,
      pagesWithIssues,
      pagesWithWarnings,
      duplicateTitles: duplicateTitles.map(
        (page) => page.path,
      ),
      duplicateDescriptions:
        duplicateDescriptions.map(
          (page) => page.path,
        ),
      brokenLinks,
      technicalIssues,
      duplicateSitemapUrls,
      passed: criticalCount === 0,
    },
    null,
    2,
  ),
);

process.exitCode = criticalCount ? 1 : 0;
