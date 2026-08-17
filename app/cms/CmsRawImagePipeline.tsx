"use client";

import { useEffect, useRef, useState } from "react";

type CategoryProfile = {
  slug: string;
  maxWidth: number;
  maxHeight: number;
  floorY: number;
};

const CANVAS_SIZE = 1400;
const WORKING_MAX_SIDE = 1400;
const MAX_UPSCALE = 1.35;
const BACKGROUND_SEED_DISTANCE = 44;
const TARGET_SELECTOR =
  'input[type="file"][multiple][accept*="image/"]';
const BYPASS_FLAG = "sepiidPrepared";

const DEFAULT_PROFILE: CategoryProfile = {
  slug: "products",
  maxWidth: 1020,
  maxHeight: 800,
  floorY: 1010,
};

const CATEGORY_PROFILES: Array<{
  terms: string[];
  profile: CategoryProfile;
}> = [
  {
    terms: ["بوتاکس", "بوتولینوم", "توکسین"],
    profile: {
      slug: "botulinum-toxins",
      maxWidth: 900,
      maxHeight: 820,
      floorY: 1005,
    },
  },
  {
    terms: ["فیلر", "ژل"],
    profile: {
      slug: "fillers",
      maxWidth: 1120,
      maxHeight: 760,
      floorY: 995,
    },
  },
  {
    terms: ["مزوژل"],
    profile: {
      slug: "mesogels",
      maxWidth: 1000,
      maxHeight: 810,
      floorY: 1010,
    },
  },
  {
    terms: ["اسکین بوستر", "اسکین‌بوستر", "اسکینبوستر"],
    profile: {
      slug: "skin-boosters",
      maxWidth: 1000,
      maxHeight: 810,
      floorY: 1010,
    },
  },
  {
    terms: ["جوانسازی", "جوان‌سازی", "جوان سازی"],
    profile: {
      slug: "rejuvenation-cocktails",
      maxWidth: 980,
      maxHeight: 820,
      floorY: 1010,
    },
  },
  {
    terms: ["روشن کننده", "روشن‌کننده", "روشنکننده"],
    profile: {
      slug: "brightening-cocktails",
      maxWidth: 980,
      maxHeight: 820,
      floorY: 1010,
    },
  },
  {
    terms: ["دور چشم", "چشم"],
    profile: {
      slug: "eye-cocktails",
      maxWidth: 930,
      maxHeight: 830,
      floorY: 1015,
    },
  },
  {
    terms: ["مو", "ریزش"],
    profile: {
      slug: "hair-cocktails",
      maxWidth: 930,
      maxHeight: 830,
      floorY: 1015,
    },
  },
  {
    terms: ["هیالورونیداز", "لیپوراز", "آنزیم"],
    profile: {
      slug: "hyaluronidase-products",
      maxWidth: 900,
      maxHeight: 830,
      floorY: 1010,
    },
  },
];

function normalizeText(value: string): string {
  return value
    .replace(/[يى]/gu, "ی")
    .replace(/ك/gu, "ک")
    .replace(/[\u200c\u200f\u202a-\u202e]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("fa");
}

function detectCategoryProfile(): CategoryProfile {
  const selectedLabels = Array.from(
    document.querySelectorAll<HTMLLabelElement>(
      ".spb-category-grid label",
    ),
  )
    .filter((label) =>
      label.querySelector<HTMLInputElement>('input[type="checkbox"]')
        ?.checked,
    )
    .map((label) => normalizeText(label.textContent || ""));

  for (const { terms, profile } of CATEGORY_PROFILES) {
    if (
      selectedLabels.some((label) =>
        terms.some((term) => label.includes(normalizeText(term))),
      )
    ) {
      return profile;
    }
  }

  return DEFAULT_PROFILE;
}

function colorDistance(
  red: number,
  green: number,
  blue: number,
  targetRed: number,
  targetGreen: number,
  targetBlue: number,
): number {
  const dr = red - targetRed;
  const dg = green - targetGreen;
  const db = blue - targetBlue;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function median(values: number[]): number {
  if (!values.length) return 255;
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
}

function estimateBorderColor(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): {
  red: number;
  green: number;
  blue: number;
  consistency: number;
} {
  const samples: Array<[number, number, number]> = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 120));
  const band = Math.max(2, Math.round(Math.min(width, height) * 0.012));

  const addSample = (x: number, y: number) => {
    const offset = (y * width + x) * 4;
    if (pixels[offset + 3] < 8) return;
    samples.push([
      pixels[offset],
      pixels[offset + 1],
      pixels[offset + 2],
    ]);
  };

  for (let x = 0; x < width; x += step) {
    for (let y = 0; y < band; y += 1) addSample(x, y);
    for (let y = height - band; y < height; y += 1) addSample(x, y);
  }

  for (let y = band; y < height - band; y += step) {
    for (let x = 0; x < band; x += 1) addSample(x, y);
    for (let x = width - band; x < width; x += 1) addSample(x, y);
  }

  const red = median(samples.map((sample) => sample[0]));
  const green = median(samples.map((sample) => sample[1]));
  const blue = median(samples.map((sample) => sample[2]));
  const consistent = samples.filter(
    ([r, g, b]) =>
      colorDistance(r, g, b, red, green, blue) <=
      BACKGROUND_SEED_DISTANCE,
  ).length;

  return {
    red,
    green,
    blue,
    consistency: samples.length ? consistent / samples.length : 0,
  };
}

