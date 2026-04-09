import type {
  BossRuntimeState,
  CheckpointState,
  EnemyState,
  EnemyDefeatRecord,
  PendingSpawnState,
  RuntimeEvent,
  RuntimePickupState,
  SessionConfig,
  SimulationState,
  StageRuntimeState
} from "../core/types";
import { getStageDefinition } from "./stageCatalog";
import type {
  BossDefinition,
  BossPhaseDefinition,
  HiddenTriggerDefinition,
  StageDefinition,
  WaveDefinition
} from "./stageTypes";

export interface StageAdvanceResult {
  stage: StageRuntimeState;
  enemies: EnemyState[];
  pickups: RuntimePickupState[];
  boss: BossRuntimeState | null;
  events: RuntimeEvent[];
  clearedThisFrame: boolean;
  loopAdvanceEnabled: boolean;
  loopTargetStageId: string | null;
}

function cloneEnemy(enemy: EnemyState): EnemyState {
  return {
    ...enemy,
    position: { ...enemy.position },
    stateTransitions: enemy.stateTransitions?.map((transition) => ({ ...transition })),
    scriptedDefeats: enemy.scriptedDefeats?.map((defeat) => ({ ...defeat }))
  };
}

function clonePickup(pickup: RuntimePickupState): RuntimePickupState {
  return {
    ...pickup,
    position: { ...pickup.position }
  };
}

function cloneBoss(boss: BossRuntimeState | null): BossRuntimeState | null {
  return boss
    ? {
        ...boss,
        position: { ...boss.position },
        parts: boss.parts.map((part) => ({
          ...part,
          position: { ...part.position }
        }))
      }
    : null;
}

function roundHealth(value: number): number {
  return Math.max(1, Math.round(value));
}

function selectBossPhase(
  phases: BossPhaseDefinition[],
  health: number
): BossPhaseDefinition | null {
  let selected = phases[0] ?? null;

  for (const phase of phases) {
    if (health <= phase.healthAtOrBelow) {
      selected = phase;
    }
  }

  return selected;
}

function isWaveTriggered(
  wave: WaveDefinition,
  stage: StageRuntimeState,
  frame: number,
  scrollY: number
): boolean {
  if (wave.trigger.type === "frame") {
    return frame >= wave.trigger.frame;
  }

  if (wave.trigger.type === "all-enemies-destroyed") {
    return wave.trigger.enemyIds.every((enemyId) =>
      stage.defeatedEnemyIds.includes(enemyId)
    );
  }

  return scrollY >= wave.trigger.scrollY;
}

function isHiddenTriggered(
  trigger: HiddenTriggerDefinition,
  stage: StageRuntimeState
): boolean {
  const condition = trigger.trigger;

  switch (condition.type) {
    case "scroll":
      return stage.scrollY >= condition.scrollY;
    case "all-enemies-destroyed":
      return condition.enemyIds.every((enemyId) =>
        stage.defeatedEnemyIds.includes(enemyId)
      );
    case "enemy-destroyed-in-state":
      return stage.defeatedEnemyRecords.some(
        (record) =>
          record.enemyId === condition.enemyId &&
          record.stateTag === condition.stateTag
      );
    case "enemy-destroyed-after-frames":
      return stage.defeatedEnemyRecords.some(
        (record) =>
          record.enemyId === condition.enemyId &&
          record.enemyAgeFrames >= condition.minAgeFrames
      );
    case "enemy-destroyed-by":
      return stage.defeatedEnemyRecords.some(
        (record) =>
          record.enemyId === condition.enemyId &&
          record.sourceEnemyId === condition.sourceEnemyId
      );
    case "enemy-destroyed":
      return stage.defeatedEnemyIds.includes(condition.enemyId);
  }
}

