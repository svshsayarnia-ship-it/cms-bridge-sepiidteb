import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const payloadRoot = path.join(root, "image-payloads", "product-masters");
const productRoot = path.join(root, "public", "images", "products");
const cutoutRoot = path.join(productRoot, "cutouts");

const CUTOUT_CANVAS = 1400;
const CUTOUT_FLOOR_Y = 980;
const CUTOUT_MAX_WIDTH = 1060;
const CUTOUT_MAX_HEIGHT = 780;
const VISIBLE_ALPHA = 12;

// Neurafill still needs reconstruction from the staged payload. Alcarisa 28
// is regenerated deterministically from its repository-native master because
// binary WebP transfer through the maintenance connector can corrupt the file.
const assets = [
  {
    slug: "neurafill-lidocaine",
    prefix: "neurafill-lidocaine.master.webp.b64.part",
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

function visibleBounds(data, width, height, channels) {
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * channels + 3];
      if (alpha < VISIBLE_ALPHA) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) {
    throw new Error("Alcarisa 28 master has no visible pixels");
  }

  return {
    left,
    top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}

async function normalizeAlcarisaCutout() {
  const source = path.join(productRoot, "alcarisa-28.webp");
  const destination = path.join(cutoutRoot, "alcarisa-28.webp");

  if (!fs.existsSync(source)) {
    throw new Error("Missing repository-native Alcarisa 28 master");
  }

  const decoded = await sharp(source, { failOn: "error" })
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bounds = visibleBounds(
    decoded.data,
    decoded.info.width,
    decoded.info.height,
    decoded.info.channels,
  );

  const scale = Math.min(
    CUTOUT_MAX_WIDTH / bounds.width,
    CUTOUT_MAX_HEIGHT / bounds.height,
  );
  const targetWidth = Math.max(1, Math.round(bounds.width * scale));
  const targetHeight = Math.max(1, Math.round(bounds.height * scale));
  const left = Math.round((CUTOUT_CANVAS - targetWidth) / 2);
  const top = CUTOUT_FLOOR_Y - targetHeight;

  if (left < 12 || top < 12) {
    throw new Error(
      `Normalized Alcarisa 28 exceeds safe canvas: ${targetWidth}x${targetHeight}`,
    );
  }

  const cropped = await sharp(decoded.data, {
    raw: {
      width: decoded.info.width,
      height: decoded.info.height,
      channels: decoded.info.channels,
    },
  })
    .extract(bounds)
    .resize(targetWidth, targetHeight, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .webp({ quality: 96, alphaQuality: 100, smartSubsample: true })
    .toBuffer();

  await sharp({
    create: {
      width: CUTOUT_CANVAS,
      height: CUTOUT_CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: cropped, left, top }])
    .webp({ quality: 96, alphaQuality: 100, smartSubsample: true })
    .toFile(destination);

  console.log(
    `[product-image-payloads] normalized Alcarisa 28 cutout to ${CUTOUT_CANVAS}x${CUTOUT_CANVAS}, content=${targetWidth}x${targetHeight}, floor=${CUTOUT_FLOOR_Y}`,
  );
}

fs.mkdirSync(productRoot, { recursive: true });
fs.mkdirSync(cutoutRoot, { recursive: true });

for (const asset of assets) {
  const bytes = readPayload(asset.prefix);
  fs.writeFileSync(path.join(productRoot, `${asset.slug}.webp`), bytes);
  fs.writeFileSync(path.join(cutoutRoot, `${asset.slug}.webp`), bytes);
}

await normalizeAlcarisaCutout();

console.log(
  `[product-image-payloads] restored ${assets.length} staged master/cutout pair before validation`,
);
