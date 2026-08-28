const DEFAULT_SITE_URL = "https://sepiidbeauty.ir";

export const siteOrigin = (() => {
  const configuredUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  try {
    const url = new URL(configuredUrl || DEFAULT_SITE_URL);

    // The production domain is configured as the apex domain. Vercel keeps
    // the www alias as a redirect, so emitting www in canonical, OG, robots,
    // or sitemap URLs creates a second URL hop and conflicting SEO signals.
    if (url.hostname.toLowerCase() === "www.sepiidbeauty.ir") {
      url.hostname = "sepiidbeauty.ir";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
})();
