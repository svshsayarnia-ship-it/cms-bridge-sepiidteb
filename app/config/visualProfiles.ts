export type ProductVisualProfile =
  | "tall"
  | "wide"
  | "square"
  | "vial"
  | "bottle"
  | "syringe"
  | "box"
  | "kit"
  | "default";

export type VisualProfileConfig = {
  /** Multiplier applied to the category scale. Keep adjustments subtle. */
  scaleMultiplier: number;
};

export const VISUAL_PROFILES: Record<
  ProductVisualProfile,
  VisualProfileConfig
> = {
  tall: { scaleMultiplier: 1.035 },
  wide: { scaleMultiplier: 0.94 },
  square: { scaleMultiplier: 0.985 },
  vial: { scaleMultiplier: 0.965 },
  bottle: { scaleMultiplier: 0.985 },
  syringe: { scaleMultiplier: 1.035 },
  box: { scaleMultiplier: 0.97 },
  kit: { scaleMultiplier: 0.91 },
  default: { scaleMultiplier: 1 },
};
