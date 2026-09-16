import { createHash } from "node:crypto";

import { getStorefrontCatalog } from "@/app/lib/storefront-catalog";

export const dynamic = "force-dynamic";

type MediaUse = {
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  image: string;
  normalizedImage: string;
  imageVerified: boolean | null;
  imageKind: string | null;
  imageApproved: boolean | null;
  mediaSha256: string | null;
  mediaStatus: number | null;
  mediaType: string | null;
};

function normalizeImage(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed, "https://sepiidbeauty.ir");
    return `${url.pathname}${url.search}`.replace(/\/+$/, "").toLowerCase();
  } catch {
    return trimmed.split("#")[0].replace(/\/+$/, "").toLowerCase();
  }
}

async function inspectRenderedMedia(image: string) {
  const normalized = normalizeImage(image);
  if (!normalized) return { sha256: null, status: null, type: null };

  const target = image.startsWith("http")
    ? image
    : new URL(normalized, "https://sepiidbeauty.ir").toString();

  try {
    const response = await fetch(target, { cache: "no-store", redirect: "follow" });
    const type = response.headers.get("content-type");
    if (!response.ok || !type?.toLowerCase().startsWith("image/")) {
      return { sha256: null, status: response.status, type };
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    return {
      sha256: createHash("sha256").update(bytes).digest("hex"),
      status: response.status,
      type,
    };
  } catch {
    return { sha256: null, status: null, type: null };
  }
}

export async function GET() {
  const { products } = await getStorefrontCatalog();
  const variantProducts = products.filter((product) => (product.variants?.length ?? 0) > 0);

  const uses: MediaUse[] = [];
  for (const product of variantProducts) {
    for (const variant of product.variants ?? []) {
      const image = variant.image?.trim() ?? "";
      const inspected = image
        ? await inspectRenderedMedia(image)
        : { sha256: null, status: null, type: null };
      uses.push({
        productSlug: product.slug,
        productName: product.nameFa,
        variantId: variant.id,
        variantName: variant.nameFa || variant.label,
        image,
        normalizedImage: normalizeImage(image),
        imageVerified: typeof variant.imageVerified === "boolean" ? variant.imageVerified : null,
        imageKind: variant.imageKind ?? null,
        imageApproved: typeof variant.imageApproved === "boolean" ? variant.imageApproved : null,
        mediaSha256: inspected.sha256,
        mediaStatus: inspected.status,
        mediaType: inspected.type,
      });
    }
  }

  const issues: Array<Record<string, unknown>> = [];
  const missingImages = uses.filter((item) => !item.image);
  const unreadableImages = uses.filter(
    (item) => item.image && (!item.mediaSha256 || item.mediaStatus !== 200 || !item.mediaType?.startsWith("image/")),
  );

  for (const item of missingImages) issues.push({ type: "missing-image", ...item });
  for (const item of unreadableImages) issues.push({ type: "unreadable-image", ...item });

  for (const product of variantProducts) {
    const productUses = uses.filter((item) => item.productSlug === product.slug);
    const byPath = new Map<string, MediaUse[]>();
    const byHash = new Map<string, MediaUse[]>();

    for (const item of productUses) {
      if (item.normalizedImage) {
        const group = byPath.get(item.normalizedImage) ?? [];
        group.push(item);
        byPath.set(item.normalizedImage, group);
      }
      if (item.mediaSha256) {
        const group = byHash.get(item.mediaSha256) ?? [];
        group.push(item);
        byHash.set(item.mediaSha256, group);
      }
    }

    for (const [image, group] of byPath) {
      if (group.length > 1) {
        issues.push({
          type: "duplicate-image-path-within-product",
          productSlug: product.slug,
          image,
          variants: group.map((item) => ({ id: item.variantId, name: item.variantName })),
        });
      }
    }
    for (const [sha256, group] of byHash) {
      if (group.length > 1) {
        issues.push({
          type: "duplicate-image-bytes-within-product",
          productSlug: product.slug,
          sha256,
          images: Array.from(new Set(group.map((item) => item.image))),
          variants: group.map((item) => ({ id: item.variantId, name: item.variantName })),
        });
      }
    }
  }

  const globalByPath = new Map<string, MediaUse[]>();
  const globalByHash = new Map<string, MediaUse[]>();
  for (const item of uses) {
    if (item.normalizedImage) {
      const group = globalByPath.get(item.normalizedImage) ?? [];
      group.push(item);
      globalByPath.set(item.normalizedImage, group);
    }
    if (item.mediaSha256) {
      const group = globalByHash.get(item.mediaSha256) ?? [];
      group.push(item);
      globalByHash.set(item.mediaSha256, group);
    }
  }

  const globalDuplicatePaths = Array.from(globalByPath.entries())
    .filter(([, group]) => new Set(group.map((item) => `${item.productSlug}:${item.variantId}`)).size > 1)
    .map(([image, group]) => ({
      image,
      uses: group.map((item) => ({ product: item.productSlug, variant: item.variantId, name: item.variantName })),
    }));

  const globalDuplicateBytes = Array.from(globalByHash.entries())
    .filter(([, group]) => new Set(group.map((item) => `${item.productSlug}:${item.variantId}`)).size > 1)
    .map(([sha256, group]) => ({
      sha256,
      images: Array.from(new Set(group.map((item) => item.image))),
      uses: group.map((item) => ({ product: item.productSlug, variant: item.variantId, name: item.variantName })),
    }));

  return Response.json(
    {
      summary: {
        variantProductCount: variantProducts.length,
        variantCount: uses.length,
        missingImageCount: missingImages.length,
        unreadableImageCount: unreadableImages.length,
        withinProductIssueCount: issues.filter((item) => String(item.type).includes("within-product")).length,
        totalIssueCount: issues.length,
        globalDuplicatePathCount: globalDuplicatePaths.length,
        globalDuplicateByteCount: globalDuplicateBytes.length,
      },
      products: variantProducts.map((product) => ({
        slug: product.slug,
        name: product.nameFa,
        parentImage: product.image,
        variants: uses
          .filter((item) => item.productSlug === product.slug)
          .map((item) => ({
            id: item.variantId,
            name: item.variantName,
            image: item.image,
            normalizedImage: item.normalizedImage,
            mediaSha256: item.mediaSha256,
            mediaStatus: item.mediaStatus,
            mediaType: item.mediaType,
            imageVerified: item.imageVerified,
            imageKind: item.imageKind,
            imageApproved: item.imageApproved,
          })),
      })),
      issues,
      globalDuplicatePaths,
      globalDuplicateBytes,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
