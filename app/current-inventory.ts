import { fillerInventorySeeds } from "./inventory/fillers";
import { skinAndSupportInventorySeeds } from "./inventory/skin-support";
import type { ProductSeed } from "./product-seed";

export const currentInventorySeeds: ProductSeed[] = [
  ...fillerInventorySeeds,
  ...skinAndSupportInventorySeeds,
];

export const currentInventoryLegacyAliases: Record<string, string> = {
  "neuramis-volume-lidocaine": "neuramis-deep-lidocaine",
  "neuramis-lidocaine": "neuramis-deep-lidocaine",
  "audrey-h": "audrey-m",
  "dimono-3ml": "cg-dimono-ptx",
  "dimono-mesotherapy": "cg-dimono-ptx",
  luxiva: "luxiva-mesogel",
};
