/** Promise wrapper around the search worker. */

import type { Position } from "@/engine";
import type { RootScore } from "./search";

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

  scoreMoves(pos: Position, depth: number): Promise<RootScore[] | null> {
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.worker.postMessage({ id, pos, depth });
    });
  }

  dispose(): void {
    this.worker.terminate();
  }
}
