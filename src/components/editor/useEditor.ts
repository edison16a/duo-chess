"use client";

/** Map editor state: the map being drawn, the active tool and symmetry. */

import { useCallback, useState } from "react";
import { standardLayout, type Color, type LayoutPiece, type PieceKind } from "@/engine";
import type { ChessMap } from "@/features/maps";

export type Tool = { type: "piece"; kind: PieceKind } | { type: "erase" } | { type: "hole" };

function blankMap(): ChessMap {
  const std = standardLayout();
  return { id: `map-${Date.now().toString(36)}`, name: "My map", width: 8, height: 8, pieces: std.pieces, holes: [], custom: true };
}

export function useEditor() {
  const [map, setMap] = useState<ChessMap>(blankMap);
  const [tool, setTool] = useState<Tool>({ type: "piece", kind: "queen" });
  const [color, setColor] = useState<Color>("w");
  const [mirror, setMirror] = useState(true);

  /** The square on the other side of the board, flipped top to bottom. */
  const mirrorOf = useCallback((square: number, m: ChessMap) => {
    const x = square % m.width, y = Math.floor(square / m.width);
    return (m.height - 1 - y) * m.width + x;
  }, []);

  const paint = useCallback((square: number, erase = false) => {
    setMap((m) => {
      const targets = mirror ? [...new Set([square, mirrorOf(square, m)])] : [square];
      let pieces = m.pieces.filter((p) => !targets.includes(p.square));
      let holes = (m.holes ?? []).filter((h) => !targets.includes(h));
      if (!erase && tool.type === "hole") holes = [...holes, ...targets];
      if (!erase && tool.type === "piece") {
        const placed: LayoutPiece[] = targets.map((s, i) => ({
          square: s,
          kind: tool.kind,
          color: tool.kind === "duck" ? "n" : i === 0 ? color : color === "w" ? "b" : "w",
        }));
        pieces = [...pieces, ...placed];
      }
      return { ...m, pieces, holes };
    });
  }, [mirror, mirrorOf, tool, color]);

  const resize = useCallback((width: number, height: number) => {
    setMap((m) => {
      const pieces = m.pieces
        .map((p) => ({ ...p, x: p.square % m.width, y: Math.floor(p.square / m.width) }))
        .filter((p) => p.x < width && p.y < height)
        .map(({ x, y, ...p }) => ({ ...p, square: y * width + x }));
      return { ...m, width, height, pieces, holes: [] };
    });
  }, []);

  return {
    map, setMap, tool, setTool, color, setColor, mirror, setMirror, paint, resize,
    clear: () => setMap((m) => ({ ...m, pieces: [], holes: [] })),
    reset: () => setMap((m) => ({ ...blankMap(), id: m.id, name: m.name })),
    fresh: () => setMap(blankMap()),
  };
}
