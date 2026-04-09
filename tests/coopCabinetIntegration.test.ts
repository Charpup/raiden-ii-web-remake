import { describe, expect, it } from "vitest";

import { Simulation } from "../src/game/core/Simulation";
import type { RuntimePickupState, SimulationState } from "../src/game/core/types";
import { getStageDefinition } from "../src/game/stage/stageCatalog";

function burnFrames(simulation: Simulation, frames: number): SimulationState {
  let state = simulation.getState();

  for (let index = 0; index < frames; index += 1) {
    state = simulation.step({ players: {} });
  }

  return state;
}

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

function exhaustPlayer(simulation: Simulation, playerId: "player1" | "player2"): SimulationState {
  let state = simulation.getState();
  let attempts = 0;

  while (state.players.find((player) => player.id === playerId)?.lifeState !== "continue-pending") {
    if (attempts >= 8) {
      throw new Error(`Failed to move ${playerId} into continue-pending within 8 damage attempts`);
    }

    simulation.applyPlayerDamage(playerId);
    state = simulation.step({ players: {} });
    attempts += 1;

    if (state.players.find((player) => player.id === playerId)?.lifeState === "continue-pending") {
      break;
    }

    const privateState = getPrivateState(simulation);
    const player = privateState.players.find((entry) => entry.id === playerId);
    if (player) {
      player.invulnerableFrames = 0;
    }
    state = simulation.getState();
  }

  return state;
}

function getPrivateState(simulation: Simulation): SimulationState {
  return (simulation as unknown as { state: SimulationState }).state;
}

