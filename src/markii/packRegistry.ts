import { defaultRegistry } from "@markii/react/components";
import { BUNDLED } from "./bundled";
import { buildPackRegistry } from "./registry";

/** The default registry plus every bundled pack, built once per process. */
export const PACKS = await buildPackRegistry(BUNDLED, defaultRegistry, (line) => console.warn(line));