function resolveHiddenReward(
  trigger: HiddenTriggerDefinition,
  session: SessionConfig
): NonNullable<HiddenTriggerDefinition["rewards"]> {
  const override = trigger.rewardOverrides?.[session.cabinetProfile];
  if (override) {
    return [override];
  }

  if (trigger.rewards?.length) {
    return trigger.rewards;
  }

  return trigger.reward ? [trigger.reward] : [];
}

function hasBlockingEnemies(enemies: EnemyState[]): boolean {
  return enemies.some((enemy) => enemy.blocksProgression);
}

function resolveEnemyStateTag(enemy: EnemyState, frame: number): string | undefined {
  let nextStateTag = enemy.stateTag;

  for (const transition of enemy.stateTransitions ?? []) {
    if (frame - enemy.spawnedAtFrame >= transition.afterFrames) {
      nextStateTag = transition.stateTag;
    }
  }

  return nextStateTag;
}

export class StageRunner {
  getDefinition(stageId: string): StageDefinition {
    return getStageDefinition(stageId);
  }

  getArenaBounds(stageId: string): StageDefinition["arenaBounds"] {
    return this.getDefinition(stageId).arenaBounds;
  }

  createInitialStageState(stageId: string): StageRuntimeState {
    return {
      stageId,
      scrollY: 0,
      waveCursor: 0,
      checkpointCursor: 0,
      armedCheckpointId: null,
      activeBossId: null,
      activeBossPhaseId: null,
      bossEncounterStarted: false,
      triggeredHiddenIds: [],
      defeatedEnemyIds: [],
      defeatedEnemyRecords: [],
      pendingSpawns: [],
      completed: false
    };
  }

  getCheckpointState(stage: StageRuntimeState): CheckpointState {
    const definition = this.getDefinition(stage.stageId);
    const checkpoint =
      definition.checkpoints.find((entry) => entry.id === stage.armedCheckpointId) ?? null;

    return {
      checkpointId: checkpoint?.id ?? `${stage.stageId}-start`,
      position: checkpoint?.position
        ? { ...checkpoint.position }
        : {
            x: definition.arenaBounds.width / 2,
            y: definition.arenaBounds.height - 48
          },
      waveCursor: checkpoint?.waveCursor ?? 0,
      scrollY: checkpoint?.scrollY ?? 0
    };
  }

  restoreStageFromCheckpoint(stage: StageRuntimeState): StageRuntimeState {
    const definition = this.getDefinition(stage.stageId);
    const checkpointIndex = definition.checkpoints.findIndex(
      (entry) => entry.id === stage.armedCheckpointId
    );
    const checkpoint = checkpointIndex >= 0 ? definition.checkpoints[checkpointIndex] : null;

    return {
      ...stage,
      scrollY: checkpoint?.scrollY ?? 0,
      waveCursor: checkpoint?.waveCursor ?? 0,
      checkpointCursor: checkpointIndex >= 0 ? checkpointIndex + 1 : 0,
      armedCheckpointId: checkpoint?.id ?? null,
      activeBossId: null,
      activeBossPhaseId: null,
      bossEncounterStarted: stage.bossEncounterStarted,
      triggeredHiddenIds: [...stage.triggeredHiddenIds],
      defeatedEnemyIds: [],
      defeatedEnemyRecords: [],
      pendingSpawns: [],
      completed: false
    };
  }

  createCheckpointRespawnRewards(
    stage: StageRuntimeState
  ): RuntimePickupState[] {
    const definition = this.getDefinition(stage.stageId);

    return definition.hiddenTriggers
      .filter(
        (hidden) =>
          stage.triggeredHiddenIds.includes(hidden.id) &&
          (hidden.checkpointRespawnRewards?.length ?? 0) > 0
      )
      .flatMap((hidden) =>
        hidden.checkpointRespawnRewards!.map((reward) => ({
          id: reward.pickupId,
          kind: reward.kind,
          position: { ...reward.position },
          collected: false,
          scoreValue: reward.scoreValue,
          sourceId: hidden.id
        }))
      );
  }

