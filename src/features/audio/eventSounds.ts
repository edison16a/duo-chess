import type { GameEvent } from "@/engine";
import { POWERS } from "@/features/powers";
import { sfx } from "./sounds";

/** One sound per action, picked by the most dramatic thing that happened. Shared by the 2D and 3D boards. */
export function playEventSounds(events: GameEvent[]): void {
  const types = new Set(events.map((e) => e.type));
  const power = events.find((e) => e.type === "power");
  if (power && power.type === "power" && POWERS[power.power]) sfx.power(POWERS[power.power].vfx);
  if (types.has("explosion") || types.has("mine")) sfx.explosion();
  else if (types.has("check")) sfx.check();
  else if (types.has("castle")) sfx.castle();
  else if (types.has("capture") || types.has("destroy")) sfx.capture();
  else if (types.has("move")) sfx.move();
}
