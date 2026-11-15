import { bundlePacks } from "./packs";

/** The packs in markii/packs/, read as text at build time. */
const SOURCES = import.meta.glob("/markii/packs/*/*", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export const BUNDLED = bundlePacks(SOURCES);
