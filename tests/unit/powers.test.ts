import { describe, expect, it } from "vitest";
import { createGame, createPosition, legalMoves, parseSquare, playMove, standardLayout, type GameState } from "@/engine";
import { ALL_POWERS, activatePower, applyDraft, createDraft, deckBudget, deckCost, draftDone, playerDone, rollOptions, type DraftStyle } from "@/features/powers";
import { POWER_ICONS } from "@/features/powers/icons";

function poweredGame(powers: string[]): GameState {
  const game = createGame(createPosition(standardLayout()));
  return { ...game, powers: { inventory: { w: powers, b: powers.slice() }, usedTurn: null } };
}

const at = (game: GameState, name: string) => parseSquare(game.pos, name);
const seeded = () => {
  let s = 42;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
};

describe("power catalog", () => {
  it("has 50 powers with unique ids and an icon each", () => {
    expect(ALL_POWERS).toHaveLength(50);
    expect(new Set(ALL_POWERS.map((p) => p.id)).size).toBe(50);
    for (const p of ALL_POWERS) expect(POWER_ICONS[p.id], p.id).toBeTruthy();
  });

  it("spreads across all five rarities", () => {
    const counts = ALL_POWERS.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.rarity]: (acc[p.rarity] ?? 0) + 1 }), {});
    expect(counts).toEqual({ rare: 15, epic: 12, legendary: 10, mythical: 8, chromatic: 5 });
  });
});

describe("activating powers", () => {
  it("frostbite stops a piece from moving on the next enemy turn", () => {
    const game = poweredGame(["frostbite"]);
    const frozen = activatePower(game, "w", "frostbite", [at(game, "g8")]) as GameState;
    expect(typeof frozen).toBe("object");
    const afterMove = playMove(frozen, { from: at(game, "e2"), to: at(game, "e4") })!;
    const knightMoves = legalMoves(afterMove.pos).filter((m) => m.from === at(game, "g8"));
    expect(knightMoves).toHaveLength(0);
  });

  it("lightning destroys a pawn and uses the move", () => {
    const game = poweredGame(["lightning"]);
    const next = activatePower(game, "w", "lightning", [at(game, "d7")]) as GameState;
    expect(next.pos.board[at(game, "d7")]).toBeNull();
    expect(next.pos.turn).toBe("b");
    expect(next.lost.b).toContain("pawn");
  });

  it("only allows one power per turn", () => {
    const game = poweredGame(["aegis", "barricade"]);
    const once = activatePower(game, "w", "aegis", [at(game, "d1")]) as GameState;
    expect(activatePower(once, "w", "barricade", [at(game, "e4")])).toBeTypeOf("string");
  });

  it("deep freeze makes the opponent skip a turn", () => {
    const game = poweredGame(["deep-freeze"]);
    const frozen = activatePower(game, "w", "deep-freeze", []) as GameState;
    const moved = playMove(frozen, { from: at(game, "e2"), to: at(game, "e4") })!;
    expect(moved.pos.turn).toBe("w");
  });

  it("cannot target the king", () => {
    const game = poweredGame(["poison"]);
    expect(activatePower(game, "w", "poison", [at(game, "e8")])).toBeTypeOf("string");
  });

  it("double down grants an extra move", () => {
    const game = poweredGame(["double-down"]);
    const boosted = activatePower(game, "w", "double-down", []) as GameState;
    const one = playMove(boosted, { from: at(game, "e2"), to: at(game, "e4") })!;
    expect(one.pos.turn).toBe("w");
    const two = playMove(one, { from: at(game, "d2"), to: at(game, "d4") })!;
    expect(two.pos.turn).toBe("b");
  });

  it("every power either applies or explains why not on the opening position", () => {
    for (const power of ALL_POWERS) {
      const game = poweredGame([power.id]);
      const squares: number[] = [];
      for (const step of power.targets) {
        const ctx = { pos: game.pos, color: "w" as const, enemy: "b" as const, lost: game.lost, squares };
        const pick = game.pos.board.findIndex((_, s) => step.valid(ctx, s));
        if (pick >= 0) squares.push(pick);
      }
      const result = activatePower(game, "w", power.id, squares, seeded());
      expect(["object", "string"]).toContain(typeof result);
    }
  });
});

describe("draft", () => {
  it("rolls distinct options", () => {
    expect(new Set(rollOptions(seeded())).size).toBe(3);
    expect(new Set(rollOptions(seeded(), 2)).size).toBe(2);
  });

  const play = (style: DraftStyle) => {
    const random = seeded();
    let draft = createDraft(style, 4, random);
    let picks = 0;
    // White races ahead to show the players do not wait on each other.
    for (const color of ["w", "w", "w", "w", "b", "b", "b", "b"] as const) {
      if (playerDone(draft, color)) continue;
      const next = applyDraft(draft, color, [draft.options[color][0]], random);
      expect(typeof next).toBe("object");
      draft = next as typeof draft;
      picks++;
    }
    expect(draftDone(draft)).toBe(true);
    return { draft, picks };
  };

  it("Split hands the other card to the opponent", () => {
    const { draft, picks } = play("split");
    expect(picks).toBe(4);
    expect(draft.log[0].give).not.toBeNull();
    expect(draft.inventory.w).toHaveLength(4);
    expect(draft.inventory.b).toHaveLength(4);
  });

  it("Triple keeps one card and gives nothing away", () => {
    const { draft, picks } = play("triple");
    expect(picks).toBe(8);
    expect(draft.log.every((p) => p.give === null)).toBe(true);
    expect(draft.inventory.w).toEqual(draft.log.filter((p) => p.by === "w").map((p) => p.keep));
    expect(draft.inventory.b).toHaveLength(4);
  });

  it("refuses picks off your own table or after you are done", () => {
    const random = seeded();
    let draft = createDraft("triple", 1, random);
    const offTable = ALL_POWERS.find((p) => !draft.options.w.includes(p.id))!.id;
    expect(typeof applyDraft(draft, "w", [offTable], random)).toBe("string");
    draft = applyDraft(draft, "w", [draft.options.w[0]], random) as typeof draft;
    expect(typeof applyDraft(draft, "w", [draft.options.b[0]], random)).toBe("string");
  });

  it("prices Free Deck cards by rarity", () => {
    expect(deckBudget(4)).toBe(10);
    const rares = ALL_POWERS.filter((p) => p.rarity === "rare").slice(0, 3).map((p) => p.id);
    expect(deckCost(rares)).toBe(3);
  });
});
