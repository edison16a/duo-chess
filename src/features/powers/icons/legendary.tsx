import type { ReactElement } from "react";

/** Line art for the legendary powers. Each entry is the inner content of a 24x24 svg; the wrapper sets stroke and fill. */
export const LEGENDARY_ICONS: Record<string, ReactElement> = {
  "deep-freeze": (
    <>
      <path d="M3 2.5h10M3 21.5h10" />
      <path d="M4.5 2.5v3c0 2.5 3.5 4.5 3.5 6.5s-3.5 4-3.5 6.5v3M11.5 2.5v3c0 2.5-3.5 4.5-3.5 6.5s3.5 4 3.5 6.5v3" />
      <path d="M18 11v9M14.1 13.25l7.8 4.5M14.1 17.75l7.8-4.5" />
    </>
  ),
  meteor: (
    <>
      <circle cx="7.5" cy="16.5" r="4.5" />
      <path d="M11.5 12.5 20.5 3.5M9 9.5l4.5-4.5M14.5 15l4.5-4.5" />
      <circle cx="6.5" cy="17.5" r="1" fill="currentColor" />
    </>
  ),
  coronation: (
    <>
      <path d="M2.5 7 6 17h12l3.5-10-5 4L12 4l-4.5 7z" />
      <path d="M6 20.5h12" />
    </>
  ),
  clone: (
    <>
      <rect x="8" y="8" width="13.5" height="13.5" rx="2" />
      <path d="M4.5 16A2 2 0 0 1 2.5 14V4.5a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2" />
      <path d="M14.75 11.5v6.5M11.5 14.75H18" />
    </>
  ),
  "chain-lightning": (
    <>
      <path d="M14 2 4.5 13.5h6L8 21.5l4.5-6 3.5 5.5 3.5-9.5H13z" />
    </>
  ),
  bulwark: (
    <>
      <path d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.2 7.5 10 4.3-1.8 7.5-5.4 7.5-10v-6z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </>
  ),
  "summon-knight": (
    <>
      <path d="M6.5 18 8 13l-3.5 1.2L2.5 12 7 6.5l.5-3 2.5 2c4 .5 6.5 4 6 12.5" />
      <path d="M4.5 18h12v3h-12z" />
      <circle cx="7.8" cy="9" r="0.9" fill="currentColor" />
      <path d="M19 2l.9 2.1 2.1.9-2.1.9L19 8l-.9-2.1L16 5l2.1-.9z" />
    </>
  ),
  blizzard: (
    <>
      <path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.24" />
      <path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01" strokeWidth="2.5" />
    </>
  ),
  exile: (
    <>
      <path d="M13 7.5v-4H4.5v17H13v-4" />
      <path d="M9 12h12M17.5 8.5 21 12l-3.5 3.5" />
    </>
  ),
  inferno: (
    <>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </>
  ),
};
