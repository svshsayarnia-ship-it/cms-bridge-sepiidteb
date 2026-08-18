import type { ProductVisualProfile } from "./visualProfiles";

export type ProductVisualAnchor = "center-bottom";

export type ProductVisualCategoryConfig = {
  scale: number;
  anchor: ProductVisualAnchor;
  /**
   * Category backgrounds stay owned by the existing Sepiid Beauty CSS variables.
   * This token is documentation/configuration only; ProductVisual reads the
   * already-approved --category-* variables instead of redefining brand art.
   */
  background: "existing-category-background";
  defaultProfile: ProductVisualProfile;
};

export const PRODUCT_VISUAL_CONFIG: Record<
  string,
  ProductVisualCategoryConfig
> = {
  fillers: {
    scale: 0.86,
    anchor: "center-bottom",
    background: "existing-category-background",
    defaultProfile: "syringe",
  },
  "skin-boosters": {
    scale: 0.88,
    anchor: "center-bottom",
    background: "existing-category-background",
    defaultProfile: "syringe",
  },
  "botulinum-toxins": {
    scale: 0.88,
    anchor: "center-bottom",
    background: "existing-category-background",
    defaultProfile: "vial",
  },
  "rejuvenation-cocktails": {
    scale: 0.88,
    anchor: "center-bottom",
    background: "existing-category-background",
    defaultProfile: "box",
  },
  "brightening-cocktails": {
    scale: 0.87,
    anchor: "center-bottom",
    background: "existing-category-background",
    defaultProfile: "box",
  },
  "eye-cocktails": {
    scale: 0.86,
    anchor: "center-bottom",
    background: "existing-category-background",
    defaultProfile: "box",
  },
  "hair-cocktails": {
    scale: 0.87,
    anchor: "center-bottom",
    background: "existing-category-background",
    defaultProfile: "box",
  },
  "hyaluronidase-products": {
    scale: 0.88,
    anchor: "center-bottom",
    background: "existing-category-background",
    defaultProfile: "vial",
  },
  default: {
    scale: 0.87,
    anchor: "center-bottom",
    background: "existing-category-background",
    defaultProfile: "default",
  },
};

export function getProductVisualCategoryConfig(
  category?: string | null,
): ProductVisualCategoryConfig {
  if (!category) return PRODUCT_VISUAL_CONFIG.default;
  return PRODUCT_VISUAL_CONFIG[category] ?? PRODUCT_VISUAL_CONFIG.default;
}