describe("Co-op and cabinet rules integration", () => {
  it("COOP-201 leaves the shared encounter intact when only one player enters continue-pending", () => {
    const simulation = new Simulation({ mode: "co-op", stageId: "stage-1" });
    let state = stepUntil(simulation, (nextState) => nextState.enemies.length > 0, 30);
    const enemyIds = state.enemies.map((enemy) => enemy.id);

    state = exhaustPlayer(simulation, "player1");

    expect(state.players.find((player) => player.id === "player1")?.lifeState).toBe(
      "continue-pending"
    );
    expect(state.players.find((player) => player.id === "player2")?.lifeState).toBe("alive");
    expect(
      enemyIds.every((enemyId) => state.enemies.some((enemy) => enemy.id === enemyId))
    ).toBe(true);
    expect(state.stage.waveCursor).toBeGreaterThanOrEqual(1);
    expect(state.flow).toBe("continue");
    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "continue-opened", playerId: "player1" })
      ])
    );
  });

  it("COOP-202 accepts continue for one pending player without rewinding the shared encounter", () => {
    const simulation = new Simulation({ mode: "co-op", stageId: "stage-1" });
    let state = stepUntil(
      simulation,
      (nextState) => nextState.stage.armedCheckpointId === "stage-1-checkpoint-crater-exit",
      40
    );

    state = exhaustPlayer(simulation, "player1");
    expect(state.players.find((player) => player.id === "player1")?.lifeState).toBe(
      "continue-pending"
    );
    expect(simulation.joinPlayer("player1")).toBe(false);

    simulation.acceptContinue("player1");
    state = simulation.step({ players: {} });

    const player1 = state.players.find((player) => player.id === "player1");
    expect(player1?.lifeState).toBe("respawning");
    expect(player1?.active).toBe(true);
    expect(player1?.lives).toBe(state.cabinetRules.startingLives);
    expect(player1?.bombs).toBe(state.cabinetRules.startingBombs);
    expect(player1?.position).toEqual({ x: 160, y: 472 });
    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "continue-accepted", playerId: "player1" }),
        expect.objectContaining({
          type: "player-respawned",
          playerId: "player1",
          checkpointId: "stage-1-checkpoint-crater-exit"
        })
      ])
    );
  });

  it("COOP-202 times out both players into session-game-over when no continue is accepted", () => {
    const simulation = new Simulation({ mode: "co-op", stageId: "stage-1" });
    let state = exhaustPlayer(simulation, "player1");
    state = exhaustPlayer(simulation, "player2");

    expect(state.flow).toBe("continue");

    state = stepUntil(
      simulation,
      (nextState) => nextState.flow === "session-game-over",
      state.frame + state.cabinetRules.continueCountdownFrames + 2
    );

    expect(state.players.every((player) => player.lifeState === "game-over")).toBe(true);
    expect(state.flow).toBe("session-game-over");
    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "session-game-over" })
      ])
    );
  });

  it("COOP-203 re-enters player two from a checkpoint-safe position after game-over", () => {
    const simulation = new Simulation({ mode: "co-op", stageId: "stage-1" });
    let state = stepUntil(
      simulation,
      (nextState) => nextState.stage.armedCheckpointId === "stage-1-checkpoint-crater-exit",
      40
    );

    state = exhaustPlayer(simulation, "player2");
    state = burnFrames(simulation, state.cabinetRules.continueCountdownFrames);
    expect(state.players.find((player) => player.id === "player2")?.lifeState).toBe(
      "game-over"
    );

    simulation.joinPlayer("player2");
    state = simulation.step({ players: {} });

    const player2 = state.players.find((player) => player.id === "player2");
    expect(player2?.lifeState).toBe("respawning");
    expect(player2?.active).toBe(true);
    expect(player2?.position).toEqual({ x: 182, y: 472 });
    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "player-joined", playerId: "player2" }),
        expect.objectContaining({
          type: "player-respawned",
          playerId: "player2",
          checkpointId: "stage-1-checkpoint-crater-exit"
        })
      ])
    );
  });

  it("COOP-204 attributes enemy defeats and pickup collection to the correct player", () => {
    const simulation = new Simulation({ mode: "co-op", stageId: "stage-1" });
    let state = stepUntil(simulation, (nextState) => nextState.enemies.length > 0, 30);
    const targetEnemyId = state.enemies[0]?.id;

    expect(targetEnemyId).toBeTruthy();
    simulation.defeatEnemy(targetEnemyId!, { sourcePlayerId: "player2" });
    state = simulation.step({ players: {} });

    expect(state.players.find((player) => player.id === "player2")?.score).toBeGreaterThan(0);
    expect(state.players.find((player) => player.id === "player1")?.score).toBe(0);

    const privateState = getPrivateState(simulation);
    const injectedPickup: RuntimePickupState = {
      id: "test-bomb-pickup",
      kind: "bomb",
      position: { x: 0, y: 0 },
      collected: false,
      scoreValue: 500
    };
    privateState.pickups.push(injectedPickup);

    const beforePlayer1Bombs =
      simulation.getState().players.find((player) => player.id === "player1")?.bombs ?? 0;

    simulation.collectPickup("test-bomb-pickup", "player1");
    state = simulation.step({ players: {} });

    expect(state.players.find((player) => player.id === "player1")?.bombs).toBe(
      beforePlayer1Bombs + 1
    );
    expect(state.players.find((player) => player.id === "player1")?.score).toBe(500);
    expect(state.players.find((player) => player.id === "player2")?.bombs).toBe(
      state.cabinetRules.startingBombs
    );
    expect(
      state.pickups.find((pickup) => pickup.id === "test-bomb-pickup")?.collectedByPlayerId
    ).toBe("player1");
    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "pickup-collected",
          playerId: "player1",
          pickupId: "test-bomb-pickup"
        })
      ])
    );

    const nextPrivateState = getPrivateState(simulation);
    const medalPickup: RuntimePickupState = {
      id: "test-medal-pickup",
      kind: "medal",
      position: { x: 0, y: 0 },
      collected: false,
      scoreValue: 500
    };
    nextPrivateState.pickups.push(medalPickup);

    expect(simulation.collectPickup("test-medal-pickup", "player1")).toBe(true);
    state = simulation.step({ players: {} });

    expect(state.players.find((player) => player.id === "player1")?.score).toBe(1_100);
  });

  it("CAB-201 seeds starting stock, extend thresholds, and continue policy from cabinet rules", () => {
    const easy = new Simulation({ cabinetProfile: "easy" }).getState();
    const hard = new Simulation({ cabinetProfile: "hard" }).getState();

    expect(easy.cabinetRules.profile).toBe("easy");
    expect(hard.cabinetRules.profile).toBe("hard");
    expect(easy.players[0]?.lives).toBe(easy.cabinetRules.startingLives);
    expect(hard.players[0]?.bombs).toBe(hard.cabinetRules.startingBombs);
    expect(hard.cabinetRules.extendThresholds[0]).toBeGreaterThan(
      easy.cabinetRules.extendThresholds[0]
    );
    expect(easy.cabinetRules.continueEnabled).toBe(true);
  });

  it("CAB-202 keeps hard-only content and reward overrides in stage data while cabinet rules stay session-level", () => {
    const stage1 = getStageDefinition("stage-1");
    const stage2 = getStageDefinition("stage-2");

    expect(
      stage1.hiddenTriggers.find((hidden) => hidden.id === "stage-1-hidden-cache-reward")
        ?.rewardOverrides?.hard?.kind
    ).toBe("miclus");
    expect(stage2.waves.find((wave) => wave.id === "stage-2-hard-late-car")?.cabinetProfiles).toEqual([
      "hard"
    ]);
  });
});
