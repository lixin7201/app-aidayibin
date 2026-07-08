import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

import type { LifeTestResultCode } from "@/features/life-test/types";

const posterAssetExtensions = ["webp", "png", "jpg", "jpeg"] as const;

export function getLifeTestPosterPreferredBasePath(code: LifeTestResultCode) {
  return join(process.cwd(), "public", "life-test", "posters", `${code}.png`);
}

export function getLifeTestPosterPublicBaseUrl(code: LifeTestResultCode) {
  return `/life-test/posters/${code}.png`;
}

export async function getLifeTestPosterBasePath(code: LifeTestResultCode) {
  for (const extension of posterAssetExtensions) {
    const filePath = join(
      process.cwd(),
      "public",
      "life-test",
      "posters",
      `${code}.${extension}`,
    );

    try {
      await access(filePath);
      return filePath;
    } catch {
      // Try the next extension. Missing local assets should not break results.
    }
  }

  return null;
}

export async function readLifeTestPosterBaseDataUri(code: LifeTestResultCode) {
  for (const extension of posterAssetExtensions) {
    const filePath = join(
      process.cwd(),
      "public",
      "life-test",
      "posters",
      `${code}.${extension}`,
    );

    try {
      const buffer = await readFile(filePath);
      const mimeType = extension === "jpg" ? "jpeg" : extension;
      return `data:image/${mimeType};base64,${buffer.toString("base64")}`;
    } catch {
      // Try the next extension. Missing local assets should not break results.
    }
  }

  return null;
}
