import type {
  PlayerSlot,
  RuntimeEvent,
  SimulationFrameInput,
  SimulationState
} from "./types";

function createInitialPlayer(id: PlayerSlot, x: number): SimulationState["players"][0] {
  return {
    id,
    position: { x, y: 520 },
    hitRadius: 6,
    animation: "idle"
  };
}

function cloneState(state: SimulationState): SimulationState {
  return {
    frame: state.frame,
    stageId: state.stageId,
    players: state.players.map((player) => ({
      ...player,
      position: { ...player.position }
    })),
    enemies: state.enemies.map((enemy) => ({
      ...enemy,
      position: { ...enemy.position }
    })),
    recentEvents: state.recentEvents.map((event) => ({ ...event }))
  };
}

export class Simulation {
  private state: SimulationState = {
    frame: 0,
    stageId: "boot",
    players: [createInitialPlayer("player1", 180), createInitialPlayer("player2", 300)],
    enemies: [],
    recentEvents: []
  };

  private pendingEvents: RuntimeEvent[] = [];

  queueEvent(event: RuntimeEvent): void {
    this.pendingEvents.push(event);
  }

  step(_frameInput: SimulationFrameInput): SimulationState {
    this.state.frame += 1;
    this.state.recentEvents = this.pendingEvents.map((event) => ({ ...event }));
    this.pendingEvents = [];

    for (const event of this.state.recentEvents) {
      if (event.type === "stage-started") {
        this.state.stageId = event.stageId;
      }
    }

    return this.getState();
  }

  getState(): SimulationState {
    return cloneState(this.state);
  }
}
