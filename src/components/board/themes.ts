/** Board color themes. Classic brown is the default; the rest are a click away. */
export interface BoardTheme {
  id: string;
  name: string;
  light: string;
  dark: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  { id: "walnut", name: "Walnut", light: "#eed8b5", dark: "#b4865f" },
  { id: "meadow", name: "Meadow", light: "#e9edcf", dark: "#769656" },
  { id: "slate", name: "Slate", light: "#dee3e6", dark: "#8ca2ad" },
  { id: "dusk", name: "Dusk", light: "#c9c4d6", dark: "#7b6f99" },
];

const KEY = "duochess.theme";

export function loadTheme(): BoardTheme {
  try {
    const id = localStorage.getItem(KEY);
    return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0];
  } catch {
    return BOARD_THEMES[0];
  }
}

export function saveTheme(id: string): void {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // Theme just will not persist in this browser.
  }
}
