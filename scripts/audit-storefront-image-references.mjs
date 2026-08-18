import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appRoot = path.join(root, "app");
const publicRoot = path.join(root, "public");

const PRODUCT_ROOT = "/images/products/";
const CUTOUT_ROOT = "/images/products/cutouts/";
const DRIVE_PRODUCT_ROOT = "/images/drive/product-";
const TOP_AGE_PRO_SOURCE = "/images/products/sourced/mesolike-top-age-pro.webp";
const TOP_AGE_PRO_CUTOUT = "/images/products/cutouts/sourced/mesolike-top-age-pro.webp";
const TOP_AGE_PRO_CLEAN_CUTOUT = "/images/products/cutouts/sourced/mesolike-top-age-pro-clean.svg";
const WHITE_CARTON_SOURCE_ASSETS = new Set([
  "/images/products/sourced/f-mesomatrix.webp",
  "/images/products/sourced/fusion-f-radiance.webp",
  "/images/products/sourced/fusion-lift-face.webp",
  "/images/products/sourced/fusion-melaclear.webp",
  "/images/products/sourced/f-vitamin-c.webp",
  "/images/products/sourced/f-melirutin.webp",
  "/images/products/sourced/f-eye-contour.webp",
  "/images/products/sourced/f-hair.webp",
  "/images/products/sourced/fusion-hair-men.webp",
]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return /\.(?:ts|tsx|js|mjs)$/u.test(entry.name) ? [absolute] : [];
  });
}

function publicFileExists(urlPath) {
  const clean = urlPath.split("?", 1)[0];
  if (!clean.startsWith("/")) return true;
  return fs.existsSync(path.join(publicRoot, clean.slice(1)));
}

function resolvedProductImage(urlPath) {
  const clean = urlPath.split("?", 1)[0];

  if (WHITE_CARTON_SOURCE_ASSETS.has(clean)) return clean;
  if (clean === TOP_AGE_PRO_SOURCE || clean === TOP_AGE_PRO_CUTOUT) {
    return TOP_AGE_PRO_CLEAN_CUTOUT;
  }
  if (clean.startsWith(CUTOUT_ROOT)) return clean;

  if (
    clean.startsWith(PRODUCT_ROOT) &&
    !clean.startsWith(`${PRODUCT_ROOT}editorial/`)
  ) {
    const relative = clean
      .slice(PRODUCT_ROOT.length)
      .replace(/\.(?:png|jpe?g|webp)$/iu, ".webp");
    return `${CUTOUT_ROOT}${relative}`;
  }

  if (clean.startsWith(DRIVE_PRODUCT_ROOT)) {
    const filename = clean
      .split("/")
      .pop()
      ?.replace(/\.(?:png|jpe?g|webp)$/iu, ".webp");
    return filename ? `${CUTOUT_ROOT}drive/${filename}` : clean;
  }

  return clean;
}

const references = new Map();
const literalPattern = /["'`](\/images\/(?:categories|products|drive)\/[^"'`?\s)]+(?:\?[^"'`\s)]*)?)["'`]/gu;

for (const file of walk(appRoot)) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(literalPattern)) {
    const ref = match[1];
    if (!references.has(ref)) references.set(ref, new Set());
    references.get(ref).add(path.relative(root, file));
  }
}

const failures = [];
for (const [ref, owners] of references) {
  const sourceRef = ref.split("?", 1)[0];
  if (!publicFileExists(sourceRef)) {
    failures.push(
      `${sourceRef} is missing (referenced by ${[...owners].join(", ")})`,
    );
    continue;
  }

  const resolved = resolvedProductImage(sourceRef);
  if (resolved !== sourceRef && !publicFileExists(resolved)) {
    failures.push(
      `${sourceRef} resolves to missing ${resolved} (referenced by ${[...owners].join(", ")})`,
    );
  }
}

if (failures.length > 0) {
  console.error("Storefront image reference audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `[storefront-image-audit] ${references.size} literal product/category image references resolve to existing public assets`,
);
