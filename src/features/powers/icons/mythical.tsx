import type { ReactElement } from "react";

/** Line art for the mythical powers. Each entry is the inner content of a 24x24 svg; the wrapper sets stroke and fill. */
export const MYTHICAL_ICONS: Record<string, ReactElement> = {
  curse: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <path d="M12 12a.75.75 0 0 1 .75.75 1.5 1.5 0 0 1-1.5 1.5A2.25 2.25 0 0 1 9 12a3 3 0 0 1 3-3" />
    </>
  ),
  "summon-dragon": (
    <>
      <path d="M3 9.5 9 7c1.5-2 4-4.5 8.5-5.5-2 1.5-3 3.5-3.5 5 2 .5 3.5 1.5 4.5 3l2.5-.5-1.5 2.5 2 1-2 1.5c.5 2 .5 4.5.5 7" />
      <path d="M3 9.5V12l6.5.5-5 2.5 1.5 1.5 5-.5c1.5 1.5 2.5 3 3 5.5" />
      <circle cx="11.3" cy="9.6" r="1" fill="currentColor" />
    </>
  ),
  overclock: (
    <>
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
      <path d="M12 15l5-5" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
      <path d="M6 13h1.5M12 7v1.5" />
    </>
  ),
  armageddon: (
    <>
      <path d="M6.5 12a3 3 0 0 1-1.7-5.5A4 4 0 0 1 9.5 3.2a4 4 0 0 1 5 0 4 4 0 0 1 4.7 3.3A3 3 0 0 1 17.5 12z" />
      <path d="M10.5 12c0 3-.5 4.8-2 6.5M13.5 12c0 3 .5 4.8 2 6.5" />
      <ellipse cx="12" cy="14.5" rx="4.5" ry="1.25" />
      <path d="M3.5 21.5c0-1.8 1.5-3 3.5-3h10c2 0 3.5 1.2 3.5 3z" />
    </>
  ),
  "black-hole": (
    <>
      <path d="M14.6 12L14.8 12.6L14.9 13.2L14.9 13.9L14.7 14.6L14.3 15.3L13.7 15.9L13 16.4L12.1 16.8L11.1 17L10.1 17L9 16.8L8 16.3L7 15.6L6.1 14.7L5.4 13.6L5 12.3L4.8 10.9L4.8 9.5L5.2 8L5.9 6.6L6.9 5.3L8.1 4.2L9.6 3.3L11.3 2.8L13.1 2.5L15 2.7" />
      <path d="M9.4 12L9.2 11.4L9.1 10.8L9.1 10.1L9.3 9.4L9.7 8.7L10.3 8.1L11 7.6L11.9 7.2L12.9 7L13.9 7L15 7.2L16 7.7L17 8.4L17.9 9.3L18.6 10.4L19 11.7L19.2 13.1L19.2 14.5L18.8 16L18.1 17.4L17.1 18.7L15.9 19.8L14.4 20.7L12.7 21.2L10.9 21.5L9 21.3" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </>
  ),
  possession: (
    <>
      <path d="M4.5 3.5h15" />
      <path d="M6.5 3.5v9.5M17.5 3.5v9.5M12 3.5V7" />
      <circle cx="12" cy="9.25" r="2.25" />
      <path d="M6.5 13 12 14l5.5-1M12 11.5v6M8.5 21.5l3.5-4 3.5 4" />
    </>
  ),
  resurrection: (
    <>
      <path d="M12 10.5C9.5 9 8 6.8 8 5a4 4 0 0 1 8 0c0 1.8-1.5 4-4 5.5z" />
      <path d="M5 10.5h14M12 10.5v11" />
    </>
  ),
  "mirror-image": (
    <>
      <path d="M3 7l5.5 5L3 17z" fill="currentColor" />
      <path d="M21 7l-5.5 5 5.5 5z" />
      <path d="M12 2v2.5M12 8v2.5M12 13.5V16M12 19.5V22" />
    </>
  ),
};
