import { describe, expect, it } from "vitest";

import { Simulation } from "../src/game/core/Simulation";
import type { SimulationState } from "../src/game/core/types";
import { getStageDefinition } from "../src/game/stage/stageCatalog";

function stepUntil(
  simulation: Simulation,
  predicate: (state: SimulationState) => boolean,
  maxFrames = 900
): SimulationState {
  let state = simulation.getState();

  while (!predicate(state) && state.frame < maxFrames) {
    state = simulation.step({ players: {} });
  }

  return state;
}

function clearToBoss(
  simulation: Simulation,
  options?: {
    maxFrames?: number;
    skipEnemyIds?: string[];
    skipEnemyPrefixes?: string[];
  }
): SimulationState {
  const maxFrames = options?.maxFrames ?? 1_000;
  const skipEnemyIds = options?.skipEnemyIds ?? [];
  const skipEnemyPrefixes = options?.skipEnemyPrefixes ?? [];
  let state = simulation.getState();

  while (!state.boss?.active && state.frame < maxFrames) {
    for (const enemy of state.enemies) {
      if (skipEnemyIds.includes(enemy.id)) {
        continue;
      }

      if (skipEnemyPrefixes.some((prefix) => enemy.id.startsWith(prefix))) {
        continue;
      }

      simulation.defeatEnemy(enemy.id);
    }

    state = simulation.step({ players: {} });
  }

  return state;
}

