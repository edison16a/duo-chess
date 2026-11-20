import type { RatingId } from "@/engine";

export interface RatingInfo {
  id: RatingId;
  label: string;
  /** Glyph shown inside the badge. */
  glyph: string;
  /** CSS variable for the badge and glow color. */
  color: string;
  /** Whether the piece gets the big shine and shake treatment. */
  dramatic: boolean;
}

export const RATINGS: Record<RatingId, RatingInfo> = {
  legendary: { id: "legendary", label: "Legendary", glyph: "!!!", color: "var(--rate-legendary)", dramatic: true },
  brilliant: { id: "brilliant", label: "Brilliant", glyph: "!!", color: "var(--rate-brilliant)", dramatic: true },
  great: { id: "great", label: "Great", glyph: "!", color: "var(--rate-great)", dramatic: true },
  best: { id: "best", label: "Best", glyph: "★", color: "var(--rate-best)", dramatic: false },
  excellent: { id: "excellent", label: "Excellent", glyph: "✓", color: "var(--rate-excellent)", dramatic: false },
  good: { id: "good", label: "Good", glyph: "✓", color: "var(--rate-good)", dramatic: false },
  inaccuracy: { id: "inaccuracy", label: "Inaccuracy", glyph: "?!", color: "var(--rate-inaccuracy)", dramatic: false },
  mistake: { id: "mistake", label: "Mistake", glyph: "?", color: "var(--rate-mistake)", dramatic: true },
  blunder: { id: "blunder", label: "Blunder", glyph: "??", color: "var(--rate-blunder)", dramatic: true },
  // A known opening move. Until globals.css defines the variable, the tan chess.com uses shows instead.
  book: { id: "book", label: "Book", glyph: "📖", color: "var(--rate-book, #a88865)", dramatic: false },
};
