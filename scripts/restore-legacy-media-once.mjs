import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const marker = path.join(root, "scripts", ".restore-legacy-media-once");

if (!(await fileExists(marker))) {
  console.info("[restore-build] one-time marker absent; skipping legacy media restore");
  process.exit(0);
}

const storeUrl = (process.env.WORDPRESS_URL ?? "").trim().replace(/\/$/u, "");
const consumerKey = (process.env.WOOCOMMERCE_CONSUMER_KEY ?? "").trim();
const consumerSecret = (process.env.WOOCOMMERCE_CONSUMER_SECRET ?? "").trim();

if (!storeUrl || !consumerKey || !consumerSecret) {
  console.warn("[restore-build] CMS credentials are unavailable; build continues without restore");
  process.exit(0);
}

const cardRolePrefix = "sepiid-role-card-";
const variantRolePrefix = "sepiid-role-variant-";
const sourceFiles = [
  "app/catalog.ts",
  "app/inventory/fillers.ts",
  "app/inventory/skin-support.ts",
  "app/current-inventory.ts",
];

const categoryFamilyImages = {
  fillers: "/images/products/editorial/fillers-family.webp",
  "skin-boosters": "/images/products/editorial/skin-boosters-family.webp",
  "botulinum-toxins": "/images/products/editorial/botulinum-family.webp",
  "rejuvenation-cocktails": "/images/products/editorial/rejuvenation-family.webp",
  "brightening-cocktails": "/images/products/editorial/brightening-family.webp",
  "eye-cocktails": "/images/products/editorial/eye-family.webp",
  "hair-cocktails": "/images/products/editorial/hair-family.webp",
};

function fileExists(filePath) {
  return fs.access(filePath).then(() => true).catch(() => false);
}

function canonicalSlug(value) {
  const clean = String(value ?? "").trim().toLowerCase();
  const duplicate = clean.match(/^(.*)-(\d+)$/u);
  if (!duplicate) return clean;
  const suffix = Number(duplicate[2]);
  return suffix >= 2 && suffix <= 20 ? duplicate[1] : clean;
}

function rolePart(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/gu, "-")
    .replace(/^-+|-+$/gu, "") || "item";
}

function roleToken(kind, slug, variantId = "") {
  return kind === "card"
    ? `${cardRolePrefix}${rolePart(slug)}-slot`
    : `${variantRolePrefix}${rolePart(slug)}-${rolePart(variantId)}-slot`;
}

function roleFileName(fileName, token) {
  const dot = fileName.lastIndexOf(".");
  const rawBase = dot > 0 ? fileName.slice(0, dot) : fileName;
  const extension = dot > 0 ? fileName.slice(dot + 1) : "webp";
  const cleanBase = rawBase.replace(/[^a-z0-9_-]+/giu, "-").replace(/^-+|-+$/gu, "").slice(0, 48) || "image";
  const cleanExtension = extension.replace(/[^a-z0-9]+/giu, "").toLowerCase() || "webp";
  return `${token}-${cleanBase}.${cleanExtension}`;
}

function imagePathFromBlock(block) {
  return block.match(/\bimage\s*:\s*["']([^"']+)["']/u)?.[1] ?? "";
}

function categoryFromBlock(block) {
  return block.match(/\bcategory\s*:\s*["']([^"']+)["']/u)?.[1] ?? "";
}

function addEntry(entries, slug, category, image, variants = {}) {
  const key = canonicalSlug(slug);
  if (!key) return;
  const current = entries.get(key) ?? { category: "", image: "", variants: {} };
  entries.set(key, {
    category: category || current.category,
    image: image || current.image,
    variants: { ...current.variants, ...variants },
  });
}

function extractBaseBlocks(source) {
  const lines = source.split("\n");
  const starts = [];
  let offset = 0;
  for (const line of lines) {
    const match = line.match(/^( {2,4})slug\s*:\s*["']([^"']+)["']/u);
    if (match && match[1].length <= 4) starts.push({ offset, slug: match[2] });
    offset += line.length + 1;
  }

  return starts.map((start, index) => ({
    slug: start.slug,
    block: source.slice(start.offset, starts[index + 1]?.offset ?? source.length),
  }));
}

function extractEntriesFromSource(source, entries) {
  for (const { slug, block } of extractBaseBlocks(source)) {
    const variantsIndex = block.search(/\bvariants\s*:/u);
    const cardSection = variantsIndex >= 0 ? block.slice(0, variantsIndex) : block;
    const variantSection = variantsIndex >= 0 ? block.slice(variantsIndex) : "";
    const variants = {};
    const ids = [...variantSection.matchAll(/\bid\s*:\s*["']([^"']+)["']/gu)];
    for (let index = 0; index < ids.length; index += 1) {
      const segment = variantSection.slice(ids[index].index, ids[index + 1]?.index ?? variantSection.length);
      const image = imagePathFromBlock(segment);
      if (image) variants[ids[index][1]] = image;
    }
    addEntry(entries, slug, categoryFromBlock(block), imagePathFromBlock(cardSection), variants);
  }

  for (const line of source.split("\n")) {
    const inline = line.match(/\{\s*slug\s*:\s*["']([^"']+)["']([\s\S]*?)\}/u);
    if (!inline) continue;
    addEntry(entries, inline[1], categoryFromBlock(inline[0]), imagePathFromBlock(inline[0]));
  }
}

