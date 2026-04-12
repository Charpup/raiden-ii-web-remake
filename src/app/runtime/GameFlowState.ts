import type { CabinetProfile, SessionMode } from "../../game/core/types";

export type GameFlowScreen =
  | "title"
  | "mode-select"
  | "cabinet-select"
  | "asset-loading"
  | "asset-error"
  | "gameplay"
  | "continue"
  | "game-over"
  | "ending"
  | "loop-transition";

export type FlowTransitionReason =
  | "initial"
  | "user-start"
  | "mode-selected"
  | "asset-loading"
  | "asset-error"
  | "gameplay-started"
  | "continue"
  | "game-over"
  | "ending"
  | "loop-transition"
  | "loop-transition-complete"
  | "stage-progressed"
  | "return-to-title"
  | "ending-complete";

export interface GameSelectionState {
  mode: SessionMode;
  cabinetProfile: CabinetProfile;
  stageId: string;
}

export interface GameFlowSnapshot extends GameSelectionState {
  screen: GameFlowScreen;
  audioUnlocked: boolean;
  lastTransitionReason: FlowTransitionReason;
}

export const ENDING_OVERLAY_FRAMES = 240;
export const LOOP_TRANSITION_OVERLAY_FRAMES = 180;
const OVERLAY_STEP_MS = 1000 / 60;
const FLOAT_EPSILON = 1e-6;

export function createDefaultSelectionState(): GameSelectionState {
  return {
    mode: "single",
    cabinetProfile: "easy",
    stageId: "stage-1"
  };
}

export function isSimulationDrivenScreen(screen: GameFlowScreen): boolean {
  return screen === "gameplay" || screen === "continue";
}

export function consumeOverlayFrames(
  accumulatorMs: number,
  hostDeltaMs: number
): {
  frames: number;
  remainderMs: number;
} {
  let nextAccumulatorMs = Math.max(0, accumulatorMs + Math.max(0, hostDeltaMs));
  let frames = 0;

  while (nextAccumulatorMs + FLOAT_EPSILON >= OVERLAY_STEP_MS) {
    nextAccumulatorMs -= OVERLAY_STEP_MS;
    if (Math.abs(nextAccumulatorMs) < FLOAT_EPSILON) {
      nextAccumulatorMs = 0;
    }
    frames += 1;
  }

  return {
    frames,
    remainderMs: nextAccumulatorMs
  };
}
