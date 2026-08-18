"use client";

/* eslint-disable @next/next/no-img-element -- remote/SVG fallback stays centralized here */

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import {
  getProductVisualCategoryConfig,
  type ProductVisualAnchor,
} from "../../config/productVisualConfig";
import {
  VISUAL_PROFILES,
  type ProductVisualProfile,
} from "../../config/visualProfiles";
import { getProductCutoutSrc } from "../../lib/product-image";

const FALLBACK_PRODUCT_IMAGE = "/images/sepiid-logo.webp";
const MAX_OFFSET = 5;
const MIN_SCALE = 0.68;
const MAX_SCALE = 1.06;

export type ProductVisualVariant =
  | "card"
  | "detail"
  | "carousel"
  | "search"
  | "hero"
  | "thumbnail";

export type ProductVisualProduct = {
  slug?: string;
  nameFa: string;
  category?: string;
  image?: string | null;
  masterImage?: string | null;
  imageAlt?: string | null;
  visualProfile?: ProductVisualProfile | null;
  visualScale?: number | null;
  visualOffsetX?: number | null;
  visualOffsetY?: number | null;
};

type ProductVisualProps = {
  product: ProductVisualProduct;
  variant?: ProductVisualVariant;
  priority?: boolean;
  sizes?: string;
  className?: string;
  decorative?: boolean;
  draggable?: boolean;
  showBackground?: boolean;
};

type ProductVisualStyle = CSSProperties & {
  "--product-visual-scale": number;
  "--product-visual-offset-x": string;
  "--product-visual-offset-y": string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function finiteOrNull(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function canUseNextImage(src: string) {
  return src.startsWith("/") && !/\.svg(?:\?|$)/iu.test(src);
}

function resolveAnchor(anchor: ProductVisualAnchor) {
  return anchor === "center-bottom" ? "center bottom" : "center bottom";
}

function getVariantSizes(variant: ProductVisualVariant) {
  switch (variant) {
    case "detail":
      return "(max-width: 820px) 94vw, 48vw";
    case "carousel":
      return "(max-width: 820px) 92vw, 52vw";
    case "hero":
      return "(max-width: 820px) 44vw, 260px";
    case "search":
      return "72px";
    case "thumbnail":
      return "58px";
    case "card":
    default:
      return "(max-width: 1100px) 50vw, 33vw";
  }
}

export function ProductVisual({
  product,
  variant = "card",
  priority = false,
  sizes,
  className = "",
  decorative = false,
  draggable = false,
  showBackground = true,
}: ProductVisualProps) {
  const requestedSrc = getProductCutoutSrc(
    product.masterImage?.trim() ||
      product.image?.trim() ||
      FALLBACK_PRODUCT_IMAGE,
  );
  const [src, setSrc] = useState(requestedSrc);

  useEffect(() => {
    setSrc(requestedSrc);
  }, [requestedSrc]);

  const categoryConfig = getProductVisualCategoryConfig(product.category);
  const profile =
    product.visualProfile && VISUAL_PROFILES[product.visualProfile]
      ? product.visualProfile
      : categoryConfig.defaultProfile;
  const profileConfig = VISUAL_PROFILES[profile] ?? VISUAL_PROFILES.default;

  const scale = useMemo(() => {
    const explicitScale = finiteOrNull(product.visualScale);
    return clamp(
      explicitScale ?? categoryConfig.scale * profileConfig.scaleMultiplier,
      MIN_SCALE,
      MAX_SCALE,
    );
  }, [categoryConfig.scale, product.visualScale, profileConfig.scaleMultiplier]);

  const offsetX = clamp(
    finiteOrNull(product.visualOffsetX) ?? 0,
    -MAX_OFFSET,
    MAX_OFFSET,
  );
  const offsetY = clamp(
    finiteOrNull(product.visualOffsetY) ?? 0,
    -MAX_OFFSET,
    MAX_OFFSET,
  );

  const visualStyle: ProductVisualStyle = {
    "--product-visual-scale": scale,
    "--product-visual-offset-x": `${offsetX}%`,
    "--product-visual-offset-y": `${offsetY}%`,
  };

  const imageAlt = decorative
    ? ""
    : product.imageAlt?.trim() || `تصویر ${product.nameFa}`;
  const imageClassName = "product-visual__image";
  const imageSizes = sizes ?? getVariantSizes(variant);

  const image = canUseNextImage(src) ? (
    <Image
      alt={imageAlt}
      className={imageClassName}
      draggable={draggable}
      fill
      onError={() => {
        if (src !== FALLBACK_PRODUCT_IMAGE) setSrc(FALLBACK_PRODUCT_IMAGE);
      }}
      priority={priority}
      sizes={imageSizes}
      src={src}
    />
  ) : (
    <img
      alt={imageAlt}
      className={imageClassName}
      decoding="async"
      draggable={draggable}
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
      onError={() => {
        if (src !== FALLBACK_PRODUCT_IMAGE) setSrc(FALLBACK_PRODUCT_IMAGE);
      }}
      src={src}
    />
  );

  return (
    <span
      className={`product-visual product-visual--${variant}${
        showBackground ? " product-visual--with-background" : ""
      }${className ? ` ${className}` : ""}`}
      data-category={product.category || "default"}
      data-profile={profile}
      data-product-slug={product.slug}
      style={visualStyle}
    >
      <span className="product-visual__background" aria-hidden="true" />
      <span className="product-visual__stage">
        {image}
      </span>
    </span>
  );
}
