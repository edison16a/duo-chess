import type { RatingId } from "@/engine";
import { RATINGS } from "@/features/analysis/ratings";

/**
 * The mark for a move rating. Most are punctuation like "!!" or "?", but a
 * book move gets a small drawn book: an emoji would look different on
 * every system, and some have none at all.
 */
export function RatingGlyph({ id, size = 12 }: { id: RatingId; size?: number }) {
  if (id !== "book") return <>{RATINGS[id].glyph}</>;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinejoin="round" aria-label="Book">
      <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z" />
      <path d="M12 6.5v13" />
    </svg>
  );
}
