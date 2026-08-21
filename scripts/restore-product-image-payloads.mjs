import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const payloadRoot = path.join(root, "image-payloads", "product-masters");
const productRoot = path.join(root, "public", "images", "products");
const cutoutRoot = path.join(productRoot, "cutouts");

const assets = [
  {
    slug: "alcarisa-28",
    prefix: "alcarisa-28.webp.b64.part",
  },
  {
    slug: "neurafill-lidocaine",
    prefix: "neurafill-lidocaine.master.webp.b64.part",
  },
  {
    slug: "neuramis-volume-1ml",
    prefix: "neuramis-volume-1ml.master.webp.b64.part",
  },
];

function readPayload(prefix) {
  const parts = fs
    .readdirSync(payloadRoot)
    .filter((name) => name.startsWith(prefix))
    .sort();

  if (parts.length === 0) {
    throw new Error(`Missing product image payload parts for ${prefix}`);
  }

  const encoded = parts
    .map((name) => fs.readFileSync(path.join(payloadRoot, name), "utf8").trim())
    .join("");
  const bytes = Buffer.from(encoded, "base64");

  const isWebp =
    bytes.length > 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP";

  if (!isWebp) {
    throw new Error(`Decoded payload is not WebP: ${prefix}`);
  }

  return bytes;
}

fs.mkdirSync(productRoot, { recursive: true });
fs.mkdirSync(cutoutRoot, { recursive: true });

for (const asset of assets) {
  const bytes = readPayload(asset.prefix);
  fs.writeFileSync(path.join(productRoot, `${asset.slug}.webp`), bytes);
  fs.writeFileSync(path.join(cutoutRoot, `${asset.slug}.webp`), bytes);
}

console.log(
  `[product-image-payloads] restored ${assets.length} master/cutout pairs before validation`,
);
