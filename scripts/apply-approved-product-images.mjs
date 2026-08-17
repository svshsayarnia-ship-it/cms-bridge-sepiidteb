import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const payloadDir = path.join(root, "image-payloads", "approved-v2");
const outputDir = path.join(
  root,
  "public",
  "images",
  "products",
  "editorial",
  "approved",
);

const products = [
  ["masport", "تصویر ادیتوریال مصپورت ۵۰۰ واحد"],
  ["dyston-500", "تصویر ادیتوریال دیستون ۵۰۰"],
  ["blank-b", "تصویر ادیتوریال بلانک بی"],
  ["fusion-f-eye-contour", "تصویر ادیتوریال فیوژن اف آی کانتور"],
  ["fusion-f-mesomatrix", "تصویر ادیتوریال فیوژن اف مزوماتریکس"],
  ["fusion-f-vitamin-c", "تصویر ادیتوریال فیوژن اف ویتامین سی"],
  ["fusion-f-melirutin", "تصویر ادیتوریال فیوژن اف ملی‌روتین"],
  ["mesolike-glutathione", "تصویر ادیتوریال مزولایک گلوتاتیون"],
  ["fusion-f-hair", "تصویر ادیتوریال فیوژن اف هیر"],
  ["mesolike-eye-top", "تصویر ادیتوریال مزولایک آی تاپ"],
  ["mesolike-hair-men", "تصویر ادیتوریال مزولایک هیر من"],
  ["mesolike-hair", "تصویر ادیتوریال مزولایک ضدریزش مو"],
  ["liporase-1500", "تصویر ادیتوریال لیپوریز ۱۵۰۰"],
];

fs.mkdirSync(outputDir, { recursive: true });

for (const [slug] of products) {
  const payloadPath = path.join(payloadDir, `${slug}.webp.b64`);
  if (!fs.existsSync(payloadPath)) {
    throw new Error(`Missing approved image payload: ${payloadPath}`);
  }

  const encoded = fs.readFileSync(payloadPath, "utf8").trim();
  const bytes = Buffer.from(encoded, "base64");
  const isWebp =
    bytes.length > 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP";

  if (!isWebp) {
    throw new Error(`Invalid WebP payload for ${slug}`);
  }

  fs.writeFileSync(path.join(outputDir, `${slug}.webp`), bytes);
}

const catalogPath = path.join(root, "app", "catalog.ts");
let source = fs.readFileSync(catalogPath, "utf8");
const marker = "APPROVED_PRODUCT_IMAGES_BUILD";

if (!source.includes(marker)) {
  const mapStart = source.indexOf("const officialImageOverrides:");
  if (mapStart < 0) {
    throw new Error("officialImageOverrides map not found in app/catalog.ts");
  }

  const opening = source.indexOf("> = {", mapStart);
  if (opening < 0) {
    throw new Error("officialImageOverrides opening not found in app/catalog.ts");
  }

  const lineEnd = source.indexOf("\n", opening);
  if (lineEnd < 0) {
    throw new Error("Cannot locate insertion point in app/catalog.ts");
  }

  const injection = [
    `  // ${marker}`,
    ...products.flatMap(([slug, alt]) => [
      `  "${slug}": {`,
      `    image: "/images/products/editorial/approved/${slug}.webp",`,
      `    imageAlt: "${alt}",`,
      "    imageVerified: false,",
      '    imageKind: "market-reference",',
      "  },",
    ]),
    "",
  ].join("\n");

  const insertAt = lineEnd + 1;
  source = source.slice(0, insertAt) + injection + source.slice(insertAt);
  fs.writeFileSync(catalogPath, source);
}

console.log(
  `[approved-product-images] prepared ${products.length} product images for storefront build`,
);
