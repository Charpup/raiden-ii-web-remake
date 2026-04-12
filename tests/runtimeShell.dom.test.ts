// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRaidenApp } from "../src/app/createRaidenApp";
import type { HudProjection } from "../src/app/hudProjection";
import type {
  AudioFrame,
  PresentationalScene,
  RuntimeEvent,
  SimulationState
} from "../src/game/core/types";

class FakeSceneAdapter {
  public attached = false;

  public syncedScenes: PresentationalScene[] = [];

  async attach(_host?: HTMLElement): Promise<void> {
    this.attached = true;
  }

  sync(scene: PresentationalScene): void {
    this.syncedScenes.push(scene);
  }

  resize(): void {}

  destroy(): void {
    this.attached = false;
  }
}

class FakeAudioPlaybackAdapter {
  public unlocked = false;

  public syncedFrames: AudioFrame[] = [];

  unlock(): void {
    this.unlocked = true;
  }

  sync(frame: AudioFrame): void {
    this.syncedFrames.push(frame);
  }

  setSuspended(): void {}

  destroy(): void {}
}

type FakeAssetLoadState = {
  state: "idle" | "loading" | "ready" | "error";
  stageId: string | null;
  missingCount: number;
  missingAssets: Array<{ kind: "texture" | "audio"; id: string; path: string }>;
  loadedTextureIds: string[];
  loadedAudioCueIds: string[];
};

class FakeAssetPackStore {
  private readonly mode: "success" | "error";

  private readonly missingAssets: Array<{ kind: "texture" | "audio"; id: string; path: string }>;

  private loadState: FakeAssetLoadState = {
    state: "idle",
    stageId: null,
    missingCount: 0,
    missingAssets: [],
    loadedTextureIds: [],
    loadedAudioCueIds: []
  };

  constructor(
    mode: "success" | "error" = "success",
    missingAssets: Array<{ kind: "texture" | "audio"; id: string; path: string }> = [
      {
        kind: "texture",
        id: "shared.player-ship",
        path: "assets/replacement/gameplay/player-ship.png"
      }
    ]
  ) {
    this.mode = mode;
    this.missingAssets = missingAssets;
  }

  async ensureStageBundle(stageId: string): Promise<{ ok: boolean; missingAssets: FakeAssetLoadState["missingAssets"] }> {
    this.loadState = {
      state: "loading",
      stageId,
      missingCount: 0,
      missingAssets: [],
      loadedTextureIds: [],
      loadedAudioCueIds: []
    };

    await Promise.resolve();

    if (this.mode === "error") {
      this.loadState = {
        state: "error",
        stageId,
        missingCount: this.missingAssets.length,
        missingAssets: this.missingAssets,
        loadedTextureIds: [],
        loadedAudioCueIds: []
      };
      return { ok: false, missingAssets: this.missingAssets };
    }

    this.loadState = {
      state: "ready",
      stageId,
      missingCount: 0,
      missingAssets: [],
      loadedTextureIds: [],
      loadedAudioCueIds: []
    };
    return { ok: true, missingAssets: [] };
  }

  getImage(): HTMLImageElement | null {
    return null;
  }

  getAudioBuffer(): AudioBuffer | null {
    return null;
  }

  getMissingAssets(): FakeAssetLoadState["missingAssets"] {
    return this.loadState.missingAssets;
  }

  getLoadState(): FakeAssetLoadState {
    return this.loadState;
  }

  reset(): void {
    this.loadState = {
      state: "idle",
      stageId: null,
      missingCount: 0,
      missingAssets: [],
      loadedTextureIds: [],
      loadedAudioCueIds: []
    };
  }
}

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function activePilotKeysForFrame(frame: number): Set<string> {
  const horizontalSway = Math.sin(frame / 40);
  const keys = new Set<string>(["KeyZ"]);

  if (horizontalSway < -0.35) {
    keys.add("ArrowLeft");
  } else if (horizontalSway > 0.35) {
    keys.add("ArrowRight");
  }

  if (frame % 12 < 4) {
    keys.add("ArrowUp");
  }

  return keys;
}

