/**
 * Browsers keep only about sixteen WebGL contexts per page and silently
 * kill the oldest one when a new one is made. The oldest is usually the
 * game board, so previews and live card art share a small budget here and
 * the board's own contexts never get pushed out.
 */

/** Previews, live cards and the landing scene together. The board and its effect layer are not counted. */
const MAX_VIEWS = 5;
let live = 0;

/**
 * Takes a slot for a new view. Optional views (live card art, which has a
 * still image to fall back on) are refused when the budget is full; views
 * the user asked for, like a hover preview, always get one.
 */
export function claimContext(optional: boolean): boolean {
  if (optional && live >= MAX_VIEWS) return false;
  live++;
  return true;
}

export function releaseContext(): void {
  live = Math.max(0, live - 1);
}
