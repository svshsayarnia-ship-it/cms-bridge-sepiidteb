import "server-only";

import sharp from "sharp";

const MAX_EDGE = 1800;
const MIN_VISIBLE_ALPHA = 24;
const CUTOUT_ALPHA_RATIO = 0.1;
const CUTOUT_MAX_VISIBLE_BOUNDS_RATIO = 0.84;
const MAX_BACKGROUND_REMOVAL_RATIO = 0.94;
const SQUARE_PADDING_RATIO = 0.075;

type RawImage = {
  data: Buffer;
  width: number;
  height: number;
  channels: 4;
};

type Bounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type NormalizedProductImage = {
  file: File;
  removedBackground: boolean;
  removalRatio: number;
  validatedCutout: boolean;
};

function safeStem(filename: string): string {
  const base = filename.replace(/\.[^.]+$/u, "").toLowerCase();
  const stem = base
    .normalize("NFKD")
    .replace(/[^a-z0-9\u0600-\u06ff]+/giu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 72);
  return stem || `product-${Date.now()}`;
}

function colorDistance(
  data: Buffer,
  firstPixel: number,
  secondPixel: number,
  channels: number,
): number {
  const a = firstPixel * channels;
  const b = secondPixel * channels;
  const dr = data[a] - data[b];
  const dg = data[a + 1] - data[b + 1];
  const db = data[a + 2] - data[b + 2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function colorDistanceToRgb(
  data: Buffer,
  pixel: number,
  channels: number,
  rgb: readonly [number, number, number],
): number {
  const offset = pixel * channels;
  const dr = data[offset] - rgb[0];
  const dg = data[offset + 1] - rgb[1];
  const db = data[offset + 2] - rgb[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function pixelAlpha(image: RawImage, pixel: number) {
  return image.data[pixel * image.channels + 3];
}

function visibleBounds(image: RawImage): Bounds {
  const { data, width, height, channels } = image;
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * channels + 3];
      if (alpha < MIN_VISIBLE_ALPHA) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) {
    return { left: 0, top: 0, width, height };
  }

  return {
    left,
    top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}

function isExistingProductCutout(image: RawImage, bounds: Bounds): boolean {
  const { data, width, height, channels } = image;
  const pixels = width * height;
  let transparent = 0;

  for (let pixel = 0; pixel < pixels; pixel += 1) {
    if (data[pixel * channels + 3] < 245) transparent += 1;
  }

  const alphaRatio = transparent / pixels;
  const visibleBoundsRatio =
    (bounds.width * bounds.height) / Math.max(1, width * height);

  return (
    alphaRatio >= CUTOUT_ALPHA_RATIO &&
    visibleBoundsRatio <= CUTOUT_MAX_VISIBLE_BOUNDS_RATIO
  );
}

function firstVisiblePixel(
  image: RawImage,
  startX: number,
  startY: number,
  stepX: number,
  stepY: number,
): number | null {
  let x = startX;
  let y = startY;
  while (x >= 0 && x < image.width && y >= 0 && y < image.height) {
    const pixel = y * image.width + x;
    if (pixelAlpha(image, pixel) >= MIN_VISIBLE_ALPHA) return pixel;
    x += stepX;
    y += stepY;
  }
  return null;
}

function visibleEdgeSeeds(image: RawImage) {
  const seeds = new Set<number>();
  const xSamples = Math.min(28, Math.max(8, Math.floor(image.width / 60)));
  const ySamples = Math.min(28, Math.max(8, Math.floor(image.height / 60)));

  for (let index = 0; index <= xSamples; index += 1) {
    const x = Math.round((index * (image.width - 1)) / xSamples);
    const top = firstVisiblePixel(image, x, 0, 0, 1);
    const bottom = firstVisiblePixel(image, x, image.height - 1, 0, -1);
    if (top !== null) seeds.add(top);
    if (bottom !== null) seeds.add(bottom);
  }

  for (let index = 0; index <= ySamples; index += 1) {
    const y = Math.round((index * (image.height - 1)) / ySamples);
    const left = firstVisiblePixel(image, 0, y, 1, 0);
    const right = firstVisiblePixel(image, image.width - 1, y, -1, 0);
    if (left !== null) seeds.add(left);
    if (right !== null) seeds.add(right);
  }

  return [...seeds];
}

function backgroundPalette(
  image: RawImage,
  seeds: number[],
): Array<readonly [number, number, number]> {
  const palette: Array<readonly [number, number, number]> = [];
  for (const pixel of seeds) {
    const offset = pixel * image.channels;
    palette.push([
      image.data[offset],
      image.data[offset + 1],
      image.data[offset + 2],
    ]);
  }
  return palette;
}

function nearestBackgroundDistance(
  image: RawImage,
  pixel: number,
  palette: Array<readonly [number, number, number]>,
): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (const rgb of palette) {
    nearest = Math.min(
      nearest,
      colorDistanceToRgb(image.data, pixel, image.channels, rgb),
    );
  }
  return nearest;
}

function removeConnectedBackground(image: RawImage): number {
  const { data, width, height, channels } = image;
  const pixels = width * height;
  const original = Buffer.from(data);
  const seeds = visibleEdgeSeeds(image);
  if (seeds.length === 0) return 0;

  const palette = backgroundPalette(image, seeds);
  const visited = new Uint8Array(pixels);
  const background = new Uint8Array(pixels);
  const queue = new Int32Array(pixels);
  let read = 0;
  let write = 0;

  for (let pixel = 0; pixel < pixels; pixel += 1) {
    if (pixelAlpha(image, pixel) < MIN_VISIBLE_ALPHA) {
      visited[pixel] = 1;
      background[pixel] = 1;
    }
  }

  const enqueue = (pixel: number) => {
    if (visited[pixel]) return;
    visited[pixel] = 1;
    background[pixel] = 1;
    queue[write] = pixel;
    write += 1;
  };

  for (const seed of seeds) enqueue(seed);

  const canJoinBackground = (from: number, next: number) => {
    if (pixelAlpha(image, next) < MIN_VISIBLE_ALPHA) return true;
    const edgeDistance = nearestBackgroundDistance(image, next, palette);
    const localDistance = colorDistance(data, from, next, channels);
    return (
      (edgeDistance <= 64 && localDistance <= 30) ||
      (edgeDistance <= 108 && localDistance <= 12)
    );
  };

  while (read < write) {
    const pixel = queue[read];
    read += 1;
    const x = pixel % width;
    const y = Math.floor(pixel / width);

    if (x > 0) {
      const next = pixel - 1;
      if (!visited[next] && canJoinBackground(pixel, next)) enqueue(next);
    }
    if (x + 1 < width) {
      const next = pixel + 1;
      if (!visited[next] && canJoinBackground(pixel, next)) enqueue(next);
    }
    if (y > 0) {
      const next = pixel - width;
      if (!visited[next] && canJoinBackground(pixel, next)) enqueue(next);
    }
    if (y + 1 < height) {
      const next = pixel + width;
      if (!visited[next] && canJoinBackground(pixel, next)) enqueue(next);
    }
  }

  let backgroundCount = 0;
  for (let pixel = 0; pixel < pixels; pixel += 1) {
    if (background[pixel]) backgroundCount += 1;
  }
  const ratio = backgroundCount / pixels;

  if (ratio >= MAX_BACKGROUND_REMOVAL_RATIO) {
    original.copy(data);
    return 0;
  }

  for (let pixel = 0; pixel < pixels; pixel += 1) {
    if (background[pixel]) data[pixel * channels + 3] = 0;
  }

  for (let pixel = 0; pixel < pixels; pixel += 1) {
    if (!background[pixel]) continue;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const neighbours = [
      x > 0 ? pixel - 1 : -1,
      x + 1 < width ? pixel + 1 : -1,
      y > 0 ? pixel - width : -1,
      y + 1 < height ? pixel + width : -1,
    ];
    for (const neighbour of neighbours) {
      if (neighbour < 0 || background[neighbour]) continue;
      const alphaOffset = neighbour * channels + 3;
      data[alphaOffset] = Math.min(data[alphaOffset], 218);
    }
  }

  return ratio;
}

export async function normalizeCmsProductImage(
  source: File,
): Promise<NormalizedProductImage> {
  const input = Buffer.from(await source.arrayBuffer());
  const decoded = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toColourspace("srgb")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const image: RawImage = {
    data: decoded.data,
    width: decoded.info.width,
    height: decoded.info.height,
    channels: 4,
  };

  const initialBounds = visibleBounds(image);
  const alreadyCutout = isExistingProductCutout(image, initialBounds);
  const removalRatio = alreadyCutout ? 0 : removeConnectedBackground(image);
  const validatedCutout = alreadyCutout || removalRatio > 0.02;
  const bounds = visibleBounds(image);
  const padding = Math.max(
    18,
    Math.round(Math.max(bounds.width, bounds.height) * SQUARE_PADDING_RATIO),
  );
  const side = Math.min(
    MAX_EDGE,
    Math.max(bounds.width, bounds.height) + padding * 2,
  );

  const crop = sharp(image.data, {
    raw: { width: image.width, height: image.height, channels: 4 },
  }).extract(bounds);

  const horizontal = Math.max(0, side - bounds.width);
  const vertical = Math.max(0, side - bounds.height);
  const left = Math.floor(horizontal / 2);
  const right = horizontal - left;
  const top = Math.floor(vertical / 2);
  const bottom = vertical - top;

  const output = await crop
    .extend({
      left,
      right,
      top,
      bottom,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 92, alphaQuality: 100, smartSubsample: true })
    .toBuffer();

  const filename = `sepiid-cutout-${safeStem(source.name)}.webp`;
  const file = new File([new Uint8Array(output)], filename, {
    type: "image/webp",
  });

  return {
    file,
    removedBackground: removalRatio > 0.02,
    removalRatio: Math.round(removalRatio * 1000) / 1000,
    validatedCutout,
  };
}
