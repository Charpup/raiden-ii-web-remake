import { describe, expect, it } from "vitest";

import { Renderer } from "../src/game/render/Renderer";
import { Simulation } from "../src/game/core/Simulation";

function emptyInput() {
  return { players: {} };
}

function activePilotInputForFrame(frame: number) {
  const horizontalSway = Math.sin(frame / 40);
  const moveX = horizontalSway < -0.35 ? -1 : horizontalSway > 0.35 ? 1 : 0;
  const moveY = frame % 12 < 4 ? -1 : 0;

  return {
    players: {
      player1: {
        move: { x: moveX, y: moveY },
        fire: true,
        bomb: false,
        focus: false
      }
    }
  };
}

function runOpeningWindow(frames = 1800) {
  const simulation = new Simulation({
    stageId: "stage-1",
    cabinetProfile: "easy",
    mode: "single"
  });
  const renderer = new Renderer();
  const seenWaveIds = new Set<string>();
  const visibleSignals = {
    hit: false,
    explosion: false,
    pickup: false
  };
  let continueOpened = false;
  let sessionGameOver = false;
  let state = simulation.getState();

  for (let frame = 0; frame < frames; frame += 1) {
    state = simulation.step(activePilotInputForFrame(frame));
    const scene = renderer.sync(state);

    if (scene.effects.some((effect) => effect.animation === "hit")) {
      visibleSignals.hit = true;
    }
    if (scene.effects.some((effect) => effect.animation === "explosion")) {
      visibleSignals.explosion = true;
    }
    if (scene.pickups.length > 0) {
      visibleSignals.pickup = true;
    }

    for (const event of state.recentEvents) {
      if (event.type === "wave-spawned") {
        seenWaveIds.add(event.waveId);
      }
      if (event.type === "continue-opened") {
        continueOpened = true;
      }
      if (event.type === "session-game-over") {
        sessionGameOver = true;
      }
    }
  }

  return {
    state,
    seenWaveIds,
    visibleSignals,
    continueOpened,
    sessionGameOver
  };
}

describe("Stage 1 prototype playability", () => {
  it("PRT-003 advances Stage 1 scoutcraft behavior so the opening wave does not remain static", () => {
    const simulation = new Simulation({ stageId: "stage-1" });

    let state = simulation.step(emptyInput());
    let scout = state.enemies.find((enemy) => enemy.id === "stage-1-opening-scout-1");
    expect(scout).toBeTruthy();
    const startingPosition = { ...scout!.position };

    for (let frame = 0; frame < 8; frame += 1) {
      state = simulation.step(emptyInput());
    }

    scout = state.enemies.find((enemy) => enemy.id === "stage-1-opening-scout-1");
    expect(scout).toBeTruthy();
    expect(scout!.position.y).toBeGreaterThan(startingPosition.y);
    expect(scout!.position.x).not.toBe(startingPosition.x);
  });

  it("PRT-003 spawns and advances player bullets when the pilot fires", () => {
    const simulation = new Simulation({ stageId: "stage-1" });

    simulation.step({
      players: {
        player1: {
          move: { x: 0, y: 0 },
          fire: true,
          bomb: false,
          focus: false
        }
      }
    });
    let state = simulation.getState();
    expect(state.bullets.some((bullet) => bullet.owner === "player")).toBe(true);

    const bullet = state.bullets.find((entry) => entry.owner === "player");
    if (!bullet) {
      throw new Error("Expected a player bullet after firing.");
    }

    const startingY = bullet.position.y;
    simulation.step(emptyInput());
    state = simulation.getState();
    const advancedBullet = state.bullets.find((entry) => entry.id === bullet.id);
    expect(advancedBullet).toBeTruthy();
    expect(advancedBullet!.position.y).toBeLessThan(startingY);
  });

  it("PRT-004 spawns hostile Stage 1 bullets so the encounter pushes back", () => {
    const simulation = new Simulation({ stageId: "stage-1" });
    let state = simulation.getState();

    for (let frame = 0; frame < 160; frame += 1) {
      state = simulation.step(emptyInput());
      if (state.bullets.some((bullet) => bullet.owner === "enemy")) {
        break;
      }
    }

    expect(state.bullets.some((bullet) => bullet.owner === "enemy")).toBe(true);
  });

  it("PRT-004 can damage and respawn a stationary pilot from live Stage 1 pressure", () => {
    const simulation = new Simulation({ stageId: "stage-1" });
    const startingLives = simulation.getState().players[0]?.lives ?? 0;
    let state = simulation.getState();
    let sawRespawn = false;

    for (let frame = 0; frame < 420; frame += 1) {
      state = simulation.step(emptyInput());
      if (
        state.recentEvents.some(
          (event) => event.type === "player-respawned" && event.playerId === "player1"
        )
      ) {
        sawRespawn = true;
        break;
      }
    }

    expect(sawRespawn).toBe(true);
    expect(state.players[0]?.lives).toBeLessThan(startingLives);
    expect(state.effects.some((effect) => effect.kind === "respawn")).toBe(true);
  });

  it("CRD-101 keeps an active pilot out of continue and session game-over for the first 1800 frames", () => {
    const result = runOpeningWindow();

    expect(result.continueOpened).toBe(false);
    expect(result.sessionGameOver).toBe(false);
    expect(result.state.flow).toBe("playing");
  });

  it("CRD-102 advances the active pilot route into swamp-pressure without collapsing the opening readability window", () => {
    const result = runOpeningWindow();

    expect(result.seenWaveIds.has("stage-1-swamp-pressure")).toBe(true);
    expect(result.continueOpened).toBe(false);
    expect(result.sessionGameOver).toBe(false);
  });

  it("CRD-103 projects visible hit, explosion, and pickup feedback during the opening combat band", () => {
    const result = runOpeningWindow();

    expect(result.visibleSignals.hit).toBe(true);
    expect(result.visibleSignals.explosion).toBe(true);
    expect(result.visibleSignals.pickup).toBe(true);
  });
});
