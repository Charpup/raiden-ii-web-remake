import { describe, expect, it } from "vitest";

import { Simulation } from "../src/game/core/Simulation";
import type { SimulationState } from "../src/game/core/types";
import { getStageDefinition } from "../src/game/stage/stageCatalog";

function stepUntil(
  simulation: Simulation,
  predicate: (state: SimulationState) => boolean,
  maxFrames = 240
): SimulationState {
  let state = simulation.getState();

  while (!predicate(state) && state.frame < maxFrames) {
    state = simulation.step({ players: {} });
  }

  return state;
}

function stepUntilBoss(simulation: Simulation, maxFrames = 420): SimulationState {
  let state = simulation.getState();

  while (!state.boss?.active && state.frame < maxFrames) {
    for (const enemy of state.enemies) {
      simulation.defeatEnemy(enemy.id);
    }

    state = simulation.step({ players: {} });
  }

  return state;
}

describe("Stage 1 golden slice", () => {
  it("AUTH-101 exposes the authored macro route and metadata for Stage 1", () => {
    const definition = getStageDefinition("stage-1");
    const authoredDefinition = definition as unknown as {
      waves: Array<{
        id: string;
        enemies: Array<{
          id: string;
          spawnOffsetFrames?: number;
          behaviorId?: string;
        }>;
      }>;
      boss: {
        phases: Array<{
          id: string;
          patternId?: string;
        }>;
      } | null;
    };

    expect(authoredDefinition.waves.map((wave) => wave.id)).toEqual([
      "stage-1-opening-scoutcraft",
      "stage-1-farm-turretline",
      "stage-1-first-cache-carrier",
      "stage-1-warplane-pincer",
      "stage-1-swamp-pressure",
      "stage-1-crater-run",
      "stage-1-fairy-tree-guard",
      "stage-1-pre-boss-medal-cache"
    ]);
    expect(authoredDefinition.waves[0]?.enemies[1]).toMatchObject({
      spawnOffsetFrames: 2,
      behaviorId: "scoutcraft-swoop"
    });
    expect(authoredDefinition.boss?.phases).toEqual([
      expect.objectContaining({
        id: "stage-1-walkers-opening",
        patternId: "paired-diagonals"
      }),
      expect.objectContaining({
        id: "stage-1-walkers-rotary-combo",
        patternId: "rotary-straight-burst"
      }),
      expect.objectContaining({
        id: "stage-1-walkers-desperation",
        patternId: "desperation-flak"
      })
    ]);
  });

  it("STG-101 staggers the opening scoutcraft entries over multiple frames", () => {
    const simulation = new Simulation({ stageId: "stage-1" });

    let state = stepUntil(
      simulation,
      (nextState) =>
        nextState.recentEvents.some(
          (event) =>
            event.type === "wave-spawned" &&
            event.waveId === "stage-1-opening-scoutcraft"
        ),
      24
    );

    expect(state.enemies.map((enemy) => enemy.id)).toContain("stage-1-opening-scout-1");
    expect(state.enemies.map((enemy) => enemy.id)).not.toContain(
      "stage-1-opening-scout-4"
    );

    state = simulation.step({ players: {} });
    state = simulation.step({ players: {} });
    state = simulation.step({ players: {} });

    expect(state.enemies.map((enemy) => enemy.id)).toContain("stage-1-opening-scout-4");
  });

  it("STG-102 respawns single-player runs from the crater-exit checkpoint", () => {
    const simulation = new Simulation({ stageId: "stage-1" });

    const stateAtCheckpoint = stepUntil(
      simulation,
      (nextState) => nextState.stage.armedCheckpointId === "stage-1-checkpoint-crater-exit",
      180
    );

    expect(stateAtCheckpoint.stage.armedCheckpointId).toBe(
      "stage-1-checkpoint-crater-exit"
    );
    expect(stateAtCheckpoint.stage.pendingSpawns).toHaveLength(0);

    simulation.applyPlayerDamage("player1");
    const respawnedState = simulation.step({ players: {} });
    const respawnedPlayer = respawnedState.players.find((player) => player.id === "player1");

    expect(respawnedPlayer?.position).toEqual({ x: 160, y: 472 });
    expect(respawnedState.stage.waveCursor).toBeGreaterThanOrEqual(6);
    expect(respawnedState.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "player-respawned",
          checkpointId: "stage-1-checkpoint-crater-exit"
        })
      ])
    );
  });

  it("HID-101 reveals the fairy tree once and upgrades the hard-cabinet cache to Miclus", () => {
    const hardSimulation = new Simulation({ stageId: "stage-1", cabinetProfile: "hard" });

    let hardState = stepUntil(
      hardSimulation,
      (nextState) => nextState.enemies.some((enemy) => enemy.id === "stage-1-fairy-tree"),
      220
    );

    hardSimulation.defeatEnemy("stage-1-fairy-tree");
    hardState = hardSimulation.step({ players: {} });

    expect(hardState.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "hidden-triggered",
          triggerId: "stage-1-hidden-fairy"
        })
      ])
    );
    expect(
      hardState.pickups.filter((pickup) => (pickup.kind as string) === "fairy")
    ).toHaveLength(1);

    hardState = stepUntil(
      hardSimulation,
      (nextState) =>
        nextState.stage.armedCheckpointId === "stage-1-checkpoint-crater-exit" &&
        nextState.enemies.some((enemy) => enemy.id === "stage-1-fairy-tree"),
      260
    );
    hardSimulation.applyPlayerDamage("player1");
    hardState = hardSimulation.step({ players: {} });

    expect(
      hardState.pickups.map((pickup) => pickup.kind).sort()
    ).toEqual(expect.arrayContaining(["bomb", "main-vulcan", "sub-homing"]));

    hardState = stepUntil(
      hardSimulation,
      (nextState) => nextState.enemies.some((enemy) => enemy.id === "stage-1-fairy-tree"),
      260
    );
    hardSimulation.defeatEnemy("stage-1-fairy-tree");
    hardState = hardSimulation.step({ players: {} });

    expect(
      hardState.recentEvents.filter(
        (event) =>
          event.type === "hidden-triggered" && event.triggerId === "stage-1-hidden-fairy"
      )
    ).toHaveLength(0);
    expect(
      hardSimulation
        .getState()
        .pickups.filter((pickup) => pickup.id === "stage-1-hidden-fairy-reward")
    ).toHaveLength(0);

    hardState = stepUntil(
      hardSimulation,
      (nextState) =>
        nextState.enemies.some((enemy) => enemy.id === "stage-1-pre-boss-cache-core"),
      320
    );
    hardSimulation.defeatEnemy("stage-1-pre-boss-cache-core");
    hardState = hardSimulation.step({ players: {} });

    expect(
      hardState.pickups.filter((pickup) => (pickup.kind as string) === "miclus")
    ).toHaveLength(1);

    const easySimulation = new Simulation({ stageId: "stage-1", cabinetProfile: "easy" });
    let easyState = stepUntil(
      easySimulation,
      (nextState) =>
        nextState.enemies.some((enemy) => enemy.id === "stage-1-pre-boss-cache-core"),
      320
    );
    easySimulation.defeatEnemy("stage-1-pre-boss-cache-core");
    easyState = easySimulation.step({ players: {} });

    expect(
      easyState.pickups.filter((pickup) => (pickup.kind as string) === "miclus")
    ).toHaveLength(0);
  });

  it("BOS-101 uses the authored Walker phase ladder before stage clear", () => {
    const simulation = new Simulation({ stageId: "stage-1" });
    let state = stepUntilBoss(simulation);
    const openingBoss = state.boss as (typeof state.boss & {
      patternId?: string;
      parts?: Array<{ id: string; health: number }>;
    }) | null;

    expect(openingBoss?.bossId).toBe("stage-1-death-walkers");
    expect(openingBoss?.currentPhaseId).toBe("stage-1-walkers-opening");
    expect(openingBoss?.patternId).toBe("paired-diagonals");
    expect(openingBoss?.parts?.map((part) => part.id)).toEqual([
      "stage-1-walker-left",
      "stage-1-walker-right"
    ]);

    simulation.applyBossPartDamage("stage-1-walker-right", 160);
    state = simulation.step({ players: {} });
    const oneWalkerDown = state.boss as (typeof state.boss & {
      parts?: Array<{ id: string; health: number }>;
    }) | null;

    expect(
      oneWalkerDown?.parts?.find((part) => part.id === "stage-1-walker-right")?.health
    ).toBe(0);
    expect(
      oneWalkerDown?.parts?.find((part) => part.id === "stage-1-walker-left")?.health
    ).toBeGreaterThan(0);
    expect(oneWalkerDown?.currentPhaseId).toBe("stage-1-walkers-rotary-combo");
    expect(state.stage.completed).toBe(false);

    simulation.applyBossDamage(120);
    state = simulation.step({ players: {} });
    const rotaryBoss = state.boss as (typeof state.boss & {
      patternId?: string;
    }) | null;

    expect(rotaryBoss?.currentPhaseId).toBe("stage-1-walkers-desperation");
    expect(rotaryBoss?.patternId).toBe("desperation-flak");

    simulation.applyBossDamage(800);
    state = simulation.step({ players: {} });

    expect(state.stage.completed).toBe(true);
    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "stage-cleared", stageId: "stage-1" })
      ])
    );
  });
});
