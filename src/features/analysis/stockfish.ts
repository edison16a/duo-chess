/**
 * Thin UCI client around the Stockfish wasm worker served from /engine.
 * Requests are queued so a burst of moves never interleaves engine output.
 */

import { MATE } from "./search";

export interface EngineLine {
  /** First move of the line in UCI notation. */
  move: string;
  /** Score in centipawns from the side to move. Mates map to +-MATE. */
  score: number;
}

const ENGINE_URL = "/engine/stockfish-19-lite-single.js";

function parseScore(tokens: string[]): number | null {
  const i = tokens.indexOf("score");
  if (i < 0) return null;
  const value = Number(tokens[i + 2]);
  if (tokens[i + 1] === "mate") return value > 0 ? MATE - value : -MATE - value;
  return value;
}

export class StockfishClient {
  private worker: Worker;
  private queue: Promise<unknown> = Promise.resolve();
  private listener: ((line: string) => void) | null = null;
  private ready: Promise<void>;

  constructor() {
    this.worker = new Worker(ENGINE_URL);
    this.worker.onmessage = (e: MessageEvent<string>) => this.listener?.(String(e.data));
    this.ready = this.waitFor("uciok", () => this.worker.postMessage("uci")).then(() => undefined);
  }

  private waitFor(token: string, send: () => void, onLine?: (line: string) => void): Promise<string> {
    return new Promise((resolve) => {
      this.listener = (line) => {
        onLine?.(line);
        if (line.startsWith(token)) {
          this.listener = null;
          resolve(line);
        }
      };
      send();
    });
  }

  /** Analyse a FEN and return the top lines, best first. */
  analyse(fen: string, opts: { depth: number; multipv: number; chess960: boolean }): Promise<EngineLine[]> {
    const run = async () => {
      await this.ready;
      const lines = new Map<number, EngineLine>();
      await this.waitFor("readyok", () => {
        this.worker.postMessage(`setoption name UCI_Chess960 value ${opts.chess960}`);
        this.worker.postMessage(`setoption name MultiPV value ${opts.multipv}`);
        this.worker.postMessage("isready");
      });
      await this.waitFor(
        "bestmove",
        () => {
          this.worker.postMessage(`position fen ${fen}`);
          this.worker.postMessage(`go depth ${opts.depth}`);
        },
        (line) => {
          if (!line.startsWith("info") || !line.includes(" score ")) return;
          const tokens = line.split(" ");
          const score = parseScore(tokens);
          // Mated or stalemated positions report a score with no pv at all.
          const pv = tokens.includes("pv") ? tokens[tokens.indexOf("pv") + 1] : "";
          const multipv = tokens.includes("multipv") ? Number(tokens[tokens.indexOf("multipv") + 1]) : 1;
          if (score !== null) lines.set(multipv, { move: pv, score });
        },
      );
      return [...lines.entries()].sort((a, b) => a[0] - b[0]).map(([, l]) => l);
    };
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }

  dispose(): void {
    this.worker.terminate();
  }
}
