import { describe, expect, it } from "vitest";
import { createPosition, DEFAULT_RULES, fromFen, moveToSan, standardLayout } from "@/engine";
import { scoreRootMoves } from "@/features/analysis/search";

describe("built in search", () => {
  it("finds mate in one", () => {
    const pos = fromFen("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1");
    const [best] = scoreRootMoves(pos, 2);
    expect(moveToSan(pos, best.move)).toBe("Ra8");
  });

  it("takes a free queen", () => {
    const pos = fromFen("4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1");
    const [best] = scoreRootMoves(pos, 3);
    expect(moveToSan(pos, best.move)).toBe("Rxd5");
  });

  it("runs the opening position in reasonable time", () => {
    const pos = createPosition(standardLayout(), { ...DEFAULT_RULES, atomic: true });
    const start = Date.now();
    const scores = scoreRootMoves(pos, 3);
    expect(scores).toHaveLength(20);
    expect(Date.now() - start).toBeLessThan(5000);
  });
});
