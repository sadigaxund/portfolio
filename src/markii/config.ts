import raw from "../../markii/settings.json";
import { parseSettings } from "./settings";

/** The host settings, checked at build time. */
export const SETTINGS = parseSettings(raw);
