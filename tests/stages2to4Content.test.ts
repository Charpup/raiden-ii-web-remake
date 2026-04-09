import { describe, expect, it } from "vitest";

import { Simulation } from "../src/game/core/Simulation";
import type { SimulationState } from "../src/game/core/types";
import { getStageDefinition } from "../src/game/stage/stageCatalog";

function stepUntil(
  simulation: Simulation,
  predicate: (state: SimulationState) => boolean,
  maxFrames = 520
): SimulationState {
  let state = simulation.getState();

  while (!predicate(state) && state.frame < maxFrames) {
    state = simulation.step({ players: {} });
  }

  return state;
}

function clearToBoss(
  simulation: Simulation,
  maxFrames = 720
): SimulationState {
  let state = simulation.getState();

  while (!state.boss?.active && state.frame < maxFrames) {
    for (const enemy of state.enemies) {
      simulation.defeatEnemy(enemy.id);
    }

    state = simulation.step({ players: {} });
  }

  return state;
}

describe("Stages 2-4 content authoring", () => {
  it("AUTH-201 locks the Stage 2-4 macro beats and minimal new trigger metadata", () => {
    const stage2 = getStageDefinition("stage-2");
    const stage3 = getStageDefinition("stage-3");
    const stage4 = getStageDefinition("stage-4");

    expect(stage2.waves.map((wave) => wave.id)).toEqual([
      "stage-2-suburb-approach",
      "stage-2-canal-gunboats",
      "stage-2-amphibious-pair",
      "stage-2-base-entrance",
      "stage-2-return-to-town",
      "stage-2-hard-late-car"
    ]);
    expect(stage3.waves.map((wave) => wave.id)).toEqual([
      "stage-3-superstructure-break",
      "stage-3-crusher-tank-route",
      "stage-3-open-water-gunboats",
      "stage-3-oil-platform-crossfire",
      "stage-3-dual-platform-route",
      "stage-3-war-barge-approach"
    ]);
    expect(stage4.waves.map((wave) => wave.id)).toEqual([
      "stage-4-forest-advance",
      "stage-4-ring-defense-circle",
      "stage-4-revealed-fairy-bush",
      "stage-4-first-platform-push",
      "stage-4-third-platform-kamikaze-rush",
      "stage-4-twin-cannon-towers"
    ]);

    expect(stage3.hiddenTriggers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "stage-3-hidden-crushed-crate-extend",
          trigger: expect.objectContaining({
            type: "enemy-destroyed-by",
            enemyId: "stage-3-opening-silver-crate",
            sourceEnemyId: "stage-3-opening-crusher-tank-2"
          })
        })
      ])
    );
    expect(stage4.waves).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "stage-4-revealed-fairy-bush",
          trigger: expect.objectContaining({
            type: "all-enemies-destroyed",
            enemyIds: [
              "stage-4-ring-target-1",
              "stage-4-ring-target-2",
              "stage-4-ring-target-3",
              "stage-4-ring-target-4",
              "stage-4-ring-target-5",
              "stage-4-ring-target-6",
              "stage-4-ring-target-7",
              "stage-4-ring-target-8"
            ]
          })
        })
      ])
    );
  });

  it("STG-201 and CHK-201 arm a Stage 2 late-route checkpoint and reach the Albatross encounter", () => {
    const simulation = new Simulation({ stageId: "stage-2" });

    const checkpointState = stepUntil(
      simulation,
      (state) => state.stage.armedCheckpointId === "stage-2-checkpoint-base-return",
      360
    );

    expect(checkpointState.stage.armedCheckpointId).toBe(
      "stage-2-checkpoint-base-return"
    );

    let state = clearToBoss(simulation, 760);
    expect(state.boss?.bossId).toBe("stage-2-albatross");
    expect(state.boss?.currentPhaseId).toBe("stage-2-albatross-opening");

    simulation.applyBossDamage(200);
    state = simulation.step({ players: {} });
    expect(state.boss?.currentPhaseId).toBe("stage-2-albatross-hornet-missiles");

    simulation.applyBossDamage(320);
    state = simulation.step({ players: {} });
    expect(state.boss?.currentPhaseId).toBe("stage-2-albatross-desperation");

    simulation.applyBossDamage(2_000);
    state = simulation.step({ players: {} });
    expect(state.stage.completed).toBe(true);
  });

  it("AUTH-201 keeps the Stage 2 late bonus car gated behind the hard cabinet profile", () => {
    const easySimulation = new Simulation({ stageId: "stage-2", cabinetProfile: "easy" });
    const easyState = stepUntil(easySimulation, (state) => state.stage.waveCursor >= 6, 360);

    expect(easyState.enemies.some((enemy) => enemy.id === "stage-2-late-car")).toBe(false);

    const hardSimulation = new Simulation({ stageId: "stage-2", cabinetProfile: "hard" });
    const hardState = stepUntil(
      hardSimulation,
      (state) => state.enemies.some((enemy) => enemy.id === "stage-2-late-car"),
      360
    );

    expect(hardState.enemies.some((enemy) => enemy.id === "stage-2-late-car")).toBe(true);
  });

  it("HID-201 only rewards the Stage 3 extend when the silver crate is crushed by the second tank", () => {
    const failedRoute = new Simulation({ stageId: "stage-3" });
    let failedState = stepUntil(
      failedRoute,
      (state) => state.enemies.some((enemy) => enemy.id === "stage-3-opening-silver-crate"),
      220
    );

    failedRoute.defeatEnemy("stage-3-opening-silver-crate");
    failedState = failedRoute.step({ players: {} });

    expect(
      failedState.pickups.filter((pickup) => pickup.kind === "extend")
    ).toHaveLength(0);

    const successfulRoute = new Simulation({ stageId: "stage-3" });
    let successfulState = stepUntil(
      successfulRoute,
      (state) =>
        state.recentEvents.some(
          (event) =>
            event.type === "hidden-triggered" &&
            event.triggerId === "stage-3-hidden-crushed-crate-extend"
        ),
      240
    );

    expect(successfulState.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "hidden-triggered",
          triggerId: "stage-3-hidden-crushed-crate-extend"
        })
      ])
    );
    expect(
      successfulState.pickups.filter((pickup) => pickup.kind === "extend")
    ).toHaveLength(1);
  });

  it("STG-202 and BOS-201 carry the Stage 3 Miclus route into the Battle Axe phase ladder", () => {
    const simulation = new Simulation({ stageId: "stage-3" });
    let state = stepUntil(
      simulation,
      (nextState) =>
        nextState.enemies.some((enemy) => enemy.id === "stage-3-right-platform-core"),
      480
    );

    simulation.defeatEnemy("stage-3-right-platform-core");
    state = simulation.step({ players: {} });

    expect(
      state.pickups.filter((pickup) => pickup.kind === "miclus")
    ).toHaveLength(1);

    state = clearToBoss(simulation, 820);
    expect(state.boss?.bossId).toBe("stage-3-battle-axe");
    expect(state.boss?.currentPhaseId).toBe("stage-3-battle-axe-pop-up-battery");

    simulation.applyBossDamage(240);
    state = simulation.step({ players: {} });
    expect(state.boss?.currentPhaseId).toBe("stage-3-battle-axe-broadside-pressure");

    simulation.applyBossDamage(320);
    state = simulation.step({ players: {} });
    expect(state.boss?.currentPhaseId).toBe("stage-3-battle-axe-exposed-core");
  });

  it("STG-203 and HID-201 reveal the Stage 4 fairy bush after the ring targets are cleared", () => {
    const simulation = new Simulation({ stageId: "stage-4" });
    let state = stepUntil(
      simulation,
      (nextState) =>
        nextState.enemies.some((enemy) => enemy.id === "stage-4-ring-target-8"),
      280
    );

    for (const enemyId of [
      "stage-4-ring-target-1",
      "stage-4-ring-target-2",
      "stage-4-ring-target-3",
      "stage-4-ring-target-4",
      "stage-4-ring-target-5",
      "stage-4-ring-target-6",
      "stage-4-ring-target-7",
      "stage-4-ring-target-8"
    ]) {
      simulation.defeatEnemy(enemyId);
    }

    state = stepUntil(
      simulation,
      (nextState) => nextState.enemies.some((enemy) => enemy.id === "stage-4-fairy-bush"),
      340
    );

    expect(
      state.pickups.filter((pickup) => pickup.kind === "fairy")
    ).toHaveLength(0);

    simulation.defeatEnemy("stage-4-fairy-bush");
    state = simulation.step({ players: {} });

    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "hidden-triggered",
          triggerId: "stage-4-hidden-fairy"
        })
      ])
    );
    expect(
      state.pickups.filter((pickup) => pickup.kind === "fairy")
    ).toHaveLength(1);
  });

  it("CHK-201 and BOS-201 give Stage 4 a checkpointed late route and a Thunder Fortress phase ladder", () => {
    const definition = getStageDefinition("stage-4");
    expect(definition.checkpoints.map((checkpoint) => checkpoint.id)).toEqual([
      "stage-4-checkpoint-kamikaze-rush"
    ]);

    const simulation = new Simulation({ stageId: "stage-4" });
    const checkpointState = stepUntil(
      simulation,
      (state) => state.stage.armedCheckpointId === "stage-4-checkpoint-kamikaze-rush",
      420
    );
    expect(checkpointState.stage.armedCheckpointId).toBe(
      "stage-4-checkpoint-kamikaze-rush"
    );

    let state = clearToBoss(simulation, 860);
    expect(state.boss?.bossId).toBe("stage-4-thunder-fortress");
    expect(state.boss?.currentPhaseId).toBe("stage-4-thunder-fortress-barricade");
    expect(state.boss?.parts.map((part) => part.id)).toEqual([
      "stage-4-thunder-fortress-barricade-left",
      "stage-4-thunder-fortress-barricade-right",
      "stage-4-thunder-fortress-tower-left",
      "stage-4-thunder-fortress-tower-right",
      "stage-4-thunder-fortress-core"
    ]);

    simulation.applyBossPartDamage("stage-4-thunder-fortress-barricade-left", 160);
    simulation.applyBossPartDamage("stage-4-thunder-fortress-barricade-right", 160);
    state = simulation.step({ players: {} });
    expect(state.boss?.currentPhaseId).toBe("stage-4-thunder-fortress-tower-battery");

    simulation.applyBossPartDamage("stage-4-thunder-fortress-tower-left", 180);
    simulation.applyBossPartDamage("stage-4-thunder-fortress-tower-right", 180);
    state = simulation.step({ players: {} });
    expect(state.boss?.currentPhaseId).toBe("stage-4-thunder-fortress-core-storm");
  });
});