  advance(state: SimulationState): StageAdvanceResult {
    const definition = this.getDefinition(state.stage.stageId);
    const events: RuntimeEvent[] = [];
    const enemies = state.enemies.map(cloneEnemy);
    const pickups = state.pickups.map(clonePickup);
    const stage: StageRuntimeState = {
      ...state.stage,
      triggeredHiddenIds: [...state.stage.triggeredHiddenIds],
      defeatedEnemyIds: [...state.stage.defeatedEnemyIds],
      defeatedEnemyRecords: state.stage.defeatedEnemyRecords.map((record) => ({ ...record })),
      pendingSpawns: state.stage.pendingSpawns.map((pending) => ({ ...pending }))
    };
    let boss = cloneBoss(state.boss);
    let clearedThisFrame = false;

    if (!stage.completed && !boss?.active) {
      stage.scrollY += this.getScrollSpeed(definition, state.session);
    }

    while (
      stage.checkpointCursor < definition.checkpoints.length &&
      stage.scrollY >= definition.checkpoints[stage.checkpointCursor].scrollY
    ) {
      const checkpoint = definition.checkpoints[stage.checkpointCursor];
      stage.armedCheckpointId = checkpoint.id;
      stage.checkpointCursor += 1;
      events.push({
        type: "checkpoint-armed",
        checkpointId: checkpoint.id,
        atFrame: state.frame
      });
    }

    while (
      stage.waveCursor < definition.waves.length &&
      isWaveTriggered(definition.waves[stage.waveCursor], stage, state.frame, stage.scrollY)
    ) {
      const wave = definition.waves[stage.waveCursor];
      const enabledForCabinet =
        !wave.cabinetProfiles ||
        wave.cabinetProfiles.includes(state.session.cabinetProfile);

      if (!enabledForCabinet) {
        stage.waveCursor += 1;
        continue;
      }

      const spawned = wave.enemies
        .filter((spawn) => (spawn.spawnOffsetFrames ?? 0) <= 0)
        .map((spawn) =>
          this.createEnemyState(spawn, wave.id, state.session, state.frame)
        );

      const delayedSpawns = wave.enemies
        .filter((spawn) => (spawn.spawnOffsetFrames ?? 0) > 0)
        .map<PendingSpawnState>((spawn) => ({
          waveId: wave.id,
          spawnId: spawn.id,
          dueFrame: state.frame + (spawn.spawnOffsetFrames ?? 0)
        }));

      enemies.push(...spawned);
      stage.pendingSpawns.push(...delayedSpawns);
      stage.waveCursor += 1;
      events.push({
        type: "wave-spawned",
        waveId: wave.id,
        enemyIds: wave.enemies.map((spawn) => spawn.id),
        atFrame: state.frame
      });
    }

    const remainingPendingSpawns: PendingSpawnState[] = [];

    for (const pending of stage.pendingSpawns) {
      if (pending.dueFrame > state.frame) {
        remainingPendingSpawns.push(pending);
        continue;
      }

      const spawn = this.findSpawnDefinition(definition, pending);
      if (!spawn) {
        continue;
      }

      enemies.push(
        this.createEnemyState(spawn, pending.waveId, state.session, state.frame)
      );
    }

    stage.pendingSpawns = remainingPendingSpawns;
    this.resolveScriptedEnemyDefeats(enemies, stage, state.frame);
    for (const enemy of enemies) {
      enemy.stateTag = resolveEnemyStateTag(enemy, state.frame);
    }

    for (const hidden of definition.hiddenTriggers) {
      if (
        stage.triggeredHiddenIds.includes(hidden.id) ||
        (stage.bossEncounterStarted && hidden.expiresOnBossStart) ||
        !isHiddenTriggered(hidden, stage)
      ) {
        continue;
      }

      const rewards = resolveHiddenReward(hidden, state.session);
      stage.triggeredHiddenIds.push(hidden.id);
      if (hidden.revealEnemies?.length) {
        enemies.push(
          ...hidden.revealEnemies.map((spawn) =>
            this.createEnemyState(spawn, hidden.id, state.session, state.frame)
          )
        );
      }
      if (rewards.length > 0) {
        const pickupIds: string[] = [];

        for (const reward of rewards) {
          pickups.push({
            id: reward.pickupId,
            kind: reward.kind,
            position: { ...reward.position },
            collected: false,
            scoreValue: reward.scoreValue,
            sourceId: hidden.id
          });
          pickupIds.push(reward.pickupId);
        }
        events.push({
          type: "hidden-triggered",
          triggerId: hidden.id,
          pickupId: pickupIds[0],
          pickupIds,
          atFrame: state.frame
        });
      }
    }

    if (
      definition.boss &&
      !boss &&
      stage.waveCursor >= definition.waves.length &&
      stage.pendingSpawns.length === 0 &&
      !hasBlockingEnemies(enemies) &&
      stage.scrollY >= definition.boss.trigger.minScrollY
    ) {
      boss = this.createBossState(definition.boss, state.session, state.frame);
      stage.activeBossId = boss.bossId;
      stage.activeBossPhaseId = boss.currentPhaseId;
      stage.bossEncounterStarted = true;
      events.push({
        type: "boss-started",
        bossId: boss.bossId,
        phaseId: boss.currentPhaseId ?? "unknown-phase",
        atFrame: state.frame
      });
    }

    if (definition.boss && boss?.active && !boss.defeated) {
      const nextPhase = selectBossPhase(definition.boss.phases, boss.health);
      if (nextPhase && nextPhase.id !== boss.currentPhaseId) {
        boss = {
          ...boss,
          currentPhaseId: nextPhase.id,
          patternId: nextPhase.patternId ?? null,
          phaseEnteredAtFrame: state.frame
        };
        stage.activeBossPhaseId = nextPhase.id;
        events.push({
          type: "boss-phase-changed",
          bossId: boss.bossId,
          phaseId: nextPhase.id,
          atFrame: state.frame
        });
      }
    }

    if (boss?.defeated && !stage.completed) {
      stage.completed = true;
      stage.activeBossId = null;
      stage.activeBossPhaseId = null;
      boss = {
        ...boss,
        active: false,
        currentPhaseId: null,
        patternId: null
      };
      clearedThisFrame = true;
      events.push({
        type: "stage-cleared",
        stageId: stage.stageId,
        atFrame: state.frame
      });
    }

    return {
      stage,
      enemies,
      pickups,
      boss,
      events,
      clearedThisFrame,
      loopAdvanceEnabled: Boolean(definition.loopAdvance?.enabled),
      loopTargetStageId: definition.loopAdvance?.nextStageId ?? null
    };
  }

