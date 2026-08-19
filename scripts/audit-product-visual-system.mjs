import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const requiredProductVisualConsumers = [
  "app/components/ProductCard.tsx",
  "app/components/ProductVariantExperience.tsx",
  "app/components/FeaturedProductCarousel.tsx",
  "app/components/SiteHeader.tsx",
  "app/shop/[category]/page.tsx",
];

const requiredCategoryProfiles = [
  "fillers",
  "skin-boosters",
  "botulinum-toxins",
  "rejuvenation-cocktails",
  "brightening-cocktails",
  "eye-cocktails",
  "hair-cocktails",
  "hyaluronidase-products",
];

const deprecatedProductCss = [
  "app/fusion-product-images.css",
  "app/hyaluronidase-product-images.css",
];

const failures = [];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

for (const relativePath of requiredProductVisualConsumers) {
  const source = await read(relativePath);

  if (!source.includes("ProductVisual")) {
    failures.push(`${relativePath}: ProductVisual is not used`);
  }

  if (/getProductCutoutSrc\s*\(/u.test(source)) {
    failures.push(`${relativePath}: product image normalization bypasses ProductVisual`);
  }

  if (/backgroundImage\s*:\s*`?[^\n]*product\.image/iu.test(source)) {
    failures.push(`${relativePath}: product image is rendered as a CSS background`);
  }
}

const productCard = await read("app/components/ProductCard.tsx");
if (/<(?:img|Image)\b/gu.test(productCard)) {
  failures.push("ProductCard.tsx: raw image element found outside ProductVisual");
}

const productExperience = await read("app/components/ProductVariantExperience.tsx");
if (/<(?:img|Image)\b/gu.test(productExperience)) {
  failures.push("ProductVariantExperience.tsx: raw image element found outside ProductVisual");
}

if (!productExperience.includes("liveImage?.src || catalogImage?.src || product.image")) {
  failures.push(
    "ProductVariantExperience.tsx: PDP canonical image must prefer the same Woo/CMS master used by discovery surfaces",
  );
}

if (!productExperience.includes("selectedVariant?.imageVerified === true")) {
  failures.push(
    "ProductVariantExperience.tsx: an unverified variant image can replace the canonical product master",
  );
}

if (/selectedVariant\?\.image\s*\|\|\s*catalogImage\?\.src/gu.test(productExperience)) {
  failures.push(
    "ProductVariantExperience.tsx: variant image bypasses the verified-image gate",
  );
}

const layout = await read("app/layout.tsx");
if (!layout.includes('import "./product-visual.css";')) {
  failures.push("app/layout.tsx: product-visual.css is not loaded");
}

for (const deprecatedImport of [
  "fusion-product-images.css",
  "hyaluronidase-product-images.css",
]) {
  if (layout.includes(deprecatedImport)) {
    failures.push(`app/layout.tsx: deprecated ${deprecatedImport} is still imported`);
  }
}

for (const relativePath of deprecatedProductCss) {
  try {
    await access(path.join(root, relativePath));
    failures.push(`${relativePath}: deprecated product-specific CSS still exists`);
  } catch {
    // Expected: product-specific CSS is intentionally removed.
  }
}

const productImageResolver = await read("app/lib/product-image.ts");
if (
  productImageResolver.includes("WHITE_CARTON_SOURCE_ASSETS") ||
  productImageResolver.includes("resolveWhiteCartonSource")
) {
  failures.push(
    "app/lib/product-image.ts: product-specific source-image bypass is present",
  );
}

const visualComponent = await read("app/components/product/ProductVisual.tsx");
const visualConfig = await read("app/config/productVisualConfig.ts");
const css = await read("app/product-visual.css");
for (const requiredToken of [
  "object-fit: contain",
  "object-position: center bottom",
]) {
  if (!css.includes(requiredToken)) {
    failures.push(`app/product-visual.css: missing ${requiredToken}`);
  }
}

if (!visualComponent.includes("masterImage") || !visualComponent.includes("visualProfile")) {
  failures.push("ProductVisual.tsx: master image/profile contract is incomplete");
}

if (!visualComponent.includes('requestedProfile !== "default"')) {
  failures.push(
    "ProductVisual.tsx: CMS `default` profile can still override category geometry",
  );
}

for (const category of requiredCategoryProfiles) {
  const key = category === "fillers" ? "fillers:" : `\"${category}\":`;
  if (!visualConfig.includes(key)) {
    failures.push(
      `app/config/productVisualConfig.ts: missing visual profile for ${category}`,
    );
  }
}

if (failures.length) {
  console.error("Product visual architecture audit failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Product visual architecture audit passed.");
