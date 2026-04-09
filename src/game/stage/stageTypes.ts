import type { ArenaBounds, CabinetProfile, PickupKind, Vector2 } from "../core/types";

export type WaveTrigger =
  | {
      type: "scroll";
      scrollY: number;
    }
  | {
      type: "frame";
      frame: number;
    };

export interface SpawnDefinition {
  id: string;
  kind: string;
  position: Vector2;
  health: number;
  scoreValue: number;
}

export interface WaveDefinition {
  id: string;
  trigger: WaveTrigger;
  enemies: SpawnDefinition[];
}

export interface CheckpointDefinition {
  id: string;
  scrollY: number;
  position: Vector2;
  waveCursor: number;
}

export type HiddenTriggerCondition =
  | {
      type: "scroll";
      scrollY: number;
    }
  | {
      type: "enemy-destroyed";
      enemyId: string;
    };

export interface HiddenRewardDefinition {
  pickupId: string;
  kind: PickupKind;
  position: Vector2;
  scoreValue: number;
}

export interface HiddenTriggerDefinition {
  id: string;
  trigger: HiddenTriggerCondition;
  reward: HiddenRewardDefinition;
}

export interface BossPhaseDefinition {
  id: string;
  healthAtOrBelow: number;
}

export interface BossDefinition {
  id: string;
  trigger: {
    type: "waves-cleared";
    minScrollY: number;
  };
  position: Vector2;
  maxHealth: number;
  scoreValue: number;
  phases: BossPhaseDefinition[];
}

export interface DifficultyTuning {
  enemyHealthMultiplier: number;
  bossHealthMultiplier: number;
  scrollSpeedMultiplier: number;
}

export interface LoopTuning {
  enemyHealthMultiplierPerLoop: number;
  bossHealthMultiplierPerLoop: number;
  scrollSpeedMultiplierPerLoop: number;
}

export interface StageDefinition {
  id: string;
  name: string;
  arenaBounds: ArenaBounds;
  baseScrollSpeed: number;
  waves: WaveDefinition[];
  checkpoints: CheckpointDefinition[];
  hiddenTriggers: HiddenTriggerDefinition[];
  boss: BossDefinition | null;
  difficulty: Record<CabinetProfile, DifficultyTuning>;
  loopTuning: LoopTuning;
  loopAdvance?: {
    enabled: boolean;
    nextStageId: string;
  };
}
