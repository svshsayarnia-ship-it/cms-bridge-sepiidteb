import type { Product, ProductVariant } from "../data";

const knownPlaceholderPath = /\/(?:images\/editorial-detail\.webp|images\/drive\/category-[^/?#]+\.webp)(?:[?#].*)?$/iu;
const placeholderAlt = /تصویر\s+(?:مفهومی|دسته(?:‌|\s)?بندی)|تصویر\s+گروه/u;

type PublicImageCandidate = {
  src?: string;
  alt?: string;
  verified?: boolean;
};

export function isVerifiedPublicProductImage({
  src = "",
  alt = "",
  verified = false,
}: PublicImageCandidate): boolean {
  const cleanSrc = src.trim();

  return Boolean(
    verified &&
      cleanSrc &&
      !knownPlaceholderPath.test(cleanSrc) &&
      !placeholderAlt.test(alt.trim()),
  );
}

export function isVerifiedPublicVariant(
  variant: ProductVariant,
): boolean {
  return isVerifiedPublicProductImage({
    src: variant.image,
    alt: variant.imageAlt,
    verified: variant.imageVerified,
  });
}

export function preparePublicImageProduct<T extends Product>(
  product: T,
): T | null {
  if (product.variants?.length) {
    const variants = product.variants.filter(isVerifiedPublicVariant);

    if (!variants.length) {
      return null;
    }

    const primaryVariant = variants[0];

    return {
      ...product,
      image: primaryVariant.image,
      imageAlt: primaryVariant.imageAlt,
      imageVerified: true,
      variants,
    };
  }

  return isVerifiedPublicProductImage({
    src: product.image,
    alt: product.imageAlt,
    verified: product.imageVerified,
  })
    ? product
    : null;
}

export function hasPublicProductImage(product: Product): boolean {
  return preparePublicImageProduct(product) !== null;
}
