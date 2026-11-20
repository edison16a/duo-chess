/** Promise wrapper around the search worker. */

import type { Position } from "@/engine";
import type { RootScore, SearchLimits } from "./search";

export class InternalEngine {
  private worker: Worker;
  private nextId = 1;
  private pending = new Map<number, (scores: RootScore[] | null) => void>();

  constructor() {
    this.worker = new Worker(new URL("./search.worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (e: MessageEvent<{ id: number; scores?: RootScore[] }>) => {
      this.pending.get(e.data.id)?.(e.data.scores ?? null);
      this.pending.delete(e.data.id);
    };
  }

  /** Without limits the search uses its default node budget, which is what the bot wants. */
  scoreMoves(pos: Position, depth: number, limits?: SearchLimits): Promise<RootScore[] | null> {
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.worker.postMessage({ id, pos, depth, limits });
    });
  }

  dispose(): void {
    this.worker.terminate();
  }
}
