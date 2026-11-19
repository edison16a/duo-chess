import { ALL8, DIAG, KNIGHT, ORTHO, sym } from "../geometry";
import type { PieceDef } from "./types";

/**
 * Fairy pieces for custom maps. Values are rough guesses tuned so the built
 * in engine trades them sensibly; they do not need to be exact.
 */
export const CUSTOM_PIECES: PieceDef[] = [
  {
    kind: "archbishop", name: "Archbishop", letter: "A", value: 750,
    patterns: [{ type: "slide", vectors: DIAG }, { type: "leap", vectors: KNIGHT }],
    blurb: "Bishop and knight in one piece.",
  },
  {
    kind: "chancellor", name: "Chancellor", letter: "C", value: 850,
    patterns: [{ type: "slide", vectors: ORTHO }, { type: "leap", vectors: KNIGHT }],
    blurb: "Rook and knight in one piece.",
  },
  {
    kind: "amazon", name: "Amazon", letter: "M", value: 1250,
    patterns: [{ type: "slide", vectors: ALL8 }, { type: "leap", vectors: KNIGHT }],
    blurb: "Queen and knight in one piece. The strongest thing on the board.",
  },
  {
    kind: "dragon", name: "Dragon", letter: "D", value: 1300,
    patterns: [{ type: "slide", vectors: ALL8, fly: true }],
    blurb: "Flies any distance in a straight line or diagonal, straight over other pieces.",
  },
  {
    kind: "rail", name: "Rail", letter: "L", value: 450,
    patterns: [
      { type: "slide", vectors: ORTHO, fly: true, mode: "move" },
      { type: "leap", vectors: ORTHO, mode: "capture" },
    ],
    blurb: "Pops to any empty square on its rank or file, even past blockers. Captures one square orthogonally.",
  },
  {
    kind: "camel", name: "Camel", letter: "E", value: 250,
    patterns: [{ type: "leap", vectors: sym(1, 3) }],
    blurb: "A long knight: jumps three one way and one the other.",
  },
  {
    kind: "zebra", name: "Zebra", letter: "Z", value: 220,
    patterns: [{ type: "leap", vectors: sym(2, 3) }],
    blurb: "Jumps three one way and two the other.",
  },
  {
    kind: "nightrider", name: "Nightrider", letter: "H", value: 550,
    patterns: [{ type: "slide", vectors: KNIGHT }],
    blurb: "Repeats knight jumps in the same direction until something blocks it.",
  },
  {
    kind: "cannon", name: "Cannon", letter: "O", value: 400,
    patterns: [{ type: "slide", vectors: ORTHO, mode: "move" }, { type: "cannon", vectors: ORTHO }],
    blurb: "Moves like a rook. To capture it must jump exactly one piece in the line.",
  },
  {
    kind: "grasshopper", name: "Grasshopper", letter: "G", value: 200,
    patterns: [{ type: "hop", vectors: ALL8 }],
    blurb: "Hops over the first piece in any line and lands right behind it.",
  },
  {
    kind: "wizard", name: "Wizard", letter: "W", value: 400,
    patterns: [{ type: "leap", vectors: DIAG }, { type: "leap", vectors: sym(1, 3) }],
    blurb: "One step diagonally, or a camel jump.",
  },
  {
    kind: "champion", name: "Champion", letter: "X", value: 450,
    patterns: [{ type: "leap", vectors: [...ORTHO, ...sym(2, 0), ...sym(2, 2)] }],
    blurb: "One step orthogonally, or jumps two squares straight or diagonally.",
  },
  {
    kind: "centaur", name: "Centaur", letter: "T", value: 600,
    patterns: [{ type: "leap", vectors: [...ALL8, ...KNIGHT] }],
    blurb: "King steps plus knight jumps, but it is not royal.",
  },
  {
    kind: "mann", name: "Mann", letter: "Y", value: 300,
    patterns: [{ type: "leap", vectors: ALL8 }],
    blurb: "Moves like a king without being one.",
  },
  {
    kind: "bomb", name: "Bomb", letter: "V", value: 250, explodesOnCapture: true,
    patterns: [{ type: "leap", vectors: ORTHO }],
    blurb: "Steps one square orthogonally. Capture it and it explodes, taking out everything around it.",
  },
  {
    kind: "phoenix", name: "Phoenix", letter: "F", value: 380,
    patterns: [{ type: "leap", vectors: [...ORTHO, ...sym(2, 2)] }],
    blurb: "One step orthogonally, or a two square diagonal jump.",
  },
];
