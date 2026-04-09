import type { PresentationalScene, SimulationState } from "../core/types";

export class Renderer {
  sync(state: SimulationState): PresentationalScene {
    return {
      frame: state.frame,
      stageId: state.stage.stageId,
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
      })),
      pickups: state.pickups.map((pickup) => ({
        id: pickup.id,
        x: pickup.position.x,
        y: pickup.position.y,
        animation: pickup.kind
      })),
      boss:
        state.boss?.active
          ? {
              id: state.boss.bossId,
              x: state.boss.position.x,
              y: state.boss.position.y,
              animation: state.boss.currentPhaseId ?? "boss-idle"
            }
          : null
    };
  }
}
