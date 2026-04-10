import {
  advancePlayerMovement,
  applyPickupToPlayer,
  applyPlayerDamage as applyCombatDamage,
  awardPoints,
  createCombatPlayerState,
  resetPlayerForContinue,
  triggerBomb
} from "../combat/CombatSystems";
import { StageRunner } from "../stage/StageRunner";
import type {
  CabinetRules,
  CheckpointState,
  CombatRules,
  PlayerInputState,
  PlayerRuntimeState,
  PlayerSlot,
  RuntimeEvent,
  SessionConfig,
  SessionFlowState,
  SimulationFrameInput,
  SimulationState
} from "./types";
import { getCabinetRules, getCombatRulesForCabinet } from "./cabinetRules";

function clonePlayer(player: PlayerRuntimeState): PlayerRuntimeState {
  return {
    ...player,
    position: { ...player.position },
    mainWeapon: { ...player.mainWeapon },
    subWeapon: player.subWeapon ? { ...player.subWeapon } : null
  };
}

function cloneCabinetRules(cabinetRules: CabinetRules): CabinetRules {
  return {
    ...cabinetRules,
    extendThresholds: [...cabinetRules.extendThresholds]
  };
}

function cloneState(state: SimulationState): SimulationState {
  return {
    frame: state.frame,
    session: { ...state.session },
    cabinetRules: cloneCabinetRules(state.cabinetRules),
    flow: state.flow,
    players: state.players.map(clonePlayer),
    enemies: state.enemies.map((enemy) => ({
      ...enemy,
      position: { ...enemy.position },
      stateTransitions: enemy.stateTransitions?.map((transition) => ({ ...transition })),
      scriptedDefeats: enemy.scriptedDefeats?.map((defeat) => ({ ...defeat }))
    })),
    bullets: state.bullets.map((bullet) => ({
      ...bullet,
      position: { ...bullet.position },
      velocity: { ...bullet.velocity }
    })),
    pickups: state.pickups.map((pickup) => ({
      ...pickup,
      position: { ...pickup.position }
    })),
    effects: state.effects.map((effect) => ({
      ...effect,
      position: { ...effect.position }
    })),
    boss: state.boss
      ? {
          ...state.boss,
          position: { ...state.boss.position },
          parts: state.boss.parts.map((part) => ({
            ...part,
            position: { ...part.position }
          }))
        }
      : null,
    stage: {
      ...state.stage,
      triggeredHiddenIds: [...state.stage.triggeredHiddenIds],
      defeatedEnemyIds: [...state.stage.defeatedEnemyIds],
      defeatedEnemyRecords: state.stage.defeatedEnemyRecords.map((record) => ({ ...record })),
      pendingSpawns: state.stage.pendingSpawns.map((pending) => ({ ...pending }))
    },
    recentEvents: state.recentEvents.map((event) => ({ ...event }))
  };
}

function emptyPlayerInput(): PlayerInputState {
  return {
    move: { x: 0, y: 0 },
    fire: false,
    bomb: false,
    focus: false
  };
}

function createDefaultSession(
  overrides: Partial<SessionConfig> = {}
): SessionConfig {
  return {
    mode: "single",
    cabinetProfile: "easy",
    stageId: "stage-1",
    loopIndex: 0,
    ...overrides
  };
}

function createInitialPlayers(
  session: SessionConfig,
  width: number,
  cabinetRules: CabinetRules,
  combatRules: CombatRules
): PlayerRuntimeState[] {
  const openingInvulnerabilityFrames = combatRules.initialSpawnInvulnerabilityFrames;

  if (session.mode === "co-op") {
    return [
      createCombatPlayerState(
        "player1",
        {
          position: { x: width / 2 - 44, y: 520 },
          lives: cabinetRules.startingLives,
          bombs: cabinetRules.startingBombs,
          invulnerableFrames: openingInvulnerabilityFrames
        },
        combatRules
      ),
      createCombatPlayerState(
        "player2",
        {
          position: { x: width / 2 + 44, y: 520 },
          lives: cabinetRules.startingLives,
          bombs: cabinetRules.startingBombs,
          invulnerableFrames: openingInvulnerabilityFrames
        },
        combatRules
      )
    ];
  }

  return [
    createCombatPlayerState(
      "player1",
      {
        position: { x: width / 2, y: 520 },
        lives: cabinetRules.startingLives,
        bombs: cabinetRules.startingBombs,
        invulnerableFrames: openingInvulnerabilityFrames
      },
      combatRules
    )
  ];
}

function getStageStartPositions(
  session: SessionConfig,
  width: number
): Record<PlayerSlot, { x: number; y: number }> {
  if (session.mode === "co-op") {
    return {
      player1: { x: width / 2 - 44, y: 520 },
      player2: { x: width / 2 + 44, y: 520 }
    };
  }

  return {
    player1: { x: width / 2, y: 520 },
    player2: { x: width / 2 + 44, y: 520 }
  };
}

function resolveSessionFlow(players: PlayerRuntimeState[]): SessionFlowState {
  const joinedPlayers = players.filter((player) => player.joined);
  const hasContinuePending = joinedPlayers.some(
    (player) => player.lifeState === "continue-pending"
  );

  if (hasContinuePending) {
    return "continue";
  }

  const hasPlayablePlayer = joinedPlayers.some(
    (player) => player.lifeState === "alive" || player.lifeState === "respawning"
  );

  if (joinedPlayers.length > 0 && !hasPlayablePlayer) {
    return "session-game-over";
  }

  return "playing";
}

type EnemyMovementProfile = (
  enemy: SimulationState["enemies"][number],
  bounds: ReturnType<StageRunner["getArenaBounds"]>,
  age: number
) => { x: number; y: number };

interface EnemyFireProfile {
  startDelayFrames: number;
  intervalFrames: number;
  aimedProjectileSpeed?: number;
  spreadProjectiles?: { x: number; y: number }[];
}

export function resolveEnemyBehaviorKey(
  enemy: Pick<SimulationState["enemies"][number], "behaviorId" | "behaviorVariantId">
): string | null {
  return enemy.behaviorVariantId ?? enemy.behaviorId ?? null;
}

