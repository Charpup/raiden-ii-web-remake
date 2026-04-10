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
  if (session.mode === "co-op") {
    return [
      createCombatPlayerState(
        "player1",
        {
          position: { x: width / 2 - 44, y: 520 },
          lives: cabinetRules.startingLives,
          bombs: cabinetRules.startingBombs
        },
        combatRules
      ),
      createCombatPlayerState(
        "player2",
        {
          position: { x: width / 2 + 44, y: 520 },
          lives: cabinetRules.startingLives,
          bombs: cabinetRules.startingBombs
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
        bombs: cabinetRules.startingBombs
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

    if (this.hasPlayablePlayers(nextState.players)) {
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
                animation: "idle"
              }
            : player
        );
        this.bootstrapStageEventPending = true;
      }
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

  private consumePendingEvents(): RuntimeEvent[] {
    const events = this.pendingEvents.map((event) => ({ ...event }));
    this.pendingEvents = [];
    return events;
  }
}
