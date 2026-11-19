/**
 * User made maps live in localStorage. They are tiny, and when a host picks
 * one the full map travels inside the room config, so the guest never needs
 * the host's storage.
 */

import type { ChessMap } from "./types";

const KEY = "duochess.maps.v1";

export function loadCustomMaps(): ChessMap[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ChessMap[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomMap(map: ChessMap): void {
  try {
    const maps = loadCustomMaps().filter((m) => m.id !== map.id);
    localStorage.setItem(KEY, JSON.stringify([{ ...map, custom: true }, ...maps]));
  } catch {
    // Private windows can refuse storage; the editor still works for this session.
  }
}

export function deleteCustomMap(id: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadCustomMaps().filter((m) => m.id !== id)));
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