  private createEnemyState(
    spawn: WaveDefinition["enemies"][number],
    waveId: string,
    session: SessionConfig,
    frame: number
  ): EnemyState {
    const definition = this.getDefinition(session.stageId);
    const multiplier = this.getEnemyHealthMultiplier(definition, session);
    const maxHealth = roundHealth(spawn.health * multiplier);

    return {
      id: spawn.id,
      kind: spawn.kind,
      position: { ...spawn.position },
      health: maxHealth,
      maxHealth,
      scoreValue: spawn.scoreValue,
      spawnedByWaveId: waveId,
      spawnedAtFrame: frame,
      blocksProgression: spawn.blocksProgression ?? true,
      stateTag: spawn.stateTag,
      stateTransitions: spawn.stateTransitions?.map((transition) => ({ ...transition })),
      behaviorId: spawn.behaviorId,
      scriptedDefeats: spawn.scriptedDefeats?.map((defeat) => ({ ...defeat })),
      animation: "idle"
    };
  }

  private createBossState(
    boss: BossDefinition,
    session: SessionConfig,
    frame: number
  ): BossRuntimeState {
    const definition = this.getDefinition(session.stageId);
    const multiplier = this.getBossHealthMultiplier(definition, session);
    const parts = (boss.parts ?? []).map((part) => ({
      id: part.id,
      position: { ...part.position },
      health: roundHealth(part.maxHealth * multiplier),
      maxHealth: roundHealth(part.maxHealth * multiplier),
      active: true
    }));
    const maxHealth =
      parts.length > 0
        ? parts.reduce((total, part) => total + part.maxHealth, 0)
        : roundHealth(boss.maxHealth * multiplier);
    const currentPhase = selectBossPhase(boss.phases, maxHealth);

    return {
      bossId: boss.id,
      active: true,
      defeated: false,
      currentPhaseId: currentPhase?.id ?? null,
      patternId: currentPhase?.patternId ?? null,
      position: { ...boss.position },
      health: maxHealth,
      maxHealth,
      enteredAtFrame: frame,
      phaseEnteredAtFrame: frame,
      parts
    };
  }

