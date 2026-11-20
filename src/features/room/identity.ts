/**
 * Who am I in this browser tab. The id lives in sessionStorage so a refresh
 * keeps your seat while a second tab counts as a different player, which
 * is handy for trying the game alone. The name is shared across tabs.
 */

const ID_KEY = "duochess.id";
const NAME_KEY = "duochess.name";
const HOST_KEY = "duochess.hosting";

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function randomTag(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

let memoryId: string | null = null;

export function clientId(): string {
  const stored = safe(() => sessionStorage.getItem(ID_KEY), null);
  if (stored) return stored;
  const id = memoryId ?? `p${randomTag(10).toLowerCase()}`;
  memoryId = id;
  safe(() => sessionStorage.setItem(ID_KEY, id), undefined);
  return id;
}

export function defaultName(): string {
  return `Player ${randomTag(3)}`;
}

export function playerName(): string {
  const stored = safe(() => localStorage.getItem(NAME_KEY), null);
  if (stored) return stored;
  const name = defaultName();
  safe(() => localStorage.setItem(NAME_KEY, name), undefined);
  return name;
}

export function savePlayerName(name: string): void {
  safe(() => localStorage.setItem(NAME_KEY, name), undefined);
}

/** Marks this tab as the host of a room code it just created. */
export function markHosting(code: string): void {
  safe(() => sessionStorage.setItem(HOST_KEY, code), undefined);
}

export function isHosting(code: string): boolean {
  return safe(() => sessionStorage.getItem(HOST_KEY) === code, false);
}
