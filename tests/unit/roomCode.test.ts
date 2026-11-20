import { describe, expect, it } from "vitest";
import { isValidCode, newRoomCode, normalizeCode } from "@/features/net/roomCode";

describe("room codes", () => {
  it("are four digits", () => {
    for (let i = 0; i < 20; i++) expect(isValidCode(newRoomCode())).toBe(true);
    expect(normalizeCode(" 12-34 9")).toBe("1234");
    expect(isValidCode("12a4")).toBe(false);
  });
});
