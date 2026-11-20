/**
 * The bot's own engine workers, separate from the ones that rate moves so
 * strength limits never leak into the analysis. Both start lazily.
 */

import { InternalEngine } from "@/features/analysis/internal";
import { StockfishClient } from "@/features/analysis/stockfish";
import type { AnalysisKind } from "@/features/modes";
import type { BestMoveFn, BrainDeps, RootSearch } from "./brain";

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      () => { clearTimeout(timer); resolve(fallback); },
    );
  });
}

export class BotEngines implements BrainDeps {
  private sf: StockfishClient | null = null;
  private internal: InternalEngine | null = null;

  readonly search: RootSearch = (pos, depth) => this.internalEngine().scoreMoves(pos, depth);

  readonly bestMove: BestMoveFn = (fen, opts, timeoutMs) => withTimeout(this.stockfish().bestMove(fen, opts), timeoutMs, "");

  /** Boots the engine a mode needs ahead of time, so the first move is not slowed by loading. */
  warm(kind: AnalysisKind): void {
    if (kind === "stockfish") this.stockfish();
    else this.internalEngine();
  }

  private stockfish(): StockfishClient {
    return (this.sf ??= new StockfishClient());
  }

  private internalEngine(): InternalEngine {
    return (this.internal ??= new InternalEngine());
  }

  dispose(): void {
    this.sf?.dispose();
    this.internal?.dispose();
    this.sf = null;
    this.internal = null;
  }
}
