import type { ReactElement, SVGProps } from "react";

/** Inner paths for the app's line icons, 24x24, stroked with currentColor. */
const PATHS: Record<string, ReactElement> = {
  plus: <path d="M12 5v14M5 12h14" />,
  enter: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" /></>,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  handshake: <><path d="M3 12l4-4 4 2 3-2 4 4" /><path d="M7 14l3 3 2-1 2 2 4-4" /></>,
  rematch: <><path d="M4 12a8 8 0 0 1 14-5.3L20 9" /><path d="M20 4v5h-5" /><path d="M20 12a8 8 0 0 1-14 5.3L4 15" /><path d="M4 20v-5h5" /></>,
  flip: <><path d="M7 4v16" /><path d="M4 7l3-3 3 3" /><path d="M17 20V4" /><path d="M14 17l3 3 3-3" /></>,
  soundOn: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /><path d="M19 6a8.5 8.5 0 0 1 0 12" /></>,
  soundOff: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M17 9l5 6M22 9l-5 6" /></>,
  home: <><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /><path d="M9 7h6" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>,
  save: <><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v5h7V4" /><rect x="8" y="13" width="8" height="5" rx="1" /></>,
  mirror: <><path d="M12 3v18" strokeDasharray="2 2.5" /><path d="M8 7l-4 5 4 5z" /><path d="M16 7l4 5-4 5z" /></>,
  eraser: <><path d="M4 16l9-9 6 6-6 6H8z" /><path d="M8 19h12" /></>,
  hole: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 8l8 8" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14a4.5 4.5 0 0 1 5 5" /></>,
  crown: <><path d="M4 8l4 4 4-6 4 6 4-4-2 10H6z" /><path d="M6 21h12" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  chart: <><path d="M5 20V10" /><path d="M12 20V4" /><path d="M19 20v-7" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c5 0 9 6 9 6a15 15 0 0 1-3 3.4" /><path d="M6.5 7.6A15 15 0 0 0 3 12s4 6 9 6a8.6 8.6 0 0 0 3.6-.8" /></>,
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4" /><path d="M10 2h4" /></>,
  palette: <><path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7" r="1" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
  arrowLeft: <path d="M15 5l-7 7 7 7" />,
  bot: <><rect x="4.5" y="8" width="15" height="11.5" rx="3" /><path d="M12 8V4.5" /><circle cx="12" cy="3.6" r="1" /><path d="M9.2 13.2v1.2M14.8 13.2v1.2" /><path d="M2.5 12.5v3M21.5 12.5v3" /></>,
  swap: <><path d="M7 4L3 8l4 4" /><path d="M3 8h14" /><path d="M17 20l4-4-4-4" /><path d="M21 16H7" /></>,
};

export type IconName = keyof typeof PATHS;

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      {PATHS[name]}
    </svg>
  );
}

/** Wraps raw icon content (power and mode icons) in the same svg shell. */
export function GlyphIcon({ children, size = 18, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      {children}
    </svg>
  );
}
