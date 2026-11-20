/** Chess clock math shared by the host reducer and the clock display. */

import type { Color } from "@/engine";
import type { ClockState } from "./types";

export function startClock(minutes: number, now: number): ClockState {
  const ms = minutes * 60_000;
  return { w: ms, b: ms, runningSince: now };
}

/** Time left for `color` at host time `now`, given whose turn it is. */
export function remaining(clock: ClockState, color: Color, turn: Color, now: number): number {
  const base = clock[color];
  if (color !== turn || clock.runningSince === null) return base;
  return base - (now - clock.runningSince);
}

/**
 * Charges the mover for the time spent. The increment is only added when
 * the turn actually passes, so double move turns get one increment.
 */
export function chargeMove(clock: ClockState, mover: Color, turnPassed: boolean, incrementSec: number, now: number): ClockState {
  const spent = clock.runningSince === null ? 0 : now - clock.runningSince;
  const left = clock[mover] - spent + (turnPassed ? incrementSec * 1000 : 0);
  return { ...clock, [mover]: Math.max(0, left), runningSince: now };
}

export function stopClock(clock: ClockState, turn: Color, now: number): ClockState {
  return { ...clock, [turn]: Math.max(0, remaining(clock, turn, turn, now)), runningSince: null };
}

export function formatClock(ms: number): string {
  const safe = Math.max(0, ms);
  const totalSeconds = safe < 10_000 ? safe / 1000 : Math.ceil(safe / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds - m * 60;
  if (safe < 10_000) return `${m}:${s.toFixed(1).padStart(4, "0")}`;
  return `${m}:${String(Math.floor(s)).padStart(2, "0")}`;
}
