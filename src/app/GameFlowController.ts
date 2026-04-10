import type {
  CabinetProfile,
  SessionConfig,
  SessionMode,
  SimulationState
} from "../game/core/types";
import {
  createDefaultSelectionState,
  ENDING_OVERLAY_FRAMES,
  type FlowTransitionReason,
  LOOP_TRANSITION_OVERLAY_FRAMES,
  type GameFlowScreen,
  type GameFlowSnapshot,
  type GameSelectionState
} from "./runtime/GameFlowState";

export class GameFlowController {
  private screen: GameFlowScreen = "title";

  private selection: GameSelectionState = createDefaultSelectionState();

  private audioUnlocked = false;

  private lastTransitionReason: FlowTransitionReason = "initial";

  private endingFramesRemaining = 0;

  private loopTransitionFramesRemaining = 0;

  private queuedLoopTransition = false;

  beginModeSelect(): void {
    this.setScreen("mode-select", "user-start");
    this.resetTransientOverlays();
  }

  selectMode(mode: SessionMode): void {
    this.selection = {
      ...this.selection,
      mode
    };
    this.setScreen("cabinet-select", "mode-selected");
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
    this.setScreen("gameplay", "gameplay-started");
  }

  returnToTitle(): void {
    this.setScreen("title", "return-to-title");
    this.selection = createDefaultSelectionState();
    this.audioUnlocked = false;
    this.resetTransientOverlays();
  }

  markAudioUnlocked(): void {
    this.audioUnlocked = true;
  }

  consumeSimulation(state: SimulationState): void {
    const endingStarted = state.recentEvents.find((event) => event.type === "ending-started");
    const loopAdvanced = state.recentEvents.find((event) => event.type === "loop-advanced");

    if (!endingStarted && this.selection.stageId !== state.session.stageId) {
      this.selection = {
        ...this.selection,
        stageId: state.session.stageId
      };
    }

    if (endingStarted) {
      this.setScreen("ending", "ending");
      this.endingFramesRemaining = ENDING_OVERLAY_FRAMES;
      this.queuedLoopTransition = Boolean(loopAdvanced);
      this.loopTransitionFramesRemaining = 0;
      return;
    }

    if (this.screen === "ending" || this.screen === "loop-transition") {
      return;
    }

    if (state.flow === "session-game-over") {
      this.setScreen("game-over", "game-over");
      return;
    }

    if (state.flow === "continue") {
      this.setScreen("continue", "continue");
      return;
    }

    if (
      this.screen !== "title" &&
      this.screen !== "mode-select" &&
      this.screen !== "cabinet-select"
    ) {
      this.setScreen(
        "gameplay",
        this.selection.stageId !== state.session.stageId ? "stage-progressed" : "gameplay-started"
      );
    }
  }

  advanceOverlayFrame(frames = 1): void {
    if (frames <= 0) {
      return;
    }

    if (this.screen === "ending" && this.endingFramesRemaining > 0) {
      this.endingFramesRemaining = Math.max(0, this.endingFramesRemaining - frames);
      if (this.endingFramesRemaining === 0) {
        if (this.queuedLoopTransition) {
          this.setScreen("loop-transition", "loop-transition");
          this.loopTransitionFramesRemaining = LOOP_TRANSITION_OVERLAY_FRAMES;
          this.queuedLoopTransition = false;
        } else {
          this.setScreen("title", "ending-complete");
          this.selection = createDefaultSelectionState();
        }
      }
      return;
    }

    if (this.screen === "loop-transition" && this.loopTransitionFramesRemaining > 0) {
      this.loopTransitionFramesRemaining = Math.max(
        0,
        this.loopTransitionFramesRemaining - frames
      );
      if (this.loopTransitionFramesRemaining === 0) {
        this.setScreen("gameplay", "loop-transition-complete");
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
      audioUnlocked: this.audioUnlocked,
      lastTransitionReason: this.lastTransitionReason
    };
  }

  private resetTransientOverlays(): void {
    this.endingFramesRemaining = 0;
    this.loopTransitionFramesRemaining = 0;
    this.queuedLoopTransition = false;
  }

  private setScreen(screen: GameFlowScreen, reason: FlowTransitionReason): void {
    this.screen = screen;
    this.lastTransitionReason = reason;
  }
}
