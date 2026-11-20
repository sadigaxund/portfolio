export const LOCAL_IMAGES = import.meta.glob<string>("/content/**/*.{webp,png,jpg,svg,mp4}", { query: "?url", import: "default", eager: true });
