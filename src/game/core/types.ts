export type SessionMode = "single" | "co-op";
export type CabinetProfile = "easy" | "hard";
export type PlayerSlot = "player1" | "player2";
export type MainWeaponType = "vulcan" | "laser" | "plasma";
export type SubWeaponType = "homing" | "straight";
export type PickupKind =
  | "medal"
  | "hidden-medal"
  | "fairy"
  | "miclus"
  | "main-vulcan"
  | "main-laser"
  | "main-plasma"
  | "sub-homing"
  | "sub-straight"
  | "bomb"
  | "extend";

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

export interface WeaponState<TType extends string> {
  type: TType;
  level: number;
}

export interface CombatRules {
  moveSpeed: number;
  focusMultiplier: number;
  hitRadius: number;
  maxMainWeaponLevel: number;
  maxSubWeaponLevel: number;
  bombInvulnerabilityFrames: number;
  respawnInvulnerabilityFrames: number;
  extendThresholds: number[];
  medalValues: number[];
  respawnMainWeaponLevel(previousLevel: number): number;
  respawnSubWeaponLevel(previousLevel: number): number;
}

export interface ArenaBounds {
  width: number;
  height: number;
}

export interface BulletState {
  id: string;
  owner: "player" | "enemy";
  position: Vector2;
  velocity: Vector2;
}

export interface CheckpointState {
  checkpointId: string;
  position: Vector2;
  waveCursor: number;
  scrollY: number;
}

export interface PlayerRuntimeState {
  id: PlayerSlot;
  position: Vector2;
  hitRadius: number;
  moveSpeed: number;
  focusMultiplier: number;
  lives: number;
  bombs: number;
  invulnerableFrames: number;
  score: number;
  extendsAwarded: number;
  medalTier: number;
  mainWeapon: WeaponState<MainWeaponType>;
  subWeapon: WeaponState<SubWeaponType> | null;
  active: boolean;
  animation: "idle" | "bank-left" | "bank-right";
}

export interface EnemyScriptedDefeatState {
  targetEnemyId: string;
  afterFrames: number;
}

export interface EnemyState {
  id: string;
  kind: string;
  position: Vector2;
  health: number;
  maxHealth: number;
  scoreValue: number;
  spawnedByWaveId: string;
  spawnedAtFrame: number;
  behaviorId?: string;
  scriptedDefeats?: EnemyScriptedDefeatState[];
  animation: "idle";
}

export interface RuntimePickupState {
  id: string;
  kind: PickupKind;
  position: Vector2;
  collected: boolean;
  scoreValue: number;
  sourceId?: string;
}

export interface BossRuntimeState {
  bossId: string;
  active: boolean;
  defeated: boolean;
  currentPhaseId: string | null;
  patternId: string | null;
  position: Vector2;
  health: number;
  maxHealth: number;
  enteredAtFrame: number | null;
  phaseEnteredAtFrame: number | null;
  parts: BossPartRuntimeState[];
}

export interface BossPartRuntimeState {
  id: string;
  position: Vector2;
  health: number;
  maxHealth: number;
  active: boolean;
}

export interface PendingSpawnState {
  waveId: string;
  spawnId: string;
  dueFrame: number;
}

export interface EnemyDefeatRecord {
  enemyId: string;
  sourceEnemyId?: string;
}

export interface StageRuntimeState {
  stageId: string;
  scrollY: number;
  waveCursor: number;
  checkpointCursor: number;
  armedCheckpointId: string | null;
  activeBossId: string | null;
  activeBossPhaseId: string | null;
  triggeredHiddenIds: string[];
  defeatedEnemyIds: string[];
  defeatedEnemyRecords: EnemyDefeatRecord[];
  pendingSpawns: PendingSpawnState[];
  completed: boolean;
}

export interface SessionConfig {
  mode: SessionMode;
  cabinetProfile: CabinetProfile;
  stageId: string;
  loopIndex: number;
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
    }
  | {
      type: "bomb-triggered";
      playerId: PlayerSlot;
      atFrame: number;
    }
  | {
      type: "wave-spawned";
      waveId: string;
      enemyIds: string[];
      atFrame: number;
    }
  | {
      type: "checkpoint-armed";
      checkpointId: string;
      atFrame: number;
    }
  | {
      type: "hidden-triggered";
      triggerId: string;
      pickupId: string;
      atFrame: number;
    }
  | {
      type: "boss-started";
      bossId: string;
      phaseId: string;
      atFrame: number;
    }
  | {
      type: "boss-phase-changed";
      bossId: string;
      phaseId: string;
      atFrame: number;
    }
  | {
      type: "player-respawned";
      playerId: PlayerSlot;
      checkpointId: string;
      atFrame: number;
    }
  | {
      type: "stage-cleared";
      stageId: string;
      atFrame: number;
    }
  | {
      type: "loop-advanced";
      loopIndex: number;
      atFrame: number;
    };

export interface SimulationState {
  frame: number;
  session: SessionConfig;
  players: PlayerRuntimeState[];
  enemies: EnemyState[];
  bullets: BulletState[];
  pickups: RuntimePickupState[];
  boss: BossRuntimeState | null;
  stage: StageRuntimeState;
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
  pickups: PresentationalEntity[];
  boss: PresentationalEntity | null;
  bossParts: PresentationalEntity[];
}

export interface AudioFrame {
  bgmCue: string | null;
  sfxCues: string[];
}
