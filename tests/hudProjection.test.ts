import { describe, expect, it } from "vitest";
import { projectHud } from "../src/app/hudProjection";
import type { SimulationState } from "../src/game/core/types";

function createSimulationState(): SimulationState {
  return {
    frame: 321,
    session: {
      mode: "co-op",
      cabinetProfile: "hard",
      stageId: "stage-4",
      loopIndex: 1
    },
    cabinetRules: {
      profile: "hard",
      startingLives: 2,
      startingBombs: 2,
      extendThresholds: [150000, 500000],
      continueEnabled: true,
      continueCountdownFrames: 600,
      enemyHealthMultiplier: 1.2,
      bossHealthMultiplier: 1.35,
      scrollSpeedMultiplier: 1.1
    },
    flow: "continue",
    players: [
      {
        id: "player1",
        position: { x: 160, y: 508 },
        hitRadius: 6,
        moveSpeed: 5,
        focusMultiplier: 0.5,
        lives: 2,
        bombs: 1,
        invulnerableFrames: 0,
        score: 245000,
        extendsAwarded: 1,
        medalTier: 3,
        mainWeapon: { type: "laser", level: 3 },
        subWeapon: { type: "homing", level: 2 },
        joined: true,
        lifeState: "alive",
        continueFramesRemaining: null,
        active: true,
        animation: "idle"
      },
      {
        id: "player2",
        position: { x: 224, y: 512 },
        hitRadius: 6,
        moveSpeed: 5,
        focusMultiplier: 0.5,
        lives: 0,
        bombs: 0,
        invulnerableFrames: 0,
        score: 98000,
        extendsAwarded: 0,
        medalTier: 1,
        mainWeapon: { type: "vulcan", level: 1 },
        subWeapon: null,
        joined: true,
        lifeState: "continue-pending",
        continueFramesRemaining: 119,
        active: false,
        animation: "idle"
      }
    ],
    enemies: [],
    bullets: [],
    pickups: [],
    effects: [],
    boss: {
      bossId: "thunder-fortress",
      active: true,
      defeated: false,
      currentPhaseId: "core-storm",
      patternId: "spiral-crossfire",
      position: { x: 192, y: 140 },
      health: 450,
      maxHealth: 900,
      enteredAtFrame: 300,
      phaseEnteredAtFrame: 320,
      parts: []
    },
    stage: {
      stageId: "stage-4",
      scrollY: 4800,
      waveCursor: 12,
      checkpointCursor: 2,
      armedCheckpointId: "stage-4-platform",
      activeBossId: "thunder-fortress",
      activeBossPhaseId: "core-storm",
      bossEncounterStarted: true,
      triggeredHiddenIds: ["stage-4-ring-route"],
      defeatedEnemyIds: [],
      defeatedEnemyRecords: [],
      pendingSpawns: [],
      completed: false
    },
    recentEvents: []
  };
}

describe("HUD projection", () => {
  it("HUD-001 projects per-player stock and weapon state from simulation", () => {
    const hud = projectHud(createSimulationState());

    expect(hud.stageLabel).toBe("Stage 4");
    expect(hud.loopLabel).toBe("Loop 2");
    expect(hud.players).toHaveLength(2);
    expect(hud.players[0]).toMatchObject({
      id: "player1",
      score: 245000,
      lives: 2,
      bombs: 1,
      mainWeaponLabel: "Laser Lv3",
      subWeaponLabel: "Homing Lv2",
      lifeState: "alive"
    });
  });

  it("HUD-001 exposes boss health and continue countdowns for the DOM overlay", () => {
    const hud = projectHud(createSimulationState());

    expect(hud.boss).toMatchObject({
      id: "thunder-fortress",
      phaseLabel: "core-storm"
    });
    expect(hud.boss?.healthRatio).toBeCloseTo(0.5);
    expect(hud.players[1].continueSecondsRemaining).toBe(2);
    expect(hud.players[1].lifeState).toBe("continue-pending");
  });
});