function extractOfficialOverrides(source, entries) {
  const start = source.indexOf("const officialImageOverrides");
  if (start < 0) return;
  const block = source.slice(start);
  const keys = [...block.matchAll(/^  (?:"([^"]+)"|([a-z0-9_-]+))\s*:/gim)];
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index][1] || keys[index][2];
    const entryStart = keys[index].index;
    const entryEnd = keys[index + 1]?.index ?? block.length;
    const entry = block.slice(entryStart, entryEnd);
    const directImage = imagePathFromBlock(entry);
    const marketImage = entry.match(/marketReferenceImage\(\s*["']([^"']+)["']/u)?.[1];
    const image = directImage || (marketImage ? `/images/products/market-reference/${marketImage}.webp` : "");
    if (image) addEntry(entries, key, "", image);
  }
}

async function buildImageManifest() {
  const entries = new Map();
  for (const relative of sourceFiles) {
    extractEntriesFromSource(await fs.readFile(path.join(root, relative), "utf8"), entries);
  }
  extractOfficialOverrides(await fs.readFile(path.join(root, "app/catalog.ts"), "utf8"), entries);
  return entries;
}

function localAsset(value) {
  const clean = String(value ?? "").trim();
  if (!clean.startsWith("/images/products/") && !clean.startsWith("/images/drive/product-")) return null;
  if (clean.includes("..") || clean.includes("?") || clean.includes("#")) return null;
  return { url: clean, filePath: path.join(root, "public", clean.slice(1)), fileName: path.basename(clean) };
}

function mediaIdentity(image) {
  return `${image?.name ?? ""} ${image?.src ?? ""}`.toLowerCase();
}

async function readAsset(value) {
  const asset = localAsset(value);
  if (!asset || !(await fileExists(asset.filePath))) return null;
  const bytes = await fs.readFile(asset.filePath);
  if (bytes.length === 0 || bytes.length > 4 * 1024 * 1024) return null;
  const extension = path.extname(asset.filePath).toLowerCase();
  const mime = { ".gif": "image/gif", ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" }[extension];
  if (!mime) return null;
  return { ...asset, bytes, mime };
}

const authHeader = `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`;

async function requestJson(endpoint, options = {}, timeoutMs = 90_000) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${storeUrl}/wp-json/wc/v3/${endpoint}`, {
        ...options,
        headers: {
          accept: "application/json",
          "cache-control": "no-cache, no-store, max-age=0",
          authorization: authHeader,
          ...(options.headers ?? {}),
        },
        signal: controller.signal,
      });
      const text = await response.text();
      let body = null;
      try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      if (!response.ok) throw new Error(`${response.status}: ${body?.message ?? "WooCommerce request failed"}`);
      return body;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const transient = /fetch failed|ETIMEDOUT|ECONNRESET|ECONNREFUSED|UND_ERR|aborted/i.test(message);
      if (!transient || attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError ?? new Error("WooCommerce request failed after retries");
}
async function uploadAsset(asset, token, alt) {
  const form = new FormData();
  form.set("file", new Blob([asset.bytes], { type: asset.mime }), roleFileName(asset.fileName, token));
  form.set("alt", alt);
  return requestJson("sepiid-media", {
    method: "POST",
    body: form,
    headers: { "x-sepiid-correlation-id": crypto.randomUUID() },
  });
}

async function listProducts() {
  const products = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await requestJson(`products?per_page=100&page=${page}&status=any`, {}, 90_000);
    if (!Array.isArray(batch) || batch.length === 0) break;
    products.push(...batch);
    if (batch.length < 100) break;
  }
  return products;
}

const entries = await buildImageManifest();
const products = await listProducts();
let restoredSlots = 0;
let updatedProducts = 0;
let skippedProducts = 0;
let failedProducts = 0;

console.info("[restore-build] started", { products: products.length, manifestEntries: entries.size });

for (const product of products) {
  try {
    const key = canonicalSlug(product.slug);
    const entry = entries.get(key);
    if (!entry) {
      skippedProducts += 1;
      continue;
    }

    const cardImage = entry.image || categoryFamilyImages[entry.category] || "";
    const images = Array.isArray(product.images) ? product.images : [];
    const nextImages = images.map((image) => ({ id: Number(image.id) })).filter((image) => Number.isSafeInteger(image.id) && image.id > 0);
    const restored = [];

    if (!images.some((image) => mediaIdentity(image).includes(roleToken("card", key)))) {
      const asset = await readAsset(cardImage);
      if (asset) {
        const uploaded = await uploadAsset(asset, roleToken("card", key), `تصویر اصلی ${product.name}`);
        if (uploaded?.id) {
          nextImages.push({ id: Number(uploaded.id) });
          restored.push("card");
        }
      }
    }

    for (const [variantId, variantImage] of Object.entries(entry.variants)) {
      const token = roleToken("variant", key, variantId);
      if (images.some((image) => mediaIdentity(image).includes(token))) continue;
      const asset = await readAsset(variantImage);
      if (!asset) continue;
      const uploaded = await uploadAsset(asset, token, `تصویر مدل ${variantId} ${product.name}`);
      if (uploaded?.id) {
        nextImages.push({ id: Number(uploaded.id) });
        restored.push(`variant:${variantId}`);
      }
    }

    if (restored.length === 0) {
      skippedProducts += 1;
      continue;
    }

    await requestJson(`products/${product.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ images: nextImages }),
    }, 90_000);
    restoredSlots += restored.length;
    updatedProducts += 1;
    console.info("[restore-build] product restored", { id: product.id, slug: product.slug, restored });
  } catch (error) {
    failedProducts += 1;
    console.warn("[restore-build] product failed", {
      id: product.id,
      slug: product.slug,
      error: error instanceof Error ? error.message : "unknown error",
    });
  }
}

console.info("[restore-build] completed", {
  products: products.length,
  updatedProducts,
  restoredSlots,
  skippedProducts,
  failedProducts,
});
