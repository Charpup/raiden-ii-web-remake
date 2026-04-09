export interface ClockStep {
  frame: number;
  dtMs: number;
}

export interface ClockTickResult {
  steps: ClockStep[];
  remainderMs: number;
  consumedDeltaMs: number;
  paused: boolean;
}

export interface GameClockOptions {
  stepMs?: number;
  maxDeltaMs?: number;
}

const DEFAULT_STEP_MS = 1000 / 60;
const DEFAULT_MAX_DELTA_MS = 100;
const FLOAT_EPSILON = 1e-6;

export class GameClock {
  private readonly stepMs: number;

  private readonly maxDeltaMs: number;

  private accumulatorMs = 0;

  private frame = 0;

  private pausedState = false;

  constructor(options: GameClockOptions = {}) {
    this.stepMs = options.stepMs ?? DEFAULT_STEP_MS;
    this.maxDeltaMs = options.maxDeltaMs ?? DEFAULT_MAX_DELTA_MS;
  }

  pause(): void {
    this.pausedState = true;
  }

  resume(): void {
    this.pausedState = false;
  }

  isPaused(): boolean {
    return this.pausedState;
  }

  tick(hostDeltaMs: number): ClockTickResult {
    if (this.pausedState) {
      return {
        steps: [],
        remainderMs: this.accumulatorMs,
        consumedDeltaMs: 0,
        paused: true
      };
    }

    const consumedDeltaMs = Math.min(
      Math.max(hostDeltaMs, 0),
      this.maxDeltaMs
    );
    this.accumulatorMs += consumedDeltaMs;

    const steps: ClockStep[] = [];
    while (this.accumulatorMs + FLOAT_EPSILON >= this.stepMs) {
      this.accumulatorMs -= this.stepMs;
      if (Math.abs(this.accumulatorMs) < FLOAT_EPSILON) {
        this.accumulatorMs = 0;
      }

      this.frame += 1;
      steps.push({
        frame: this.frame,
        dtMs: this.stepMs
      });
    }

    return {
      steps,
      remainderMs: this.accumulatorMs,
      consumedDeltaMs,
      paused: false
    };
  }
}
