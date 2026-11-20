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

/** Settings for a single bot move. */
export interface BestMoveOptions {
  movetime: number;
  chess960: boolean;
  /** Strength cap through UCI_LimitStrength, or null to play at `skill` instead. */
  elo: number | null;
  /** Skill Level, 0 to 20. Ignored by Stockfish while an Elo cap is set. */
  skill: number;
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
    return this.enqueue(run);
  }

  /**
   * Plays one move at a limited strength and returns it in UCI notation, or
   * an empty string when the side to move has none. Every call sets all the
   * options again because the client may be shared between modes.
   */
  bestMove(fen: string, opts: BestMoveOptions): Promise<string> {
    const run = async () => {
      await this.ready;
      const send = (cmd: string) => this.worker.postMessage(cmd);
      await this.waitFor("readyok", () => {
        send(`setoption name UCI_Chess960 value ${opts.chess960}`);
        send("setoption name MultiPV value 1");
        send(`setoption name UCI_LimitStrength value ${opts.elo !== null}`);
        if (opts.elo !== null) send(`setoption name UCI_Elo value ${Math.round(opts.elo)}`);
        send(`setoption name Skill Level value ${opts.skill}`);
        send("isready");
      });
      const line = await this.waitFor("bestmove", () => {
        send(`position fen ${fen}`);
        send(`go movetime ${Math.round(opts.movetime)}`);
      });
      const move = line.split(" ")[1] ?? "";
      return move === "(none)" ? "" : move;
    };
    return this.enqueue(run);
  }

  /** Runs requests one at a time so engine output never interleaves. */
  private enqueue<T>(run: () => Promise<T>): Promise<T> {
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }

  dispose(): void {
    this.worker.terminate();
  }
}
