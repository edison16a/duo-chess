import { parseRows } from "./parse";
import type { ChessMap } from "./types";

function map(id: string, name: string, blurb: string, rows: string[], extra: Partial<ChessMap> = {}): ChessMap {
  return { id, name, blurb, ...parseRows(rows), ...extra };
}

/** Hand made boards that show off the fairy pieces and odd shapes. */
export const PREMADE_MAPS: ChessMap[] = [
  map("capablanca", "Capablanca", "A wider 10x8 board with an Archbishop and a Chancellor.", [
    "rnabqkbcnr", "pppppppppp", "..........", "..........", "..........", "..........", "PPPPPPPPPP", "RNABQKBCNR",
  ]),
  map("horde", "Horde", "White is a swarm of 36 pawns with no king. Wipe them all out.", [
    "rnbqkbnr", "pppppppp", "........", ".PP..PP.", "PPPPPPPP", "PPPPPPPP", "PPPPPPPP", "PPPPPPPP",
  ]),
  map("knightmare", "Knightmare", "Every officer is a knight.", [
    "nnnnknnn", "pppppppp", "........", "........", "........", "........", "PPPPPPPP", "NNNNKNNN",
  ]),
  map("los-alamos", "Los Alamos", "The classic 6x6 board with no bishops. Short and sharp.", [
    "rnqknr", "pppppp", "......", "......", "PPPPPP", "RNQKNR",
  ]),
  map("cannon-fort", "Cannon Fortress", "Cannons replace the bishops. Line up a screen to fire.", [
    "rnoqkonr", "pppppppp", "........", "........", "........", "........", "PPPPPPPP", "RNOQKONR",
  ]),
  map("menagerie", "Menagerie", "Camels, zebras and grasshoppers instead of the usual crew.", [
    "ezgqkgze", "pppppppp", "........", "........", "........", "........", "PPPPPPPP", "EZGQKGZE",
  ]),
  map("bomb-squad", "Bomb Squad", "Bombs on the flanks. Capture one and everything nearby goes up.", [
    "rnbqkbnr", "vppppppv", "........", "........", "........", "........", "VPPPPPPV", "RNBQKBNR",
  ]),
  map("the-pit", "The Pit", "A hole in the middle of the board changes every line.", [
    "rnbqkbnr", "pppppppp", "........", "...##...", "...##...", "........", "PPPPPPPP", "RNBQKBNR",
  ]),
  map("dragon-duel", "Dragon Duel", "Each side trades its queen for a dragon that flies over pieces.", [
    "rnbdkbnr", "pppppppp", "........", "........", "........", "........", "PPPPPPPP", "RNBDKBNR",
  ]),
  map("wizard-war", "Wizard War", "Wizards, champions and phoenixes on a 10x10 battlefield.", [
    "rwfcqkcfwr", "xnbppppbnx", "pppp..pppp", "..........", "..........", "..........", "..........", "PPPP..PPPP", "XNBPPPPBNX", "RWFCQKCFWR",
  ], { rules: { castling: true } }),
  map("rail-yard", "Rail Yard", "Rails pop across open lines while centaurs guard the king.", [
    "lntqkbnl", "pppppppp", "........", "........", "........", "........", "PPPPPPPP", "LNTQKBNL",
  ]),
];
