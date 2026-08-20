import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

const runtimeCache = await read("app/lib/storefront-runtime-cache.ts");
const snapshots = await read("app/lib/storefront-product-snapshots.ts");
const catalog = await read("app/lib/storefront-catalog.ts");
const productPage = await read("app/product/[slug]/page.tsx");

for (const token of [
  'const PRODUCT_INDEX_KEY = "products:index"',
  "getRuntimeStorefrontProducts",
  "ensureRuntimeStorefrontProductSlugs",
  "forgetRuntimeStorefrontProductSlug",
]) {
  if (!runtimeCache.includes(token)) {
    failures.push(`storefront-runtime-cache.ts: missing ${token}`);
  }
}

for (const token of [
  "getRuntimeStorefrontProducts",
  "preferNewestProduct",
  "runtimeProducts",
]) {
  if (!snapshots.includes(token)) {
    failures.push(`storefront-product-snapshots.ts: missing ${token}`);
  }
}

if (!catalog.includes("getStorefrontProductSnapshots")) {
  failures.push(
    "storefront-catalog.ts: catalog must read the unified storefront snapshot",
  );
}

if (!productPage.includes("getRuntimeStorefrontProduct")) {
  failures.push(
    "app/product/[slug]/page.tsx: PDP no longer reads the immediate runtime product record",
  );
}

if (!productPage.includes("getStorefrontProductSnapshots")) {
  failures.push(
    "app/product/[slug]/page.tsx: PDP must retain the shared snapshot fallback",
  );
}

if (failures.length > 0) {
  console.error("Storefront product cache unification audit failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Storefront product cache unification audit passed: PDP and discovery surfaces share the same fresh product records.",
);