function removeConnectedBackground(
  imageData: ImageData,
): {
  removedRatio: number;
  bbox: [number, number, number, number] | null;
} {
  const { data, width, height } = imageData;
  const total = width * height;
  const background = estimateBorderColor(data, width, height);
  const threshold =
    background.consistency >= 0.88
      ? 54
      : background.consistency >= 0.68
        ? 42
        : 30;

  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const isBackground = (index: number) => {
    const offset = index * 4;
    if (data[offset + 3] < 8) return true;
    return (
      colorDistance(
        data[offset],
        data[offset + 1],
        data[offset + 2],
        background.red,
        background.green,
        background.blue,
      ) <= threshold
    );
  };

  const seed = (index: number) => {
    if (visited[index] || !isBackground(index)) return;
    visited[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    seed(x);
    seed((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    seed(y * width);
    seed(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % width;
    const y = Math.floor(index / width);

    if (x > 0) seed(index - 1);
    if (x + 1 < width) seed(index + 1);
    if (y > 0) seed(index - width);
    if (y + 1 < height) seed(index + width);
  }

  const originalAlpha = new Uint8ClampedArray(total);
  for (let index = 0; index < total; index += 1) {
    originalAlpha[index] = data[index * 4 + 3];
    if (visited[index]) data[index * 4 + 3] = 0;
  }

  // Preserve anti-aliased packaging edges by feathering only pixels directly
  // beside the removed, edge-connected background. White cartons inside the
  // product remain untouched because they are not connected to the border.
  for (let index = 0; index < total; index += 1) {
    if (visited[index]) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    const touchesBackground =
      (x > 0 && visited[index - 1]) ||
      (x + 1 < width && visited[index + 1]) ||
      (y > 0 && visited[index - width]) ||
      (y + 1 < height && visited[index + width]);
    if (!touchesBackground) continue;

    const offset = index * 4;
    const distance = colorDistance(
      data[offset],
      data[offset + 1],
      data[offset + 2],
      background.red,
      background.green,
      background.blue,
    );
    const feather = Math.max(
      0,
      Math.min(1, (distance - threshold * 0.65) / (threshold * 0.75)),
    );
    data[offset + 3] = Math.min(
      originalAlpha[index],
      Math.round(255 * feather),
    );
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let foreground = 0;

  for (let index = 0; index < total; index += 1) {
    if (data[index * 4 + 3] < 18) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    foreground += 1;
  }

  // If a difficult photograph would erase most of the pack, abandon the matte
  // and keep the source intact. The storefront still normalizes its scale and
  // category frame instead of publishing a damaged product.
  if (foreground / total < 0.045) {
    for (let index = 0; index < total; index += 1) {
      data[index * 4 + 3] = originalAlpha[index];
    }
    return {
      removedRatio: 0,
      bbox: [0, 0, width, height],
    };
  }

  return {
    removedRatio: tail / total,
    bbox:
      maxX >= minX && maxY >= minY
        ? [minX, minY, maxX + 1, maxY + 1]
        : null,
  };
}

async function canvasToProductFile(
  canvas: HTMLCanvasElement,
  originalName: string,
  categorySlug: string,
): Promise<File> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.94);
  });

  const fallbackBlob =
    blob ||
    (await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    }));

  if (!fallbackBlob) {
    throw new Error("ساخت خروجی استاندارد تصویر ناموفق بود.");
  }

  const base = originalName
    .replace(/\.[^.]+$/u, "")
    .replace(/[^a-z0-9_-]+/giu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 60) || "product";
  const extension = fallbackBlob.type === "image/webp" ? "webp" : "png";

  return new File(
    [fallbackBlob],
    `${base}-sepiid-${categorySlug}.${extension}`,
    {
      type: fallbackBlob.type,
      lastModified: Date.now(),
    },
  );
}

