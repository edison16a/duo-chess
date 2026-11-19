import { PIECES, neighbors, type PieceKind } from "@/engine";
import { destroy, patchStatus, pickRandom, pieceAt, setKind, spawn, squaresOf, vulnerable } from "../helpers";
import { emptySquare, ownPiece } from "../targets";
import type { PowerDef } from "../types";

const PRISM: PieceKind[] = ["knight", "bishop", "rook"];

export const CHROMATIC_POWERS: PowerDef[] = [
  {
    id: "prismatic-burst", name: "Prismatic Burst", rarity: "chromatic", vfx: "rainbow", costsMove: true,
    blurb: "Every pawn you own turns into a random knight, bishop or rook. Uses your move.",
    targets: [],
    apply: (c) => {
      const pawns = squaresOf(c.pos, (p) => p.color === c.color && p.kind === "pawn");
      if (!pawns.length) return "You have no pawns";
      c.squares.push(...pawns);
      for (const s of pawns) setKind(c.pos, s, pickRandom(PRISM, c.random)!);
    },
  },
  {
    id: "supernova", name: "Supernova", rarity: "chromatic", vfx: "rainbow", costsMove: true,
    blurb: "One of your pieces explodes and takes every neighbouring enemy with it. Uses your move.",
    targets: [ownPiece("Pick the piece that goes nova")],
    apply: (c) => {
      const center = c.squares[0];
      const hit = neighbors(c.pos, center).filter((s) => {
        const p = pieceAt(c.pos, s);
        return vulnerable(p) && p.color === c.enemy;
      });
      destroy(c, center);
      hit.forEach((s) => destroy(c, s));
      c.events.push({ type: "explosion", square: center, squares: [center, ...hit] });
    },
  },
  {
    id: "infinity", name: "Infinity", rarity: "chromatic", vfx: "rainbow", costsMove: false,
    blurb: "Your next three turns are double moves.",
    targets: [],
    apply: (c) => { c.pos.bonus[c.color] = { turns: 3, extra: 1 }; },
  },
  {
    id: "rainbow-bridge", name: "Rainbow Bridge", rarity: "chromatic", vfx: "rainbow", costsMove: false,
    blurb: "All your pieces are shielded and can glide through others for two turns.",
    targets: [],
    apply: (c) => {
      for (const s of squaresOf(c.pos, (p) => p.color === c.color && !PIECES[p.kind].royal)) {
        patchStatus(c.pos, s, { shielded: 4, ghost: 3 });
      }
    },
  },
  {
    id: "genesis", name: "Genesis", rarity: "chromatic", vfx: "rainbow", costsMove: true,
    blurb: "Create an Amazon, a queen that also jumps like a knight. Uses your move.",
    targets: [emptySquare("Pick a square on your home rank", { homeRank: true })],
    apply: (c) => spawn(c, c.squares[0], "amazon"),
  },
];
