import { chess960Layout } from "@/engine";
import type { ModeDef, ModeId } from "./types";

export const MODES: ModeDef[] = [
  {
    id: "classic", name: "Classic", blurb: "Regular chess, done right.", analysis: "stockfish", rules: {},
    howTo: ["Standard rules. Checkmate the enemy king to win."],
  },
  {
    id: "superpowers", name: "Superpowers", blurb: "Draft powers, then break the rules.", analysis: "internal", powers: true, rules: {},
    howTo: [
      "Before the game you draft powers. Take & give: take one of two, your opponent gets the other. Triple draft: keep one of three. Free deck: build your own hand on a point budget.",
      "On your turn you can fire one power. Some are free, some use up your move.",
      "Powers never target kings directly.",
    ],
  },
  {
    id: "atomic", name: "Atomic", blurb: "Every capture is an explosion.", analysis: "internal", rules: { atomic: true },
    howTo: [
      "A capture blows up the capturing piece, the captured piece and every non pawn around them.",
      "Blow up the enemy king to win. Kings cannot capture, and touching kings cannot be checked.",
    ],
  },
  {
    id: "double", name: "Double Move", blurb: "Two moves every turn.", analysis: "internal", rules: { movesPerTurn: 2 },
    howTo: ["You make two moves per turn. Giving check ends your turn right away."],
  },
  {
    id: "triple", name: "Triple Move", blurb: "Three moves every turn.", analysis: "internal", rules: { movesPerTurn: 3 },
    howTo: ["You make three moves per turn. Giving check ends your turn right away."],
  },
  {
    id: "lightning", name: "Lightning", blurb: "One second per move. Hesitate and it moves for you.", analysis: "stockfish", moveTimer: 1, rules: {},
    howTo: ["Standard rules, but you get one second per move. Run out and a random legal move is played for you."],
  },
  {
    id: "chess960", name: "Chess960", blurb: "Shuffled back rank, same rules.", analysis: "stockfish",
    rules: { chess960: true }, layout: (random) => chess960Layout(random),
    howTo: ["The back rank is shuffled (mirrored for both sides). Castling puts king and rook on the usual squares."],
  },
  {
    id: "koth", name: "King of the Hill", blurb: "Reach the center with your king.", analysis: "internal", rules: { kingOfTheHill: true },
    howTo: ["Normal chess, but you also win by walking your king onto one of the four center squares."],
  },
  {
    id: "three-check", name: "Three Check", blurb: "Give three checks to win.", analysis: "internal", rules: { checksToWin: 3 },
    howTo: ["Normal chess, but the third check you give wins the game."],
  },
  {
    id: "crazyhouse", name: "Crazyhouse", blurb: "Captured pieces join your army.", analysis: "internal", rules: { drops: true },
    howTo: ["Pieces you capture go to your pocket. Instead of moving, you can drop one onto any empty square."],
  },
  {
    id: "antichess", name: "Antichess", blurb: "Lose everything to win.", analysis: "internal",
    rules: { giveaway: true, mustCapture: true, checkRules: false, castling: false },
    howTo: ["If you can capture, you must. The king is an ordinary piece. Lose all your pieces, or get stuck, to win."],
  },
  {
    id: "fog", name: "Fog of War", blurb: "You only see what your pieces see.", analysis: "internal", fog: true,
    rules: { checkRules: false },
    howTo: ["You only see squares your pieces can move to. There is no check: capture the king to win."],
  },
  {
    id: "duck", name: "Duck", blurb: "Move, then place the duck.", analysis: "internal", rules: { duck: true, checkRules: false },
    howTo: [
      "After every move you must put the duck on a new empty square. Nothing can pass through or capture it.",
      "There is no check. Capture the king to win.",
    ],
  },
  {
    id: "custom", name: "Custom Map", blurb: "Premade boards or your own.", analysis: "internal", usesMap: true, rules: {},
    howTo: ["Pick one of the premade boards or build your own in the map editor. Fairy pieces welcome."],
  },
];

export const MODE_BY_ID: Record<ModeId, ModeDef> = Object.fromEntries(MODES.map((m) => [m.id, m])) as Record<ModeId, ModeDef>;
