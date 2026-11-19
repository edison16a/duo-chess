import { forward, onBoard, sq, xy } from "@/engine";
import { addEffect, isEmpty, lastRank, pawnSafe, patchStatus, pieceAt, relocate, setKind, spawn, squaresOf } from "../helpers";
import { emptySquare, enemyPiece, ownPiece } from "../targets";
import type { PowerDef, TargetStep } from "../types";

/** Second pick for Leapfrog: two squares away in a line, with a piece in between. */
const leapLanding: TargetStep = {
  label: "Pick where it lands",
  valid: (ctx, s) => {
    const from = ctx.squares[0];
    const [fx, fy] = xy(ctx.pos, from);
    const [x, y] = xy(ctx.pos, s);
    const dx = x - fx, dy = y - fy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== 2 || (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy))) return false;
    const mid = sq(ctx.pos, fx + dx / 2, fy + dy / 2);
    const piece = pieceAt(ctx.pos, from)!;
    return !!ctx.pos.board[mid] && isEmpty(ctx.pos, s) && pawnSafe(ctx.pos, piece.kind, s);
  },
};

export const RARE_POWERS: PowerDef[] = [
  {
    id: "frostbite", name: "Frostbite", rarity: "rare", vfx: "frost", costsMove: false,
    blurb: "Freeze an enemy piece for two turns.",
    targets: [enemyPiece("Pick an enemy piece")],
    apply: (c) => patchStatus(c.pos, c.squares[0], { frozen: 4 }),
  },
  {
    id: "aegis", name: "Aegis", rarity: "rare", vfx: "shield", costsMove: false,
    blurb: "One of your pieces cannot be captured for two turns.",
    targets: [ownPiece("Pick a piece to shield")],
    apply: (c) => patchStatus(c.pos, c.squares[0], { shielded: 4 }),
  },
  {
    id: "pawn-storm", name: "Pawn Storm", rarity: "rare", vfx: "earth", costsMove: true,
    blurb: "Every pawn that can step forward does. Uses your move.",
    targets: [],
    apply: (c) => {
      const dir = forward(c.color);
      const pawns = squaresOf(c.pos, (p) => p.color === c.color && p.kind === "pawn")
        .sort((a, b) => (xy(c.pos, b)[1] - xy(c.pos, a)[1]) * dir);
      let advanced = 0;
      for (const s of pawns) {
        const [x, y] = xy(c.pos, s);
        if (!onBoard(c.pos, x, y + dir)) continue;
        const to = sq(c.pos, x, y + dir);
        if (!isEmpty(c.pos, to)) continue;
        relocate(c, s, to);
        if (y + dir === lastRank(c.pos, c.color)) setKind(c.pos, to, "queen");
        advanced++;
      }
      if (!advanced) return "None of your pawns can move";
    },
  },
  {
    id: "reinforce", name: "Reinforce", rarity: "rare", vfx: "holy", costsMove: false,
    blurb: "Place a new pawn anywhere in your half.",
    targets: [emptySquare("Pick an empty square in your half", { ownHalf: true })],
    apply: (c) => {
      if (!pawnSafe(c.pos, "pawn", c.squares[0])) return "Pawns cannot go on the end ranks";
      spawn(c, c.squares[0], "pawn");
    },
  },
  {
    id: "sidestep", name: "Sidestep", rarity: "rare", vfx: "speed", costsMove: false,
    blurb: "Slide a piece one square orthogonally, for free.",
    targets: [ownPiece("Pick a piece"), emptySquare("Pick a square next to it", { nearPrevious: "orthogonal" })],
    apply: (c) => relocate(c, c.squares[0], c.squares[1]),
  },
  {
    id: "swap", name: "Swap", rarity: "rare", vfx: "arcane", costsMove: true,
    blurb: "Two of your pieces trade places. Uses your move.",
    targets: [ownPiece("Pick the first piece"), ownPiece("Pick the second piece")],
    apply: (c) => {
      const [a, b] = c.squares;
      const pa = c.pos.board[a]!, pb = c.pos.board[b]!;
      if (a === b) return "Pick two different pieces";
      if (!pawnSafe(c.pos, pa.kind, b) || !pawnSafe(c.pos, pb.kind, a)) return "Pawns cannot go on the end ranks";
      c.pos.board[a] = { ...pb, moved: true };
      c.pos.board[b] = { ...pa, moved: true };
      c.events.push({ type: "warp", from: a, to: b }, { type: "warp", from: b, to: a });
    },
  },
  {
    id: "barricade", name: "Barricade", rarity: "rare", vfx: "earth", costsMove: false,
    blurb: "Raise a wall on an empty square for three turns.",
    targets: [emptySquare("Pick an empty square")],
    apply: (c) => addEffect(c, "wall", c.squares[0], 6),
  },
  {
    id: "landmine", name: "Landmine", rarity: "rare", vfx: "fire", costsMove: false,
    blurb: "Hide a mine. The first enemy piece to land there is destroyed.",
    targets: [emptySquare("Pick where to bury it")],
    apply: (c) => addEffect(c, "mine", c.squares[0], -1),
  },
  {
    id: "squire", name: "Squire", rarity: "rare", vfx: "holy", costsMove: false,
    blurb: "Turn one of your pawns into a knight.",
    targets: [ownPiece("Pick a pawn", { kinds: ["pawn"] })],
    apply: (c) => setKind(c.pos, c.squares[0], "knight"),
  },
  {
    id: "recall", name: "Recall", rarity: "rare", vfx: "arcane", costsMove: true,
    blurb: "Send a piece back to your home rank. Uses your move.",
    targets: [ownPiece("Pick a piece", { exclude: ["pawn"] }), emptySquare("Pick a square on your home rank", { homeRank: true })],
    apply: (c) => relocate(c, c.squares[0], c.squares[1]),
  },
  {
    id: "smoke-screen", name: "Smoke Screen", rarity: "rare", vfx: "smoke", costsMove: false,
    blurb: "Your pieces vanish from your opponent's view for two turns.",
    targets: [],
    apply: (c) => {
      for (const s of squaresOf(c.pos, (p) => p.color === c.color)) patchStatus(c.pos, s, { hidden: 4 });
    },
  },
  {
    id: "pushback", name: "Pushback", rarity: "rare", vfx: "speed", costsMove: false,
    blurb: "Shove an enemy piece one square back toward its side.",
    targets: [enemyPiece("Pick an enemy piece")],
    apply: (c) => {
      const s = c.squares[0];
      const [x, y] = xy(c.pos, s);
      const ny = y - forward(c.enemy);
      if (!onBoard(c.pos, x, ny)) return "It is already at the edge";
      const to = sq(c.pos, x, ny);
      if (!isEmpty(c.pos, to)) return "The square behind it is not empty";
      if (!pawnSafe(c.pos, c.pos.board[s]!.kind, to)) return "Pawns cannot go on the end ranks";
      relocate(c, s, to);
    },
  },
  {
    id: "fortify", name: "Fortify", rarity: "rare", vfx: "shield", costsMove: false,
    blurb: "All your pawns are shielded until your next turn.",
    targets: [],
    apply: (c) => {
      for (const s of squaresOf(c.pos, (p) => p.color === c.color && p.kind === "pawn")) patchStatus(c.pos, s, { shielded: 2 });
    },
  },
  {
    id: "leapfrog", name: "Leapfrog", rarity: "rare", vfx: "speed", costsMove: true,
    blurb: "Jump a piece over a neighbour. Uses your move.",
    targets: [ownPiece("Pick a piece"), leapLanding],
    apply: (c) => relocate(c, c.squares[0], c.squares[1]),
  },
  {
    id: "sprint", name: "Sprint", rarity: "rare", vfx: "speed", costsMove: false,
    blurb: "A pawn dashes two squares forward, for free.",
    targets: [ownPiece("Pick a pawn", { kinds: ["pawn"] })],
    apply: (c) => {
      const s = c.squares[0];
      const [x, y] = xy(c.pos, s);
      const dir = forward(c.color);
      if (!onBoard(c.pos, x, y + 2 * dir)) return "Not enough room";
      const one = sq(c.pos, x, y + dir), two = sq(c.pos, x, y + 2 * dir);
      if (!isEmpty(c.pos, one) || !isEmpty(c.pos, two)) return "The path is blocked";
      if (!pawnSafe(c.pos, "pawn", two)) return "It would land on the last rank";
      relocate(c, s, two);
    },
  },
];
