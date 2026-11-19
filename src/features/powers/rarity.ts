import type { Rarity } from "./types";

export const RARITIES: Rarity[] = ["rare", "epic", "legendary", "mythical", "chromatic"];

/** Draft odds. Chromatic is meant to feel like an event when it shows up. */
export const RARITY_WEIGHT: Record<Rarity, number> = {
  rare: 46,
  epic: 28,
  legendary: 15,
  mythical: 8,
  chromatic: 3,
};

export const RARITY_LABEL: Record<Rarity, string> = {
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythical: "Mythical",
  chromatic: "Chromatic",
};

/** CSS custom property each rarity paints with. Chromatic animates its hue in CSS. */
export const RARITY_COLOR: Record<Rarity, string> = {
  rare: "var(--rarity-rare)",
  epic: "var(--rarity-epic)",
  legendary: "var(--rarity-legendary)",
  mythical: "var(--rarity-mythical)",
  chromatic: "var(--rarity-chromatic)",
};
