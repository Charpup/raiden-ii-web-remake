import { describe, expect, it } from "vitest";

import { AudioDirector } from "../src/game/audio/AudioDirector";
import { GameClock } from "../src/game/core/GameClock";
import { Simulation } from "../src/game/core/Simulation";
import { createDefaultInputMapper } from "../src/game/input/InputMapper";
import { Renderer } from "../src/game/render/Renderer";

describe("Runtime foundation", () => {
  it("SIM-001 fixed-step accumulator emits exact frame count", () => {
    const clock = new GameClock();

    const result = clock.tick(50);

    expect(result.steps).toHaveLength(3);
    expect(result.remainderMs).toBeCloseTo(0, 4);
  });

  it("SIM-001 paused clock suppresses steps", () => {
    const clock = new GameClock();
    clock.pause();

    const result = clock.tick(50);

    expect(result.steps).toHaveLength(0);
  });

  it("SIM-002 background spike is clamped", () => {
    const clock = new GameClock({ maxDeltaMs: 100 });

    const result = clock.tick(400);

    expect(result.consumedDeltaMs).toBe(100);
    expect(result.steps).toHaveLength(6);
    expect(result.remainderMs).toBeCloseTo(0, 4);
  });

  it("SIM-002 resume continues from previous remainder", () => {
    const clock = new GameClock();

    const first = clock.tick(15);
    clock.pause();
    clock.resume();
    const second = clock.tick(20);

    expect(first.remainderMs).toBeGreaterThan(0);
    expect(second.steps).toHaveLength(2);
  });

  it("INP-001 keyboard mapping yields independent player controls", () => {
    const mapper = createDefaultInputMapper();

    const frame = mapper.captureFrame({
      keyboardPressed: ["ArrowUp", "KeyZ", "KeyD", "Comma"]
    });

    expect(frame.players.player1.move.y).toBe(-1);
    expect(frame.players.player1.fire).toBe(true);
    expect(frame.players.player2.move.x).toBe(1);
    expect(frame.players.player2.bomb).toBe(true);
  });

  it("INP-001 gamepad binding can target a specific player slot", () => {
    const mapper = createDefaultInputMapper();

    const frame = mapper.captureFrame({
      gamepads: [
        {
          player: "player2",
          axes: [0.4, -0.75],
          buttons: {
            fire: true
          }
        }
      ]
    });

    expect(frame.players.player1.fire).toBe(false);
    expect(frame.players.player2.move.x).toBeCloseTo(0.4);
    expect(frame.players.player2.move.y).toBeCloseTo(-0.75);
    expect(frame.players.player2.fire).toBe(true);
  });

  it("REN-001 renderer mirrors simulation entities without mutating rules", () => {
    const simulation = new Simulation();
    const state = simulation.step({ players: {} });
    const renderer = new Renderer();
    const frozen = JSON.parse(JSON.stringify(state));

    const scene = renderer.sync(state);

    expect(scene.players).toHaveLength(state.players.length);
    expect(scene.enemies).toHaveLength(state.enemies.length);
    expect(scene.stageId).toBe(state.stage.stageId);
    expect(scene.scrollY).toBe(state.stage.scrollY);
    expect(scene.backgroundLayers.length).toBeGreaterThan(0);
    expect(scene.players[0]?.spriteId).toBe("shared.player-ship");
    expect(state).toEqual(frozen);
  });

  it("REN-001 renderer projects the active boss when an encounter starts", () => {
    const simulation = new Simulation({ stageId: "stage-1" });
    const renderer = new Renderer();
    let state = simulation.getState();

    while (!state.boss?.active && state.frame < 60) {
      for (const enemy of state.enemies) {
        simulation.defeatEnemy(enemy.id);
      }

      state = simulation.step({ players: {} });
    }

    const scene = renderer.sync(state);

    expect(scene.boss?.id).toBe("stage-1-death-walkers");
    expect(scene.boss?.spriteId).toBe("shared.boss-walker-body");
    expect(scene.bossParts?.map((part) => part.id)).toEqual([
      "stage-1-walker-left",
      "stage-1-walker-right"
    ]);
    expect(scene.bossParts?.map((part) => part.spriteId)).toEqual([
      "shared.boss-walker-part",
      "shared.boss-walker-part"
    ]);
  });

  it("AUD-001 emits stage bgm and edge-triggered fire cues", () => {
    const simulation = new Simulation();
    const director = new AudioDirector();

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
    const first = director.sync(simulation.getState());

    simulation.step({ players: {} });
    const second = director.sync(simulation.getState());

    expect(first.bgmCue).toBe("bgm-stage-1");
    expect(first.sfxCues).toContain("sfx-player1-fire");
    expect(second.sfxCues).not.toContain("sfx-player1-fire");
  });

  it("AUD-001 does not duplicate cues when the same frame syncs twice", () => {
    const simulation = new Simulation();
    const director = new AudioDirector();

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

    const first = director.sync(simulation.getState());
    const second = director.sync(simulation.getState());

    expect(first.sfxCues).toContain("sfx-player1-fire");
    expect(second.sfxCues).toHaveLength(0);
  });
});
