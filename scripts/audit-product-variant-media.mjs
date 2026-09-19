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
const productCard = await read("app/components/ProductCard.tsx");
const publicProduct = await read("app/lib/public-product.ts");
const storefrontCatalog = await read("app/lib/storefront-catalog.ts");
const featuredCarousel = await read("app/components/FeaturedProductCarousel.tsx");
const homePage = await read("app/page.tsx");
const currentInventory = await read("app/current-inventory.ts");
const fillers = await read("app/inventory/fillers.ts");
const skinSupport = await read("app/inventory/skin-support.ts");

const requiredExperienceTokens = [
  "selectedCmsVariantImage",
  "selectedVariantImage",
  "canonicalImage",
  "selectedCmsImage",
];

for (const token of requiredExperienceTokens) {
  if (!experience.includes(token)) {
    failures.push(`ProductVariantExperience.tsx: missing variant-media guard ${token}`);
  }
}

if (experience.includes("selectedBundledImage") || experience.includes("variantFallbackImages")) {
  failures.push(
    "ProductVariantExperience.tsx: variant selection still contains non-CMS image fallbacks",
  );
}


const regressionChecks = [
  {
    source: productCard,
    token: 'getVariantImage(previewVariant)',
    message: "ProductCard.tsx: selected card variant does not resolve its own image",
  },
  {
    source: productCard,
    token: 'fallbackImage:',
    message: "ProductCard.tsx: selected local variant is not routed through its own fallback image",
  },
  {
    source: publicProduct,
    token: "isPublicVariantImageSrc",
    message: "public-product.ts: verified model-specific variant assets are not public",
  },
  {
    source: storefrontCatalog,
    token: "isPublicVariantImageSrc(variant.image, variant.imageVerified)",
    message: "storefront-catalog.ts: missing exact local variant fallback when CMS role is empty",
  },
  {
    source: featuredCarousel,
    token: "priority={productIndex === 0}",
    message: "FeaturedProductCarousel.tsx: more than the first visible product may be eagerly loaded",
  },
  {
    source: featuredCarousel,
    token: "product.variants ?? []",
    message: "FeaturedProductCarousel.tsx: SSR variant data is not used for first paint",
  },
  {
    source: homePage,
    token: "variants: publicProduct.variants?.map",
    message: "page.tsx: homepage does not hydrate variant media on the server",
  },
];

for (const check of regressionChecks) {
  if (!check.source.includes(check.token)) {
    failures.push(check.message);
  }
}

if (productCard.includes("getVariantImage(variant, displayProduct.image)")) {
  failures.push(
    "ProductCard.tsx: a missing variant image still falls back to the parent image",
  );
}

if (featuredCarousel.includes("variant.image || product.image")) {
  failures.push(
    "FeaturedProductCarousel.tsx: a missing variant image still falls back to the parent image",
  );
}

if (/variant="carousel"[\s\S]{0,240}\bpriority\s*(?:\n|\r|\s|>)/u.test(featuredCarousel)) {
  failures.push(
    "FeaturedProductCarousel.tsx: carousel images use unconditional priority",
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
  "/images/products/audrey-m.webp",
  "/images/products/audrey-h.webp",
  "/images/products/inovosense-smile.webp",
  "/images/products/inovosense-style.webp",
  "/images/products/inovosense-shape.webp",
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
  "public/images/products/cutouts/alcarisa-28.webp",
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
  "public/images/products/audrey-m.webp",
  "public/images/products/audrey-h.webp",
  "public/images/products/inovosense-smile.webp",
  "public/images/products/inovosense-style.webp",
  "public/images/products/inovosense-shape.webp",
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
