import type { PresentationalScene, SimulationState } from "../core/types";

export class Renderer {
  sync(state: SimulationState): PresentationalScene {
    return {
      frame: state.frame,
      stageId: state.stageId,
      players: state.players.map((player) => ({
        id: player.id,
        x: player.position.x,
        y: player.position.y,
        animation: player.animation
      })),
      enemies: state.enemies.map((enemy) => ({
        id: enemy.id,
        x: enemy.position.x,
        y: enemy.position.y,
        animation: enemy.animation
      }))
    };
  }
}
