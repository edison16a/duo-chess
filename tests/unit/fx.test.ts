import { describe, expect, it } from "vitest";
import { DEFAULT_MODS, type Mods } from "@/features/modes";
import { FLASH_RED, eventFlashes, fxLevel, ratingsShow } from "@/features/fx";

describe("low detail effects", () => {
  it("turns blast squares red once each", () => {
    const flashes = eventFlashes([
      { type: "explosion", square: 27, squares: [27, 28, 36] },
      { type: "destroy", square: 28, kind: "knight", color: "b" },
      { type: "move", from: 12, to: 28, pieceId: 4 },
    ]);
    expect(flashes.map((f) => f.square)).toEqual([27, 28, 36]);
    expect(flashes.every((f) => f.color === FLASH_RED)).toBe(true);
  });

  it("reads settings from rooms made before they existed", () => {
    const old = { ...DEFAULT_MODS, ratings: true, fx: undefined } as unknown as Mods;
    expect(ratingsShow(old)).toBe("board");
    expect(ratingsShow({ ...old, ratings: false } as unknown as Mods)).toBe("off");
    expect(fxLevel(old)).toBe("full");
    expect(ratingsShow({ ...DEFAULT_MODS, ratings: "list" })).toBe("list");
    expect(ratingsShow({ ...DEFAULT_MODS, ratings: "minimal" })).toBe("minimal");
  });
});
