import { AudioDirector } from "../../game/audio/AudioDirector";
import { GameClock } from "../../game/core/GameClock";
import { Simulation } from "../../game/core/Simulation";
import type {
  AudioFrame,
  CapturedFrameInput,
  PlayerSlot,
  PresentationalScene,
  SimulationState
} from "../../game/core/types";
import { createDefaultInputMapper, type RawFrameInput } from "../../game/input/InputMapper";
import { Renderer } from "../../game/render/Renderer";
import { GameFlowController } from "../GameFlowController";
import { createAssetManifest, type AssetManifest } from "../assets/assetManifest";
import { WebAudioPlaybackAdapter, type AudioPlaybackAdapter } from "../audio/AudioPlaybackAdapter";
import { projectHud, type HudProjection } from "../hudProjection";
import { consumeOverlayFrames, isSimulationDrivenScreen } from "./GameFlowState";
import type { SceneAdapter } from "../render/PixiSceneAdapter";

export interface BrowserRuntimeSnapshot {
  flow: ReturnType<GameFlowController["getState"]>;
  hud: HudProjection | null;
  scene: PresentationalScene | null;
  audioFrame: AudioFrame | null;
  assetManifest: AssetManifest;
}

export interface BrowserRuntimeOptions {
  sceneAdapterFactory?: () => SceneAdapter | Promise<SceneAdapter>;
  audioPlaybackFactory?: () => AudioPlaybackAdapter;
  assetManifest?: AssetManifest;
  onSnapshot?: (snapshot: BrowserRuntimeSnapshot) => void;
}

async function createDefaultSceneAdapter(): Promise<SceneAdapter> {
  const module = await import("../render/PixiSceneAdapter");
  return new module.PixiSceneAdapter();
}

export class BrowserRuntime {
  private readonly flowController = new GameFlowController();

  private readonly inputMapper = createDefaultInputMapper();

  private readonly renderer = new Renderer();

  private readonly audioDirector = new AudioDirector();

  private readonly assetManifest: AssetManifest;

  private readonly audioPlayback: AudioPlaybackAdapter;

  private readonly onSnapshot?: (snapshot: BrowserRuntimeSnapshot) => void;

  private readonly sceneAdapterFactory: () => SceneAdapter | Promise<SceneAdapter>;

  private clock = new GameClock();

  private pressedKeys = new Set<string>();

  private sceneAdapter: SceneAdapter | null = null;

  private simulation: Simulation | null = null;

  private latestHud: HudProjection | null = null;

  private latestScene: PresentationalScene | null = null;

  private latestAudioFrame: AudioFrame | null = null;

  private animationFrameId: number | null = null;

  private lastAnimationTimestamp: number | null = null;

  private overlayAccumulatorMs = 0;

  constructor(options: BrowserRuntimeOptions = {}) {
    this.assetManifest = options.assetManifest ?? createAssetManifest();
    this.audioPlayback = options.audioPlaybackFactory?.() ?? new WebAudioPlaybackAdapter();
    this.sceneAdapterFactory = options.sceneAdapterFactory ?? createDefaultSceneAdapter;
    this.onSnapshot = options.onSnapshot;
  }

  async attach(host: HTMLElement): Promise<void> {
    const sceneAdapter = await this.sceneAdapterFactory();
    await sceneAdapter.attach(host);
    this.sceneAdapter = sceneAdapter;
    this.emitSnapshot();
  }

  getSnapshot(): BrowserRuntimeSnapshot {
    return {
      flow: this.flowController.getState(),
      hud: this.latestHud,
      scene: this.latestScene,
      audioFrame: this.latestAudioFrame,
      assetManifest: this.assetManifest
    };
  }

  beginModeSelect(): void {
    this.flowController.beginModeSelect();
    this.emitSnapshot();
  }

  selectMode(mode: ReturnType<GameFlowController["getSessionConfig"]>["mode"]): void {
    this.flowController.selectMode(mode);
    this.emitSnapshot();
  }

  selectCabinetProfile(
    profile: ReturnType<GameFlowController["getSessionConfig"]>["cabinetProfile"]
  ): void {
    this.flowController.selectCabinetProfile(profile);
    this.emitSnapshot();
  }

  startGameplay(): void {
    this.flowController.startGameplay();
    this.clock = new GameClock();
    this.overlayAccumulatorMs = 0;
    this.clearPressedKeys();
    this.simulation = new Simulation(this.flowController.getSessionConfig());
    this.syncOutputs(this.simulation.getState());
  }

  startAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      return;
    }

    const animate = (timestamp: number): void => {
      if (this.lastAnimationTimestamp !== null) {
        this.tickHostDelta(timestamp - this.lastAnimationTimestamp);
      }

      this.lastAnimationTimestamp = timestamp;
      this.animationFrameId = window.requestAnimationFrame(animate);
    };

    this.animationFrameId = window.requestAnimationFrame(animate);
  }

  stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.lastAnimationTimestamp = null;
  }

  tickHostDelta(deltaMs: number): void {
    if (!this.simulation) {
      return;
    }

    const screen = this.flowController.getState().screen;
    if (!isSimulationDrivenScreen(screen)) {
      const overlayTick = consumeOverlayFrames(this.overlayAccumulatorMs, deltaMs);
      this.overlayAccumulatorMs = overlayTick.remainderMs;
      if (overlayTick.frames > 0) {
        this.flowController.advanceOverlayFrame(overlayTick.frames);
      }
      this.emitSnapshot();
      return;
    }

    const tick = this.clock.tick(deltaMs);
    if (tick.steps.length === 0) {
      return;
    }

    const initialSimulationScreen = screen;
    for (const _step of tick.steps) {
      const state = this.simulation.step(this.captureGameplayInput());
      this.syncOutputs(state);

      if (this.flowController.getState().screen !== initialSimulationScreen) {
        break;
      }
    }
  }

  handleKeyDown(code: string): void {
    this.pressedKeys.add(code);
  }

  handleKeyUp(code: string): void {
    this.pressedKeys.delete(code);
  }

  unlockAudio(): void {
    this.flowController.markAudioUnlocked();
    this.audioPlayback.unlock();
    this.emitSnapshot();
  }

  setVisibilityHidden(hidden: boolean): void {
    if (hidden) {
      this.clock.pause();
      this.clearPressedKeys();
    } else {
      this.clock.resume();
    }

    this.audioPlayback.setSuspended(hidden);
  }

  acceptContinue(playerId: PlayerSlot): void {
    if (!this.simulation) {
      return;
    }

    if (this.simulation.acceptContinue(playerId)) {
      this.syncOutputs(this.simulation.getState());
    }
  }

  joinPlayer(playerId: PlayerSlot): void {
    if (!this.simulation) {
      return;
    }

    if (this.simulation.joinPlayer(playerId)) {
      this.syncOutputs(this.simulation.getState());
    }
  }

  returnToTitle(): void {
    this.simulation = null;
    this.latestHud = null;
    this.latestScene = null;
    this.latestAudioFrame = {
      bgmCue: null,
      sfxCues: []
    };
    this.audioPlayback.sync(this.latestAudioFrame);
    this.clock = new GameClock();
    this.overlayAccumulatorMs = 0;
    this.clearPressedKeys();
    this.flowController.returnToTitle();
    this.emitSnapshot();
  }

  destroy(): void {
    this.stopAnimationLoop();
    this.audioPlayback.destroy();
    this.sceneAdapter?.destroy();
    this.sceneAdapter = null;
  }

  private captureGameplayInput(): CapturedFrameInput {
    const rawInput: RawFrameInput = {
      keyboardPressed: [...this.pressedKeys],
      gamepads: this.readGamepads()
    };

    return this.inputMapper.captureFrame(rawInput);
  }

  private readGamepads(): RawFrameInput["gamepads"] {
    if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") {
      return [];
    }

    const mapped: NonNullable<RawFrameInput["gamepads"]> = [];
    for (const [index, gamepad] of Array.from(navigator.getGamepads()).entries()) {
      if (!gamepad) {
        continue;
      }

      mapped.push({
        player: index === 0 ? "player1" : "player2",
        axes: [gamepad.axes[0] ?? 0, gamepad.axes[1] ?? 0],
        buttons: {
          fire: Boolean(gamepad.buttons[0]?.pressed),
          bomb: Boolean(gamepad.buttons[1]?.pressed),
          focus: Boolean(gamepad.buttons[4]?.pressed)
        }
      });
    }

    return mapped;
  }

  private syncOutputs(state: SimulationState): void {
    this.latestScene = this.renderer.sync(state);
    this.sceneAdapter?.sync(this.latestScene);
    this.latestAudioFrame = this.audioDirector.sync(state);
    this.audioPlayback.sync(this.latestAudioFrame);
    this.latestHud = projectHud(state);
    this.flowController.consumeSimulation(state);
    this.emitSnapshot();
  }

  private emitSnapshot(): void {
    this.onSnapshot?.(this.getSnapshot());
  }

  private clearPressedKeys(): void {
    this.pressedKeys.clear();
  }
}
