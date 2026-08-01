const DEFAULT_SITE_URL = "https://sepiidbeauty.ir";

export const siteOrigin = (() => {
  const configuredUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  try {
    return new URL(configuredUrl || DEFAULT_SITE_URL).toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
})();