export const enemyMovementProfiles: Record<string, EnemyMovementProfile> = {
  "scoutcraft-swoop": (enemy, bounds) => ({
    x: enemy.position.x < bounds.width / 2 ? 0.55 : -0.55,
    y: 2.8
  }),
  "escort-sweep": (enemy, bounds) => ({
    x: enemy.position.x < bounds.width / 2 ? 0.35 : -0.35,
    y: 2.2
  }),
  "warplane-strafe": (enemy, bounds) => ({
    x: enemy.position.x < bounds.width / 2 ? 0.9 : -0.9,
    y: 2.1
  }),
  "carrier-drift": (_enemy, _bounds, age) => ({
    x: Math.sin(age / 7) * 0.4,
    y: 1.7
  }),
  "ground-lane-advance": () => ({
    x: 0,
    y: 1.2
  }),
  "fixed-aimed-burst": () => ({
    x: 0,
    y: 0.95
  }),
  "gunboat-midline": (_enemy, _bounds, age) => ({
    x: Math.sin(age / 9) * 0.24,
    y: 1.25
  }),
  "static-scenery": () => ({
    x: 0,
    y: 0.95
  }),
  "stage1-opening-scout-readable": (enemy, bounds) => ({
    x: enemy.position.x < bounds.width / 2 ? 0.42 : -0.42,
    y: 2.45
  }),
  "stage1-escort-readable": (enemy, bounds) => ({
    x: enemy.position.x < bounds.width / 2 ? 0.24 : -0.24,
    y: 1.95
  }),
  "stage1-warplane-readable": (enemy, bounds) => ({
    x: enemy.position.x < bounds.width / 2 ? 0.68 : -0.68,
    y: 1.82
  }),
  "stage1-carrier-readable": (_enemy, _bounds, age) => ({
    x: Math.sin(age / 10) * 0.3,
    y: 1.38
  }),
  "stage1-ground-readable": () => ({
    x: 0,
    y: 1.02
  }),
  "stage1-fixed-burst-readable": () => ({
    x: 0,
    y: 0.82
  }),
  "stage1-gunboat-readable": (_enemy, _bounds, age) => ({
    x: Math.sin(age / 11) * 0.18,
    y: 1.02
  }),
  "amphibious-midboss": (enemy, bounds) => ({
    x: enemy.position.x < bounds.width / 2 ? 0.16 : -0.16,
    y: 0.88
  }),
  "barge-broadside": (enemy, bounds, age) => ({
    x: enemy.position.x < bounds.width / 2 ? 0.12 : -0.12,
    y: 1.02 + Math.sin(age / 14) * 0.05
  }),
  "bomber-lane": (_enemy, _bounds, age) => ({
    x: Math.sin(age / 16) * 0.2,
    y: 1.58
  }),
  "dash-across": (enemy, bounds) => ({
    x: enemy.position.x < bounds.width / 2 ? 2.8 : -2.8,
    y: 0.18
  }),
  "escape-crystal": (_enemy, _bounds, age) => ({
    x: Math.sin(age / 6) * 0.25,
    y: 0.72
  }),
  "rail-strafe": (enemy, bounds) => ({
    x: enemy.position.x < bounds.width / 2 ? 0.32 : -0.32,
    y: 1.28
  }),
  "roaming-crystal": (_enemy, _bounds, age) => ({
    x: Math.sin(age / 8) * 1.4,
    y: 0.58
  })
};

