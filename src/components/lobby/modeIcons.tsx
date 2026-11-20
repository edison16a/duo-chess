import type { ReactElement } from "react";
import type { ModeId } from "@/features/modes";

/** Line icons for each game mode, same 24x24 stroke style as the rest of the app. */
export const MODE_ICONS: Record<ModeId, ReactElement> = {
  classic: <><circle cx="12" cy="6.5" r="2.5" /><path d="M9.5 10.5h5l1 7h-7z" /><path d="M7 20h10" /></>,
  superpowers: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" />,
  atomic: <><circle cx="12" cy="12" r="1.6" fill="currentColor" /><ellipse cx="12" cy="12" rx="9" ry="3.6" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" /></>,
  double: <><path d="M5 7l5 5-5 5" /><path d="M12 7l5 5-5 5" /></>,
  triple: <><path d="M3 7l4.5 5L3 17" /><path d="M9.5 7l4.5 5-4.5 5" /><path d="M16 7l4.5 5-4.5 5" /></>,
  lightning: <><circle cx="12" cy="13" r="8" /><path d="M13 7.5l-3.5 6h3l-1 4.5 3.5-6h-3z" /><path d="M10 2.5h4" /></>,
  chess960: <><path d="M3 7h3.5a4 4 0 0 1 3.3 1.8l4.4 6.4a4 4 0 0 0 3.3 1.8H21" /><path d="M3 17h3.5a4 4 0 0 0 3.3-1.8l.6-.9" /><path d="M13.6 8.7l.6-.9A4 4 0 0 1 17.5 6H21" /><path d="M18.5 3.5L21 6l-2.5 2.5" /><path d="M18.5 14.5L21 17l-2.5 2.5" /></>,
  koth: <><path d="M3 20l6-9 4 5 3-4 5 8z" /><path d="M14 9V3l4 1.5-4 1.5" /></>,
  "three-check": <><path d="M3 13l3 3 5-6" /><path d="M10 15l2 2 5-6" /><path d="M16 15l1.5 1.5L22 11" /></>,
  crazyhouse: <><path d="M12 3v10" /><path d="M8 9.5l4 4 4-4" /><rect x="5" y="16" width="14" height="5" rx="1.5" /></>,
  antichess: <><path d="M4 16l4-4 4 6 4-6 4 4-2-10H6z" /><path d="M6 3h12" /></>,
  fog: <><path d="M7 17h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 9.5 3.75 3.75 0 0 0 7 17z" /><path d="M5 21h14" /></>,
  duck: <><path d="M6 14c0 3.5 3 6 7 6s7-2.5 7-6c0-2-1.5-3-3-3h-3.5" /><path d="M13.5 11a4 4 0 1 0-6.4-3.2" /><path d="M7.1 7.8L3.5 9l3.4 1.6" /><circle cx="10.5" cy="7" r="0.6" fill="currentColor" /></>,
  custom: <><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17" /></>,
};