function syncHeldKeys(heldKeys: Set<string>, nextKeys: Set<string>): void {
  for (const key of [...heldKeys]) {
    if (nextKeys.has(key)) {
      continue;
    }

    window.dispatchEvent(new KeyboardEvent("keyup", { code: key }));
    heldKeys.delete(key);
  }

  for (const key of nextKeys) {
    if (heldKeys.has(key)) {
      continue;
    }

    window.dispatchEvent(new KeyboardEvent("keydown", { code: key }));
    heldKeys.add(key);
  }
}

function createSimulationState(
  overrides: Partial<SimulationState> = {},
  recentEvents: RuntimeEvent[] = []
): SimulationState {
  return {
    frame: 120,
    session: {
      mode: "single",
      cabinetProfile: "easy",
      stageId: "stage-1",
      loopIndex: 0
    },
    cabinetRules: {
      profile: "easy",
      startingLives: 3,
      startingBombs: 3,
      extendThresholds: [100000, 400000],
      continueEnabled: true,
      continueCountdownFrames: 600,
      enemyHealthMultiplier: 1,
      bossHealthMultiplier: 1,
      scrollSpeedMultiplier: 1
    },
    flow: "playing",
    players: [
      {
        id: "player1",
        position: { x: 192, y: 520 },
        hitRadius: 6,
        moveSpeed: 5,
        focusMultiplier: 0.5,
        lives: 3,
        bombs: 2,
        invulnerableFrames: 0,
        score: 125000,
        extendsAwarded: 1,
        medalTier: 2,
        mainWeapon: { type: "laser", level: 2 },
        subWeapon: { type: "homing", level: 1 },
        joined: true,
        lifeState: "alive",
        continueFramesRemaining: null,
        active: true,
        animation: "idle"
      }
    ],
    enemies: [],
    bullets: [],
    pickups: [],
    effects: [],
    boss: null,
    stage: {
      stageId: "stage-1",
      scrollY: 1200,
      waveCursor: 4,
      checkpointCursor: 1,
      armedCheckpointId: "stage-1-mid",
      activeBossId: null,
      activeBossPhaseId: null,
      bossEncounterStarted: false,
      triggeredHiddenIds: [],
      defeatedEnemyIds: [],
      defeatedEnemyRecords: [],
      pendingSpawns: [],
      completed: false
    },
    recentEvents,
    ...overrides
  };
}

function createHudProjection(stageId: string): HudProjection {
  return {
    stageId,
    stageLabel: `Stage ${stageId.split("-")[1]}`,
    loopIndex: 0,
    loopLabel: "Loop 1",
    cabinetProfile: "easy",
    flow: "playing",
    players: [
      {
        id: "player1",
        joined: true,
        score: 125000,
        scoreLabel: "125000",
        lives: 3,
        bombs: 2,
        mainWeaponLabel: "Laser Lv2",
        subWeaponLabel: "Homing Lv1",
        lifeState: "alive",
        continueSecondsRemaining: null
      }
    ],
    boss: {
      id: `${stageId}-boss`,
      phaseLabel: "opening",
      healthRatio: 0.5,
      healthLabel: "400 / 800"
    }
  };
}

function createScene(stageId: string): PresentationalScene {
  return {
    frame: 120,
    stageId,
    scrollY: 1200,
    backgroundLayers: [
      {
        id: `${stageId}-bg`,
        spriteId: stageId === "stage-1" ? "stage-1.backdrop-sky" : `${stageId}.backdrop`,
        offsetY: -120,
        parallax: 1
      }
    ],
    players: [
      {
        id: "player1",
        x: 160,
        y: 472,
        animation: "idle",
        spriteId: "shared.player-ship"
      }
    ],
    enemies: [],
    playerBullets: [],
    enemyBullets: [],
    pickups: [],
    effects: [],
    boss: {
      id: `${stageId}-boss`,
      x: 160,
      y: 84,
      animation: "idle",
      spriteId: "shared.boss-shell"
    },
    bossParts: []
  };
}

