import NoteIsland, { type IslandProps } from "./NoteIsland";
import { PACKS } from "./packRegistry";

/** A note with scripts that also names a pack. Loading this module waits for the pack registry, so hydration matches the server. */
export default function NoteIslandPacks(props: Omit<IslandProps, "registry">) {
  return <NoteIsland {...props} registry={PACKS.registry} />;
}
