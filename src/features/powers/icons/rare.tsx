import type { ReactElement } from "react";

/** Line art for the rare powers. Each entry is the inner content of a 24x24 svg; the wrapper sets stroke and fill. */
export const RARE_ICONS: Record<string, ReactElement> = {
  frostbite: (
    <>
      <path d="M12 2.5v19M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" />
      <path d="M12 2.5v19M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" transform="rotate(60 12 12)" />
      <path d="M12 2.5v19M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" transform="rotate(120 12 12)" />
    </>
  ),
  aegis: (
    <>
      <path d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.2 7.5 10 4.3-1.8 7.5-5.4 7.5-10v-6z" />
      <path d="M12 6.5v11.6c-2.6-1.4-4.3-3.8-4.3-6.6V8.2z" fill="currentColor" />
    </>
  ),
  "pawn-storm": (
    <>
      <circle cx="12" cy="8" r="2.5" />
      <path d="M9.5 12.5h5M10.5 12.5 9.5 17.5M13.5 12.5l1 5M8 21h8l-1.5-3.5h-5z" />
      <path d="M4 15V5M2 7.5 4 5l2 2.5" />
      <path d="M20 15V5M18 7.5 20 5l2 2.5" />
    </>
  ),
  reinforce: (
    <>
      <circle cx="9" cy="8" r="2.5" />
      <path d="M6.5 12.5h5M7.5 12.5 6.5 17.5M10.5 12.5l1 5M5 21h8l-1.5-3.5h-5z" />
      <path d="M18.5 3.5v7M15 7h7" />
    </>
  ),
  sidestep: (
    <>
      <rect x="2.5" y="12.5" width="8" height="8" rx="1.5" strokeDasharray="2 2.5" />
      <rect x="13.5" y="12.5" width="8" height="8" rx="1.5" />
      <circle cx="17.5" cy="16.5" r="1.75" fill="currentColor" />
      <path d="M5 8.5h13.5M15.5 5.5l3 3-3 3" />
    </>
  ),
  swap: (
    <>
      <circle cx="5" cy="7" r="2.25" />
      <path d="M9 7h11.5M17.5 4l3 3-3 3" />
      <circle cx="19" cy="17" r="2.25" />
      <path d="M15 17H3.5M6.5 14l-3 3 3 3" />
    </>
  ),
  barricade: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
      <path d="M3 9.5h18M3 14.5h18" />
      <path d="M9 4.5v5M15 4.5v5M6 9.5v5M12 9.5v5M18 9.5v5M9 14.5v5M15 14.5v5" />
    </>
  ),
  landmine: (
    <>
      <path d="M3.5 15.5h17V17a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 17z" />
      <path d="M6 15.5a6 3.5 0 0 1 12 0" />
      <path d="M10.5 12.2v-1.7h3v1.7" />
      <path d="M12 3v3.5M6.5 5l1.75 2.25M17.5 5l-1.75 2.25" />
    </>
  ),
  squire: (
    <>
      <path d="M8.5 18 10 13l-3.5 1.2L4.5 12 9 6.5l.5-3 2.5 2c4 .5 6.5 4 6 12.5" />
      <path d="M6.5 18h12v3h-12z" />
      <circle cx="9.8" cy="9" r="0.9" fill="currentColor" />
      <path d="M18 6.5 20 4.5l2 2" />
    </>
  ),
  recall: (
    <>
      <path d="M2.5 11 12 3l9.5 8" />
      <path d="M5 9v11.5h14V9" />
      <path d="M15.5 17.5v-2a2.5 2.5 0 0 0-2.5-2.5H8.5" />
      <path d="M10.5 10.5 8 13l2.5 2.5" />
    </>
  ),
  "smoke-screen": (
    <>
      <path d="M7 16.5a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 16.9 7.6 4.5 4.5 0 0 1 17 16.5z" />
      <path d="M4 20.5h7M14 20.5h6" />
    </>
  ),
  pushback: (
    <>
      <path d="M2.5 12h8.5M8 8.5l3.5 3.5L8 15.5" />
      <circle cx="16.5" cy="12" r="3.5" />
      <path d="M21.5 8a6 6 0 0 1 0 8" />
    </>
  ),
  fortify: (
    <>
      <path d="M5.5 20.5V4h3v2.5H11V4h2v2.5h2.5V4h3v16.5" />
      <path d="M3.5 20.5h17" />
      <path d="M10 20.5V17a2 2 0 0 1 4 0v3.5" />
      <path d="M5.5 10h13" />
    </>
  ),
  leapfrog: (
    <>
      <path d="M4.5 16.5Q12 1.5 19.5 16.5" />
      <path d="M16.4 14.8 19.5 16.5 20 13" />
      <circle cx="12" cy="17" r="2.5" fill="currentColor" />
      <path d="M3 21h18" />
    </>
  ),
  sprint: (
    <>
      <circle cx="8" cy="8" r="2.5" />
      <path d="M5.5 12.5h5M6.5 12.5 5.5 17.5M9.5 12.5l1 5M4 21h8l-1.5-3.5h-5z" />
      <path d="M15 10.5l3-3 3 3M15 16l3-3 3 3" />
    </>
  ),
};
