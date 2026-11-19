import { neighbors, onBoard, sq, xy, PIECES } from "@/engine";
import { addEffect, destroy, homeRank, isEmpty, lastRank, pawnSafe, patchStatus, pieceAt, relocate, setKind, spawn, vulnerable } from "../helpers";
import { emptySquare, enemyPiece, ownPiece } from "../targets";
import type { PowerDef } from "../types";

/** Most recently lost piece that a revive is allowed to bring back. */
function revivable(lost: string[]): string | undefined {
  return [...lost].reverse().find((k) => k !== "queen" && k !== "king" && k !== "amazon" && k !== "dragon");
}

export const EPIC_POWERS: PowerDef[] = [
  {
    id: "ice-wall", name: "Ice Wall", rarity: "epic", vfx: "frost", costsMove: false,
    blurb: "Raise three walls of ice in a row for three turns.",
    targets: [emptySquare("Pick the middle of the wall")],
    apply: (c) => {
      const [x, y] = xy(c.pos, c.squares[0]);
      for (const dx of [-1, 0, 1]) {
        if (!onBoard(c.pos, x + dx, y)) continue;
        const s = sq(c.pos, x + dx, y);
        if (isEmpty(c.pos, s)) addEffect(c, "wall", s, 6);
      }
    },
  },
  {
    id: "teleport", name: "Teleport", rarity: "epic", vfx: "arcane", costsMove: true,
    blurb: "Move one of your pieces to any empty square. Uses your move.",
    targets: [ownPiece("Pick a piece"), emptySquare("Pick where it appears")],
    apply: (c) => relocate(c, c.squares[0], c.squares[1]),
  },
  {
    id: "lightning", name: "Lightning", rarity: "epic", vfx: "storm", costsMove: true,
    blurb: "Strike down an enemy pawn. Uses your move.",
    targets: [enemyPiece("Pick an enemy pawn", { kinds: ["pawn"] })],
    apply: (c) => destroy(c, c.squares[0]),
  },
  {
    id: "knights-blessing", name: "Knight's Blessing", rarity: "epic", vfx: "holy", costsMove: false,
    blurb: "A piece can also jump like a knight for the rest of the game.",
    targets: [ownPiece("Pick a piece", { exclude: ["knight", "pawn"] })],
    apply: (c) => patchStatus(c.pos, c.squares[0], { blessed: true }),
  },
  {
    id: "ghost-walk", name: "Ghost Walk", rarity: "epic", vfx: "smoke", costsMove: false,
    blurb: "A piece glides through other pieces for two turns.",
    targets: [ownPiece("Pick a piece", { exclude: ["pawn"] })],
    apply: (c) => patchStatus(c.pos, c.squares[0], { ghost: 3 }),
  },
  {
    id: "shrink", name: "Shrink", rarity: "epic", vfx: "arcane", costsMove: true,
    blurb: "Turn an enemy knight or bishop into a pawn. Uses your move.",
    targets: [enemyPiece("Pick an enemy knight or bishop", { kinds: ["knight", "bishop"] })],
    apply: (c) => {
      const [, y] = xy(c.pos, c.squares[0]);
      if (y === lastRank(c.pos, c.enemy)) return "It would land on its promotion rank";
      setKind(c.pos, c.squares[0], "pawn");
    },
  },
  {
    id: "ascend", name: "Ascend", rarity: "epic", vfx: "holy", costsMove: true,
    blurb: "Turn one of your pawns into a rook. Uses your move.",
    targets: [ownPiece("Pick a pawn", { kinds: ["pawn"] })],
    apply: (c) => setKind(c.pos, c.squares[0], "rook"),
  },
  {
    id: "double-down", name: "Double Down", rarity: "epic", vfx: "speed", costsMove: false,
    blurb: "Take one extra move this turn.",
    targets: [],
    apply: (c) => { c.pos.movesLeft += 1; },
  },
  {
    id: "portal", name: "Portal", rarity: "epic", vfx: "arcane", costsMove: false,
    blurb: "Open two linked portals for four turns. Land on one, come out the other.",
    targets: [emptySquare("Pick the first portal"), emptySquare("Pick the second portal")],
    apply: (c) => {
      const [a, b] = c.squares;
      if (a === b) return "Pick two different squares";
      addEffect(c, "portal", a, 8, b);
      addEffect(c, "portal", b, 8, a);
    },
  },
  {
    id: "shockwave", name: "Shockwave", rarity: "epic", vfx: "storm", costsMove: false,
    blurb: "Blast every enemy next to one of your pieces one square away.",
    targets: [ownPiece("Pick the center piece")],
    apply: (c) => {
      const center = c.squares[0];
      const [cx, cy] = xy(c.pos, center);
      let pushed = 0;
      for (const n of neighbors(c.pos, center)) {
        const p = pieceAt(c.pos, n);
        if (!vulnerable(p) || p.color !== c.enemy) continue;
        const [x, y] = xy(c.pos, n);
        const tx = x + Math.sign(x - cx), ty = y + Math.sign(y - cy);
        if (!onBoard(c.pos, tx, ty)) continue;
        const to = sq(c.pos, tx, ty);
        if (!isEmpty(c.pos, to) || !pawnSafe(c.pos, p.kind, to)) continue;
        relocate(c, n, to);
        pushed++;
      }
      if (!pushed) return "No enemy piece next to it can be pushed";
    },
  },
  {
    id: "revive", name: "Revive", rarity: "epic", vfx: "holy", costsMove: true,
    blurb: "Bring back your last lost piece (not a queen) on your home rank. Uses your move.",
    available: (c) => !!revivable(c.lost[c.color]),
    targets: [emptySquare("Pick a square on your home rank", { homeRank: true })],
    apply: (c) => {
      const kind = revivable(c.lost[c.color]);
      if (!kind) return "Nothing to revive";
      const s = c.squares[0];
      if (xy(c.pos, s)[1] !== homeRank(c.pos, c.color)) return "Pick your home rank";
      if (kind === "pawn" && !pawnSafe(c.pos, "pawn", s)) return "Pawns cannot go on the end ranks";
      spawn(c, s, kind as keyof typeof PIECES);
      const idx = c.lost[c.color].lastIndexOf(kind as never);
      c.lost[c.color].splice(idx, 1);
    },
  },
  {
    id: "poison", name: "Poison", rarity: "epic", vfx: "void", costsMove: false,
    blurb: "An enemy piece withers away after three turns.",
    targets: [enemyPiece("Pick an enemy piece")],
    apply: (c) => patchStatus(c.pos, c.squares[0], { poisoned: 6 }),
  },
];
