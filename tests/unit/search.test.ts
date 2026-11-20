import { describe, expect, it } from "vitest";
import { createPosition, DEFAULT_RULES, fromFen, moveToSan, standardLayout, type Position } from "@/engine";
import { MATE, isMateScore, scoreRootMoves } from "@/features/analysis/search";
import { newGame, playLine } from "./lines";

const san = (pos: Position, scores: ReturnType<typeof scoreRootMoves>) => moveToSan(pos, scores[0].move);

describe("built in search", () => {
  it("finds mate in one", () => {
    const pos = fromFen("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1");
    const scores = scoreRootMoves(pos, 2);
    expect(san(pos, scores)).toBe("Ra8");
    expect(scores[0].score).toBe(MATE - 1);
  });

  it("takes a free queen", () => {
    const pos = fromFen("4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1");
    expect(san(pos, scoreRootMoves(pos, 3))).toBe("Rxd5");
  });

  it("prefers the quicker mate", () => {
    // Qg7 is mate at once; other queen moves mate later or not at all.
    const pos = fromFen("7k/8/5KQ1/8/8/8/8/8 w - - 0 1");
    const scores = scoreRootMoves(pos, 3);
    expect(scores[0].score).toBe(MATE - 1);
    expect(scores.filter((s) => s.score === MATE - 1).length).toBeLessThan(scores.length);
  });

  it("sees a mate that lands exactly on the horizon", () => {
    // Back rank: Re8 is mate. Even at depth 1 the search must notice Black has no answer.
    const pos = fromFen("6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1");
    expect(scoreRootMoves(pos, 1)[0].score).toBe(MATE - 1);
  });

  it("follows a checking line past its nominal depth", () => {
    // 1.Qh7+ Kf8 2.Qh8# needs three plies; depth 2 sees it because checks do not use up depth.
    const pos = fromFen("6k1/5p2/6pQ/8/8/8/8/6KR w - - 0 1");
    const [best] = scoreRootMoves(pos, 2);
    expect(isMateScore(best.score) && best.score > 0).toBe(true);
  });

  it("scores Black's view with the right sign", () => {
    const pos = fromFen("4k3/3r4/8/8/8/8/3Q4/7K b - - 0 1");
    const [best] = scoreRootMoves(pos, 3);
    expect(san(pos, [best])).toBe("Rxd2");
    expect(best.score).toBeLessThan(0);
  });

  it("knows antichess captures are forced", () => {
    const pos = playLine(newGame("antichess"), ["e3", "b5"])[2].pos;
    const scores = scoreRootMoves(pos, 2);
    expect(scores).toHaveLength(1);
    expect(san(pos, scores)).toBe("Bxb5");
  });

  it("lets an atomic capture blow up the king", () => {
    const pos = playLine(newGame("atomic"), ["e4", "d5", "Nf3", "Bg4", "exd5"])[5].pos;
    const [best] = scoreRootMoves(pos, 2);
    expect(san(pos, [best])).toBe("Qxd2");
    expect(best.score).toBe(-(MATE - 1));
  });

  it("keeps both moves of a double move turn on the mover's side", () => {
    // Nothing takes the queen on h4 in one move, but Nf3 and then Nxh4 does it in one turn.
    const pos = playLine(newGame("double"), ["e4", "d4", "e5", "Qh4"])[4].pos;
    expect(pos.turn).toBe("w");
    const scores = scoreRootMoves(pos, 2, 20_000);
    expect(scores[0].score).toBeGreaterThan(500);
  });

  it("stays inside its node budget and still scores every move", () => {
    const pos = createPosition(standardLayout(), { ...DEFAULT_RULES, atomic: true });
    const start = Date.now();
    const scores = scoreRootMoves(pos, 6, 20_000);
    expect(scores).toHaveLength(20);
    expect(Date.now() - start).toBeLessThan(5000);
  });

  it("stops at its time budget", () => {
    const pos = fromFen("r1bq1rk1/pp2bppp/2n1pn2/3p4/2PP4/2N1PN2/PP1B1PPP/R2QKB1R w KQ - 0 8");
    const start = Date.now();
    const scores = scoreRootMoves(pos, 8, Infinity, { timeMs: 300 });
    expect(scores.length).toBeGreaterThan(30);
    expect(Date.now() - start).toBeLessThan(1500);
  });
});
