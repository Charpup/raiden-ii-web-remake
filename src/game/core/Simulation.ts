import {
  advancePlayerMovement,
  applyPlayerDamage as applyCombatDamage,
  createCombatPlayerState,
  defaultCombatRules,
  triggerBomb
} from "../combat/CombatSystems";
import { StageRunner } from "../stage/StageRunner";
import type {
  PlayerInputState,
  PlayerRuntimeState,
  PlayerSlot,
  RuntimeEvent,
  SessionConfig,
  SimulationFrameInput,
  SimulationState
} from "./types";

function clonePlayer(player: PlayerRuntimeState): PlayerRuntimeState {
  return {
    ...player,
    position: { ...player.position },
    mainWeapon: { ...player.mainWeapon },
    subWeapon: player.subWeapon ? { ...player.subWeapon } : null
  };
}

function cloneState(state: SimulationState): SimulationState {
  return {
    frame: state.frame,
    session: { ...state.session },
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
  width: number
): PlayerRuntimeState[] {
  if (session.mode === "co-op") {
    return [
      createCombatPlayerState("player1", {
        position: { x: width / 2 - 44, y: 520 }
      }),
      createCombatPlayerState("player2", {
        position: { x: width / 2 + 44, y: 520 }
      })
    ];
  }

  return [
    createCombatPlayerState("player1", {
      position: { x: width / 2, y: 520 }
    })
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

export class Simulation {
  private readonly stageRunner = new StageRunner();

  private bootstrapStageEventPending = true;

  private pendingEvents: RuntimeEvent[] = [];

  private state: SimulationState;

  constructor(config: Partial<SessionConfig> = {}) {
    const session = createDefaultSession(config);
    const bounds = this.stageRunner.getArenaBounds(session.stageId);

    this.state = {
      frame: 0,
      session,
      players: createInitialPlayers(session, bounds.width),
      enemies: [],
      bullets: [],
      pickups: [],
      boss: null,
      stage: this.stageRunner.createInitialStageState(session.stageId),
      recentEvents: []
    };
  }

  step(frameInput: SimulationFrameInput): SimulationState {
    const nextState = cloneState(this.state);
    nextState.frame += 1;
    const events = this.consumePendingEvents();

    if (this.bootstrapStageEventPending) {
      events.push({
        type: "stage-started",
        stageId: nextState.stage.stageId,
        atFrame: nextState.frame
      });
      this.bootstrapStageEventPending = false;
    }

    const bounds = this.stageRunner.getArenaBounds(nextState.stage.stageId);
    nextState.players = nextState.players.map((player) => {
      if (!player.active) {
        return player;
      }

      const input = frameInput.players[player.id] ?? emptyPlayerInput();
      let nextPlayer = advancePlayerMovement(
        player,
        input,
        bounds,
        defaultCombatRules
      );

      if (input.fire && nextPlayer.active) {
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
          defaultCombatRules
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

    const stageAdvance = this.stageRunner.advance(nextState);
    nextState.stage = stageAdvance.stage;
    nextState.enemies = stageAdvance.enemies;
    nextState.pickups = stageAdvance.pickups;
    nextState.boss = stageAdvance.boss;
    events.push(...stageAdvance.events);

    if (stageAdvance.clearedThisFrame && stageAdvance.loopAdvanceEnabled) {
      nextState.session = {
        ...nextState.session,
        loopIndex: nextState.session.loopIndex + 1
      };
      events.push({
        type: "loop-advanced",
        loopIndex: nextState.session.loopIndex,
        atFrame: nextState.frame
      });

      const nextStageId = stageAdvance.loopTargetStageId ?? nextState.session.stageId;
      const nextBounds = this.stageRunner.getArenaBounds(nextStageId);
      const nextPositions = getStageStartPositions(nextState.session, nextBounds.width);

      nextState.session = {
        ...nextState.session,
        stageId: nextStageId
      };
      nextState.stage = this.stageRunner.createInitialStageState(nextStageId);
      nextState.enemies = [];
      nextState.bullets = [];
      nextState.pickups = [];
      nextState.boss = null;
      nextState.players = nextState.players.map((player) => ({
        ...player,
        position: { ...nextPositions[player.id] },
        animation: "idle"
      }));
      this.bootstrapStageEventPending = true;
    }

    nextState.recentEvents = events;
    this.state = nextState;
    return this.getState();
  }

  getState(): SimulationState {
    return cloneState(this.state);
  }

  applyPlayerDamage(playerId: PlayerSlot): void {
    const index = this.state.players.findIndex((player) => player.id === playerId);
    if (index === -1) {
      return;
    }

    const checkpoint = this.stageRunner.getCheckpointState(this.state.stage);
    const result = applyCombatDamage(
      this.state.players[index],
      checkpoint,
      defaultCombatRules
    );

    this.state.players[index] = result.player;

    if (result.outcome === "respawned") {
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
    }
  }

  defeatEnemy(
    enemyId: string,
    options?: {
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
      this.state.stage = {
        ...this.state.stage,
        defeatedEnemyIds: [...this.state.stage.defeatedEnemyIds, enemyId],
        defeatedEnemyRecords: [
          ...this.state.stage.defeatedEnemyRecords,
          {
            enemyId,
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

  private consumePendingEvents(): RuntimeEvent[] {
    const events = this.pendingEvents.map((event) => ({ ...event }));
    this.pendingEvents = [];
    return events;
  }
}
