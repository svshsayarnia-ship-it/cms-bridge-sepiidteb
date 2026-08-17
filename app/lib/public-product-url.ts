import { isApprovedInventorySlug } from "../current-inventory";

const duplicateWooSuffix = /^(.*)-([2-9]\d*)$/;

export function canonicalPublicProductSlug(slug: string): string {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug || isApprovedInventorySlug(normalizedSlug)) {
    return normalizedSlug;
  }

  const match = normalizedSlug.match(duplicateWooSuffix);
  const candidateSlug = match?.[1] ?? "";

  return candidateSlug && isApprovedInventorySlug(candidateSlug)
    ? candidateSlug
    : normalizedSlug;
}

export function canonicalizePublicProductPath(value: string): string {
  if (!value) return value;

  const isAbsolute = /^https?:\/\//i.test(value);

  try {
    const url = new URL(value, "https://sepiid.local");
    const match = url.pathname.match(/^\/product\/([^/]+)\/?$/);

    if (!match) return value;

    const requestedSlug = decodeURIComponent(match[1]);
    const canonicalSlug = canonicalPublicProductSlug(requestedSlug);

    if (canonicalSlug === requestedSlug) {
      return value;
    }

    url.pathname = `/product/${encodeURIComponent(canonicalSlug)}`;

    return isAbsolute
      ? url.toString()
      : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return value;
  }
}
