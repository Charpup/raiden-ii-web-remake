import { AudioDirector } from "../../game/audio/AudioDirector";
import { GameClock } from "../../game/core/GameClock";
import { Simulation } from "../../game/core/Simulation";
import type {
  AudioFrame,
  CapturedFrameInput,
  PlayerSlot,
  PresentationalScene,
  RuntimeEvent,
  SimulationState
} from "../../game/core/types";
import { createDefaultInputMapper, type RawFrameInput } from "../../game/input/InputMapper";
import { Renderer } from "../../game/render/Renderer";
import { GameFlowController } from "../GameFlowController";
import { createAssetManifest, type AssetManifest } from "../assets/assetManifest";
import {
  DefaultReplacementAssetStore,
  type ReplacementAssetLoadState,
  type ReplacementAssetStore
} from "../assets/ReplacementAssetStore";
import { WebAudioPlaybackAdapter, type AudioPlaybackAdapter } from "../audio/AudioPlaybackAdapter";
import { projectHud, type HudProjection } from "../hudProjection";
import { Canvas2DSceneAdapter } from "../render/Canvas2DSceneAdapter";
import type { SceneAdapter } from "../render/PixiSceneAdapter";
import { consumeOverlayFrames, isSimulationDrivenScreen } from "./GameFlowState";

export interface BrowserRuntimeSceneCounts {
  players: number;
  enemies: number;
  playerBullets: number;
  enemyBullets: number;
  pickups: number;
  effects: number;
}

export interface BrowserRuntimeSnapshot {
  flow: ReturnType<GameFlowController["getState"]>;
  hud: HudProjection | null;
  scene: PresentationalScene | null;
  audioFrame: AudioFrame | null;
  assetManifest: AssetManifest;
  assetLoad: ReplacementAssetLoadState;
  simulationFrame: number | null;
  sceneCounts: BrowserRuntimeSceneCounts;
  recentEventTypes: RuntimeEvent["type"][];
  lastFlowTransitionReason: ReturnType<GameFlowController["getState"]>["lastTransitionReason"];
}

export interface BrowserRuntimeOptions {
  sceneAdapterFactory?: () => SceneAdapter | Promise<SceneAdapter>;
  audioPlaybackFactory?: () => AudioPlaybackAdapter;
  assetManifest?: AssetManifest;
  assetPackStore?: ReplacementAssetStore;
  onSnapshot?: (snapshot: BrowserRuntimeSnapshot) => void;
  onAttachPhase?: (phase: BrowserRuntimeAttachPhase) => void;
}

export type BrowserRuntimeAttachPhase =
  | "idle"
  | "loading-scene-adapter"
  | "scene-adapter-created"
  | "attaching-scene-adapter"
  | "scene-adapter-attached";

async function createDefaultSceneAdapter(
  assetManifest: AssetManifest,
  assetPackStore: ReplacementAssetStore
): Promise<SceneAdapter> {
  return new Canvas2DSceneAdapter(assetManifest, assetPackStore);
}

export class BrowserRuntime {
  private readonly flowController = new GameFlowController();

  private readonly inputMapper = createDefaultInputMapper();

  private readonly renderer = new Renderer();

  private readonly audioDirector = new AudioDirector();

  private readonly assetManifest: AssetManifest;

  private readonly assetPackStore: ReplacementAssetStore;

  private readonly audioPlayback: AudioPlaybackAdapter;

  private readonly onSnapshot?: (snapshot: BrowserRuntimeSnapshot) => void;

  private readonly onAttachPhase?: (phase: BrowserRuntimeAttachPhase) => void;

  private readonly sceneAdapterFactory: () => SceneAdapter | Promise<SceneAdapter>;

  private clock = new GameClock();

  private pressedKeys = new Set<string>();

  private sceneAdapter: SceneAdapter | null = null;

  private simulation: Simulation | null = null;

  private latestHud: HudProjection | null = null;

  private latestScene: PresentationalScene | null = null;

  private latestAudioFrame: AudioFrame | null = null;

  private latestSimulationFrame: number | null = null;

  private latestRecentEventTypes: RuntimeEvent["type"][] = [];

  private animationFrameId: number | null = null;

  private lastAnimationTimestamp: number | null = null;

  private overlayAccumulatorMs = 0;

  private gameplayLaunchToken = 0;

  constructor(options: BrowserRuntimeOptions = {}) {
    this.assetManifest = options.assetManifest ?? createAssetManifest();
    this.assetPackStore =
      options.assetPackStore ?? new DefaultReplacementAssetStore(this.assetManifest);
    this.audioPlayback =
      options.audioPlaybackFactory?.() ??
      new WebAudioPlaybackAdapter(this.assetManifest, this.assetPackStore);
    this.sceneAdapterFactory =
      options.sceneAdapterFactory ??
      (() => createDefaultSceneAdapter(this.assetManifest, this.assetPackStore));
    this.onSnapshot = options.onSnapshot;
    this.onAttachPhase = options.onAttachPhase;
  }

