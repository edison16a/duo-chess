/// <reference lib="webworker" />
/**
 * Runs the built in search off the main thread so the board stays smooth
 * while variant moves are being rated.
 */

import type { Position } from "@/engine";
import { scoreRootMoves } from "./search";

interface Request {
  id: number;
  pos: Position;
  depth: number;
}

self.onmessage = (e: MessageEvent<Request>) => {
  const { id, pos, depth } = e.data;
  try {
    const scores = scoreRootMoves(pos, depth);
    self.postMessage({ id, scores });
  } catch (error) {
    self.postMessage({ id, error: String(error) });
  }
};
