import type { ReactElement } from "react";
import { CHROMATIC_ICONS } from "./chromatic";
import { EPIC_ICONS } from "./epic";
import { LEGENDARY_ICONS } from "./legendary";
import { MYTHICAL_ICONS } from "./mythical";
import { RARE_ICONS } from "./rare";

/** Every power icon keyed by power id. */
export const POWER_ICONS: Record<string, ReactElement> = {
  ...RARE_ICONS,
  ...EPIC_ICONS,
  ...LEGENDARY_ICONS,
  ...MYTHICAL_ICONS,
  ...CHROMATIC_ICONS,
};
