const ALLOWED_TAGS = new Set([
  "p", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "ul", "ol", "li",
  "blockquote", "a", "table", "thead", "tbody", "tr", "th", "td", "br", "hr",
  "article", "section", "header", "footer", "nav", "figure", "figcaption", "span", "img",
]);

const VOID_TAGS = new Set(["br", "hr", "img"]);

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function safeUrl(value: string, image = false) {
  const url = value.trim();
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (!image && url.startsWith("#")) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? url : "";
  } catch {
    return "";
  }
}

function readAttribute(source: string, name: string) {
  const match = source.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match ? (match[1] ?? match[2] ?? match[3] ?? "") : "";
}

export function sanitizeArticleHtml(input: string) {
  const withoutUnsafeBlocks = input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|option|link|meta|base|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|option|link|meta|base|svg|math)\b[^>]*\/?\s*>/gi, "");

  return withoutUnsafeBlocks.replace(/<\/?([a-z0-9]+)\b([^>]*)>/gi, (full, rawTag: string, rawAttributes: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (full.startsWith("</")) return VOID_TAGS.has(tag) ? "" : `</${tag}>`;

    const attributes: string[] = [];
    const id = readAttribute(rawAttributes, "id");
    if (id && /^(?:[a-z][a-z0-9_-]{0,79})$/i.test(id)) attributes.push(`id="${escapeAttribute(id)}"`);

    if (tag === "a") {
      const href = safeUrl(readAttribute(rawAttributes, "href"));
      const title = readAttribute(rawAttributes, "title");
      if (href) attributes.push(`href="${escapeAttribute(href)}"`);
      if (title) attributes.push(`title="${escapeAttribute(title.slice(0, 200))}"`);
      if (href.startsWith("https://")) attributes.push('target="_blank"', 'rel="noopener noreferrer"');
    }

    if (tag === "img") {
      const src = safeUrl(readAttribute(rawAttributes, "src"), true);
      if (!src) return "";
      attributes.push(`src="${escapeAttribute(src)}"`);
      attributes.push(`alt="${escapeAttribute(readAttribute(rawAttributes, "alt").slice(0, 300))}"`);
      attributes.push('loading="lazy"');
      for (const dimension of ["width", "height"]) {
        const value = readAttribute(rawAttributes, dimension);
        if (/^\d{1,4}$/.test(value)) attributes.push(`${dimension}="${value}"`);
      }
    }

    if (tag === "th" || tag === "td") {
      for (const span of ["colspan", "rowspan"]) {
        const value = readAttribute(rawAttributes, span);
        if (/^[1-9]\d?$/.test(value)) attributes.push(`${span}="${value}"`);
      }
    }

    return `<${tag}${attributes.length ? ` ${attributes.join(" ")}` : ""}${VOID_TAGS.has(tag) ? " /" : ""}>`;
  });
}

export function encodeArticleHtml(html: string) {
  const encoded = Buffer.from(sanitizeArticleHtml(html), "utf8").toString("base64");
  return encoded.match(/.{1,8000}/g) ?? [];
}

export function decodeArticleHtml(chunks?: string[]) {
  if (!chunks?.length) return "";
  try {
    return Buffer.from(chunks.join(""), "base64").toString("utf8");
  } catch {
    return "";
  }
}
