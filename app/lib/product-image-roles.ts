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
  return images.find((image) => isCardRoleImage(image, slugs)) ?? null;
}

export function findVariantRoleImage(
  images: CmsImage[],
  slugs: string | string[],
  variantId: string,
): CmsImage | null {
  return images.find((image) => isVariantRoleImage(image, slugs, variantId)) ?? null;
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
