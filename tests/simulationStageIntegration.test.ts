import { describe, expect, it } from "vitest";

import { Simulation } from "../src/game/core/Simulation";

function burnRespawnInvulnerability(simulation: Simulation, frames = 121): void {
  for (let index = 0; index < frames; index += 1) {
    simulation.step({ players: {} });
  }
}

describe("Simulation and stage integration", () => {
  it("SIM-003 initializes session-owned runtime state", () => {
    const simulation = new Simulation({
      mode: "co-op",
      cabinetProfile: "hard",
      stageId: "stage-1",
      loopIndex: 2
    });

    const state = simulation.getState();

    expect(state.session).toEqual({
      mode: "co-op",
      cabinetProfile: "hard",
      stageId: "stage-1",
      loopIndex: 2
    });
    expect(state.players).toHaveLength(2);
    expect(state.players.every((player) => player.mainWeapon.level === 1)).toBe(true);
    expect(state.enemies).toHaveLength(0);
    expect(state.pickups).toHaveLength(0);
    expect(state.boss).toBeNull();
  });

  it("SIM-004 step consumes input and emits simulation-owned fire events", () => {
    const simulation = new Simulation();
    const initialX = simulation.getState().players[0]?.position.x ?? 0;

    const state = simulation.step({
      players: {
        player1: {
          move: { x: 1, y: 0 },
          fire: true,
          bomb: false,
          focus: false
        }
      }
    });

    const player = state.players.find((entry) => entry.id === "player1");
    expect(player?.position.x).toBeGreaterThan(initialX);
    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "player-fired", playerId: "player1" })
      ])
    );
  });

  it("STG-001 emits configured wave spawns from stage data", () => {
    const simulation = new Simulation({ stageId: "stage-1" });
    let state = simulation.getState();

    while (state.enemies.length === 0 && state.frame < 20) {
      state = simulation.step({ players: {} });
    }

    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "wave-spawned",
          waveId: "stage-1-opening-scoutcraft"
        })
      ])
    );
    expect(state.enemies.map((enemy) => enemy.id)).toContain("stage-1-opening-scout-1");
  });

  it("STG-002 checkpoint respawn restores player position and stage cursor", () => {
    const simulation = new Simulation({ stageId: "stage-1" });
    let state = simulation.getState();

    while (
      state.stage.armedCheckpointId !== "stage-1-checkpoint-crater-exit" &&
      state.frame < 40
    ) {
      state = simulation.step({ players: {} });
    }

    const armedWaveCursor = state.stage.waveCursor;
    simulation.applyPlayerDamage("player1");
    state = simulation.step({ players: {} });

    const player = state.players.find((entry) => entry.id === "player1");
    expect(player?.position).toEqual({ x: 160, y: 472 });
    expect(state.stage.armedCheckpointId).toBe("stage-1-checkpoint-crater-exit");
    expect(state.stage.waveCursor).toBeGreaterThanOrEqual(armedWaveCursor);
    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "player-respawned",
          checkpointId: "stage-1-checkpoint-crater-exit"
        })
      ])
    );
  });

  it("STG-002 single-player respawn restores checkpoint bookkeeping without stale hidden rewards", () => {
    const simulation = new Simulation({ stageId: "stage-1" });
    let state = simulation.getState();

    while (
      (!state.enemies.some((enemy) => enemy.id === "stage-1-fairy-tree") ||
        state.stage.armedCheckpointId !== "stage-1-checkpoint-crater-exit") &&
      state.frame < 60
    ) {
      state = simulation.step({ players: {} });
    }

    simulation.defeatEnemy("stage-1-fairy-tree");
    state = simulation.step({ players: {} });
    expect(state.pickups).toHaveLength(1);

    simulation.applyPlayerDamage("player1");
    state = simulation.step({ players: {} });

    expect(state.pickups.map((pickup) => pickup.kind).sort()).toEqual(
      expect.arrayContaining(["bomb", "main-vulcan", "sub-homing"])
    );
    expect(state.stage.triggeredHiddenIds).toEqual(["stage-1-hidden-fairy"]);
    expect(state.stage.defeatedEnemyIds).toEqual([]);

    while (
      !state.enemies.some((enemy) => enemy.id === "stage-1-fairy-tree") &&
      state.frame < 90
    ) {
      state = simulation.step({ players: {} });
    }

    simulation.defeatEnemy("stage-1-fairy-tree");
    state = simulation.step({ players: {} });

    expect(state.recentEvents).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "hidden-triggered",
          triggerId: "stage-1-hidden-fairy"
        })
      ])
    );
    expect(
      simulation
        .getState()
        .pickups.filter((pickup) => pickup.id === "stage-1-hidden-fairy-reward")
    ).toHaveLength(0);
  });

  it("HID-001 hidden trigger rewards once after the configured enemy defeat", () => {
    const simulation = new Simulation({ stageId: "stage-1" });
    let state = simulation.getState();

    while (!state.enemies.some((enemy) => enemy.id === "stage-1-fairy-tree") && state.frame < 60) {
      state = simulation.step({ players: {} });
    }

    simulation.defeatEnemy("stage-1-fairy-tree");
    state = simulation.step({ players: {} });

    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "hidden-triggered",
          triggerId: "stage-1-hidden-fairy"
        })
      ])
    );
    expect(
      state.pickups.filter((pickup) => pickup.id === "stage-1-hidden-fairy-reward")
    ).toHaveLength(1);

    simulation.step({ players: {} });
    simulation.step({ players: {} });

    expect(
      simulation
        .getState()
        .pickups.filter((pickup) => pickup.id === "stage-1-hidden-fairy-reward")
    ).toHaveLength(1);
  });

  it("BOS-001 advances boss phases and clears the stage", () => {
    const simulation = new Simulation({ stageId: "stage-1" });
    let state = simulation.getState();

    while (!state.boss?.active && state.frame < 60) {
      for (const enemy of state.enemies) {
        simulation.defeatEnemy(enemy.id);
      }

      state = simulation.step({ players: {} });
    }

    expect(state.boss?.currentPhaseId).toBe("stage-1-walkers-opening");

    simulation.applyBossDamage(120);
    state = simulation.step({ players: {} });

    expect(state.boss?.currentPhaseId).toBe("stage-1-walkers-rotary-combo");
    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "boss-phase-changed",
          phaseId: "stage-1-walkers-rotary-combo"
        })
      ])
    );

    simulation.applyBossPartDamage("stage-1-walker-right", 120);
    state = simulation.step({ players: {} });

    expect(state.boss?.currentPhaseId).toBe("stage-1-walkers-desperation");

    simulation.applyBossPartDamage("stage-1-walker-left", 500);
    simulation.applyBossPartDamage("stage-1-walker-right", 500);
    state = simulation.step({ players: {} });

    expect(state.stage.completed).toBe(true);
    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "stage-cleared", stageId: "stage-1" })
      ])
    );
  });

  it("CAB-001 changes enemy health through cabinet data only", () => {
    const easy = new Simulation({ stageId: "stage-1", cabinetProfile: "easy" });
    const hard = new Simulation({ stageId: "stage-1", cabinetProfile: "hard" });
    let easyState = easy.getState();
    let hardState = hard.getState();

    while (
      (easyState.enemies.length === 0 || hardState.enemies.length === 0) &&
      easyState.frame < 20
    ) {
      easyState = easy.step({ players: {} });
      hardState = hard.step({ players: {} });
    }

    expect(hardState.enemies[0]?.maxHealth ?? 0).toBeGreaterThan(
      easyState.enemies[0]?.maxHealth ?? 0
    );
  });

  it("COOP-001 updates two players inside one simulation state", () => {
    const simulation = new Simulation({ mode: "co-op", stageId: "stage-1" });
    const initial = simulation.getState();
    const initialPlayer1 = initial.players.find((entry) => entry.id === "player1");
    const initialPlayer2 = initial.players.find((entry) => entry.id === "player2");

    const state = simulation.step({
      players: {
        player1: {
          move: { x: 1, y: 0 },
          fire: false,
          bomb: false,
          focus: false
        },
        player2: {
          move: { x: -1, y: 0 },
          fire: false,
          bomb: false,
          focus: false
        }
      }
    });

    const player1 = state.players.find((entry) => entry.id === "player1");
    const player2 = state.players.find((entry) => entry.id === "player2");

    expect(state.players).toHaveLength(2);
    expect((player1?.position.x ?? 0) > (initialPlayer1?.position.x ?? 0)).toBe(true);
    expect((player2?.position.x ?? 0) < (initialPlayer2?.position.x ?? 0)).toBe(true);
  });

  it("COOP-001 respawning one player does not reset the shared encounter", () => {
    const simulation = new Simulation({ mode: "co-op", stageId: "stage-1" });
    let state = simulation.getState();

    while (state.enemies.length === 0 && state.frame < 20) {
      state = simulation.step({ players: {} });
    }

    const enemyIds = state.enemies.map((enemy) => enemy.id);
    simulation.applyPlayerDamage("player1");
    state = simulation.step({ players: {} });

    expect(state.enemies.map((enemy) => enemy.id)).toEqual(enemyIds);
    expect(state.players.find((entry) => entry.id === "player2")?.active).toBe(true);
  });

  it("SIM-004 destroyed players ignore movement fire and bomb input", () => {
    const simulation = new Simulation({ stageId: "stage-1" });

    simulation.applyPlayerDamage("player1");
    burnRespawnInvulnerability(simulation);
    simulation.applyPlayerDamage("player1");
    burnRespawnInvulnerability(simulation);
    simulation.applyPlayerDamage("player1");

    const destroyed = simulation.getState().players.find((entry) => entry.id === "player1");
    const destroyedPosition = destroyed?.position;

    const state = simulation.step({
      players: {
        player1: {
          move: { x: 1, y: -1 },
          fire: true,
          bomb: true,
          focus: false
        }
      }
    });

    const player = state.players.find((entry) => entry.id === "player1");
    expect(player?.active).toBe(false);
    expect(player?.position).toEqual(destroyedPosition);
    expect(state.recentEvents).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "player-fired", playerId: "player1" }),
        expect.objectContaining({ type: "bomb-triggered", playerId: "player1" })
      ])
    );
  });

  it("LOP-001 advances loop index after final-stage clear", () => {
    const simulation = new Simulation({ stageId: "stage-8", loopIndex: 0 });
    let state = simulation.getState();

    while (!state.boss?.active && state.frame < 40) {
      for (const enemy of state.enemies) {
        simulation.defeatEnemy(enemy.id);
      }

      state = simulation.step({ players: {} });
    }

    simulation.applyBossDamage(500);
    state = simulation.step({ players: {} });

    expect(state.session.loopIndex).toBe(1);
    expect(state.stage.stageId).toBe("stage-1");
    expect(state.stage.completed).toBe(false);
    expect(state.boss).toBeNull();
    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "loop-advanced", loopIndex: 1 })
      ])
    );
  });
});