  private findSpawnDefinition(
    definition: StageDefinition,
    pending: PendingSpawnState
  ): WaveDefinition["enemies"][number] | null {
    const wave = definition.waves.find((entry) => entry.id === pending.waveId);
    if (!wave) {
      return null;
    }

    return wave.enemies.find((entry) => entry.id === pending.spawnId) ?? null;
  }

  private getEnemyHealthMultiplier(
    definition: StageDefinition,
    session: SessionConfig
  ): number {
    return (
      definition.difficulty[session.cabinetProfile].enemyHealthMultiplier *
      (1 + definition.loopTuning.enemyHealthMultiplierPerLoop * session.loopIndex)
    );
  }

  private getBossHealthMultiplier(
    definition: StageDefinition,
    session: SessionConfig
  ): number {
    return (
      definition.difficulty[session.cabinetProfile].bossHealthMultiplier *
      (1 + definition.loopTuning.bossHealthMultiplierPerLoop * session.loopIndex)
    );
  }

  private getScrollSpeed(definition: StageDefinition, session: SessionConfig): number {
    return (
      definition.baseScrollSpeed *
      definition.difficulty[session.cabinetProfile].scrollSpeedMultiplier *
      (1 + definition.loopTuning.scrollSpeedMultiplierPerLoop * session.loopIndex)
    );
  }

  private resolveScriptedEnemyDefeats(
    enemies: EnemyState[],
    stage: StageRuntimeState,
    frame: number
  ): void {
    for (const sourceEnemy of [...enemies]) {
      for (const scriptedDefeat of sourceEnemy.scriptedDefeats ?? []) {
        if (frame - sourceEnemy.spawnedAtFrame < scriptedDefeat.afterFrames) {
          continue;
        }

        if (stage.defeatedEnemyIds.includes(scriptedDefeat.targetEnemyId)) {
          continue;
        }

        const targetIndex = enemies.findIndex(
          (enemy) => enemy.id === scriptedDefeat.targetEnemyId
        );
        if (targetIndex === -1) {
          continue;
        }

        const target = enemies[targetIndex];
        enemies.splice(targetIndex, 1);
        stage.defeatedEnemyIds.push(scriptedDefeat.targetEnemyId);
        stage.defeatedEnemyRecords.push(
          this.createEnemyDefeatRecord(target, frame, sourceEnemy.id)
        );
      }
    }
  }

  private createEnemyDefeatRecord(
    enemy: EnemyState,
    frame: number,
    sourceEnemyId?: string
  ): EnemyDefeatRecord {
    return {
      enemyId: enemy.id,
      sourceEnemyId,
      atFrame: frame,
      enemyAgeFrames: frame - enemy.spawnedAtFrame,
      stateTag: enemy.stateTag
    };
  }
}
