/**
 * Core data types for the rules engine. Everything here is plain JSON so a
 * whole game can be shipped over the wire and stored as a retained message.
 */

export type Color = "w" | "b";
/** Neutral pieces (the duck) belong to nobody and can never be captured. */
export type Side = Color | "n";

export type PieceKind =
  | "king" | "queen" | "rook" | "bishop" | "knight" | "pawn"
  | "archbishop" | "chancellor" | "amazon" | "dragon" | "rail" | "camel"
  | "zebra" | "nightrider" | "cannon" | "grasshopper" | "wizard" | "champion"
  | "centaur" | "mann" | "bomb" | "phoenix" | "duck";

/**
 * Timed status effects from superpowers. Counters are measured in plies
 * (turn ends), so a value of 4 placed during your turn lasts through the
 * opponent's next two turns.
 */
export interface PieceStatus {
  frozen?: number;
  shielded?: number;
  ghost?: number;
  poisoned?: number;
  hidden?: number;
  /** Permanent extra knight jumps from Knight's Blessing. */
  blessed?: boolean;
}

export interface Piece {
  id: number;
  kind: PieceKind;
  color: Side;
  moved: boolean;
  /** Promoted pawns turn back into pawns when captured in crazyhouse. */
  promoted?: boolean;
  status?: PieceStatus;
}

export type EffectKind = "wall" | "mine" | "portal";

/** Something sitting on a square that is not a piece (walls, mines, portals). */
export interface Effect {
  id: number;
  kind: EffectKind;
  square: number;
  owner: Color;
  /** Plies left before it fades. Negative means it never expires. */
  ttl: number;
  /** For portals, the square of the paired portal. */
  link?: number;
}

/**
 * Rule switches. Game modes are just different combinations of these, which
 * keeps the move generator free of mode specific branches.
 */
export interface Rules {
  /** When false there is no check: you win by capturing the king. */
  checkRules: boolean;
  castling: boolean;
  atomic: boolean;
  mustCapture: boolean;
  /** Antichess: losing all your pieces (or being stuck) wins. */
  giveaway: boolean;
  drops: boolean;
  kingOfTheHill: boolean;
  /** Number of checks that wins the game, 0 to disable. */
  checksToWin: number;
  movesPerTurn: number;
  duck: boolean;
  /** Castling encoded the Chess960 way for the analysis engine. */
  chess960: boolean;
}

export interface Move {
  from: number;
  to: number;
  promotion?: PieceKind;
  /** Crazyhouse drop. `from` is -1 for drops. */
  drop?: PieceKind;
  castle?: { rookFrom: number; rookTo: number };
  /** Square of the pawn removed by en passant. */
  epVictim?: number;
  /** Duck chess: where the duck lands after the move. */
  duckTo?: number;
}

export interface Position {
  width: number;
  height: number;
  board: (Piece | null)[];
  /** Squares that do not exist on custom maps. */
  holes: number[];
  turn: Color;
  movesLeft: number;
  ep: { square: number; victim: number } | null;
  halfmove: number;
  fullmove: number;
  pockets: Record<Color, PieceKind[]>;
  checks: Record<Color, number>;
  effects: Effect[];
  /** Turns a side must sit out (Deep Freeze). */
  skip: Record<Color, number>;
  /** Extra moves granted for a number of upcoming turns (Infinity). */
  bonus: Record<Color, { turns: number; extra: number }>;
  rules: Rules;
  /** Whether each side started with a royal piece. Decides how it can lose. */
  royalStart: Record<Color, boolean>;
  nextId: number;
}

export type ResultReason =
  | "checkmate" | "stalemate" | "resign" | "timeout" | "king-captured"
  | "king-exploded" | "hill" | "three-check" | "repetition" | "fifty-move"
  | "insufficient" | "agreement" | "annihilation" | "giveaway" | "abandoned";

export interface GameResult {
  winner: Color | null;
  reason: ResultReason;
}

/** Visual events the board animates. Emitted by moves and powers. */
export type GameEvent =
  | { type: "move"; from: number; to: number; pieceId: number }
  | { type: "capture"; square: number; kind: PieceKind; color: Side }
  | { type: "explosion"; square: number; squares: number[] }
  | { type: "castle" }
  | { type: "promote"; square: number; kind: PieceKind }
  | { type: "check"; square: number }
  | { type: "destroy"; square: number; kind: PieceKind; color: Side }
  | { type: "warp"; from: number; to: number }
  | { type: "mine"; square: number }
  | { type: "power"; power: string; color: Color; squares: number[] }
  | { type: "skip"; color: Color };
