import "server-only";

import sharp from "sharp";

const MAX_EDGE = 1800;
const MIN_VISIBLE_ALPHA = 24;
const EXISTING_ALPHA_RATIO = 0.12;
const EXISTING_BORDER_ALPHA_RATIO = 0.65;
const MAX_BACKGROUND_REMOVAL_RATIO = 0.94;
const SQUARE_PADDING_RATIO = 0.075;

type RawImage = {
  data: Buffer;
  width: number;
  height: number;
  channels: 4;
};

export type NormalizedProductImage = {
  file: File;
  removedBackground: boolean;
  removalRatio: number;
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

function borderPalette(image: RawImage): Array<readonly [number, number, number]> {
  const { data, width, height, channels } = image;
  const palette: Array<readonly [number, number, number]> = [];
  const samples = 18;
  const pushPixel = (x: number, y: number) => {
    const offset = (y * width + x) * channels;
    palette.push([data[offset], data[offset + 1], data[offset + 2]]);
  };

  for (let index = 0; index <= samples; index += 1) {
    const x = Math.round((index * (width - 1)) / samples);
    const y = Math.round((index * (height - 1)) / samples);
    pushPixel(x, 0);
    pushPixel(x, height - 1);
    pushPixel(0, y);
    pushPixel(width - 1, y);
  }
  return palette;
}

function nearestBorderColorDistance(
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

function hasMeaningfulTransparency(image: RawImage): boolean {
  const { data, width, height, channels } = image;
  const pixels = width * height;
  let transparent = 0;
  let transparentBorder = 0;
  let borderPixels = 0;

  for (let pixel = 0; pixel < pixels; pixel += 1) {
    if (data[pixel * channels + 3] < 245) transparent += 1;
  }

  const countBorder = (pixel: number) => {
    borderPixels += 1;
    if (data[pixel * channels + 3] < 245) transparentBorder += 1;
  };

  for (let x = 0; x < width; x += 1) {
    countBorder(x);
    countBorder((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    countBorder(y * width);
    countBorder(y * width + width - 1);
  }

  const canvasRatio = transparent / pixels;
  const borderRatio = borderPixels > 0 ? transparentBorder / borderPixels : 0;

  // Rounded corners, shadows or a thin transparent frame are not a product
  // cutout. A source is trusted as already-cut-out only when transparency is
  // substantial across the canvas or dominates the outer edge.
  return (
    canvasRatio >= EXISTING_ALPHA_RATIO ||
    borderRatio >= EXISTING_BORDER_ALPHA_RATIO
  );
}

function removeConnectedBackground(image: RawImage): number {
  const { data, width, height, channels } = image;
  const pixels = width * height;
  const original = Buffer.from(data);
  const palette = borderPalette(image);
  const visited = new Uint8Array(pixels);
  const queue = new Int32Array(pixels);
  let read = 0;
  let write = 0;

  const enqueue = (pixel: number) => {
    if (visited[pixel]) return;
    visited[pixel] = 1;
    queue[write] = pixel;
    write += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  const canJoinBackground = (from: number, next: number) => {
    const edgeDistance = nearestBorderColorDistance(image, next, palette);
    const localDistance = colorDistance(data, from, next, channels);
    return (
      (edgeDistance <= 52 && localDistance <= 24) ||
      (edgeDistance <= 92 && localDistance <= 10)
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

  const ratio = write / pixels;
  if (ratio >= MAX_BACKGROUND_REMOVAL_RATIO) {
    original.copy(data);
    return 0;
  }

  for (let index = 0; index < write; index += 1) {
    data[queue[index] * channels + 3] = 0;
  }

  for (let index = 0; index < write; index += 1) {
    const pixel = queue[index];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const neighbours = [
      x > 0 ? pixel - 1 : -1,
      x + 1 < width ? pixel + 1 : -1,
      y > 0 ? pixel - width : -1,
      y + 1 < height ? pixel + width : -1,
    ];
    for (const neighbour of neighbours) {
      if (neighbour < 0 || visited[neighbour]) continue;
      const alphaOffset = neighbour * channels + 3;
      data[alphaOffset] = Math.min(data[alphaOffset], 210);
    }
  }
  return ratio;
}

function visibleBounds(image: RawImage) {
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
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
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

  const alreadyTransparent = hasMeaningfulTransparency(image);
  const removalRatio = alreadyTransparent ? 0 : removeConnectedBackground(image);
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
  };
}
