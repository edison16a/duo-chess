import { PIECES, xy, type PieceKind } from "@/engine";
import { area, destroy, homeRank, isRoyal, lastRank, pieceAt, setKind, spawn, squaresOf, vulnerable } from "../helpers";
import { anySquare, emptySquare, enemyPiece, ownPiece } from "../targets";
import type { PowerDef, TargetStep } from "../types";

/** Strongest piece this color has lost, for Resurrection. */
function bestLost(lost: PieceKind[]): PieceKind | undefined {
  return lost.filter((k) => k !== "king" && k !== "pawn").sort((a, b) => PIECES[b].value - PIECES[a].value)[0];
}

const nearHome: TargetStep = {
  label: "Pick a square on your first two ranks",
  valid: (ctx, s) => {
    if (ctx.pos.board[s] || ctx.pos.holes.includes(s)) return false;
    const y = xy(ctx.pos, s)[1];
    const home = homeRank(ctx.pos, ctx.color);
    return Math.abs(y - home) <= 1;
  },
};

export const MYTHICAL_POWERS: PowerDef[] = [
  {
    id: "curse", name: "Curse", rarity: "mythical", vfx: "void", costsMove: true,
    blurb: "Turn any enemy piece except the king into a pawn. Uses your move.",
    targets: [enemyPiece("Pick an enemy piece", { exclude: ["pawn"] })],
    apply: (c) => {
      const y = xy(c.pos, c.squares[0])[1];
      if (y === lastRank(c.pos, c.enemy) || y === homeRank(c.pos, c.enemy)) return "Pawns cannot sit on the end ranks";
      setKind(c.pos, c.squares[0], "pawn");
    },
  },
  {
    id: "summon-dragon", name: "Summon Dragon", rarity: "mythical", vfx: "fire", costsMove: true,
    blurb: "A dragon lands near your home rank. Uses your move.",
    targets: [nearHome],
    apply: (c) => spawn(c, c.squares[0], "dragon"),
  },
  {
    id: "overclock", name: "Overclock", rarity: "mythical", vfx: "speed", costsMove: false,
    blurb: "Take two extra moves this turn.",
    targets: [],
    apply: (c) => { c.pos.movesLeft += 2; },
  },
  {
    id: "armageddon", name: "Armageddon", rarity: "mythical", vfx: "fire", costsMove: true,
    blurb: "Every pawn on the board is destroyed. Uses your move.",
    targets: [],
    apply: (c) => {
      const pawns = squaresOf(c.pos, (p) => p.kind === "pawn" && !p.status?.shielded);
      if (!pawns.length) return "There are no pawns left";
      c.squares.push(...pawns);
      pawns.forEach((s) => destroy(c, s));
    },
  },
  {
    id: "black-hole", name: "Black Hole", rarity: "mythical", vfx: "void", costsMove: true,
    blurb: "Swallow every piece except kings in a 3x3 area, yours included. Uses your move.",
    targets: [anySquare("Pick the center")],
    apply: (c) => {
      const hit = area(c.pos, c.squares[0]).filter((s) => vulnerable(pieceAt(c.pos, s)));
      if (!hit.length) return "Nothing there to swallow";
      hit.forEach((s) => destroy(c, s));
    },
  },
  {
    id: "possession", name: "Possession", rarity: "mythical", vfx: "void", costsMove: true,
    blurb: "An enemy pawn, knight or bishop switches to your side. Uses your move.",
    targets: [enemyPiece("Pick a piece to possess", { maxValue: 330 })],
    apply: (c) => {
      const p = pieceAt(c.pos, c.squares[0])!;
      if (p.kind === "pawn" && xy(c.pos, c.squares[0])[1] === lastRank(c.pos, c.color)) return "That pawn would be stuck";
      c.pos.board[c.squares[0]] = { ...p, color: c.color, moved: true, status: undefined };
    },
  },
  {
    id: "resurrection", name: "Resurrection", rarity: "mythical", vfx: "holy", costsMove: true,
    blurb: "Bring back the strongest piece you have lost on your home rank. Uses your move.",
    available: (c) => !!bestLost(c.lost[c.color]),
    targets: [emptySquare("Pick a square on your home rank", { homeRank: true })],
    apply: (c) => {
      const kind = bestLost(c.lost[c.color]);
      if (!kind) return "Nothing to bring back";
      spawn(c, c.squares[0], kind);
      c.lost[c.color].splice(c.lost[c.color].indexOf(kind), 1);
    },
  },
  {
    id: "mirror-image", name: "Mirror Image", rarity: "mythical", vfx: "arcane", costsMove: true,
    blurb: "One of your pawns becomes a copy of any enemy piece. Uses your move.",
    targets: [
      ownPiece("Pick your pawn", { kinds: ["pawn"] }),
      { label: "Pick the enemy piece to copy", valid: (ctx, s) => { const p = pieceAt(ctx.pos, s); return !!p && p.color === ctx.enemy && !isRoyal(p); } },
    ],
    apply: (c) => setKind(c.pos, c.squares[0], pieceAt(c.pos, c.squares[1])!.kind),
  },
];