export const enemyFireProfiles: Record<string, EnemyFireProfile> = {
  "fixed-aimed-burst": {
    startDelayFrames: 18,
    intervalFrames: 48,
    aimedProjectileSpeed: 3.9
  },
  "ground-lane-advance": {
    startDelayFrames: 42,
    intervalFrames: 84,
    aimedProjectileSpeed: 3.4
  },
  "scoutcraft-swoop": {
    startDelayFrames: 28,
    intervalFrames: 54,
    aimedProjectileSpeed: 4.2
  },
  "escort-sweep": {
    startDelayFrames: 28,
    intervalFrames: 54,
    aimedProjectileSpeed: 4.2
  },
  "warplane-strafe": {
    startDelayFrames: 14,
    intervalFrames: 36,
    aimedProjectileSpeed: 4.7
  },
  "gunboat-midline": {
    startDelayFrames: 20,
    intervalFrames: 46,
    spreadProjectiles: [
      { x: -1.1, y: 3.8 },
      { x: 0, y: 4.1 },
      { x: 1.1, y: 3.8 }
    ]
  },
  "stage1-opening-scout-readable": {
    startDelayFrames: 48,
    intervalFrames: 84,
    aimedProjectileSpeed: 3.35
  },
  "stage1-escort-readable": {
    startDelayFrames: 54,
    intervalFrames: 88,
    aimedProjectileSpeed: 3.4
  },
  "stage1-warplane-readable": {
    startDelayFrames: 32,
    intervalFrames: 76,
    aimedProjectileSpeed: 3.85
  },
  "stage1-ground-readable": {
    startDelayFrames: 74,
    intervalFrames: 118,
    aimedProjectileSpeed: 2.95
  },
  "stage1-fixed-burst-readable": {
    startDelayFrames: 68,
    intervalFrames: 112,
    aimedProjectileSpeed: 3.05
  },
  "stage1-gunboat-readable": {
    startDelayFrames: 52,
    intervalFrames: 92,
    spreadProjectiles: [
      { x: -0.9, y: 3.35 },
      { x: 0, y: 3.65 },
      { x: 0.9, y: 3.35 }
    ]
  },
  "amphibious-midboss": {
    startDelayFrames: 26,
    intervalFrames: 48,
    spreadProjectiles: [
      { x: -0.8, y: 3.35 },
      { x: 0, y: 3.7 },
      { x: 0.8, y: 3.35 }
    ]
  },
  "barge-broadside": {
    startDelayFrames: 24,
    intervalFrames: 42,
    spreadProjectiles: [
      { x: -1.1, y: 3.25 },
      { x: 0, y: 3.6 },
      { x: 1.1, y: 3.25 }
    ]
  },
  "bomber-lane": {
    startDelayFrames: 30,
    intervalFrames: 46,
    spreadProjectiles: [
      { x: -1.2, y: 3.5 },
      { x: 0, y: 3.9 },
      { x: 1.2, y: 3.5 }
    ]
  },
  "escape-crystal": {
    startDelayFrames: 40,
    intervalFrames: 88,
    aimedProjectileSpeed: 3.2
  },
  "rail-strafe": {
    startDelayFrames: 18,
    intervalFrames: 48,
    aimedProjectileSpeed: 4.1
  },
  "roaming-crystal": {
    startDelayFrames: 28,
    intervalFrames: 52,
    aimedProjectileSpeed: 3.5
  }
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class Simulation {
  private readonly stageRunner = new StageRunner();

  private readonly cabinetRules: CabinetRules;

  private readonly combatRules: CombatRules;

  private bootstrapStageEventPending = true;

  private pendingEvents: RuntimeEvent[] = [];

  private state: SimulationState;

  constructor(config: Partial<SessionConfig> = {}) {
    const session = createDefaultSession(config);
    const bounds = this.stageRunner.getArenaBounds(session.stageId);

    this.cabinetRules = getCabinetRules(session.cabinetProfile);
    this.combatRules = getCombatRulesForCabinet(session.cabinetProfile);

    this.state = {
      frame: 0,
      session,
      cabinetRules: cloneCabinetRules(this.cabinetRules),
      flow: "playing",
      players: createInitialPlayers(session, bounds.width, this.cabinetRules, this.combatRules),
      enemies: [],
      bullets: [],
      pickups: [],
      effects: [],
      boss: null,
      stage: this.stageRunner.createInitialStageState(session.stageId),
      recentEvents: []
    };
  }

  step(frameInput: SimulationFrameInput): SimulationState {
    const nextState = cloneState(this.state);
    nextState.frame += 1;
    nextState.effects = this.advanceEffects(nextState.effects);
    const events = this.consumePendingEvents();

    if (this.bootstrapStageEventPending) {
      events.push({
        type: "stage-started",
        stageId: nextState.stage.stageId,
        atFrame: nextState.frame
      });
      this.bootstrapStageEventPending = false;
    }

    nextState.players = nextState.players.map((player) =>
      this.advanceContinueCountdown(player, nextState.frame, events)
    );

    const bounds = this.stageRunner.getArenaBounds(nextState.stage.stageId);
    nextState.players = nextState.players.map((player) => {
      if (!this.canProcessGameplayInput(player)) {
        return player;
      }

      const input = frameInput.players[player.id] ?? emptyPlayerInput();
      let nextPlayer = advancePlayerMovement(
        player,
        input,
        bounds,
        this.combatRules
      );

      if (nextPlayer.lifeState === "respawning" && nextPlayer.invulnerableFrames === 0) {
        nextPlayer = {
          ...nextPlayer,
          lifeState: "alive"
        };
      }

      if (input.fire && nextPlayer.active) {
        nextState.bullets.push(...this.createPlayerVolley(nextPlayer, nextState.frame));
        events.push({
          type: "player-fired",
          playerId: player.id,
          atFrame: nextState.frame
        });
      }

      if (input.bomb && nextPlayer.active) {
        const bombResult = triggerBomb(
          nextPlayer,
          nextState.bullets,
          this.combatRules
        );
        nextPlayer = bombResult.player;
        nextState.bullets = bombResult.remainingBullets;

        if (bombResult.activated) {
          events.push({
            type: "bomb-triggered",
            playerId: player.id,
            atFrame: nextState.frame
          });
        }
      }

      return nextPlayer;
    });

    const hasPlayablePlayers = this.hasPlayablePlayers(nextState.players);

    if (hasPlayablePlayers) {
      const stageAdvance = this.stageRunner.advance(nextState);
      nextState.stage = stageAdvance.stage;
      nextState.enemies = stageAdvance.enemies;
      nextState.pickups = stageAdvance.pickups;
      nextState.boss = stageAdvance.boss;
      events.push(...stageAdvance.events);

      if (stageAdvance.clearedThisFrame && stageAdvance.clearTransition) {
        const clearedStageId = nextState.stage.stageId;
        const nextLoopIndex =
          nextState.session.loopIndex + (stageAdvance.clearTransition.incrementLoop ? 1 : 0);

        if (stageAdvance.clearTransition.incrementLoop) {
          nextState.session = {
            ...nextState.session,
            loopIndex: nextLoopIndex
          };
          events.push({
            type: "loop-advanced",
            loopIndex: nextLoopIndex,
            atFrame: nextState.frame
          });
        }

        if (stageAdvance.clearTransition.enterEnding) {
          events.push({
            type: "ending-started",
            stageId: clearedStageId,
            nextStageId: stageAdvance.clearTransition.nextStageId,
            loopIndex: nextLoopIndex,
            atFrame: nextState.frame
          });
        }

        const nextStageId = stageAdvance.clearTransition.nextStageId;
        const nextBounds = this.stageRunner.getArenaBounds(nextStageId);
        const nextPositions = getStageStartPositions(nextState.session, nextBounds.width);

        nextState.session = {
          ...nextState.session,
          stageId: nextStageId,
          loopIndex: nextLoopIndex
        };
        nextState.stage = this.stageRunner.createInitialStageState(nextStageId);
        nextState.enemies = [];
        nextState.bullets = [];
        nextState.pickups = [];
        nextState.boss = null;
        nextState.players = nextState.players.map((player) =>
          player.joined
            ? {
                ...player,
                position: { ...nextPositions[player.id] },
                invulnerableFrames: this.combatRules.initialSpawnInvulnerabilityFrames,
                continueFramesRemaining: null,
                lifeState: "alive",
                active: true,
                animation: "idle"
              }
            : player
        );
        this.bootstrapStageEventPending = true;
      }
    }

    const activeBounds = this.stageRunner.getArenaBounds(nextState.stage.stageId);

    if (hasPlayablePlayers) {
      nextState.enemies = this.advanceEnemyBehaviors(
        nextState.enemies,
        activeBounds,
        nextState.frame
      );
      this.advanceBossBehavior(nextState, activeBounds);
      this.spawnEnemyProjectiles(nextState);
      nextState.bullets = this.advanceBullets(nextState.bullets, activeBounds);
      this.resolvePlayerBulletCollisions(nextState, events);
      this.resolveEnemyThreats(nextState, events);
      this.collectTouchingPickups(nextState, events);
    }

    nextState.flow = this.updateSessionFlow(nextState.players, nextState.flow, nextState.frame, events);

    nextState.recentEvents = events;
    this.state = nextState;
    return this.getState();
  }

  getState(): SimulationState {
    return cloneState(this.state);
  }

  joinPlayer(playerId: PlayerSlot): boolean {
    if (this.state.session.mode !== "co-op") {
      return false;
    }

    const index = this.state.players.findIndex((player) => player.id === playerId);
    if (index === -1) {
      return false;
    }

    const player = this.state.players[index];
    if (
      (player.joined && player.active) ||
      player.lifeState === "continue-pending"
    ) {
      return false;
    }

    const checkpoint = this.getPlayerCheckpoint(playerId);
    this.state.players[index] = resetPlayerForContinue(
      {
        ...player,
        joined: true
      },
      checkpoint,
      {
        lives: this.cabinetRules.startingLives,
        bombs: this.cabinetRules.startingBombs
      },
      this.combatRules
    );
    this.pendingEvents.push({
      type: "player-joined",
      playerId,
      atFrame: this.state.frame + 1
    });
    this.pendingEvents.push({
      type: "player-respawned",
      playerId,
      checkpointId: checkpoint.checkpointId,
      atFrame: this.state.frame + 1
    });
    this.state.flow = resolveSessionFlow(this.state.players);

    return true;
  }

  acceptContinue(playerId: PlayerSlot): boolean {
    const index = this.state.players.findIndex((player) => player.id === playerId);
    if (index === -1) {
      return false;
    }

    const player = this.state.players[index];
    if (player.lifeState !== "continue-pending" || !this.cabinetRules.continueEnabled) {
      return false;
    }

    const checkpoint = this.getPlayerCheckpoint(playerId);
    this.state.players[index] = resetPlayerForContinue(
      player,
      checkpoint,
      {
        lives: this.cabinetRules.startingLives,
        bombs: this.cabinetRules.startingBombs
      },
      this.combatRules
    );

    if (this.state.session.mode === "single") {
      this.state.stage = this.stageRunner.restoreStageFromCheckpoint(this.state.stage);
      this.state.enemies = [];
      this.state.bullets = [];
      this.state.pickups = this.stageRunner.createCheckpointRespawnRewards(this.state.stage);
      this.state.boss = null;
    }

    this.pendingEvents.push({
      type: "continue-accepted",
      playerId,
      atFrame: this.state.frame + 1
    });
    this.pendingEvents.push({
      type: "player-respawned",
      playerId,
      checkpointId: checkpoint.checkpointId,
      atFrame: this.state.frame + 1
    });
    this.state.flow = resolveSessionFlow(this.state.players);

    return true;
  }

  collectPickup(pickupId: string, playerId: PlayerSlot): boolean {
    const pickupIndex = this.state.pickups.findIndex((pickup) => pickup.id === pickupId);
    const playerIndex = this.state.players.findIndex((player) => player.id === playerId);
    if (pickupIndex === -1 || playerIndex === -1) {
      return false;
    }

    const pickup = this.state.pickups[pickupIndex];
    const player = this.state.players[playerIndex];
    if (pickup.collected || !player.joined || !player.active) {
      return false;
    }

    this.state.players[playerIndex] = applyPickupToPlayer(player, pickup, this.combatRules);
    this.state.pickups[pickupIndex] = {
      ...pickup,
      collected: true,
      collectedByPlayerId: playerId
    };
    this.pendingEvents.push({
      type: "pickup-collected",
      playerId,
      pickupId,
      pickupKind: pickup.kind,
      atFrame: this.state.frame + 1
    });

    return true;
  }

  applyPlayerDamage(playerId: PlayerSlot): void {
    const index = this.state.players.findIndex((player) => player.id === playerId);
    if (index === -1) {
      return;
    }

    const player = this.state.players[index];
    if (!player.joined || player.lifeState === "continue-pending" || player.lifeState === "game-over") {
      return;
    }

    const checkpoint = this.getPlayerCheckpoint(playerId);
    const previousFlow = this.state.flow;
    const result = applyCombatDamage(
      player,
      checkpoint,
      this.combatRules
    );

    if (result.outcome === "blocked") {
      this.state.players[index] = result.player;
      return;
    }

    if (result.outcome === "respawned") {
      this.state.players[index] = {
        ...result.player,
        joined: true,
        lifeState: "respawning",
        continueFramesRemaining: null,
        active: true
      };

      if (this.state.session.mode === "single") {
        this.state.stage = this.stageRunner.restoreStageFromCheckpoint(this.state.stage);
        this.state.enemies = [];
        this.state.bullets = [];
        this.state.pickups = this.stageRunner.createCheckpointRespawnRewards(this.state.stage);
        this.state.boss = null;
      }

      this.pendingEvents.push({
        type: "player-respawned",
        playerId,
        checkpointId: checkpoint.checkpointId,
        atFrame: this.state.frame + 1
      });
      this.state.flow = resolveSessionFlow(this.state.players);
      return;
    }

    if (this.cabinetRules.continueEnabled) {
      this.state.players[index] = {
        ...result.player,
        joined: true,
        lifeState: "continue-pending",
        continueFramesRemaining: this.cabinetRules.continueCountdownFrames,
        active: false
      };
      this.pendingEvents.push({
        type: "continue-opened",
        playerId,
        countdownFrames: this.cabinetRules.continueCountdownFrames,
        atFrame: this.state.frame + 1
      });
    } else {
      this.state.players[index] = {
        ...result.player,
        joined: true,
        lifeState: "game-over",
        continueFramesRemaining: null,
        active: false
      };
      this.pendingEvents.push({
        type: "player-game-over",
        playerId,
        atFrame: this.state.frame + 1
      });
    }

    this.state.flow = resolveSessionFlow(this.state.players);
    if (previousFlow !== "session-game-over" && this.state.flow === "session-game-over") {
      this.pendingEvents.push({
        type: "session-game-over",
        atFrame: this.state.frame + 1
      });
    }
  }

  defeatEnemy(
    enemyId: string,
    options?: {
      sourcePlayerId?: PlayerSlot;
      sourceEnemyId?: string;
    }
  ): void {
    const defeatedEnemy = this.state.enemies.find((enemy) => enemy.id === enemyId) ?? null;
    const before = this.state.enemies.length;
    this.state.enemies = this.state.enemies.filter((enemy) => enemy.id !== enemyId);

    if (
      before !== this.state.enemies.length &&
      defeatedEnemy &&
      !this.state.stage.defeatedEnemyIds.includes(enemyId)
    ) {
      if (options?.sourcePlayerId) {
        const playerIndex = this.state.players.findIndex(
          (player) => player.id === options.sourcePlayerId
        );

        if (playerIndex >= 0) {
          this.state.players[playerIndex] = awardPoints(
            this.state.players[playerIndex],
            defeatedEnemy.scoreValue,
            this.combatRules
          );
        }
      }

      this.state.stage = {
        ...this.state.stage,
        defeatedEnemyIds: [...this.state.stage.defeatedEnemyIds, enemyId],
        defeatedEnemyRecords: [
          ...this.state.stage.defeatedEnemyRecords,
          {
            enemyId,
            sourcePlayerId: options?.sourcePlayerId,
            sourceEnemyId: options?.sourceEnemyId,
            atFrame: this.state.frame,
            enemyAgeFrames: this.state.frame - defeatedEnemy.spawnedAtFrame,
            stateTag: defeatedEnemy.stateTag
          }
        ]
      };
    }
  }

  applyBossDamage(amount: number): void {
    if (!this.state.boss || !this.state.boss.active || this.state.boss.defeated) {
      return;
    }

    if (this.state.boss.parts.length > 0) {
      const nextPart = this.state.boss.parts.find((part) => part.active);
      if (!nextPart) {
        return;
      }

      this.applyBossPartDamage(nextPart.id, amount);
      return;
    }

    const nextHealth = Math.max(0, this.state.boss.health - amount);
    this.state.boss = {
      ...this.state.boss,
      health: nextHealth,
      defeated: nextHealth === 0
    };
  }

  applyBossPartDamage(partId: string, amount: number): void {
    if (!this.state.boss || !this.state.boss.active || this.state.boss.defeated) {
      return;
    }

    let changed = false;
    const nextParts = this.state.boss.parts.map((part) => {
      if (part.id !== partId || !part.active) {
        return part;
      }

      changed = true;
      const nextHealth = Math.max(0, part.health - amount);

      return {
        ...part,
        health: nextHealth,
        active: nextHealth > 0
      };
    });

    if (!changed) {
      return;
    }

    const nextHealth = nextParts.reduce((total, part) => total + part.health, 0);
    this.state.boss = {
      ...this.state.boss,
      parts: nextParts,
      health: nextHealth,
      defeated: nextHealth === 0
    };
  }

  private advanceContinueCountdown(
    player: PlayerRuntimeState,
    frame: number,
    events: RuntimeEvent[]
  ): PlayerRuntimeState {
    if (
      player.lifeState !== "continue-pending" ||
      player.continueFramesRemaining === null
    ) {
      return player;
    }

    const continueFramesRemaining = Math.max(0, player.continueFramesRemaining - 1);
    if (continueFramesRemaining > 0) {
      return {
        ...player,
        continueFramesRemaining,
        active: false
      };
    }

    events.push({
      type: "player-game-over",
      playerId: player.id,
      atFrame: frame
    });

    return {
      ...player,
      lifeState: "game-over",
      continueFramesRemaining: null,
      active: false
    };
  }

  private canProcessGameplayInput(player: PlayerRuntimeState): boolean {
    return (
      player.joined &&
      player.active &&
      (player.lifeState === "alive" || player.lifeState === "respawning")
    );
  }

  private hasPlayablePlayers(players: PlayerRuntimeState[]): boolean {
    return players.some((player) => this.canProcessGameplayInput(player));
  }

  private updateSessionFlow(
    players: PlayerRuntimeState[],
    previousFlow: SessionFlowState,
    frame: number,
    events: RuntimeEvent[]
  ): SessionFlowState {
    const nextFlow = resolveSessionFlow(players);

    if (previousFlow !== "session-game-over" && nextFlow === "session-game-over") {
      events.push({
        type: "session-game-over",
        atFrame: frame
      });
    }

    return nextFlow;
  }

  private getPlayerCheckpoint(playerId: PlayerSlot): CheckpointState {
    const checkpoint = this.stageRunner.getCheckpointState(this.state.stage);
    const bounds = this.stageRunner.getArenaBounds(this.state.stage.stageId);
    const offset =
      this.state.session.mode === "co-op" && playerId === "player2" ? 22 : 0;

    return {
      ...checkpoint,
      position: {
        x: clamp(checkpoint.position.x + offset, 0, bounds.width),
        y: checkpoint.position.y
      }
    };
  }

  private advanceEffects(effects: SimulationState["effects"]): SimulationState["effects"] {
    return effects
      .map((effect) => ({
        ...effect,
        framesRemaining: effect.framesRemaining - 1
      }))
      .filter((effect) => effect.framesRemaining > 0);
  }

  private pushEffect(
    nextState: SimulationState,
    kind: SimulationState["effects"][number]["kind"],
    position: { x: number; y: number },
    totalFrames: number
  ): void {
    nextState.effects.push({
      id: `${kind}-${nextState.frame}-${nextState.effects.length}`,
      kind,
      position: { x: position.x, y: position.y },
      framesRemaining: totalFrames,
      totalFrames
    });
  }

  private createPlayerVolley(player: PlayerRuntimeState, frame: number) {
    const level = player.mainWeapon.level;
    const offsets =
      level >= 5 ? [-10, 0, 10] : level >= 3 ? [-7, 7] : [0];
    const speed =
      player.mainWeapon.type === "laser"
        ? 13
        : player.mainWeapon.type === "plasma"
          ? 10
          : 11;

    return offsets.map((offset, index) => ({
      id: `${player.id}-bullet-${frame}-${index}`,
      owner: "player" as const,
      sourcePlayerId: player.id,
      damage: player.mainWeapon.type === "laser" ? 10 : 8,
      position: {
        x: clamp(player.position.x + offset, 0, this.stageRunner.getArenaBounds(this.state.stage.stageId).width),
        y: player.position.y - 20
      },
      velocity: {
        x: offset === 0 ? 0 : offset > 0 ? 0.3 : -0.3,
        y: -speed
      }
    }));
  }

  private advanceBossBehavior(
    nextState: SimulationState,
    bounds: ReturnType<StageRunner["getArenaBounds"]>
  ): void {
    if (!nextState.boss?.active || nextState.boss.defeated || nextState.boss.enteredAtFrame === null) {
      return;
    }

    const oscillation = Math.sin((nextState.frame - nextState.boss.enteredAtFrame) / 28) * 24;
    const nextX = clamp(bounds.width / 2 + oscillation, 72, bounds.width - 72);
    const currentBoss = nextState.boss;
    const partOffsets = currentBoss.parts.map((part) => ({
      id: part.id,
      dx: part.position.x - currentBoss.position.x,
      dy: part.position.y - currentBoss.position.y
    }));

    nextState.boss = {
      ...currentBoss,
      position: {
        x: nextX,
        y: currentBoss.position.y
      },
      parts: currentBoss.parts.map((part) => {
        const offset = partOffsets.find((candidate) => candidate.id === part.id);
        return {
          ...part,
          position: offset
            ? {
                x: nextX + offset.dx,
                y: currentBoss.position.y + offset.dy
              }
            : part.position
        };
      })
    };
  }

  private createEnemyBullet(
    sourceEnemyId: string,
    frame: number,
    position: { x: number; y: number },
    velocity: { x: number; y: number },
    damage = 1
  ) {
    return {
      id: `${sourceEnemyId}-bullet-${frame}-${Math.round(position.x)}-${Math.round(position.y)}-${Math.round(velocity.x * 10)}`,
      owner: "enemy" as const,
      sourceEnemyId,
      damage,
      position: { ...position },
      velocity: { ...velocity }
    };
  }

  private createAimedVelocity(
    origin: { x: number; y: number },
    target: { x: number; y: number },
    speed: number
  ) {
    const deltaX = target.x - origin.x;
    const deltaY = target.y - origin.y;
    const magnitude = Math.max(1, Math.hypot(deltaX, deltaY));
    return {
      x: (deltaX / magnitude) * speed,
      y: (deltaY / magnitude) * speed
    };
  }

  private pickTarget(
    players: PlayerRuntimeState[],
    origin: { x: number; y: number }
  ): PlayerRuntimeState | null {
    const activePlayers = players.filter((player) => this.canProcessGameplayInput(player));
    if (activePlayers.length === 0) {
      return null;
    }

    return activePlayers.reduce((best, candidate) => {
      const bestDistance = Math.hypot(best.position.x - origin.x, best.position.y - origin.y);
      const candidateDistance = Math.hypot(
        candidate.position.x - origin.x,
        candidate.position.y - origin.y
      );

      return candidateDistance < bestDistance ? candidate : best;
    });
  }

  private spawnEnemyProjectiles(nextState: SimulationState): void {
    const targetablePlayers = nextState.players.filter((player) => this.canProcessGameplayInput(player));
    if (targetablePlayers.length === 0) {
      return;
    }

    for (const enemy of nextState.enemies) {
      const age = nextState.frame - enemy.spawnedAtFrame;
      const target = this.pickTarget(targetablePlayers, enemy.position);
      const behaviorKey = resolveEnemyBehaviorKey(enemy);
      if (!target) {
        continue;
      }

      if (!behaviorKey) {
        continue;
      }

      const fireProfile = enemyFireProfiles[behaviorKey];
      if (
        !fireProfile ||
        age <= fireProfile.startDelayFrames ||
        age % fireProfile.intervalFrames !== 0
      ) {
        continue;
      }

      if (fireProfile.spreadProjectiles) {
        nextState.bullets.push(
          ...fireProfile.spreadProjectiles.map((velocity) =>
            this.createEnemyBullet(enemy.id, nextState.frame, enemy.position, velocity)
          )
        );
        continue;
      }

      if (fireProfile.aimedProjectileSpeed) {
        nextState.bullets.push(
          this.createEnemyBullet(
            enemy.id,
            nextState.frame,
            enemy.position,
            this.createAimedVelocity(
              enemy.position,
              target.position,
              fireProfile.aimedProjectileSpeed
            )
          )
        );
      }
    }

    if (!nextState.boss?.active || nextState.boss.defeated) {
      return;
    }

    const emitters =
      nextState.boss.parts.filter((part) => part.active).map((part) => part.position).length > 0
        ? nextState.boss.parts.filter((part) => part.active).map((part) => part.position)
        : [nextState.boss.position];
    const phaseFrames =
      nextState.boss.phaseEnteredAtFrame === null
        ? 0
        : nextState.frame - nextState.boss.phaseEnteredAtFrame;

    switch (nextState.boss.patternId) {
      case "paired-diagonals":
        if (phaseFrames % 44 === 0) {
          for (const emitter of emitters) {
            nextState.bullets.push(
              this.createEnemyBullet(nextState.boss.bossId, nextState.frame, emitter, { x: -1.6, y: 4 }),
              this.createEnemyBullet(nextState.boss.bossId, nextState.frame, emitter, { x: 1.6, y: 4 })
            );
          }
        }
        break;
      case "rotary-straight-burst":
        if (phaseFrames % 34 === 0) {
          for (const emitter of emitters) {
            nextState.bullets.push(
              this.createEnemyBullet(nextState.boss.bossId, nextState.frame, emitter, { x: -1.3, y: 4.2 }),
              this.createEnemyBullet(nextState.boss.bossId, nextState.frame, emitter, { x: 0, y: 4.6 }),
              this.createEnemyBullet(nextState.boss.bossId, nextState.frame, emitter, { x: 1.3, y: 4.2 })
            );
          }
        }
        break;
      case "desperation-flak":
        if (phaseFrames % 24 === 0) {
          for (const emitter of emitters) {
            nextState.bullets.push(
              this.createEnemyBullet(nextState.boss.bossId, nextState.frame, emitter, { x: -2.2, y: 3.6 }),
              this.createEnemyBullet(nextState.boss.bossId, nextState.frame, emitter, { x: -1.1, y: 4 }),
              this.createEnemyBullet(nextState.boss.bossId, nextState.frame, emitter, { x: 0, y: 4.4 }),
              this.createEnemyBullet(nextState.boss.bossId, nextState.frame, emitter, { x: 1.1, y: 4 }),
              this.createEnemyBullet(nextState.boss.bossId, nextState.frame, emitter, { x: 2.2, y: 3.6 })
            );
          }
        }
        break;
    }
  }

  private advanceEnemyBehaviors(
    enemies: SimulationState["enemies"],
    bounds: ReturnType<StageRunner["getArenaBounds"]>,
    frame: number
  ): SimulationState["enemies"] {
    return enemies
      .map((enemy) => {
        const age = frame - enemy.spawnedAtFrame;
        const behaviorKey = resolveEnemyBehaviorKey(enemy);
        const movementProfile = behaviorKey ? enemyMovementProfiles[behaviorKey] : null;
        const delta = movementProfile
          ? movementProfile(enemy, bounds, age)
          : { x: 0, y: 0 };

        return {
          ...enemy,
          position: {
            x: enemy.position.x + delta.x,
            y: enemy.position.y + delta.y
          }
        };
      })
      .filter(
        (enemy) =>
          enemy.position.y <= bounds.height + 96 &&
          enemy.position.x >= -96 &&
          enemy.position.x <= bounds.width + 96
      );
  }

  private advanceBullets(
    bullets: SimulationState["bullets"],
    bounds: ReturnType<StageRunner["getArenaBounds"]>
  ): SimulationState["bullets"] {
    return bullets
      .map((bullet) => ({
        ...bullet,
        position: {
          x: bullet.position.x + bullet.velocity.x,
          y: bullet.position.y + bullet.velocity.y
        }
      }))
      .filter(
        (bullet) =>
          bullet.position.x >= -48 &&
          bullet.position.x <= bounds.width + 48 &&
          bullet.position.y >= -64 &&
          bullet.position.y <= bounds.height + 64
      );
  }

  private resolvePlayerBulletCollisions(
    nextState: SimulationState,
    events: RuntimeEvent[]
  ): void {
    const remainingBullets: SimulationState["bullets"] = [];

    for (const bullet of nextState.bullets) {
      if (bullet.owner !== "player") {
        remainingBullets.push(bullet);
        continue;
      }

      let consumed = false;
      const damage = bullet.damage ?? 8;

      for (const enemy of [...nextState.enemies]) {
        if (!this.intersectsEnemy(bullet.position.x, bullet.position.y, enemy)) {
          continue;
        }

        consumed = true;
        const nextHealth = Math.max(0, enemy.health - damage);
        if (nextHealth === 0) {
          this.removeEnemyFromState(nextState, enemy.id, bullet.sourcePlayerId);
          this.pushEffect(nextState, "explosion", enemy.position, 24);
          events.push({
            type: "enemy-destroyed",
            enemyId: enemy.id,
            atFrame: nextState.frame
          });
        } else {
          nextState.enemies = nextState.enemies.map((candidate) =>
            candidate.id === enemy.id ? { ...candidate, health: nextHealth } : candidate
          );
          this.pushEffect(nextState, "hit", bullet.position, 14);
        }
        break;
      }

      if (consumed) {
        continue;
      }

      if (nextState.boss?.active && !nextState.boss.defeated) {
        if (nextState.boss.parts.length > 0) {
          const hitPart = nextState.boss.parts.find(
            (part) =>
              part.active &&
              Math.hypot(part.position.x - bullet.position.x, part.position.y - bullet.position.y) <= 18
          );

          if (hitPart) {
            consumed = true;
            this.applyBossPartDamageToState(nextState, hitPart.id, damage);
            this.pushEffect(nextState, "hit", bullet.position, 14);
          }
        } else if (
          Math.hypot(
            nextState.boss.position.x - bullet.position.x,
            nextState.boss.position.y - bullet.position.y
          ) <= 28
        ) {
          consumed = true;
          this.applyBossDamageToState(nextState, damage);
          this.pushEffect(nextState, "hit", bullet.position, 14);
        }
      }

      if (!consumed) {
        remainingBullets.push(bullet);
      }
    }

    nextState.bullets = remainingBullets;
  }

  private resolveEnemyThreats(nextState: SimulationState, events: RuntimeEvent[]): void {
    const damagedPlayers = new Set<PlayerSlot>();
    const remainingBullets: SimulationState["bullets"] = [];
    let encounterReset = false;

    for (const bullet of nextState.bullets) {
      if (bullet.owner !== "enemy") {
        remainingBullets.push(bullet);
        continue;
      }

      const hitPlayer = nextState.players.find(
        (player) =>
          !damagedPlayers.has(player.id) &&
          this.canProcessGameplayInput(player) &&
          Math.hypot(player.position.x - bullet.position.x, player.position.y - bullet.position.y) <=
            player.hitRadius + 6
      );

      if (!hitPlayer) {
        remainingBullets.push(bullet);
        continue;
      }

      damagedPlayers.add(hitPlayer.id);
      const damageResult = this.applyPlayerDamageToState(nextState, hitPlayer.id, events);
      if (damageResult.hitApplied) {
        this.pushEffect(nextState, "hit", hitPlayer.position, 12);
        this.pushEffect(nextState, "explosion", hitPlayer.position, 22);
      }

      if (damageResult.stageReset) {
        encounterReset = true;
        break;
      }
    }

    if (encounterReset) {
      return;
    }

    nextState.bullets = remainingBullets;

    for (const player of nextState.players) {
      if (damagedPlayers.has(player.id) || !this.canProcessGameplayInput(player)) {
        continue;
      }

      const touchedEnemy = nextState.enemies.some((enemy) =>
        this.intersectsEnemy(player.position.x, player.position.y, enemy, player.hitRadius + 8)
      );
      const touchedBoss =
        nextState.boss?.active &&
        !nextState.boss.defeated &&
        (Math.hypot(
          nextState.boss.position.x - player.position.x,
          nextState.boss.position.y - player.position.y
        ) <= player.hitRadius + 30 ||
          nextState.boss.parts.some(
            (part) =>
              part.active &&
              Math.hypot(part.position.x - player.position.x, part.position.y - player.position.y) <=
                player.hitRadius + 20
          ));

      if (!touchedEnemy && !touchedBoss) {
        continue;
      }

      const damageResult = this.applyPlayerDamageToState(nextState, player.id, events);
      if (damageResult.hitApplied) {
        this.pushEffect(nextState, "hit", player.position, 12);
        this.pushEffect(nextState, "explosion", player.position, 22);
      }

      if (damageResult.stageReset) {
        return;
      }
    }
  }

  private collectTouchingPickups(nextState: SimulationState, events: RuntimeEvent[]): void {
    nextState.pickups = nextState.pickups.map((pickup) => {
      if (pickup.collected) {
        return pickup;
      }

      const collector = nextState.players.find(
        (player) =>
          this.canProcessGameplayInput(player) &&
          Math.hypot(player.position.x - pickup.position.x, player.position.y - pickup.position.y) <= 18
      );

      if (!collector) {
        return pickup;
      }

      nextState.players = nextState.players.map((player) =>
        player.id === collector.id
          ? applyPickupToPlayer(player, pickup, this.combatRules)
          : player
      );
      events.push({
        type: "pickup-collected",
        playerId: collector.id,
        pickupId: pickup.id,
        pickupKind: pickup.kind,
        atFrame: nextState.frame
      });

      return {
        ...pickup,
        collected: true,
        collectedByPlayerId: collector.id
      };
    });
  }

  private intersectsEnemy(
    x: number,
    y: number,
    enemy: SimulationState["enemies"][number],
    bonusRadius = 0
  ): boolean {
    const radius =
      enemy.kind === "gunboat"
        ? 18
        : enemy.kind === "alpha-warplane" || enemy.kind === "item-carrier"
          ? 16
          : enemy.kind === "small-tank" || enemy.kind === "farm-turret" || enemy.kind === "marsh-turret"
            ? 14
            : 12;

    return Math.hypot(enemy.position.x - x, enemy.position.y - y) <= radius + bonusRadius;
  }

  private removeEnemyFromState(
    nextState: SimulationState,
    enemyId: string,
    sourcePlayerId?: PlayerSlot
  ): void {
    const defeatedEnemy = nextState.enemies.find((enemy) => enemy.id === enemyId);
    if (!defeatedEnemy) {
      return;
    }

    nextState.enemies = nextState.enemies.filter((enemy) => enemy.id !== enemyId);
    if (!nextState.stage.defeatedEnemyIds.includes(enemyId)) {
      nextState.stage.defeatedEnemyIds = [...nextState.stage.defeatedEnemyIds, enemyId];
      nextState.stage.defeatedEnemyRecords = [
        ...nextState.stage.defeatedEnemyRecords,
        {
          enemyId,
          sourcePlayerId,
          atFrame: nextState.frame,
          enemyAgeFrames: nextState.frame - defeatedEnemy.spawnedAtFrame,
          stateTag: defeatedEnemy.stateTag
        }
      ];
    }

    if (sourcePlayerId) {
      nextState.players = nextState.players.map((player) =>
        player.id === sourcePlayerId
          ? awardPoints(player, defeatedEnemy.scoreValue, this.combatRules)
          : player
      );
    }
  }

  private applyPlayerDamageToState(
    nextState: SimulationState,
    playerId: PlayerSlot,
    events: RuntimeEvent[]
  ): {
    hitApplied: boolean;
    stageReset: boolean;
  } {
    const playerIndex = nextState.players.findIndex((player) => player.id === playerId);
    if (playerIndex === -1) {
      return {
        hitApplied: false,
        stageReset: false
      };
    }

    const player = nextState.players[playerIndex];
    if (!player.joined || player.lifeState === "continue-pending" || player.lifeState === "game-over") {
      return {
        hitApplied: false,
        stageReset: false
      };
    }

    const checkpoint = this.getPlayerCheckpointForState(nextState, playerId);
    const result = applyCombatDamage(player, checkpoint, this.combatRules);

    if (result.outcome === "blocked") {
      return {
        hitApplied: false,
        stageReset: false
      };
    }

    events.push({
      type: "player-hit",
      playerId,
      atFrame: nextState.frame
    });

    if (result.outcome === "respawned") {
      nextState.players[playerIndex] = {
        ...result.player,
        joined: true,
        lifeState: "respawning",
        continueFramesRemaining: null,
        active: true
      };

      if (nextState.session.mode === "single") {
        nextState.stage = this.stageRunner.restoreStageFromCheckpoint(nextState.stage);
        nextState.enemies = [];
        nextState.bullets = [];
        nextState.pickups = this.stageRunner.createCheckpointRespawnRewards(nextState.stage);
        nextState.boss = null;
      }

      this.pushEffect(nextState, "respawn", checkpoint.position, 26);
      events.push({
        type: "player-respawned",
        playerId,
        checkpointId: checkpoint.checkpointId,
        atFrame: nextState.frame
      });
      nextState.flow = resolveSessionFlow(nextState.players);

      return {
        hitApplied: true,
        stageReset: nextState.session.mode === "single"
      };
    }

    if (this.cabinetRules.continueEnabled) {
      nextState.players[playerIndex] = {
        ...result.player,
        joined: true,
        lifeState: "continue-pending",
        continueFramesRemaining: this.cabinetRules.continueCountdownFrames,
        active: false
      };
      events.push({
        type: "continue-opened",
        playerId,
        countdownFrames: this.cabinetRules.continueCountdownFrames,
        atFrame: nextState.frame
      });
    } else {
      nextState.players[playerIndex] = {
        ...result.player,
        joined: true,
        lifeState: "game-over",
        continueFramesRemaining: null,
        active: false
      };
      events.push({
        type: "player-game-over",
        playerId,
        atFrame: nextState.frame
      });
    }

    nextState.flow = resolveSessionFlow(nextState.players);
    return {
      hitApplied: true,
      stageReset: false
    };
  }

  private getPlayerCheckpointForState(
    nextState: SimulationState,
    playerId: PlayerSlot
  ): CheckpointState {
    const checkpoint = this.stageRunner.getCheckpointState(nextState.stage);
    const bounds = this.stageRunner.getArenaBounds(nextState.stage.stageId);
    const offset =
      nextState.session.mode === "co-op" && playerId === "player2" ? 22 : 0;

    return {
      ...checkpoint,
      position: {
        x: clamp(checkpoint.position.x + offset, 0, bounds.width),
        y: checkpoint.position.y
      }
    };
  }

  private applyBossDamageToState(nextState: SimulationState, amount: number): void {
    if (!nextState.boss || !nextState.boss.active || nextState.boss.defeated) {
      return;
    }

    const nextHealth = Math.max(0, nextState.boss.health - amount);
    nextState.boss = {
      ...nextState.boss,
      health: nextHealth,
      defeated: nextHealth === 0
    };
  }

  private applyBossPartDamageToState(
    nextState: SimulationState,
    partId: string,
    amount: number
  ): void {
    if (!nextState.boss || !nextState.boss.active || nextState.boss.defeated) {
      return;
    }

    const nextParts = nextState.boss.parts.map((part) => {
      if (part.id !== partId || !part.active) {
        return part;
      }

      const nextHealth = Math.max(0, part.health - amount);
      return {
        ...part,
        health: nextHealth,
        active: nextHealth > 0
      };
    });
    const nextHealth = nextParts.reduce((total, part) => total + part.health, 0);
    nextState.boss = {
      ...nextState.boss,
      parts: nextParts,
      health: nextHealth,
      defeated: nextHealth === 0
    };
  }

  private consumePendingEvents(): RuntimeEvent[] {
    const events = this.pendingEvents.map((event) => ({ ...event }));
    this.pendingEvents = [];
    return events;
  }
}
