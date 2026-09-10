import type { CmsImage } from "./cms-types";

const ROLE_PREFIX = "sepiid-role";

function rolePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function imageIdentity(image: CmsImage): string {
  const fileName = image.src.split("/").pop() ?? "";
  return `${image.name} ${fileName}`.toLowerCase();
}

function asSlugList(slugs: string | string[]): string[] {
  return Array.from(
    new Set(
      (Array.isArray(slugs) ? slugs : [slugs])
        .map((slug) => slug.trim())
        .filter(Boolean),
    ),
  );
}

export function cardImageRoleToken(slug: string): string {
  return `${ROLE_PREFIX}-card-${rolePart(slug)}-slot`;
}

export function variantImageRoleToken(slug: string, variantId: string): string {
  return `${ROLE_PREFIX}-variant-${rolePart(slug)}-${rolePart(variantId)}-slot`;
}

export function imageHasRoleToken(image: CmsImage, token: string): boolean {
  return imageIdentity(image).includes(token.toLowerCase());
}

/**
 * Only images explicitly uploaded through Sepiid CMS image-role controls are
 * allowed to become storefront product media. Ordinary WooCommerce gallery
 * images may stay attached to the product for migration/back-office purposes,
 * but public rendering must ignore them completely.
 */
export function isManagedProductRoleImage(image: CmsImage): boolean {
  return imageIdentity(image).includes(`${ROLE_PREFIX}-`);
}

export function isAnyCardRoleImage(image: CmsImage): boolean {
  return imageIdentity(image).includes(`${ROLE_PREFIX}-card-`);
}

export function isAnyVariantRoleImage(image: CmsImage): boolean {
  return imageIdentity(image).includes(`${ROLE_PREFIX}-variant-`);
}

export function isCardRoleImage(
  image: CmsImage,
  slugs: string | string[],
): boolean {
  return asSlugList(slugs).some((slug) =>
    imageHasRoleToken(image, cardImageRoleToken(slug)),
  );
}

export function isVariantRoleImage(
  image: CmsImage,
  slugs: string | string[],
  variantId: string,
): boolean {
  return asSlugList(slugs).some((slug) =>
    imageHasRoleToken(image, variantImageRoleToken(slug, variantId)),
  );
}

export function findCardRoleImage(
  images: CmsImage[],
  slugs: string | string[],
): CmsImage | null {
  return (
    images.find((image) => isCardRoleImage(image, slugs)) ??
    images.find(isAnyCardRoleImage) ??
    null
  );
}

export function findVariantRoleImage(
  images: CmsImage[],
  slugs: string | string[],
  variantId: string,
): CmsImage | null {
  const exact = images.find((image) =>
    isVariantRoleImage(image, slugs, variantId),
  );
  if (exact) return exact;

  const suffix = `-${rolePart(variantId)}-slot`;
  return (
    images.find((image) => {
      const identity = imageIdentity(image);
      return (
        identity.includes(`${ROLE_PREFIX}-variant-`) &&
        identity.includes(suffix)
      );
    }) ?? null
  );
}

/**
 * Normalize public product media so CMS primary/card media is first, followed
 * by CMS variant media. Non-role WooCommerce images are deliberately removed.
 */
export function storefrontRoleImages(images: CmsImage[]): CmsImage[] {
  return images
    .filter(isManagedProductRoleImage)
    .sort((first, second) => {
      const firstRank = isAnyCardRoleImage(first) ? 0 : isAnyVariantRoleImage(first) ? 1 : 2;
      const secondRank = isAnyCardRoleImage(second) ? 0 : isAnyVariantRoleImage(second) ? 1 : 2;
      return firstRank - secondRank;
    });
}

export function roleUploadFileName(
  fileName: string,
  token: string,
): string {
  const dot = fileName.lastIndexOf(".");
  const rawBase = dot > 0 ? fileName.slice(0, dot) : fileName;
  const extension = dot > 0 ? fileName.slice(dot + 1) : "webp";
  const cleanBase = rawBase
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "image";
  const cleanExtension = extension.replace(/[^a-z0-9]+/gi, "").toLowerCase() || "webp";

  return `${token}-${cleanBase}.${cleanExtension}`;
}
