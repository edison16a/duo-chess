import { describe, expect, it } from "vitest";
import { legalMoves } from "@/engine";
import { PREMADE_MAPS, mapProblem } from "@/features/maps";
import { DEFAULT_MODS, MODES, buildGame, type GameConfig, activeMap, analysisFor, STANDARD_MAP } from "@/features/modes";

const config = (patch: Partial<GameConfig>): GameConfig => ({
  mode: "classic", mods: DEFAULT_MODS, mapId: STANDARD_MAP, customMap: null, hostColor: "w", draftStyle: "split", powersEach: 4, ...patch,
});

describe("modes", () => {
  it("every mode builds a playable game", () => {
    for (const mode of MODES) {
      const game = buildGame(config({ mode: mode.id }));
      expect(legalMoves(game.pos).length, mode.id).toBeGreaterThan(0);
    }
  });
});

describe("premade maps", () => {
  it.each(PREMADE_MAPS.map((m) => [m.id, m] as const))("%s is valid and playable", (_, map) => {
    expect(mapProblem(map)).toBeNull();
    for (const p of map.pieces) expect(p.square).toBeLessThan(map.width * map.height);
    const game = buildGame(config({ mode: "custom", mapId: map.id }));
    expect(legalMoves(game.pos).length).toBeGreaterThan(0);
  });
});

describe("maps in any mode", () => {
  it("plays every mode on its own board by default", () => {
    expect(activeMap(config({ mode: "atomic" }))).toBeNull();
    expect(buildGame(config({ mode: "atomic" })).pos.width).toBe(8);
    expect(analysisFor(config({ mode: "classic" }))).toBe("stockfish");
  });

  it("puts a mode on a map with the mode's rules on top", () => {
    const atomic = config({ mode: "atomic", mapId: "capablanca" });
    const pos = buildGame(atomic).pos;
    expect(pos.width).toBe(10);
    expect(pos.rules.atomic).toBe(true);
    // Stockfish only knows plain chess, so a map switches classic to our own search.
    expect(analysisFor(config({ mode: "classic", mapId: "capablanca" }))).toBe("internal");
  });

  it("keeps Custom Map on a real map even when the standard board was picked", () => {
    expect(activeMap(config({ mode: "custom", mapId: STANDARD_MAP }))).not.toBeNull();
  });
});
