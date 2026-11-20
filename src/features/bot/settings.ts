/** Remembers the last bot rating per browser. Purely a convenience. */

import { DEFAULT_ELO, clampElo } from "./elo";

const ELO_KEY = "duochess.botElo";

export function loadElo(): number {
  try {
    const stored = localStorage.getItem(ELO_KEY);
    return stored ? clampElo(Number(stored)) : DEFAULT_ELO;
  } catch {
    return DEFAULT_ELO;
  }
}

export function saveElo(elo: number): void {
  try {
    localStorage.setItem(ELO_KEY, String(clampElo(elo)));
  } catch {
    // Private windows can refuse storage; the slider still works.
  }
}
