import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function requireAsset(relativePath) {
  try {
    await access(path.join(root, relativePath));
  } catch {
    failures.push(`${relativePath}: required variant image is missing`);
  }
}

const experience = await read("app/components/ProductVariantExperience.tsx");
const currentInventory = await read("app/current-inventory.ts");
const fillers = await read("app/inventory/fillers.ts");
const skinSupport = await read("app/inventory/skin-support.ts");

const requiredExperienceTokens = [
  "variantFallbackImages",
  "selectedVariantHasDisplayMedia",
  "shouldUseNeutralVariantFallback",
  'selectedVariant?.imageKind === "editorial-family"',
  'selectedVariant?.imageKind === "market-reference"',
];

for (const token of requiredExperienceTokens) {
  if (!experience.includes(token)) {
    failures.push(`ProductVariantExperience.tsx: missing variant-media guard ${token}`);
  }
}

if (
  experience.includes(
    "selectedVariant?.imageVerified === true &&\n      selectedVariant.image?.trim()",
  )
) {
  failures.push(
    "ProductVariantExperience.tsx: variant selection is still restricted to exact verified images",
  );
}

const requiredInventoryMappings = [
  'image: "/images/products/alcarisa-28.webp"',
  'image: "/images/products/neuramis-lido-1ml.webp"',
  'variant.id === "10ml"',
  'imageKind: "editorial-family" as const',
  'nameFa: "پرلوکس نوا"',
  'nameFa: "پرلوکس لیپ"',
];

for (const token of requiredInventoryMappings) {
  if (!currentInventory.includes(token)) {
    failures.push(`current-inventory.ts: missing corrected mapping ${token}`);
  }
}

const requiredDistinctFillerAssets = [
  "/images/products/alcarisa-16.webp",
  "/images/products/alcarisa-20.webp",
  "/images/products/alcarisa-24.webp",
  "/images/products/eptq/eptq-s100.webp",
  "/images/products/eptq/eptq-s300.webp",
  "/images/products/eptq/eptq-s500.webp",
  "/images/products/neuramis-deep-1ml.webp",
  "/images/products/neuramis-volume-1ml.webp",
  "/images/products/neuramis-deep-10-pack.webp",
  "/images/products/neuramis-lido-10-pack.webp",
];

for (const asset of requiredDistinctFillerAssets) {
  if (!fillers.includes(asset)) {
    failures.push(`fillers.ts: expected model-specific image mapping missing ${asset}`);
  }
}

const requiredJaluproAssets = [
  "/images/products/jalupro-classic.webp",
  "/images/products/jalupro-hmw.webp",
  "/images/products/jalupro-super-hydro.webp",
];

for (const asset of requiredJaluproAssets) {
  if (!skinSupport.includes(asset)) {
    failures.push(`skin-support.ts: expected Jalupro image mapping missing ${asset}`);
  }
}

for (const relativePath of [
  "public/images/products/alcarisa-28.webp",
  "public/images/products/neuramis-lido-1ml.webp",
  "public/images/products/alcarisa-16.webp",
  "public/images/products/alcarisa-20.webp",
  "public/images/products/alcarisa-24.webp",
  "public/images/products/eptq/eptq-s100.webp",
  "public/images/products/eptq/eptq-s300.webp",
  "public/images/products/eptq/eptq-s500.webp",
  "public/images/products/neuramis-deep-1ml.webp",
  "public/images/products/neuramis-volume-1ml.webp",
  "public/images/products/neuramis-deep-10-pack.webp",
  "public/images/products/neuramis-lido-10-pack.webp",
  "public/images/products/jalupro-classic.webp",
  "public/images/products/jalupro-hmw.webp",
  "public/images/products/jalupro-super-hydro.webp",
]) {
  await requireAsset(relativePath);
}

if (failures.length) {
  console.error("Product variant media audit failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Product variant media audit passed.");
