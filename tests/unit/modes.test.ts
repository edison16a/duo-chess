import { describe, expect, it } from "vitest";
import { legalMoves } from "@/engine";
import { PREMADE_MAPS, mapProblem } from "@/features/maps";
import { DEFAULT_MODS, MODES, buildGame, type GameConfig } from "@/features/modes";

const config = (patch: Partial<GameConfig>): GameConfig => ({
  mode: "classic", mods: DEFAULT_MODS, mapId: PREMADE_MAPS[0].id, customMap: null, hostColor: "w", draftStyle: "split", powersEach: 4, ...patch,
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
