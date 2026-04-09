import type {
  ArenaBounds,
  CabinetProfile,
  EnemyScriptedDefeatState,
  PickupKind,
  Vector2
} from "../core/types";

export type WaveTrigger =
  | {
      type: "scroll";
      scrollY: number;
    }
  | {
      type: "frame";
      frame: number;
    }
  | {
      type: "all-enemies-destroyed";
      enemyIds: string[];
    };

export interface SpawnDefinition {
  id: string;
  kind: string;
  position: Vector2;
  health: number;
  scoreValue: number;
  spawnOffsetFrames?: number;
  behaviorId?: string;
  scriptedDefeats?: EnemyScriptedDefeatState[];
}

export interface WaveDefinition {
  id: string;
  trigger: WaveTrigger;
  enemies: SpawnDefinition[];
  cabinetProfiles?: CabinetProfile[];
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
    }
  | {
      type: "enemy-destroyed-by";
      enemyId: string;
      sourceEnemyId: string;
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
  rewardOverrides?: Partial<Record<CabinetProfile, HiddenRewardDefinition>>;
  checkpointRespawnRewards?: HiddenRewardDefinition[];
}

export interface BossPhaseDefinition {
  id: string;
  healthAtOrBelow: number;
  patternId?: string;
}

export interface BossPartDefinition {
  id: string;
  position: Vector2;
  maxHealth: number;
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
  parts?: BossPartDefinition[];
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
