import type { ProductVisualProfile } from "./visualProfiles";

export type ProductVisualAnchor = "center-bottom";

export const CATEGORY_ARTWORK: Record<string, string> = {
  fillers: "/images/categories/clean/boho-fillers-clean.webp",
  "skin-boosters": "/images/categories/clean/boho-skin-boosters-clean.webp",
  "botulinum-toxins": "/images/categories/clean/boho-botox-v2-clean.webp",
  "rejuvenation-cocktails": "/images/categories/clean/boho-rejuvenation-clean.webp",
  "brightening-cocktails": "/images/categories/clean/boho-brightening-clean.webp",
  "eye-cocktails": "/images/categories/clean/boho-eye-clean.webp",
  "hair-cocktails": "/images/categories/clean/boho-hair-clean.webp",
  "hyaluronidase-products": "/images/categories/clean/boho-hyaluronidase-clean.webp",
};

export type ProductVisualCategoryConfig = {
  scale: number;
  anchor: ProductVisualAnchor;
  /** Exact approved category artwork inherited by every product in the category. */
  background: string;
  defaultProfile: ProductVisualProfile;
};

export const PRODUCT_VISUAL_CONFIG: Record<
  string,
  ProductVisualCategoryConfig
> = {
  fillers: {
    scale: 0.86,
    anchor: "center-bottom",
    background: CATEGORY_ARTWORK.fillers,
    defaultProfile: "syringe",
  },
  "skin-boosters": {
    scale: 0.88,
    anchor: "center-bottom",
    background: CATEGORY_ARTWORK["skin-boosters"],
    defaultProfile: "syringe",
  },
  "botulinum-toxins": {
    scale: 0.88,
    anchor: "center-bottom",
    background: CATEGORY_ARTWORK["botulinum-toxins"],
    defaultProfile: "vial",
  },
  "rejuvenation-cocktails": {
    scale: 0.88,
    anchor: "center-bottom",
    background: CATEGORY_ARTWORK["rejuvenation-cocktails"],
    defaultProfile: "box",
  },
  "brightening-cocktails": {
    scale: 0.87,
    anchor: "center-bottom",
    background: CATEGORY_ARTWORK["brightening-cocktails"],
    defaultProfile: "box",
  },
  "eye-cocktails": {
    scale: 0.86,
    anchor: "center-bottom",
    background: CATEGORY_ARTWORK["eye-cocktails"],
    defaultProfile: "box",
  },
  "hair-cocktails": {
    scale: 0.87,
    anchor: "center-bottom",
    background: CATEGORY_ARTWORK["hair-cocktails"],
    defaultProfile: "box",
  },
  "hyaluronidase-products": {
    scale: 0.88,
    anchor: "center-bottom",
    background: CATEGORY_ARTWORK["hyaluronidase-products"],
    defaultProfile: "vial",
  },
  default: {
    scale: 0.87,
    anchor: "center-bottom",
    background: CATEGORY_ARTWORK.fillers,
    defaultProfile: "default",
  },
};

export function getProductVisualCategoryConfig(
  category?: string | null,
): ProductVisualCategoryConfig {
  if (!category) return PRODUCT_VISUAL_CONFIG.default;
  return PRODUCT_VISUAL_CONFIG[category] ?? PRODUCT_VISUAL_CONFIG.default;
}

export function getCategoryArtwork(category?: string | null): string {
  return getProductVisualCategoryConfig(category).background;
}
