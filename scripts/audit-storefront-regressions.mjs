import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";
import sharp from "sharp";

async function load(relative) {
  const source = await fs.readFile(relative, "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
}
const { matchesProductSearch } = await load("app/lib/product-search.ts");
const product = { nameFa: "اینووسنس", nameEn: "Inovosense", categoryTitle: "فیلر", variants: [{nameFa:"اینووسنس استایل", nameEn:"Style", label:"Style"}] };
for (const query of ["اینووسنس", "اينووسنس", "INOVOSENSE", "استایل", "style", "اینووسنس style", "فیلر"]) {
  assert.equal(matchesProductSearch(product, query), true, query);
}
assert.equal(matchesProductSearch({nameFa:"اسکین‌بوستر ۱۰۰"}, "اسكين بوستر 100"), true);
assert.equal(matchesProductSearch(product,"محصول غیرواقعی"), false);
const layout = await fs.readFile("app/layout.tsx", "utf8");
assert.ok(layout.includes(".filter(isCatalogFallbackProduct)"), "Search inventory must be independent of image eligibility");
const { approvedLegacyCutout, approvedProductCutouts } = await load("app/lib/approved-product-cutouts.ts");
assert.equal(approvedLegacyCutout("https://wp.sepiidbeauty.ir/wp-content/uploads/2026/09/sepiid-role-variant-eptq-1ml-s100-slot-eptq-s100.webp"), "/images/products/cutouts/eptq/eptq-s100.webp");
assert.equal(approvedLegacyCutout("https://wp.sepiidbeauty.ir/uploads/sepiid-cutout-sepiid-role-card-eptq-1ml-slot-eptq-s100-abc.webp"),null, "New CMS uploads must not be overridden");
assert.equal(approvedLegacyCutout("https://wp.sepiidbeauty.ir/uploads/eptq-s100.webp"),null);
for (const path of new Set(Object.values(approvedProductCutouts))) {
  const { data, info } = await sharp(`public${path}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let transparent = 0;
  for(let i=3;i<data.length;i+=info.channels) if(data[i]<24) transparent++;
  assert.ok(transparent/(info.width*info.height)>0.1, `${path} must have actual transparent pixels`);
  for (const pixel of [0,info.width-1,(info.height-1)*info.width,info.width*info.height-1]) {
    assert.ok(data[pixel*info.channels+3]<24, `${path}: opaque corner/background`);
  }
}
assert.equal(approvedProductCutouts["neurafill-lidocaine"], undefined, "Corrupt staged assets must never enter the approved media map");
const restore = await fs.readFile("app/api/cms/restore-legacy-media/route.ts","utf8");
assert.ok(restore.includes("normalizeCmsProductImage(file)"));
assert.ok(restore.includes("!normalized.validatedCutout"));
const visual = await fs.readFile("app/components/product/ProductVisual.tsx","utf8");
assert.ok(visual.includes('failedSrc === cmsSrc ? "" : cmsSrc'), "A failed image must not hide a different variant");
assert.ok(!visual.includes("product.fallbackImage"), "Rendering must honor the current CMS image; derivative recovery belongs in the media proxy");
assert.ok(!visual.includes('className="product-visual__glass"'));
console.log("Storefront regressions passed: search variants/RTL, CMS authority, transparent legacy media and import gate.");

const mediaRoute = await fs.readFile("app/api/cms/public-media/route.ts", "utf8");
assert.ok(mediaRoute.includes("new Response(new Uint8Array(bytes)"), "The image optimizer requires bytes, not a local-source redirect");

const { isCmsMediaSrc } = await load("app/lib/cms-media.ts");
assert.equal(isCmsMediaSrc("/api/cms/public-media?id=30213"), true);
assert.equal(isCmsMediaSrc("https://sepiidbeauty.ir/api/cms/public-media?id=30213"), true);
assert.equal(isCmsMediaSrc("https://untrusted.example/api/cms/public-media?id=30213"), false);
assert.equal(isCmsMediaSrc("/api/cms/public-media-other"), false);

// Confirmed model prices must survive an unavailable WooCommerce origin.
let pricingJs = ts.transpileModule(await fs.readFile("app/lib/variant-pricing.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const moduleUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
pricingJs = pricingJs.replace('import "server-only";', "")
  .replace('"../catalog"', JSON.stringify(moduleUrl('export const catalogProducts = [];')))
  .replace('"./woocommerce"', JSON.stringify(moduleUrl('export class WooCommerceError extends Error {}')))
  .replace('"./storefront-product-snapshots"', JSON.stringify(moduleUrl(
    'export async function getStorefrontProductSnapshots() { return {"inovosense-family": {variantPrices: {style: {regularPrice: "8800000", salePrice: ""}}}}; }'
  )));
const { getCatalogVariantPriceOverrides } = await import(moduleUrl(pricingJs));
assert.deepEqual(await getCatalogVariantPriceOverrides("inovosense-family"), {
  style: {regularPrice: "8800000", salePrice: ""},
});
console.log("Confirmed variant price survives an unavailable origin.");
