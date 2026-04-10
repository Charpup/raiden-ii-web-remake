import { describe, expect, it } from "vitest";

import { Simulation } from "../src/game/core/Simulation";
import type { SimulationState } from "../src/game/core/types";

function stepUntilBoss(
  simulation: Simulation,
  maxFrames = 1_600
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

function clearActiveBoss(simulation: Simulation): SimulationState {
  let state = simulation.getState();
  let guard = 0;

  while (state.boss?.active && guard < 20) {
    if (state.boss.parts.length > 0) {
      for (const part of state.boss.parts) {
        if (part.active) {
          simulation.applyBossPartDamage(part.id, 10_000);
        }
      }
    } else {
      simulation.applyBossDamage(10_000);
    }

    state = simulation.step({ players: {} });
    guard += 1;
  }

  return state;
}

function clearCurrentStage(simulation: Simulation): SimulationState {
  const bossState = stepUntilBoss(simulation);
  expect(bossState.boss?.active).toBe(true);
  return clearActiveBoss(simulation);
}

describe("Release verification", () => {
  it("REL-401 completes the authored Stage 1 through Stage 8 route and loops back to Stage 1", () => {
    const simulation = new Simulation({ stageId: "stage-1", loopIndex: 0 });
    const clearedStages: string[] = [];
    let state = simulation.getState();

    for (const expectedStage of [
      "stage-1",
      "stage-2",
      "stage-3",
      "stage-4",
      "stage-5",
      "stage-6",
      "stage-7",
      "stage-8"
    ]) {
      expect(state.session.stageId).toBe(expectedStage);
      state = clearCurrentStage(simulation);
      clearedStages.push(expectedStage);
      expect(state.recentEvents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "stage-cleared", stageId: expectedStage })
        ])
      );
    }

    expect(clearedStages).toEqual([
      "stage-1",
      "stage-2",
      "stage-3",
      "stage-4",
      "stage-5",
      "stage-6",
      "stage-7",
      "stage-8"
    ]);
    expect(state.session.stageId).toBe("stage-1");
    expect(state.stage.stageId).toBe("stage-1");
    expect(state.session.loopIndex).toBe(1);
    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "ending-started",
          stageId: "stage-8",
          nextStageId: "stage-1",
          loopIndex: 1
        }),
        expect.objectContaining({ type: "loop-advanced", loopIndex: 1 })
      ])
    );
  });

  it("REL-401 and REL-403 keep co-op hard runs on the authored mainline after a non-final clear", () => {
    const simulation = new Simulation({
      mode: "co-op",
      cabinetProfile: "hard",
      stageId: "stage-1"
    });

    const state = clearCurrentStage(simulation);

    expect(state.session.stageId).toBe("stage-2");
    expect(state.stage.stageId).toBe("stage-2");
    expect(state.session.loopIndex).toBe(0);
    expect(state.players).toHaveLength(2);
    expect(state.players.every((player) => player.joined && player.active)).toBe(true);
    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "stage-cleared", stageId: "stage-1" })
      ])
    );
    expect(state.recentEvents).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "ending-started" })])
    );
  });
});
