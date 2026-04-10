import { describe, expect, it } from "vitest";
import { GameFlowController } from "../src/app/GameFlowController";
import type { RuntimeEvent, SimulationState } from "../src/game/core/types";
import { consumeOverlayFrames } from "../src/app/runtime/GameFlowState";

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

describe("Browser shell flow controller", () => {
  it("UIF-001 advances from title through mode-select, cabinet-select, and asset-loading into gameplay", () => {
    const controller = new GameFlowController();

    expect(controller.getState().screen).toBe("title");

    controller.beginModeSelect();
    expect(controller.getState().screen).toBe("mode-select");

    controller.selectMode("co-op");
    expect(controller.getState().screen).toBe("cabinet-select");

    controller.selectCabinetProfile("hard");
    controller.beginAssetLoading();
    expect(controller.getState().screen).toBe("asset-loading");

    controller.completeAssetLoading();

    expect(controller.getState().screen).toBe("gameplay");
    expect(controller.getSessionConfig()).toMatchObject({
      mode: "co-op",
      cabinetProfile: "hard",
      stageId: "stage-1"
    });
  });

  it("UIF-001 maps simulation continue and session-game-over flow into browser shell overlays", () => {
    const controller = new GameFlowController();
    controller.beginModeSelect();
    controller.selectMode("single");
    controller.selectCabinetProfile("easy");
    controller.beginAssetLoading();
    controller.completeAssetLoading();

    controller.consumeSimulation(
      createSimulationState({
        flow: "continue",
        players: [
          {
            ...createSimulationState().players[0],
            lifeState: "continue-pending",
            continueFramesRemaining: 180,
            active: false
          }
        ]
      })
    );

    expect(controller.getState().screen).toBe("continue");

    controller.consumeSimulation(
      createSimulationState({
        flow: "session-game-over",
        players: [
          {
            ...createSimulationState().players[0],
            lifeState: "game-over",
            continueFramesRemaining: null,
            active: false
          }
        ]
      })
    );

    expect(controller.getState().screen).toBe("game-over");
  });

  it("UIF-001 keeps non-final stage clears in gameplay and only enters ending on explicit ending-started events", () => {
    const controller = new GameFlowController();
    controller.beginModeSelect();
    controller.selectMode("single");
    controller.selectCabinetProfile("hard");
    controller.beginAssetLoading();
    controller.completeAssetLoading();

    controller.consumeSimulation(
      createSimulationState(
        {
          session: {
            mode: "single",
            cabinetProfile: "hard",
            stageId: "stage-2",
            loopIndex: 0
          }
        },
        [
          {
            type: "stage-cleared",
            stageId: "stage-1",
            atFrame: 1800
          }
        ]
      )
    );

    expect(controller.getState().screen).toBe("gameplay");

    controller.consumeSimulation(
      createSimulationState(
        {
          session: {
            mode: "single",
            cabinetProfile: "hard",
            stageId: "stage-1",
            loopIndex: 1
          }
        },
        [
          {
            type: "ending-started",
            stageId: "stage-8",
            nextStageId: "stage-1",
            loopIndex: 2,
            atFrame: 2400
          },
          {
            type: "loop-advanced",
            loopIndex: 2,
            atFrame: 2400
          }
        ]
      )
    );

    expect(controller.getState().screen).toBe("ending");

    controller.advanceOverlayFrame(240);
    expect(controller.getState().screen).toBe("loop-transition");

    controller.advanceOverlayFrame(180);
    expect(controller.getState().screen).toBe("gameplay");
  });

  it("UIF-001 falls back to title when an ending overlay finishes without a queued loop transition", () => {
    const controller = new GameFlowController();
    controller.beginModeSelect();
    controller.selectMode("single");
    controller.selectCabinetProfile("easy");
    controller.beginAssetLoading();
    controller.completeAssetLoading();

    controller.consumeSimulation(
      createSimulationState(
        {
          session: {
            mode: "single",
            cabinetProfile: "easy",
            stageId: "stage-8",
            loopIndex: 0
          }
        },
        [
          {
            type: "ending-started",
            stageId: "stage-8",
            nextStageId: "stage-8",
            loopIndex: 0,
            atFrame: 3200
          }
        ]
      )
    );

    expect(controller.getState().screen).toBe("ending");

    controller.advanceOverlayFrame(240);
    expect(controller.getState().screen).toBe("title");
  });

  it("UIF-001 consumes overlay timing in fixed 60 Hz steps instead of rounding every host tick", () => {
    const firstTick = consumeOverlayFrames(0, 5);
    expect(firstTick.frames).toBe(0);

    const secondTick = consumeOverlayFrames(firstTick.remainderMs, 12);
    expect(secondTick.frames).toBe(1);
    expect(secondTick.remainderMs).toBeGreaterThan(0);
  });

  it("RNT-202 enters asset-error on preload failure and can recover back to title", () => {
    const controller = new GameFlowController();

    controller.beginModeSelect();
    controller.selectMode("single");
    controller.selectCabinetProfile("easy");
    controller.beginAssetLoading();
    controller.failAssetLoading();

    expect(controller.getState().screen).toBe("asset-error");
    expect(controller.getState().lastTransitionReason).toBe("asset-error");

    controller.returnToTitle();

    expect(controller.getState().screen).toBe("title");
  });
});
