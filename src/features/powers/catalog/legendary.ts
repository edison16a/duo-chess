import { PIECES, xy } from "@/engine";
import { addEffect, area, destroy, homeRank, isEmpty, patchStatus, pickRandom, pieceAt, relocate, setKind, spawn, squaresOf, vulnerable } from "../helpers";
import { anySquare, emptySquare, enemyPiece, ownPiece } from "../targets";
import type { PowerDef } from "../types";

export const LEGENDARY_POWERS: PowerDef[] = [
  {
    id: "deep-freeze", name: "Deep Freeze", rarity: "legendary", vfx: "frost", costsMove: false,
    blurb: "Your opponent skips their next turn.",
    targets: [],
    apply: (c) => { c.pos.skip[c.enemy] += 1; },
  },
  {
    id: "meteor", name: "Meteor", rarity: "legendary", vfx: "fire", costsMove: true,
    blurb: "Destroy an enemy piece (not the queen) and leave a crater. Uses your move.",
    targets: [enemyPiece("Pick an enemy piece", { exclude: ["queen", "amazon", "dragon"] })],
    apply: (c) => {
      destroy(c, c.squares[0]);
      addEffect(c, "wall", c.squares[0], 4);
    },
  },
  {
    id: "coronation", name: "Coronation", rarity: "legendary", vfx: "holy", costsMove: true,
    blurb: "Crown one of your pawns as a queen. Uses your move.",
    targets: [ownPiece("Pick a pawn", { kinds: ["pawn"] })],
    apply: (c) => setKind(c.pos, c.squares[0], "queen"),
  },
  {
    id: "clone", name: "Clone", rarity: "legendary", vfx: "arcane", costsMove: true,
    blurb: "Copy a piece worth a rook or less onto a square next to it. Uses your move.",
    targets: [ownPiece("Pick a piece to copy", { maxValue: 500, exclude: ["pawn"] }), emptySquare("Pick a square next to it", { nearPrevious: "any" })],
    apply: (c) => {
      const original = pieceAt(c.pos, c.squares[0])!;
      spawn(c, c.squares[1], original.kind);
      c.events.push({ type: "warp", from: c.squares[0], to: c.squares[1] });
    },
  },
  {
    id: "chain-lightning", name: "Chain Lightning", rarity: "legendary", vfx: "storm", costsMove: true,
    blurb: "Lightning jumps between up to three enemy pawns. Uses your move.",
    targets: [],
    apply: (c) => {
      const pawns = squaresOf(c.pos, (p) => p.color === c.enemy && p.kind === "pawn" && !p.status?.shielded);
      if (!pawns.length) return "Your opponent has no pawns to hit";
      for (let i = 0; i < 3 && pawns.length; i++) {
        const target = pickRandom(pawns, c.random)!;
        pawns.splice(pawns.indexOf(target), 1);
        c.squares.push(target);
        destroy(c, target);
      }
    },
  },
  {
    id: "bulwark", name: "Bulwark", rarity: "legendary", vfx: "shield", costsMove: false,
    blurb: "Every one of your pieces is shielded until your next turn.",
    targets: [],
    apply: (c) => {
      for (const s of squaresOf(c.pos, (p) => p.color === c.color && !PIECES[p.kind].royal)) patchStatus(c.pos, s, { shielded: 2 });
    },
  },
  {
    id: "summon-knight", name: "Summon Knight", rarity: "legendary", vfx: "holy", costsMove: true,
    blurb: "A fresh knight appears in your half. Uses your move.",
    targets: [emptySquare("Pick a square in your half", { ownHalf: true })],
    apply: (c) => spawn(c, c.squares[0], "knight"),
  },
  {
    id: "blizzard", name: "Blizzard", rarity: "legendary", vfx: "frost", costsMove: false,
    blurb: "Freeze every enemy piece in a 3x3 area for a turn.",
    targets: [anySquare("Pick the center of the storm")],
    apply: (c) => {
      for (const s of area(c.pos, c.squares[0])) {
        const p = pieceAt(c.pos, s);
        if (p && p.color === c.enemy && !PIECES[p.kind].royal) patchStatus(c.pos, s, { frozen: 2 });
      }
    },
  },
  {
    id: "exile", name: "Exile", rarity: "legendary", vfx: "void", costsMove: true,
    blurb: "Banish an enemy piece to a random square on its home rank. Uses your move.",
    targets: [enemyPiece("Pick an enemy piece", { exclude: ["pawn"] })],
    apply: (c) => {
      const home = homeRank(c.pos, c.enemy);
      const options = [];
      for (let s = 0; s < c.pos.board.length; s++) {
        if (xy(c.pos, s)[1] === home && isEmpty(c.pos, s)) options.push(s);
      }
      const to = pickRandom(options, c.random);
      if (to === undefined) return "Their home rank is full";
      relocate(c, c.squares[0], to);
    },
  },
  {
    id: "inferno", name: "Inferno", rarity: "legendary", vfx: "fire", costsMove: true,
    blurb: "Burn every enemy pawn in a 3x3 area. Uses your move.",
    targets: [anySquare("Pick the center of the fire")],
    apply: (c) => {
      let burned = 0;
      for (const s of area(c.pos, c.squares[0])) {
        const p = pieceAt(c.pos, s);
        if (vulnerable(p) && p.color === c.enemy && p.kind === "pawn") { destroy(c, s); burned++; }
      }
      if (!burned) return "There are no enemy pawns there";
    },
  },
];
