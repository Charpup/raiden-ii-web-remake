import type {
  CabinetProfile,
  SessionConfig,
  SessionMode,
  SimulationState
} from "../game/core/types";
import {
  createDefaultSelectionState,
  ENDING_OVERLAY_FRAMES,
  LOOP_TRANSITION_OVERLAY_FRAMES,
  type GameFlowScreen,
  type GameFlowSnapshot,
  type GameSelectionState
} from "./runtime/GameFlowState";

export class GameFlowController {
  private screen: GameFlowScreen = "title";

  private selection: GameSelectionState = createDefaultSelectionState();

  private audioUnlocked = false;

  private endingFramesRemaining = 0;

  private loopTransitionFramesRemaining = 0;

  private queuedLoopTransition = false;

  beginModeSelect(): void {
    this.screen = "mode-select";
    this.resetTransientOverlays();
  }

  selectMode(mode: SessionMode): void {
    this.selection = {
      ...this.selection,
      mode
    };
    this.screen = "cabinet-select";
  }

  selectCabinetProfile(cabinetProfile: CabinetProfile): void {
    this.selection = {
      ...this.selection,
      cabinetProfile
    };
  }

  setStageId(stageId: string): void {
    this.selection = {
      ...this.selection,
      stageId
    };
  }

  startGameplay(stageId = this.selection.stageId): void {
    this.selection = {
      ...this.selection,
      stageId
    };
    this.resetTransientOverlays();
    this.screen = "gameplay";
  }

  returnToTitle(): void {
    this.screen = "title";
    this.selection = createDefaultSelectionState();
    this.audioUnlocked = false;
    this.resetTransientOverlays();
  }

  markAudioUnlocked(): void {
    this.audioUnlocked = true;
  }

  consumeSimulation(state: SimulationState): void {
    const stageCleared = state.recentEvents.find((event) => event.type === "stage-cleared");
    const loopAdvanced = state.recentEvents.find((event) => event.type === "loop-advanced");

    if (stageCleared) {
      this.screen = "ending";
      this.endingFramesRemaining = ENDING_OVERLAY_FRAMES;
      this.queuedLoopTransition = Boolean(loopAdvanced);
      this.loopTransitionFramesRemaining = 0;
      return;
    }

    if (this.screen === "ending" || this.screen === "loop-transition") {
      return;
    }

    if (state.flow === "session-game-over") {
      this.screen = "game-over";
      return;
    }

    if (state.flow === "continue") {
      this.screen = "continue";
      return;
    }

    if (
      this.screen !== "title" &&
      this.screen !== "mode-select" &&
      this.screen !== "cabinet-select"
    ) {
      this.screen = "gameplay";
    }
  }

  advanceOverlayFrame(frames = 1): void {
    if (frames <= 0) {
      return;
    }

    if (this.screen === "ending" && this.endingFramesRemaining > 0) {
      this.endingFramesRemaining = Math.max(0, this.endingFramesRemaining - frames);
      if (this.endingFramesRemaining === 0 && this.queuedLoopTransition) {
        this.screen = "loop-transition";
        this.loopTransitionFramesRemaining = LOOP_TRANSITION_OVERLAY_FRAMES;
        this.queuedLoopTransition = false;
      }
      return;
    }

    if (this.screen === "loop-transition" && this.loopTransitionFramesRemaining > 0) {
      this.loopTransitionFramesRemaining = Math.max(
        0,
        this.loopTransitionFramesRemaining - frames
      );
      if (this.loopTransitionFramesRemaining === 0) {
        this.screen = "gameplay";
      }
    }
  }

  getSessionConfig(): SessionConfig {
    return {
      mode: this.selection.mode,
      cabinetProfile: this.selection.cabinetProfile,
      stageId: this.selection.stageId,
      loopIndex: 0
    };
  }

  getState(): GameFlowSnapshot {
    return {
      screen: this.screen,
      mode: this.selection.mode,
      cabinetProfile: this.selection.cabinetProfile,
      stageId: this.selection.stageId,
      audioUnlocked: this.audioUnlocked
    };
  }

  private resetTransientOverlays(): void {
    this.endingFramesRemaining = 0;
    this.loopTransitionFramesRemaining = 0;
    this.queuedLoopTransition = false;
  }
}
