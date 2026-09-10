import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

const roles = await read("app/lib/product-image-roles.ts");
const resolver = await read("app/lib/product-image.ts");
const canonical = await read("app/lib/storefront-canonical-product.ts");
const catalog = await read("app/lib/storefront-catalog.ts");
const roleApi = await read("app/api/product-image-roles/route.ts");
const manager = await read("app/cms/CmsProductImageManager.tsx");

const required = [
  [roles, "isManagedProductRoleImage", "product-image-roles.ts must identify CMS-managed role images"],
  [roles, "storefrontRoleImages", "product-image-roles.ts must expose the public image sanitizer"],
  [roles, "findPrimaryProductRoleImage", "CMS primary must be derived only from CMS role media"],
  [resolver, "isCmsManagedProductImageSrc", "ProductVisual resolver must identify CMS role URLs"],
  [resolver, "if (!isCmsManagedProductImageSrc(cleanSrc)) return \"\"", "render boundary must reject all non-CMS product media"],
  [canonical, "storefrontRoleImages(product.images", "public snapshots must strip ordinary WooCommerce images"],
  [catalog, "findPrimaryProductRoleImage", "storefront catalog must resolve the CMS primary image"],
  [catalog, "findVariantRoleImage", "storefront catalog must resolve exact CMS variant images"],
  [catalog, "image: liveImageSrc || DEFAULT_PRODUCT_IMAGE", "products without CMS media must use a neutral placeholder, not a product photo"],
  [roleApi, "getStorefrontProductSnapshots", "role API must read confirmed CMS storefront snapshots"],
  [roleApi, "findPrimaryProductRoleImage", "role API must expose a CMS-only base/card image"],
  [roleApi, "findVariantRoleImage", "role API must return exact CMS variant media"],
  [manager, "منبع واحد تصاویر: CMS", "CMS UI must communicate the global image authority"],
];

for (const [source, token, message] of required) {
  if (!source.includes(token)) failures.push(message);
}

const forbidden = [
  [catalog, "const cmsImage = product.images?.find((image) => Boolean(image.src))", "storefront catalog still accepts arbitrary WooCommerce product images"],
  [catalog, "liveImageSrc || fallback?.image", "storefront catalog can still fall back to a checked-in product photograph"],
  [roleApi, "variant.image.trim()", "role API still serves bundled/catalog variant imagery instead of CMS role media"],
  [resolver, "return resolveProductSlugCutout(productSlug)", "ProductVisual can still revive a checked-in slug cutout"],
];

for (const [source, token, message] of forbidden) {
  if (source.includes(token)) failures.push(message);
}

if (failures.length) {
  console.error("CMS image authority audit failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("CMS image authority audit passed: all ProductVisual media is CMS-role controlled; Woo and checked-in product photos are blocked.");
