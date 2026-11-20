"use client";

import { useEffect, useState } from "react";

export type ViewMode = "2d" | "3d";
const KEY = "duochess.view";

/** Remembers whether this browser prefers the flat or the 3D board. */
export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>("2d");
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "3d") setMode("3d");
    } catch {
      // Storage blocked: stay on 2D.
    }
  }, []);
  const update = (next: ViewMode) => {
    setMode(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Preference just will not persist.
    }
  };
  return [mode, update];
}
