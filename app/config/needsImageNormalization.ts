export type ImageNormalizationIssue = {
  asset: string;
  reason: string;
};

/**
 * Migration QA queue only. Entries here MUST NOT change runtime presentation.
 * They are assets that previously needed product-specific display workarounds
 * and therefore deserve a manual alpha/carton review before the queue is cleared.
 */
export const NEEDS_IMAGE_NORMALIZATION: ImageNormalizationIssue[] = [
  {
    asset: "/images/products/sourced/f-mesomatrix.webp",
    reason: "Legacy white-carton source bypass removed; verify normalized cutout preserves the full carton face.",
  },
  {
    asset: "/images/products/sourced/fusion-f-radiance.webp",
    reason: "Legacy white-carton source bypass removed; verify normalized cutout preserves the full carton face.",
  },
  {
    asset: "/images/products/sourced/fusion-lift-face.webp",
    reason: "Legacy white-carton source bypass removed; verify normalized cutout preserves the full carton face.",
  },
  {
    asset: "/images/products/sourced/fusion-melaclear.webp",
    reason: "Legacy white-carton source bypass removed; verify normalized cutout preserves the full carton face.",
  },
  {
    asset: "/images/products/sourced/f-vitamin-c.webp",
    reason: "Legacy white-carton source bypass removed; verify normalized cutout preserves the full carton face.",
  },
  {
    asset: "/images/products/sourced/f-melirutin.webp",
    reason: "Legacy white-carton source bypass removed; verify normalized cutout preserves the full carton face.",
  },
  {
    asset: "/images/products/sourced/f-eye-contour.webp",
    reason: "Legacy white-carton source bypass removed; verify normalized cutout preserves the full carton face.",
  },
  {
    asset: "/images/products/sourced/f-hair.webp",
    reason: "Legacy white-carton source bypass removed; verify normalized cutout preserves the full carton face.",
  },
  {
    asset: "/images/products/sourced/fusion-hair-men.webp",
    reason: "Legacy white-carton source bypass removed; verify normalized cutout preserves the full carton face.",
  },
];
