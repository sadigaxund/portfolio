import type { ImageSize } from "./links";

export const LOCAL_IMAGES = import.meta.glob<string>("/content/**/*.{webp,png,jpg,svg,mp4}", { query: "?url", import: "default", eager: true });

/** Intrinsic size of each raster image, so an `<img>` reserves its space before it loads. */
export const LOCAL_IMAGE_SIZES: Readonly<Record<string, ImageSize>> = Object.fromEntries(
  Object.entries(import.meta.glob<{ width: number; height: number }>("/content/**/*.{webp,png,jpg}", { import: "default", eager: true })).map(
    ([path, meta]) => [path, { width: meta.width, height: meta.height }],
  ),
);
