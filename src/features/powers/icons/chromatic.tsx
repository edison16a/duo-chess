import type { ReactElement } from "react";

/** Line art for the chromatic powers. Each entry is the inner content of a 24x24 svg; the wrapper sets stroke and fill. */
export const CHROMATIC_ICONS: Record<string, ReactElement> = {
  "prismatic-burst": (
    <>
      <path d="M10 4l7 13H3z" />
      <path d="M1.5 12.5l5-2" />
      <path d="M13.5 10.5 22 7M13.5 10.5 22 11.5M13.5 10.5 22 16" />
    </>
  ),
  supernova: (
    <>
      <path d="M12 2l1.61 6.12 3.69-1.42-1.42 3.69L22 12l-6.12 1.61 1.42 3.69-3.69-1.42L12 22l-1.61-6.12-3.69 1.42 1.42-3.69L2 12l6.12-1.61L6.7 6.7l3.69 1.42z" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </>
  ),
  infinity: (
    <>
      <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4z" />
    </>
  ),
  "rainbow-bridge": (
    <>
      <path d="M2 17.5a10 10 0 0 1 20 0" />
      <path d="M5.5 17.5a6.5 6.5 0 0 1 13 0" />
      <path d="M9 17.5a3 3 0 0 1 6 0" />
    </>
  ),
  genesis: (
    <>
      <path d="M12 21.5v-8" />
      <path d="M12 17c-3 0-5-2-5-5 3 0 5 2 5 5zM12 15c0-3 2-5 5-5 0 3-2 5-5 5z" />
      <path d="M12 1.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
    </>
  ),
};
