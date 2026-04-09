export type PlayerSlot = "player1" | "player2";

export interface Vector2 {
  x: number;
  y: number;
}

export interface PlayerInputState {
  move: Vector2;
  fire: boolean;
  bomb: boolean;
  focus: boolean;
}

export interface CapturedFrameInput {
  players: Record<PlayerSlot, PlayerInputState>;
}

export interface SimulationFrameInput {
  players: Partial<Record<PlayerSlot, PlayerInputState>>;
}

export interface PlayerState {
  id: PlayerSlot;
  position: Vector2;
  hitRadius: number;
  animation: "idle" | "bank-left" | "bank-right";
}

export interface EnemyState {
  id: string;
  position: Vector2;
  animation: "idle";
}

export type RuntimeEvent =
  | {
      type: "stage-started";
      stageId: string;
      atFrame: number;
    }
  | {
      type: "player-fired";
      playerId: PlayerSlot;
      atFrame: number;
    };

export interface SimulationState {
  frame: number;
  stageId: string;
  players: PlayerState[];
  enemies: EnemyState[];
  recentEvents: RuntimeEvent[];
}

export interface PresentationalEntity {
  id: string;
  x: number;
  y: number;
  animation: string;
}

export interface PresentationalScene {
  frame: number;
  stageId: string;
  players: PresentationalEntity[];
  enemies: PresentationalEntity[];
}

export interface AudioFrame {
  bgmCue: string | null;
  sfxCues: string[];
}