  async attach(host: HTMLElement): Promise<void> {
    this.onAttachPhase?.("loading-scene-adapter");
    const sceneAdapter = await this.sceneAdapterFactory();
    this.onAttachPhase?.("scene-adapter-created");
    this.onAttachPhase?.("attaching-scene-adapter");
    await sceneAdapter.attach(host);
    this.onAttachPhase?.("scene-adapter-attached");
    this.sceneAdapter = sceneAdapter;
    this.resizeViewport(host.clientWidth, host.clientHeight);
    this.emitSnapshot();
  }

  getSnapshot(): BrowserRuntimeSnapshot {
    const flow = this.flowController.getState();
    return {
      flow,
      hud: this.latestHud,
      scene: this.latestScene,
      audioFrame: this.latestAudioFrame,
      assetManifest: this.assetManifest,
      assetLoad: this.assetPackStore.getLoadState(),
      simulationFrame: this.latestSimulationFrame,
      sceneCounts: this.getSceneCounts(),
      recentEventTypes: [...this.latestRecentEventTypes],
      lastFlowTransitionReason: flow.lastTransitionReason
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

  async startGameplay(): Promise<void> {
    const gameplayLaunchToken = ++this.gameplayLaunchToken;
    const stageId = this.flowController.getSessionConfig().stageId;
    this.simulation = null;
    this.latestHud = null;
    this.latestScene = null;
    this.latestAudioFrame = {
      bgmCue: null,
      sfxCues: []
    };
    this.latestSimulationFrame = null;
    this.latestRecentEventTypes = [];
    this.audioPlayback.sync(this.latestAudioFrame);
    this.flowController.beginAssetLoading(stageId);
    this.emitSnapshot();

    const loadResult = await this.assetPackStore.ensureStageBundle(stageId);
    if (gameplayLaunchToken !== this.gameplayLaunchToken) {
      return;
    }

    if (!loadResult.ok) {
      this.flowController.failAssetLoading();
      this.emitSnapshot();
      return;
    }

    this.flowController.completeAssetLoading(stageId);
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

      const hitStageBoundary = state.recentEvents.some(
        (event) => event.type === "stage-cleared" || event.type === "ending-started"
      );
      if (
        this.flowController.getState().screen !== initialSimulationScreen ||
        hitStageBoundary
      ) {
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
    this.gameplayLaunchToken += 1;
    this.simulation = null;
    this.latestHud = null;
    this.latestScene = null;
    this.latestAudioFrame = {
      bgmCue: null,
      sfxCues: []
    };
    this.latestSimulationFrame = null;
    this.latestRecentEventTypes = [];
    this.audioPlayback.sync(this.latestAudioFrame);
    this.clock = new GameClock();
    this.overlayAccumulatorMs = 0;
    this.clearPressedKeys();
    this.assetPackStore.reset();
    this.flowController.returnToTitle();
    this.emitSnapshot();
  }

  destroy(): void {
    this.stopAnimationLoop();
    this.audioPlayback.destroy();
    this.sceneAdapter?.destroy();
    this.sceneAdapter = null;
  }

  resizeViewport(width: number, height: number): void {
    this.sceneAdapter?.resize(width, height);
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
    const enteringEnding = state.recentEvents.some(
      (event) => event.type === "ending-started"
    );

    this.latestSimulationFrame = state.frame;
    this.latestRecentEventTypes = state.recentEvents.map((event) => event.type);
    this.flowController.consumeSimulation(state);

    if (!enteringEnding || !this.latestScene || !this.latestHud || !this.latestAudioFrame) {
      this.latestScene = this.renderer.sync(state);
      this.sceneAdapter?.sync(this.latestScene);
      this.latestAudioFrame = this.audioDirector.sync(state);
      this.audioPlayback.sync(this.latestAudioFrame);
      this.latestHud = projectHud(state);
    }

    this.emitSnapshot();
  }

  private emitSnapshot(): void {
    this.onSnapshot?.(this.getSnapshot());
  }

  private clearPressedKeys(): void {
    this.pressedKeys.clear();
  }

  private getSceneCounts(): BrowserRuntimeSceneCounts {
    return {
      players: this.latestScene?.players.length ?? 0,
      enemies: this.latestScene?.enemies.length ?? 0,
      playerBullets: this.latestScene?.playerBullets.length ?? 0,
      enemyBullets: this.latestScene?.enemyBullets.length ?? 0,
      pickups: this.latestScene?.pickups.length ?? 0,
      effects: this.latestScene?.effects.length ?? 0
    };
  }
}