describe("Browser shell DOM runtime", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    vi.restoreAllMocks();
  });

  it("RNT-001 mounts gameplay, HUD, and overlay containers", async () => {
    const root = document.querySelector<HTMLDivElement>("#app");
    if (!root) {
      throw new Error("Missing app root");
    }

    const app = await createRaidenApp(root, {
      sceneAdapterFactory: async () => new FakeSceneAdapter(),
      audioPlaybackFactory: () => new FakeAudioPlaybackAdapter(),
      assetPackStore: new FakeAssetPackStore()
    });

    expect(root.querySelector("[data-role='gameplay-viewport']")).not.toBeNull();
    expect(root.querySelector("[data-role='hud-layer']")).not.toBeNull();
    expect(root.querySelector("[data-role='overlay-layer']")).not.toBeNull();

    app.destroy();
  });

  it("RNT-001 advances clock, simulation, renderer, and audio after entering gameplay", async () => {
    const root = document.querySelector<HTMLDivElement>("#app");
    if (!root) {
      throw new Error("Missing app root");
    }

    const fakeScene = new FakeSceneAdapter();
    const fakeAudio = new FakeAudioPlaybackAdapter();
    const app = await createRaidenApp(root, {
      sceneAdapterFactory: async () => fakeScene,
      audioPlaybackFactory: () => fakeAudio,
      assetPackStore: new FakeAssetPackStore()
    });

    root.dispatchEvent(new Event("pointerdown", { bubbles: true }));

    (root.querySelector("[data-action='start']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='mode-co-op']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='cabinet-hard']") as HTMLButtonElement).click();
    expect(root.getAttribute("data-flow")).toBe("asset-loading");

    await flushAsyncWork();

    expect(root.getAttribute("data-flow")).toBe("gameplay");

    app.runtime.tickHostDelta(50);

    expect(fakeScene.attached).toBe(true);
    expect(fakeScene.syncedScenes.length).toBeGreaterThan(0);
    expect(fakeAudio.unlocked).toBe(true);
    expect(fakeAudio.syncedFrames.length).toBeGreaterThan(0);
    expect(root.querySelector("[data-role='hud-stage-label']")?.textContent).toContain("Stage");

    app.destroy();
  });

  it("RNT-201 enters asset-loading before starting gameplay and reports ready asset-load state when the Stage 1 pack is available", async () => {
    const root = document.querySelector<HTMLDivElement>("#app");
    if (!root) {
      throw new Error("Missing app root");
    }

    const app = await createRaidenApp(root, {
      sceneAdapterFactory: async () => new FakeSceneAdapter(),
      audioPlaybackFactory: () => new FakeAudioPlaybackAdapter(),
      assetPackStore: new FakeAssetPackStore("success")
    });

    (root.querySelector("[data-action='start']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='mode-single']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='cabinet-easy']") as HTMLButtonElement).click();

    expect(root.getAttribute("data-flow")).toBe("asset-loading");
    expect(app.runtime.getSnapshot().assetLoad.state).toBe("loading");

    await flushAsyncWork();

    expect(root.getAttribute("data-flow")).toBe("gameplay");
    expect(app.runtime.getSnapshot().assetLoad.state).toBe("ready");
    expect(app.runtime.getSnapshot().assetLoad.stageId).toBe("stage-1");

    app.destroy();
  });

  it("RNT-202 shows asset-error with missing items and never enters gameplay when the Stage 1 pack is incomplete", async () => {
    const root = document.querySelector<HTMLDivElement>("#app");
    if (!root) {
      throw new Error("Missing app root");
    }

    const missingAssets = [
      {
        kind: "texture" as const,
        id: "shared.player-ship",
        path: "assets/replacement/gameplay/player-ship.png"
      },
      {
        kind: "audio" as const,
        id: "bgm-stage-1",
        path: "assets/replacement/audio/bgm-stage-1.ogg"
      }
    ];

    const app = await createRaidenApp(root, {
      sceneAdapterFactory: async () => new FakeSceneAdapter(),
      audioPlaybackFactory: () => new FakeAudioPlaybackAdapter(),
      assetPackStore: new FakeAssetPackStore("error", missingAssets)
    });

    (root.querySelector("[data-action='start']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='mode-single']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='cabinet-easy']") as HTMLButtonElement).click();

    expect(root.getAttribute("data-flow")).toBe("asset-loading");

    await flushAsyncWork();

    const snapshot = app.runtime.getSnapshot();
    expect(root.getAttribute("data-flow")).toBe("asset-error");
    expect(snapshot.flow.screen).toBe("asset-error");
    expect(snapshot.assetLoad.state).toBe("error");
    expect(snapshot.assetLoad.missingAssets).toEqual(missingAssets);
    expect(snapshot.scene).toBeNull();
    expect(root.textContent).toContain("shared.player-ship");
    expect(root.textContent).toContain("bgm-stage-1");

    (root.querySelector("[data-action='return-title']") as HTMLButtonElement).click();
    expect(root.getAttribute("data-flow")).toBe("title");

    app.destroy();
  });

  it("RNT-001 clears audio and HUD state when returning to title", async () => {
    const root = document.querySelector<HTMLDivElement>("#app");
    if (!root) {
      throw new Error("Missing app root");
    }

    const fakeScene = new FakeSceneAdapter();
    const fakeAudio = new FakeAudioPlaybackAdapter();
    const app = await createRaidenApp(root, {
      sceneAdapterFactory: async () => fakeScene,
      audioPlaybackFactory: () => fakeAudio,
      assetPackStore: new FakeAssetPackStore()
    });

    root.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    (root.querySelector("[data-action='start']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='mode-co-op']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='cabinet-hard']") as HTMLButtonElement).click();
    await flushAsyncWork();
    app.runtime.tickHostDelta(50);

    expect(root.querySelector("[data-role='player2-stock']")?.textContent).toContain("Lives");

    app.runtime.returnToTitle();

    expect(root.getAttribute("data-flow")).toBe("title");
    expect(root.querySelector("[data-role='hud-stage-label']")?.textContent).toBe("Stage 1");
    expect(root.querySelector("[data-role='hud-boss-caption']")?.textContent).toBe("No active boss");
    expect(root.querySelector("[data-role='player1-stock']")?.textContent).toBe("Lives 0 · Bombs 0");
    expect(root.querySelector("[data-role='player2-weapons']")?.textContent).toBe("Awaiting join");
    expect(fakeAudio.syncedFrames.at(-1)).toEqual({
      bgmCue: null,
      sfxCues: []
    });

    app.destroy();
  });

  it("RNT-001 clears latched gameplay input across hide, title return, and new session start", async () => {
    const root = document.querySelector<HTMLDivElement>("#app");
    if (!root) {
      throw new Error("Missing app root");
    }

    const fakeScene = new FakeSceneAdapter();
    const app = await createRaidenApp(root, {
      sceneAdapterFactory: async () => fakeScene,
      audioPlaybackFactory: () => new FakeAudioPlaybackAdapter(),
      assetPackStore: new FakeAssetPackStore()
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight" }));
    app.runtime.setVisibilityHidden(true);
    app.runtime.returnToTitle();

    (root.querySelector("[data-action='start']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='mode-single']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='cabinet-easy']") as HTMLButtonElement).click();
    await flushAsyncWork();

    const startScene = fakeScene.syncedScenes.at(-1);
    const startX = startScene?.players[0]?.x;

    app.runtime.tickHostDelta(50);

    const latestScene = fakeScene.syncedScenes.at(-1);
    expect(latestScene?.players[0]?.x).toBe(startX);

    app.destroy();
  });

  it("RNT-001 stops fixed-step simulation once gameplay transitions into an overlay mid-tick", async () => {
    const root = document.querySelector<HTMLDivElement>("#app");
    if (!root) {
      throw new Error("Missing app root");
    }

    const app = await createRaidenApp(root, {
      sceneAdapterFactory: async () => new FakeSceneAdapter(),
      audioPlaybackFactory: () => new FakeAudioPlaybackAdapter(),
      assetPackStore: new FakeAssetPackStore()
    });

    root.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    (root.querySelector("[data-action='start']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='mode-single']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='cabinet-easy']") as HTMLButtonElement).click();
    await flushAsyncWork();

    const runtimeInternals = app.runtime as unknown as {
      clock: { tick(deltaMs: number): { steps: number[] } };
      simulation: { step(): SimulationState };
    };

    let stepCalls = 0;
    runtimeInternals.clock = {
      tick(): { steps: number[] } {
        return { steps: [1, 2, 3] };
      }
    };
    runtimeInternals.simulation = {
      step(): SimulationState {
        stepCalls += 1;
        return createSimulationState(
          {},
          stepCalls === 1
            ? [
                {
                  type: "ending-started",
                  stageId: "stage-8",
                  nextStageId: "stage-1",
                  loopIndex: 1,
                  atFrame: 3600
                },
                {
                  type: "loop-advanced",
                  loopIndex: 1,
                  atFrame: 3600
                }
              ]
            : []
        );
      }
    };

    app.runtime.tickHostDelta(50);

    expect(stepCalls).toBe(1);
    expect(root.getAttribute("data-flow")).toBe("ending");

    app.destroy();
  });

  it("RNT-001 keeps the cleared-stage HUD and scene visible during the ending overlay", async () => {
    const root = document.querySelector<HTMLDivElement>("#app");
    if (!root) {
      throw new Error("Missing app root");
    }

    const app = await createRaidenApp(root, {
      sceneAdapterFactory: async () => new FakeSceneAdapter(),
      audioPlaybackFactory: () => new FakeAudioPlaybackAdapter(),
      assetPackStore: new FakeAssetPackStore()
    });

    root.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    (root.querySelector("[data-action='start']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='mode-single']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='cabinet-easy']") as HTMLButtonElement).click();
    await flushAsyncWork();

    const runtimeInternals = app.runtime as unknown as {
      clock: { tick(deltaMs: number): { steps: number[] } };
      simulation: { step(): SimulationState };
      latestHud: HudProjection | null;
      latestScene: PresentationalScene | null;
      latestAudioFrame: AudioFrame | null;
    };

    runtimeInternals.latestHud = createHudProjection("stage-8");
    runtimeInternals.latestScene = createScene("stage-8");
    runtimeInternals.latestAudioFrame = {
      bgmCue: "bgm-stage-8",
      sfxCues: []
    };
    runtimeInternals.clock = {
      tick(): { steps: number[] } {
        return { steps: [1, 2] };
      }
    };
    runtimeInternals.simulation = {
      step(): SimulationState {
        return createSimulationState(
          {
            session: {
              mode: "single",
              cabinetProfile: "easy",
              stageId: "stage-1",
              loopIndex: 1
            },
            stage: {
              ...createSimulationState().stage,
              stageId: "stage-1"
            }
          },
          [
            {
              type: "stage-cleared",
              stageId: "stage-8",
              atFrame: 3600
            },
            {
              type: "loop-advanced",
              loopIndex: 1,
              atFrame: 3600
            },
            {
              type: "ending-started",
              stageId: "stage-8",
              nextStageId: "stage-1",
              loopIndex: 1,
              atFrame: 3600
            }
          ]
        );
      }
    };

    app.runtime.tickHostDelta(50);

    expect(root.getAttribute("data-flow")).toBe("ending");
    expect(root.querySelector("[data-role='hud-stage-label']")?.textContent).toBe("Stage 8");
    expect(app.runtime.getSnapshot().hud?.stageId).toBe("stage-8");
    expect(app.runtime.getSnapshot().scene?.stageId).toBe("stage-8");
    expect(app.runtime.getSnapshot().audioFrame?.bgmCue).toBe("bgm-stage-8");

    app.destroy();
  });

  it("RNT-001 stops fixed-step simulation at a non-final stage boundary before advancing extra frames into the next stage", async () => {
    const root = document.querySelector<HTMLDivElement>("#app");
    if (!root) {
      throw new Error("Missing app root");
    }

    const app = await createRaidenApp(root, {
      sceneAdapterFactory: async () => new FakeSceneAdapter(),
      audioPlaybackFactory: () => new FakeAudioPlaybackAdapter(),
      assetPackStore: new FakeAssetPackStore()
    });

    root.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    (root.querySelector("[data-action='start']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='mode-single']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='cabinet-easy']") as HTMLButtonElement).click();
    await flushAsyncWork();

    const runtimeInternals = app.runtime as unknown as {
      clock: { tick(deltaMs: number): { steps: number[] } };
      simulation: { step(): SimulationState };
    };

    let stepCalls = 0;
    runtimeInternals.clock = {
      tick(): { steps: number[] } {
        return { steps: [1, 2, 3] };
      }
    };
    runtimeInternals.simulation = {
      step(): SimulationState {
        stepCalls += 1;
        return createSimulationState(
          {
            session: {
              mode: "single",
              cabinetProfile: "easy",
              stageId: "stage-2",
              loopIndex: 0
            },
            stage: {
              ...createSimulationState().stage,
              stageId: "stage-2"
            }
          },
          stepCalls === 1
            ? [
                {
                  type: "stage-cleared",
                  stageId: "stage-1",
                  atFrame: 2400
                }
              ]
            : []
        );
      }
    };

    app.runtime.tickHostDelta(50);

    expect(stepCalls).toBe(1);
    expect(root.getAttribute("data-flow")).toBe("gameplay");
    expect(app.runtime.getSnapshot().hud?.stageId).toBe("stage-2");

    app.destroy();
  });

  it("RNT-101 keeps the browser shell in live gameplay through an opening Stage 1 combat window", async () => {
    const root = document.querySelector<HTMLDivElement>("#app");
    if (!root) {
      throw new Error("Missing app root");
    }

    const fakeScene = new FakeSceneAdapter();
    const app = await createRaidenApp(root, {
      sceneAdapterFactory: async () => fakeScene,
      audioPlaybackFactory: () => new FakeAudioPlaybackAdapter(),
      assetPackStore: new FakeAssetPackStore()
    });

    const heldKeys = new Set<string>();
    root.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    (root.querySelector("[data-action='start']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='mode-single']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='cabinet-easy']") as HTMLButtonElement).click();
    await flushAsyncWork();

    for (let frame = 0; frame < 1800; frame += 1) {
      syncHeldKeys(heldKeys, activePilotKeysForFrame(frame));
      app.runtime.tickHostDelta(1000 / 60);
      if (root.getAttribute("data-flow") !== "gameplay") {
        break;
      }
    }

    syncHeldKeys(heldKeys, new Set<string>());

    const snapshot = app.runtime.getSnapshot();
    const tailScenes = fakeScene.syncedScenes.slice(-180);

    expect(root.getAttribute("data-flow")).toBe("gameplay");
    expect(snapshot.flow.screen).toBe("gameplay");
    expect(fakeScene.syncedScenes.some((scene) => scene.players.length > 0)).toBe(true);
    expect(fakeScene.syncedScenes.some((scene) => scene.enemies.length > 0)).toBe(true);
    expect(fakeScene.syncedScenes.some((scene) => scene.enemyBullets.length > 0)).toBe(true);
    expect(fakeScene.syncedScenes.some((scene) => scene.effects.length > 0)).toBe(true);
    expect(tailScenes.length).toBeGreaterThan(0);
    expect(
      tailScenes.some(
        (scene) =>
          scene.players.length > 0 &&
          (scene.enemies.length > 0 || scene.enemyBullets.length > 0 || scene.effects.length > 0)
      )
    ).toBe(true);

    app.destroy();
  });

  it("RNT-101 exposes preview debug snapshot data for production signoff", async () => {
    const root = document.querySelector<HTMLDivElement>("#app");
    if (!root) {
      throw new Error("Missing app root");
    }

    const fakeScene = new FakeSceneAdapter();
    const app = await createRaidenApp(root, {
      sceneAdapterFactory: async () => fakeScene,
      audioPlaybackFactory: () => new FakeAudioPlaybackAdapter(),
      assetPackStore: new FakeAssetPackStore()
    });

    root.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    (root.querySelector("[data-action='start']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='mode-single']") as HTMLButtonElement).click();
    (root.querySelector("[data-action='cabinet-easy']") as HTMLButtonElement).click();
    await flushAsyncWork();

    for (let frame = 0; frame < 240; frame += 1) {
      syncHeldKeys(new Set<string>(), new Set<string>());
      app.runtime.tickHostDelta(1000 / 60);
    }

    const snapshot = app.runtime.getSnapshot();

    expect(snapshot.flow.screen).toBe("gameplay");
    expect(snapshot.simulationFrame).not.toBeNull();
    expect(snapshot.sceneCounts.players).toBeGreaterThan(0);
    expect(snapshot.lastFlowTransitionReason).toBe("gameplay-started");
    expect(Array.isArray(snapshot.recentEventTypes)).toBe(true);

    app.destroy();
  });
});