async function normalizeProductImage(
  file: File,
  profile: CategoryProfile,
): Promise<File> {
  const bitmap = await createImageBitmap(file);

  try {
    const workScale = Math.min(
      1,
      WORKING_MAX_SIDE / Math.max(bitmap.width, bitmap.height),
    );
    const workWidth = Math.max(1, Math.round(bitmap.width * workScale));
    const workHeight = Math.max(1, Math.round(bitmap.height * workScale));
    const workCanvas = document.createElement("canvas");
    workCanvas.width = workWidth;
    workCanvas.height = workHeight;
    const workContext = workCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!workContext) {
      throw new Error("مرورگر امکان پردازش تصویر را فراهم نکرد.");
    }

    workContext.imageSmoothingEnabled = true;
    workContext.imageSmoothingQuality = "high";
    workContext.drawImage(bitmap, 0, 0, workWidth, workHeight);
    const imageData = workContext.getImageData(
      0,
      0,
      workWidth,
      workHeight,
    );
    const { bbox } = removeConnectedBackground(imageData);
    workContext.putImageData(imageData, 0, 0);

    const [left, top, right, bottom] = bbox || [0, 0, workWidth, workHeight];
    const sourceWidth = Math.max(1, right - left);
    const sourceHeight = Math.max(1, bottom - top);
    const scale = Math.min(
      profile.maxWidth / sourceWidth,
      profile.maxHeight / sourceHeight,
      MAX_UPSCALE,
    );
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
    const targetCanvas = document.createElement("canvas");
    targetCanvas.width = CANVAS_SIZE;
    targetCanvas.height = CANVAS_SIZE;
    const targetContext = targetCanvas.getContext("2d");

    if (!targetContext) {
      throw new Error("ساخت قاب استاندارد تصویر ناموفق بود.");
    }

    targetContext.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    targetContext.imageSmoothingEnabled = true;
    targetContext.imageSmoothingQuality = "high";
    const x = Math.round((CANVAS_SIZE - targetWidth) / 2);
    const y = Math.max(40, Math.round(profile.floorY - targetHeight));
    targetContext.drawImage(
      workCanvas,
      left,
      top,
      sourceWidth,
      sourceHeight,
      x,
      y,
      targetWidth,
      targetHeight,
    );

    return canvasToProductFile(
      targetCanvas,
      file.name,
      profile.slug,
    );
  } finally {
    bitmap.close();
  }
}

export function CmsRawImagePipeline() {
  const [status, setStatus] = useState("");
  const processingRef = useRef(false);

  useEffect(() => {
    const onChange = (event: Event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      if (!input.matches(TARGET_SELECTOR)) return;

      if (input.dataset[BYPASS_FLAG] === "1") {
        delete input.dataset[BYPASS_FLAG];
        return;
      }

      const files = input.files ? Array.from(input.files) : [];
      if (!files.length || processingRef.current) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      processingRef.current = true;
      const profile = detectCategoryProfile();
      setStatus(
        `در حال آماده‌سازی ${files.length.toLocaleString("fa-IR")} تصویر برای ${profile.slug}…`,
      );

      void Promise.all(
        files.map((file) => normalizeProductImage(file, profile)),
      )
        .then((preparedFiles) => {
          const transfer = new DataTransfer();
          preparedFiles.forEach((file) => transfer.items.add(file));
          input.files = transfer.files;
          input.dataset[BYPASS_FLAG] = "1";
          setStatus("تصویر استاندارد شد؛ در حال ارسال به وردپرس…");
          input.dispatchEvent(
            new Event("change", {
              bubbles: true,
              cancelable: true,
            }),
          );
        })
        .catch((error) => {
          console.error("[cms-image-pipeline] image preparation failed", error);
          setStatus(
            error instanceof Error
              ? `پردازش تصویر انجام نشد: ${error.message}`
              : "پردازش تصویر انجام نشد.",
          );
        })
        .finally(() => {
          processingRef.current = false;
          window.setTimeout(() => setStatus(""), 4200);
        });
    };

    document.addEventListener("change", onChange, true);
    return () => document.removeEventListener("change", onChange, true);
  }, []);

  if (!status) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        insetInlineStart: 18,
        bottom: 18,
        zIndex: 10000,
        maxWidth: 360,
        padding: "12px 16px",
        borderRadius: 16,
        background: "rgba(32, 30, 28, 0.94)",
        color: "#fff",
        boxShadow: "0 12px 36px rgba(0,0,0,.16)",
        fontSize: 13,
        lineHeight: 1.8,
      }}
    >
      {status}
    </div>
  );
}
