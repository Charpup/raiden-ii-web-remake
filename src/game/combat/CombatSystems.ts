import type {
  ArenaBounds,
  BulletState,
  CheckpointState,
  CombatRules,
  MainWeaponType,
  PlayerInputState,
  PlayerRuntimeState,
  PlayerSlot,
  SubWeaponType,
  Vector2
} from "../core/types";

export interface BombResult {
  activated: boolean;
  player: PlayerRuntimeState;
  remainingBullets: BulletState[];
}

export interface DamageResult {
  outcome: "blocked" | "respawned" | "destroyed";
  player: PlayerRuntimeState;
  checkpointId: string;
}

export const defaultCombatRules: CombatRules = {
  moveSpeed: 6,
  focusMultiplier: 0.5,
  hitRadius: 6,
  maxMainWeaponLevel: 7,
  maxSubWeaponLevel: 4,
  bombInvulnerabilityFrames: 90,
  respawnInvulnerabilityFrames: 120,
  extendThresholds: [200_000, 600_000, 1_200_000],
  medalValues: [100, 200, 500, 1_000, 2_000],
  respawnMainWeaponLevel(previousLevel) {
    return Math.max(1, Math.ceil(previousLevel / 2));
  },
  respawnSubWeaponLevel(previousLevel) {
    return Math.max(1, Math.ceil(previousLevel / 2));
  }
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalize(vector: Vector2): Vector2 {
  const magnitude = Math.hypot(vector.x, vector.y);
  if (magnitude === 0 || magnitude <= 1) {
    return vector;
  }

  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude
  };
}

function awardExtends(
  player: PlayerRuntimeState,
  previousScore: number,
  rules: CombatRules
): PlayerRuntimeState {
  let awarded = 0;

  for (const threshold of rules.extendThresholds) {
    if (previousScore < threshold && player.score >= threshold) {
      awarded += 1;
    }
  }

  if (awarded === 0) {
    return player;
  }

  return {
    ...player,
    lives: player.lives + awarded,
    extendsAwarded: player.extendsAwarded + awarded
  };
}

export function createCombatPlayerState(
  id: PlayerSlot,
  overrides: Partial<PlayerRuntimeState> = {},
  rules: CombatRules = defaultCombatRules
): PlayerRuntimeState {
  return {
    id,
    position: { x: 160, y: 520 },
    hitRadius: rules.hitRadius,
    moveSpeed: rules.moveSpeed,
    focusMultiplier: rules.focusMultiplier,
    lives: 2,
    bombs: 3,
    invulnerableFrames: 0,
    score: 0,
    extendsAwarded: 0,
    medalTier: 0,
    mainWeapon: { type: "vulcan", level: 1 },
    subWeapon: null,
    active: true,
    animation: "idle",
    ...overrides
  };
}

export function advancePlayerMovement(
  player: PlayerRuntimeState,
  input: PlayerInputState,
  bounds: ArenaBounds,
  rules: CombatRules = defaultCombatRules
): PlayerRuntimeState {
  const direction = normalize(input.move);
  const speed = input.focus
    ? rules.moveSpeed * rules.focusMultiplier
    : rules.moveSpeed;
  const minX = rules.hitRadius;
  const maxX = Math.max(minX, bounds.width - rules.hitRadius);
  const minY = rules.hitRadius;
  const maxY = Math.max(minY, bounds.height - rules.hitRadius);

  return {
    ...player,
    position: {
      x: clamp(player.position.x + direction.x * speed, minX, maxX),
      y: clamp(player.position.y + direction.y * speed, minY, maxY)
    },
    hitRadius: rules.hitRadius,
    moveSpeed: rules.moveSpeed,
    focusMultiplier: rules.focusMultiplier,
    invulnerableFrames: Math.max(0, player.invulnerableFrames - 1),
    animation:
      direction.x < 0 ? "bank-left" : direction.x > 0 ? "bank-right" : "idle"
  };
}

export function applyMainWeaponPickup(
  player: PlayerRuntimeState,
  pickupType: MainWeaponType,
  rules: CombatRules = defaultCombatRules
): PlayerRuntimeState {
  const nextLevel =
    player.mainWeapon.type === pickupType
      ? Math.min(player.mainWeapon.level + 1, rules.maxMainWeaponLevel)
      : 1;

  return {
    ...player,
    mainWeapon: {
      type: pickupType,
      level: nextLevel
    }
  };
}

export function applySubWeaponPickup(
  player: PlayerRuntimeState,
  pickupType: SubWeaponType,
  rules: CombatRules = defaultCombatRules
): PlayerRuntimeState {
  const nextLevel =
    player.subWeapon?.type === pickupType
      ? Math.min(player.subWeapon.level + 1, rules.maxSubWeaponLevel)
      : 1;

  return {
    ...player,
    subWeapon: {
      type: pickupType,
      level: nextLevel
    }
  };
}

export function triggerBomb(
  player: PlayerRuntimeState,
  bullets: BulletState[],
  rules: CombatRules = defaultCombatRules
): BombResult {
  if (player.bombs <= 0) {
    return {
      activated: false,
      player,
      remainingBullets: bullets
    };
  }

  return {
    activated: true,
    player: {
      ...player,
      bombs: player.bombs - 1,
      invulnerableFrames: Math.max(
        player.invulnerableFrames,
        rules.bombInvulnerabilityFrames
      )
    },
    remainingBullets: []
  };
}

export function applyPlayerDamage(
  player: PlayerRuntimeState,
  checkpoint: CheckpointState,
  rules: CombatRules = defaultCombatRules
): DamageResult {
  if (player.invulnerableFrames > 0) {
    return {
      outcome: "blocked",
      player,
      checkpointId: checkpoint.checkpointId
    };
  }

  if (player.lives <= 0) {
    return {
      outcome: "destroyed",
      player: {
        ...player,
        active: false
      },
      checkpointId: checkpoint.checkpointId
    };
  }

  return {
    outcome: "respawned",
    checkpointId: checkpoint.checkpointId,
    player: {
      ...player,
      active: true,
      lives: player.lives - 1,
      position: { ...checkpoint.position },
      bombs: Math.max(1, player.bombs),
      invulnerableFrames: rules.respawnInvulnerabilityFrames,
      animation: "idle",
      mainWeapon: {
        ...player.mainWeapon,
        level: rules.respawnMainWeaponLevel(player.mainWeapon.level)
      },
      subWeapon: player.subWeapon
        ? {
            ...player.subWeapon,
            level: rules.respawnSubWeaponLevel(player.subWeapon.level)
          }
        : null
    }
  };
}

export function awardPoints(
  player: PlayerRuntimeState,
  points: number,
  rules: CombatRules = defaultCombatRules
): PlayerRuntimeState {
  const previousScore = player.score;
  const next = {
    ...player,
    score: player.score + points
  };

  return awardExtends(next, previousScore, rules);
}

export function collectMedal(
  player: PlayerRuntimeState,
  rules: CombatRules = defaultCombatRules
): PlayerRuntimeState {
  const medalTier = Math.min(player.medalTier, rules.medalValues.length - 1);
  const scoreAward = rules.medalValues[medalTier];
  const awarded = awardPoints(player, scoreAward, rules);

  return {
    ...awarded,
    medalTier: Math.min(player.medalTier + 1, rules.medalValues.length - 1)
  };
}
