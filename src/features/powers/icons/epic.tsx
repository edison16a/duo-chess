import type { ReactElement } from "react";

/** Line art for the epic powers. Each entry is the inner content of a 24x24 svg; the wrapper sets stroke and fill. */
export const EPIC_ICONS: Record<string, ReactElement> = {
  "ice-wall": (
    <>
      <rect x="2.5" y="6" width="5.5" height="13" rx="1" />
      <rect x="9.25" y="6" width="5.5" height="13" rx="1" />
      <rect x="16" y="6" width="5.5" height="13" rx="1" />
      <path d="M4.5 9.5 6 8M11.25 9.5l1.5-1.5M18 9.5 19.5 8" />
      <path d="M5.25 19v2M12 19v2.5M18.75 19v2" />
    </>
  ),
  teleport: (
    <>
      <circle cx="5" cy="19" r="2" fill="currentColor" />
      <path d="M5 15c0-6 4-9.5 8-9.5" strokeDasharray="0.1 3" />
      <path d="M18 2.5l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8L14 6.5l2.8-1.2z" />
    </>
  ),
  lightning: (
    <>
      <path d="M13.5 2 4.5 13.5h7l-1 8.5 9-11.5h-7z" />
    </>
  ),
  "knights-blessing": (
    <>
      <circle cx="5.5" cy="19.5" r="1.75" fill="currentColor" />
      <path d="M5.5 16.5V10.5h8" />
      <path d="M11 8l2.5 2.5L11 13" />
      <circle cx="18" cy="10.5" r="2.5" />
      <ellipse cx="18" cy="4.5" rx="3.5" ry="1.25" />
    </>
  ),
  "ghost-walk": (
    <>
      <path d="M12 2.5a7.5 7.5 0 0 0-7.5 7.5v11.5l2.75-2.5 2.5 2.5L12 19l2.25 2.5 2.5-2.5 2.75 2.5V10A7.5 7.5 0 0 0 12 2.5z" />
      <circle cx="9.25" cy="10" r="1.1" fill="currentColor" />
      <circle cx="14.75" cy="10" r="1.1" fill="currentColor" />
    </>
  ),
  shrink: (
    <>
      <path d="M3 3l5.5 5.5M8.5 4v4.5H4" />
      <path d="M21 3l-5.5 5.5M15.5 4v4.5H20" />
      <path d="M3 21l5.5-5.5M8.5 20v-4.5H4" />
      <path d="M21 21l-5.5-5.5M15.5 20v-4.5H20" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </>
  ),
  ascend: (
    <>
      <path d="M6 2.5h2.75v2h2V2.5h2.5v2h2V2.5H18V8H6z" />
      <path d="M7.5 8l.5 3h8l.5-3" />
      <path d="M12 21.5v-7M8.5 18 12 14.5l3.5 3.5" />
    </>
  ),
  "double-down": (
    <>
      <path d="M3 9l5.5 6M8.5 9 3 15" />
      <path d="M12.5 10a3.25 3.25 0 1 1 6.2 1.3c-.9 1.9-6.2 4.2-6.2 6.2H19" />
    </>
  ),
  portal: (
    <>
      <ellipse cx="5.5" cy="12" rx="3" ry="8" />
      <ellipse cx="18.5" cy="12" rx="3" ry="8" />
      <path d="M8.5 12h7M13 9.5l2.5 2.5-2.5 2.5" />
    </>
  ),
  shockwave: (
    <>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M16.25 7.75a6 6 0 0 1 0 8.5M7.75 16.25a6 6 0 0 1 0-8.5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" />
    </>
  ),
  revive: (
    <>
      <path d="M12 20.5 4.6 13.3C3.2 11.9 2.5 10.6 2.5 8.8A5 5 0 0 1 7.5 3.8c1.8 0 3.1.8 4.5 2.2 1.4-1.4 2.7-2.2 4.5-2.2a5 5 0 0 1 5 5c0 1.8-.7 3.1-2.1 4.5z" />
      <path d="M12 9v6.5M8.75 12.25h6.5" />
    </>
  ),
  poison: (
    <>
      <path d="M8 2.5h6M9.5 2.5v5.5L4.6 17.1A2.5 2.5 0 0 0 6.8 20.8h8.4a2.5 2.5 0 0 0 2.2-3.7L12.5 8V2.5" />
      <path d="M6.6 14h8.8" />
      <circle cx="9.5" cy="17" r="0.9" fill="currentColor" />
      <circle cx="12.5" cy="16.5" r="0.6" fill="currentColor" />
      <path d="M19.5 2.5s-2 2.4-2 3.7a2 2 0 0 0 4 0c0-1.3-2-3.7-2-3.7z" />
    </>
  ),
};