describe("Stages 5-8 content authoring", () => {
  it("AUTH-301 locks the Stage 5-8 macro beats and minimal new hidden-route metadata", () => {
    const stage5 = getStageDefinition("stage-5") as unknown as {
      waves: Array<{ id: string }>;
      hiddenTriggers: Array<{ id: string }>;
      boss: { phases: Array<{ id: string }> };
    };
    const stage6 = getStageDefinition("stage-6") as unknown as {
      waves: Array<{ id: string }>;
      redCrystalWave?: {
        enemies: Array<{
          id: string;
          stateTransitions?: Array<{ afterFrames: number; stateTag: string }>;
        }>;
      };
      hiddenTriggers: Array<{
        id: string;
        trigger: { type: string; enemyId?: string; stateTag?: string };
      }>;
      boss: { phases: Array<{ id: string }> };
    };
    const stage7 = getStageDefinition("stage-7") as unknown as {
      waves: Array<{ id: string }>;
      hiddenTriggers: Array<{
        id: string;
        trigger: { type: string };
        revealEnemies?: Array<{ id: string }>;
        expiresOnBossStart?: boolean;
      }>;
      boss: { phases: Array<{ id: string }> };
    };
    const stage8 = getStageDefinition("stage-8") as unknown as {
      waves: Array<{ id: string }>;
      hiddenTriggers: Array<{
        id: string;
        rewards?: Array<{ kind: string }>;
        expiresOnBossStart?: boolean;
      }>;
      boss: { phases: Array<{ id: string }> };
      loopAdvance?: { enabled: boolean; nextStageId: string };
    };

    expect(stage5.waves.map((wave) => wave.id)).toEqual([
      "stage-5-ground-base-advance",
      "stage-5-rail-tank-gauntlet",
      "stage-5-bomber-corridor",
      "stage-5-refinery-crossfire",
      "stage-5-late-armor-surge",
      "stage-5-pre-boss-cache"
    ]);
    expect(stage6.waves.map((wave) => wave.id)).toEqual([
      "stage-6-launch-scramble",
      "stage-6-crystal-corridor",
      "stage-6-asteroid-ambush",
      "stage-6-defense-array",
      "stage-6-red-crystal-escape",
      "stage-6-reactor-approach"
    ]);
    expect(stage7.waves.map((wave) => wave.id)).toEqual([
      "stage-7-battleship-deck",
      "stage-7-meteor-scramble",
      "stage-7-nuclear-rocket-battery",
      "stage-7-artillery-corridor",
      "stage-7-launch-apron"
    ]);
    expect(stage8.waves.map((wave) => wave.id)).toEqual([
      "stage-8-alien-surface",
      "stage-8-roaming-crystal-chase",
      "stage-8-facility-crossfire",
      "stage-8-pre-boss-miclus-line",
      "stage-8-mother-haven-approach"
    ]);

    expect(stage6.hiddenTriggers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "stage-6-hidden-red-crystal-extend",
          trigger: expect.objectContaining({
            type: "enemy-destroyed-in-state",
            enemyId: "stage-6-red-crystal",
            stateTag: "escape-window"
          })
        })
      ])
    );
    const stage6Definition = getStageDefinition("stage-6") as unknown as {
      waves: Array<{
        id: string;
        enemies: Array<{
          id: string;
          stateTransitions?: Array<{ afterFrames: number; stateTag: string }>;
        }>;
      }>;
    };
    expect(
      stage6Definition.waves
        .find((wave) => wave.id === "stage-6-red-crystal-escape")
        ?.enemies.find((enemy) => enemy.id === "stage-6-red-crystal")
    ).toEqual(
      expect.objectContaining({
        stateTransitions: [
          expect.objectContaining({
            afterFrames: 12,
            stateTag: "escape-window"
          })
        ]
      })
    );
    expect(stage7.hiddenTriggers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "stage-7-hidden-rocket-cache-reveal",
          trigger: expect.objectContaining({ type: "all-enemies-destroyed" }),
          revealEnemies: [expect.objectContaining({ id: "stage-7-fairy-beacon" })],
          expiresOnBossStart: true
        })
      ])
    );
    expect(stage8.hiddenTriggers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "stage-8-hidden-miclus-line",
          expiresOnBossStart: true,
          rewards: expect.arrayContaining([
            expect.objectContaining({ kind: "miclus" }),
            expect.objectContaining({ kind: "medal" })
          ])
        })
      ])
    );
    expect(stage8.loopAdvance).toEqual({
      enabled: true,
      nextStageId: "stage-1"
    });
    expect(stage5.boss.phases.map((phase) => phase.id)).toEqual([
      "stage-5-black-bird-opening",
      "stage-5-black-bird-blue-form",
      "stage-5-black-bird-red-form"
    ]);
    expect(stage8.boss.phases.map((phase) => phase.id)).toEqual([
      "stage-8-mother-haven-shell",
      "stage-8-mother-haven-siege",
      "stage-8-mother-haven-core"
    ]);
  });

  it("STG-301, CHK-301, and BOS-301 arm a late Stage 5 checkpoint and reach the Black Bird ladder", () => {
    const definition = getStageDefinition("stage-5");
    expect(definition.checkpoints.map((checkpoint) => checkpoint.id)).toEqual([
      "stage-5-checkpoint-refinery-exit"
    ]);

    const simulation = new Simulation({ stageId: "stage-5" });
    const checkpointState = stepUntil(
      simulation,
      (state) => state.stage.armedCheckpointId === "stage-5-checkpoint-refinery-exit",
      520
    );

    expect(checkpointState.stage.armedCheckpointId).toBe(
      "stage-5-checkpoint-refinery-exit"
    );

    let state = clearToBoss(simulation, { maxFrames: 1_080 });
    expect(state.boss?.bossId).toBe("stage-5-black-bird");
    expect(state.boss?.currentPhaseId).toBe("stage-5-black-bird-opening");

    simulation.applyBossDamage(280);
    state = simulation.step({ players: {} });
    expect(state.boss?.currentPhaseId).toBe("stage-5-black-bird-blue-form");

    simulation.applyBossDamage(260);
    state = simulation.step({ players: {} });
    expect(state.boss?.currentPhaseId).toBe("stage-5-black-bird-red-form");

    simulation.applyBossDamage(2_000);
    state = simulation.step({ players: {} });
    expect(state.stage.completed).toBe(true);
  });

  it("STG-302 and HID-301 only reward the Stage 6 extend after the red crystal reaches its authored escape state", () => {
    const earlyRoute = new Simulation({ stageId: "stage-6" });
    let earlyState = stepUntil(
      earlyRoute,
      (state) => state.enemies.some((enemy) => enemy.id === "stage-6-red-crystal"),
      520
    );

    earlyRoute.defeatEnemy("stage-6-red-crystal");
    earlyState = earlyRoute.step({ players: {} });
    expect(
      earlyState.pickups.filter((pickup) => pickup.kind === "extend")
    ).toHaveLength(0);

    const lateRoute = new Simulation({ stageId: "stage-6" });
    let lateState = stepUntil(
      lateRoute,
      (state) => state.enemies.some((enemy) => enemy.id === "stage-6-red-crystal"),
      520
    );

    for (let frame = 0; frame < 12; frame += 1) {
      lateState = lateRoute.step({ players: {} });
    }

    lateRoute.defeatEnemy("stage-6-red-crystal");
    lateState = lateRoute.step({ players: {} });

    expect(lateState.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "hidden-triggered",
          triggerId: "stage-6-hidden-red-crystal-extend"
        })
      ])
    );
    expect(
      lateState.pickups.filter((pickup) => pickup.kind === "extend")
    ).toHaveLength(1);
  });

  it("HID-301 expires the Stage 7 rocket-cache route once the Huge Satellite encounter starts", () => {
    const simulation = new Simulation({ stageId: "stage-7" });
    let state = stepUntil(
      simulation,
      (nextState) =>
        nextState.enemies.some((enemy) => enemy.id === "stage-7-rocket-battery-4"),
      520
    );

    for (const enemyId of [
      "stage-7-rocket-battery-1",
      "stage-7-rocket-battery-2",
      "stage-7-rocket-battery-3",
      "stage-7-rocket-battery-4"
    ]) {
      simulation.defeatEnemy(enemyId);
    }

    state = stepUntil(
      simulation,
      (nextState) => nextState.enemies.some((enemy) => enemy.id === "stage-7-fairy-beacon"),
      620
    );
    expect(state.enemies.some((enemy) => enemy.id === "stage-7-fairy-beacon")).toBe(true);

    state = clearToBoss(simulation, {
      maxFrames: 1_100,
      skipEnemyIds: ["stage-7-fairy-beacon"]
    });

    expect(state.boss?.bossId).toBe("stage-7-huge-satellite");

    simulation.defeatEnemy("stage-7-fairy-beacon");
    state = simulation.step({ players: {} });
    expect(state.enemies.some((enemy) => enemy.id === "stage-7-fairy-beacon")).toBe(false);
    expect(
      state.recentEvents.filter(
        (event) =>
          event.type === "hidden-triggered" &&
          (event.triggerId === "stage-7-hidden-rocket-cache-reveal" ||
            event.triggerId === "stage-7-hidden-fairy")
      )
    ).toHaveLength(0);
    expect(
      state.pickups.filter((pickup) => pickup.kind === "fairy")
    ).toHaveLength(0);
  });

  it("STG-303 keeps the Stage 7 rocket-cache hidden route optional for mainline progression", () => {
    const simulation = new Simulation({ stageId: "stage-7" });
    const state = clearToBoss(simulation, {
      maxFrames: 1_100,
      skipEnemyIds: ["stage-7-fairy-beacon"],
      skipEnemyPrefixes: ["stage-7-rocket-battery-"]
    });

    expect(state.boss?.bossId).toBe("stage-7-huge-satellite");
    expect(state.stage.waveCursor).toBeGreaterThanOrEqual(5);
  });

  it("HID-301 keeps the Stage 7 rocket-cache route expired after the boss encounter has already started", () => {
    const simulation = new Simulation({ stageId: "stage-7" });
    let state = clearToBoss(simulation, {
      maxFrames: 1_100,
      skipEnemyIds: ["stage-7-fairy-beacon"],
      skipEnemyPrefixes: ["stage-7-rocket-battery-"]
    });

    expect(state.boss?.bossId).toBe("stage-7-huge-satellite");

    simulation.applyBossDamage(4_000);
    state = simulation.step({ players: {} });

    expect(state.stage.completed).toBe(true);
    expect(state.stage.bossEncounterStarted).toBe(true);

    for (const enemyId of [
      "stage-7-rocket-battery-1",
      "stage-7-rocket-battery-2",
      "stage-7-rocket-battery-3",
      "stage-7-rocket-battery-4"
    ]) {
      simulation.defeatEnemy(enemyId);
    }

    state = simulation.step({ players: {} });

    expect(state.enemies.some((enemy) => enemy.id === "stage-7-fairy-beacon")).toBe(false);
    expect(
      state.recentEvents.filter(
        (event) =>
          event.type === "hidden-triggered" &&
          event.triggerId === "stage-7-hidden-rocket-cache-reveal"
      )
    ).toHaveLength(0);
  });

  it("HID-301 reveals the Stage 7 fairy beacon only after the rocket batteries are cleared", () => {
    const simulation = new Simulation({ stageId: "stage-7" });
    let state = stepUntil(
      simulation,
      (nextState) =>
        nextState.enemies.some((enemy) => enemy.id === "stage-7-rocket-battery-4"),
      520
    );

    for (const enemyId of [
      "stage-7-rocket-battery-1",
      "stage-7-rocket-battery-2",
      "stage-7-rocket-battery-3",
      "stage-7-rocket-battery-4"
    ]) {
      simulation.defeatEnemy(enemyId);
    }

    state = stepUntil(
      simulation,
      (nextState) => nextState.enemies.some((enemy) => enemy.id === "stage-7-fairy-beacon"),
      580
    );
    expect(state.enemies.some((enemy) => enemy.id === "stage-7-fairy-beacon")).toBe(true);

    simulation.defeatEnemy("stage-7-fairy-beacon");
    state = simulation.step({ players: {} });
    expect(
      state.pickups.filter((pickup) => pickup.kind === "fairy")
    ).toHaveLength(1);
  });

  it("STG-304, HID-301, BOS-301, and LOP-301 turn Stage 8 into a full authored final stage with loop carryover", () => {
    const definition = getStageDefinition("stage-8");
    expect(definition.checkpoints.map((checkpoint) => checkpoint.id)).toEqual([
      "stage-8-checkpoint-facility-exit"
    ]);

    const simulation = new Simulation({ stageId: "stage-8", loopIndex: 0 });
    let state = stepUntil(
      simulation,
      (nextState) => nextState.enemies.some((enemy) => enemy.id === "stage-8-miclus-obelisk"),
      720
    );

    simulation.defeatEnemy("stage-8-miclus-obelisk");
    state = simulation.step({ players: {} });

    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "hidden-triggered",
          triggerId: "stage-8-hidden-miclus-line"
        })
      ])
    );
    expect(
      state.pickups.map((pickup) => pickup.kind).sort()
    ).toEqual(expect.arrayContaining(["medal", "medal", "medal", "miclus"]));

    state = clearToBoss(simulation, { maxFrames: 1_240 });
    expect(state.boss?.bossId).toBe("stage-8-mother-haven");
    expect(state.boss?.currentPhaseId).toBe("stage-8-mother-haven-shell");

    simulation.applyBossDamage(360);
    state = simulation.step({ players: {} });
    expect(state.boss?.currentPhaseId).toBe("stage-8-mother-haven-siege");

    simulation.applyBossDamage(320);
    state = simulation.step({ players: {} });
    expect(state.boss?.currentPhaseId).toBe("stage-8-mother-haven-core");

    simulation.applyBossDamage(4_000);
    state = simulation.step({ players: {} });

    expect(state.session.loopIndex).toBe(1);
    expect(state.stage.stageId).toBe("stage-1");
    expect(state.stage.completed).toBe(false);
    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "loop-advanced", loopIndex: 1 })
      ])
    );
  });

  it("HID-301 expires the Stage 8 Miclus line once Mother Haven has started", () => {
    const simulation = new Simulation({ stageId: "stage-8" });
    let state = clearToBoss(simulation, {
      maxFrames: 1_240,
      skipEnemyIds: ["stage-8-miclus-obelisk"]
    });

    expect(state.boss?.bossId).toBe("stage-8-mother-haven");

    simulation.defeatEnemy("stage-8-miclus-obelisk");
    state = simulation.step({ players: {} });

    expect(
      state.pickups.filter((pickup) => pickup.kind === "miclus" || pickup.kind === "medal")
    ).toHaveLength(0);
    expect(
      state.recentEvents.filter(
        (event) =>
          event.type === "hidden-triggered" &&
          event.triggerId === "stage-8-hidden-miclus-line"
      )
    ).toHaveLength(0);
  });
});
