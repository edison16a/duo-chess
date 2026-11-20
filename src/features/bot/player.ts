/**
 * The bot as a room participant. It watches every snapshot the host
 * publishes and answers through the same actions a person would send, so
 * the reducer keeps it to the rules like anyone else.
 */

import { randomMove } from "@/features/room/reducer/helpers";
import type { RoomAction, RoomState } from "@/features/room/types";
import type { BotBrain } from "./brain";
import { BOT_ID, aimSkill, clampElo, powerChance } from "./elo";
import { drawPending, jobFor, rematchPending, wantsDraw, type BotJob } from "./jobs";
import { chooseDraft, planPower } from "./powers";
import { timePlan } from "./timing";

export interface BotIO {
  state: () => RoomState;
  dispatch: (action: RoomAction) => void;
}

export interface BotPlayerOptions {
  elo: number;
  brain: BotBrain;
  id?: string;
  random?: () => number;
  /** Multiplies every pause. Tests pass 0 so games run instantly. */
  pace?: number;
}

export class BotPlayer {
  readonly id: string;
  private elo: number;
  private brain: BotBrain;
  private random: () => number;
  private pace: number;
  /** Bumped whenever the current job changes, so older async work drops its result. */
  private epoch = 0;
  private jobKey = "";
  private answeringDraw = false;
  private answeringRematch = false;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private disposed = false;

  constructor(private io: BotIO, opts: BotPlayerOptions) {
    this.id = opts.id ?? BOT_ID;
    this.elo = clampElo(opts.elo);
    this.brain = opts.brain;
    this.random = opts.random ?? Math.random;
    this.pace = opts.pace ?? 1;
  }

  setElo(elo: number): void {
    this.elo = clampElo(elo);
  }

  /** Call with every new snapshot. Starts, keeps or cancels the bot's work. */
  observe(state: RoomState): void {
    if (this.disposed) return;
    this.answerDraw(state);
    this.answerRematch(state);
    const job = jobFor(state, this.id);
    const key = job?.key ?? "";
    if (key === this.jobKey) return;
    this.jobKey = key;
    const epoch = ++this.epoch;
    if (job) void this.run(job, epoch);
  }

  dispose(): void {
    this.disposed = true;
    this.timers.forEach(clearTimeout);
    this.timers.clear();
  }

  private alive(job: BotJob, epoch: number): boolean {
    return !this.disposed && epoch === this.epoch && jobFor(this.io.state(), this.id)?.key === job.key;
  }

  private async run(job: BotJob, epoch: number): Promise<void> {
    if (job.kind === "draft") await this.draft(job, epoch);
    else await this.move(job, epoch);
  }

  private async draft(job: BotJob, epoch: number): Promise<void> {
    await this.sleep(600 + this.random() * 700);
    const draft = this.io.state().draft;
    if (!this.alive(job, epoch) || !draft) return;
    const { keep, give } = chooseDraft(draft.options, this.random);
    this.io.dispatch({ type: "draft", id: this.id, keep, give });
  }

  private async move(job: BotJob, epoch: number): Promise<void> {
    const state = this.io.state();
    const plan = timePlan(state, job.color, this.elo, Date.now(), this.random);
    let wait = plan.delay;
    const power = state.game?.powers && this.random() < powerChance(this.elo)
      ? planPower(state.game, job.color, aimSkill(this.elo), this.random)
      : null;
    if (power) {
      await this.sleep(plan.delay * 0.6);
      if (!this.alive(job, epoch)) return;
      this.io.dispatch({ type: "power", id: this.id, ...power });
      // A free power starts a new job for the move. A refused one leaves this job to move.
      if (!this.alive(job, epoch)) return;
      wait = plan.delay * 0.4;
    }
    const current = this.io.state();
    const [move] = await Promise.all([
      this.brain.chooseMove(current.game!, current.config.mode, this.elo, plan),
      this.sleep(wait),
    ]);
    if (!this.alive(job, epoch)) return;
    if (move) this.io.dispatch({ type: "move", id: this.id, move });
    // Should the host refuse the move, play any legal one so the game never stalls.
    if (!this.alive(job, epoch)) return;
    const fallback = randomMove(this.io.state(), { now: Date.now(), random: this.random });
    if (fallback) this.io.dispatch({ type: "move", id: this.id, move: fallback });
  }

  private answerDraw(state: RoomState): void {
    if (!drawPending(state, this.id)) {
      this.answeringDraw = false;
      return;
    }
    if (this.answeringDraw) return;
    this.answeringDraw = true;
    const offer = state.drawOffer;
    this.later(500 + this.random() * 600, () => {
      const now = this.io.state();
      const color = offer === "w" ? "b" : "w";
      if (!drawPending(now, this.id) || now.drawOffer !== offer) return;
      this.io.dispatch({ type: "draw-answer", id: this.id, accept: wantsDraw(now, color) });
    });
  }

  private answerRematch(state: RoomState): void {
    if (!rematchPending(state, this.id)) {
      this.answeringRematch = false;
      return;
    }
    if (this.answeringRematch) return;
    this.answeringRematch = true;
    this.later(400 + this.random() * 400, () => {
      if (rematchPending(this.io.state(), this.id)) this.io.dispatch({ type: "rematch", id: this.id });
    });
  }

  private later(ms: number, fn: () => void): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (!this.disposed) fn();
    }, ms * this.pace);
    this.timers.add(timer);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => this.later(ms, resolve));
  }
}
